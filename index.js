const { Client, Events, GatewayIntentBits, Collection } = require('discord.js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Carregar variáveis do .env
dotenv.config();
const { TOKEN, CLIENT_ID, GUILD_ID } = process.env;

// Caminho do arquivo de pontos
const pontosPath = path.join(__dirname, 'pontos.json');

// Garantir que comandos JS são importados
const commandsPath = path.join(__dirname, 'comandos');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Criar cliente do Discord
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
client.commands = new Collection();

// Importar comandos
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(`Esse comando em ${filePath} está com "data" ou "execute" ausentes.`);
  }
}

// IDs dos cargos
const ROLES = {
  Dinastya: '1310275345861054464',
  DinastyaPlus: '1310275311614562306',
  Bronze: '1312827608857186384',
  Prata: '1312827605384429690',
  Ouro: '1312827534400028692',
  Platina: '1312827612682256444',
};

// Função para verificar e atualizar os cargos
async function verificarEAtualizarCargos() {
  let pontos = {};
  if (fs.existsSync(pontosPath)) {
    try {
      const data = fs.readFileSync(pontosPath, 'utf8');
      pontos = JSON.parse(data);
    } catch (error) {
      console.error('Erro ao ler o arquivo de pontos:', error);
      return;
    }
  }

  const guild = await client.guilds.fetch(GUILD_ID);
  if (!guild) {
    console.error('Guilda não encontrada!');
    return;
  }

  for (const usuarioId in pontos) {
    const quantidadePontos = pontos[usuarioId];

    try {
      const membro = await guild.members.fetch(usuarioId);

      // Função interna para gerenciar cargos
      const gerenciarCargo = async (condicao, roleId) => {
        if (condicao) {
          if (!membro.roles.cache.has(roleId)) {
            await membro.roles.add(roleId);
            console.log(`Adicionado: ${roleId} para ${membro.user.username}`);
          }
        } else {
          if (membro.roles.cache.has(roleId)) {
            await membro.roles.remove(roleId);
            console.log(`Removido: ${roleId} de ${membro.user.username}`);
          }
        }
      };

      // Lógica para cada cargo
      await gerenciarCargo(quantidadePontos <= 99, ROLES.Dinastya);
      await gerenciarCargo(quantidadePontos > 100, ROLES.DinastyaPlus);
      await gerenciarCargo(quantidadePontos >= 500 && quantidadePontos <= 999, ROLES.Bronze);
      await gerenciarCargo(quantidadePontos >= 1000 && quantidadePontos <= 4999, ROLES.Prata);
      await gerenciarCargo(quantidadePontos >= 5000 && quantidadePontos <= 9999, ROLES.Ouro);
      await gerenciarCargo(quantidadePontos >= 10000, ROLES.Platina);
    } catch (error) {
      console.error(`Erro ao gerenciar cargos para o usuário ${usuarioId}:`, error);
    }
  }
}

// Executar a lógica de cargos periodicamente
client.once(Events.ClientReady, async readyClient => {
  console.log(`Bot conectado como ${readyClient.user.tag}`);
  
  // Verificar cargos ao iniciar
  await verificarEAtualizarCargos();

  setInterval(verificarEAtualizarCargos, 60 * 50);
});

// Lidando com comandos
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error('Comando não encontrado');
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error('Erro ao executar comando:', error);
    await interaction.reply({
      content: 'Houve um erro ao executar esse comando.',
      ephemeral: true,
    });
  }
});

// Login do bot
client.login(TOKEN);
