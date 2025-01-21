const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const fs = require('fs');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('removerpunicao')
    .setDescription('Remove a punição de um usuário.')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuário cuja punição será removida')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('tipo')
        .setDescription('Tipo de punição a ser removida (Castigo ou Banimento)')
        .setRequired(true)
    ),
  async execute(interaction) {
    const staffRoleId = '892746407549763584';
    const memberRoleId = '813788487782236240';
    const punishedRoleId = '1289775217497083914';
    const bannedRoleId = '1289808875494707292';
    const staffLogsChannelId = '1306310681141837904';

    if (!interaction.member.roles.cache.has(staffRoleId)) {
      return interaction.reply({ content: 'Você não tem permissão para usar este comando.', ephemeral: true });
    }

    const user = interaction.options.getUser('usuario');
    const tipo = interaction.options.getString('tipo');
    const filePath = './punicoes.json';

    if (!fs.existsSync(filePath)) {
      return interaction.reply({ content: 'Nenhuma punição encontrada para remoção.', ephemeral: true });
    }

    const existingData = JSON.parse(fs.readFileSync(filePath));
    const punishmentIndex = existingData.findIndex(p => p.user === user.id && p.tipo === tipo);

    if (punishmentIndex === -1) {
      return interaction.reply({ content: 'Punição não encontrada.', ephemeral: true });
    }

    const punishment = existingData[punishmentIndex];
    const member = interaction.guild.members.cache.get(user.id);

    if (tipo === 'Castigo') {
      await member.roles.remove(punishedRoleId);
      await member.roles.add(memberRoleId);
    } else if (tipo === 'Banimento') {
      await member.roles.remove(bannedRoleId);
      await member.roles.add(memberRoleId);
    }

    existingData.splice(punishmentIndex, 1);
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

    // Log da remoção da punição
    const staffTag = `<@${interaction.user.id}>`;  // Mencionando o staff que removeu
    const userTag = `<@${user.id}>`;  // Mencionando o usuário punido

    const logMessage = `# Término de Punição\n**Staff**: ${staffTag}\n**Usuário:** ${userTag}\n**Tipo de Punição:** ${punishment.tipo}\n**Motivo:** ${punishment.motivo}\n**Duração:** ${punishment.tempo}`;
    const logChannel = interaction.guild.channels.cache.get(staffLogsChannelId);
    if (logChannel) logChannel.send(logMessage);

    // Enviar DM para o usuário
    const dmMessage = `## Punição Removida \n**Motivo da Punição**: ${punishment.motivo}\n**Duração:** ${punishment.tempo}`;
    user.send(dmMessage).catch(() => console.log('Não foi possível enviar DM.'));

    interaction.reply({ content: `Punição de ${user.username} removida com sucesso.`, ephemeral: true });
  }
};
