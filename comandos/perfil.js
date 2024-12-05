const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const pontosPath = path.join(__dirname, '../pontos.json');

// Ranks com os requisitos de pontos para subir (ordem do mais alto para o mais baixo)
const ROLES = {
  Platina: '1312827612682256444',
  Ouro: '1312827534400028692',
  Prata: '1312827605384429690',
  Bronze: '1312827608857186384',
  DinastyaPlus: '1310275311614562306',
  Dinastya: '1310275345861054464',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('perfil')
    .setDescription('Exibe um dashboard com informações sobre seus pontos e progresso.')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('O usuário a quem verificar os pontos (somente disponível para quem tem cargo de Líder)')
        .setRequired(false)), // O usuário pode ser opcional
  async execute(interaction) {
    const usuarioId = interaction.user.id;
    const isAdmin = interaction.member.roles.cache.has('1310275274470064198'); // Verifica se o usuário tem o cargo de Líder
    let usuario = interaction.options.getUser('usuario') || interaction.user; // Se não for admin, pega o próprio usuário

    if (usuario !== interaction.user && !isAdmin) {
      return await interaction.reply('Você não tem permissão para ver os pontos de outros usuários.');
    }

    // Lê os pontos existentes
    let pontos = {};
    if (fs.existsSync(pontosPath)) {
      const data = fs.readFileSync(pontosPath, 'utf8');
      pontos = JSON.parse(data);
    }

    // Obtém a quantidade de pontos do usuário
    const quantidade = pontos[usuario.id] || 0;

    // Buscar o membro no servidor
    const membro = await interaction.guild.members.fetch(usuario.id).catch(() => null);
    if (!membro) {
      return interaction.reply({
        content: 'Usuário não encontrado no servidor.',
        ephemeral: true,
      });
    }

    // Verificar qual rank o usuário possui com base nos cargos
    let rankAtual = 'Sem rank';
    // Percorre os ranks a partir do mais alto
    for (let rank in ROLES) {
      if (membro.roles.cache.has(ROLES[rank])) {
        rankAtual = `<@&${ROLES[rank]}>`; // Faz a menção ao cargo
        break; // Encontra o primeiro rank que o usuário possui, começando do mais alto
      }
    }

    // Criação do embed com informações
    const embed = new EmbedBuilder()
      .setColor('#F5723A') // Cor do embed (dourado)
      .setTitle('<:Profile:1314024334381289502> Perfil do Membro')
      .setDescription ('<:D8:1314024468149964881><:D8:1314024468149964881><:D8:1314024468149964881><:D8:1314024468149964881><:D8:1314024468149964881><:D8:1314024468149964881><:D8:1314024468149964881><:D8:1314024468149964881><:D8:1314024468149964881><:D8:1314024468149964881><:D8:1314024468149964881><:D8:1314024468149964881><:D8:1314024468149964881>')
      .setThumbnail(usuario.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '📌 Usuário', value: membro.displayName || '📌 Usuário desconhecido', inline: true },
        { name: '🎓 Pontos', value: `${quantidade}`, inline: true },
        { name: '🎖️ Rank Atual', value: rankAtual || '❓ Sem rank', inline: true }
      )
      .setFooter({ text: '© Dinastya' })
      .setTimestamp();

    // Envia o embed
    await interaction.reply({ embeds: [embed] });
  },
};
