const { Client, Events, GatewayIntentBits, Collection } = require('discord.js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { verificarpunicoes } = require('./verificarpunicoes');
const { iniciarSincronizacao } = require('./linkarcargos');

dotenv.config();
const { TOKEN, CLIENT_ID, GUILD_ID } = process.env;

const commandsPath = path.join(__dirname, 'comandos');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.commands = new Collection();

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(`Esse comando em ${filePath} está com "data" ou "execute" ausentes.`);
  }
}

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


// Logando bot e verificando punições.
client.login(TOKEN);
client.once(Events.ClientReady, async readyClient => {
  console.log(`Bot conectado como ${readyClient.user.tag}`);

  iniciarSincronizacao(client);

  client.guilds.cache.forEach(guild => {
    verificarpunicoes(guild);
  });
})