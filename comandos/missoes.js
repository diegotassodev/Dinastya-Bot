const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const missoesPath = path.join(__dirname, '../dados/missoes.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('missoes')
    .setDescription('Exibe a lista de missões ativas de um usuário.')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('O usuário para visualizar as missões (somente para líderes).')
        .setRequired(false)),
  async execute(interaction) {
    const userId = interaction.user.id;
    const isLeader = interaction.member.roles.cache.has('1310275274470064198'); // ID do cargo de Líder
    const targetUser = interaction.options.getUser('usuario') || interaction.user; // Usuário especificado ou o próprio

    // Verifica permissão caso o alvo seja outro usuário
    if (targetUser.id !== userId && !isLeader) {
      return interaction.reply({
        content: 'Você não tem permissão para visualizar missões de outros usuários.',
        ephemeral: true,
      });
    }

    // Lê as missões do arquivo JSON
    let missoesData = {};
    if (fs.existsSync(missoesPath)) {
      const data = fs.readFileSync(missoesPath, 'utf8');
      missoesData = JSON.parse(data);
    }

    // Obtém as missões do usuário alvo
    const missoes = missoesData[targetUser.id] || [];

    // Verifica se o usuário tem missões disponíveis
    if (missoes.length === 0) {
      return interaction.reply({
        content: `${targetUser.username} não possui missões ativas no momento.`,
        ephemeral: targetUser.id === userId, // Apenas privado se for o próprio usuário
      });
    }

    // Cria o embed com as missões do usuário alvo
    const embed = new EmbedBuilder()
      .setColor('#00FF00') // Cor verde
      .setTitle(`🗺️ Missões Ativas de ${targetUser.username}`)
      .setDescription('Aqui estão as missões disponíveis:')
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true })) // Adiciona a foto do usuário
      .setFooter({ text: '© Dinastya' })
      .setTimestamp();

    // Adiciona cada missão como um campo no embed
    missoes.forEach(missao => {
      embed.addFields({
        name: `#${missao.id} - ${missao.titulo}`,
        value: `**Descrição:** ${missao.descricao}\n**Recompensa:** ${missao.recompensa}`,
        inline: false,
      });
    });

    // Envia o embed
    await interaction.reply({ embeds: [embed] });
  },
};
