// Declaração das constantes iniciais para o funcionamento do sistema.
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const ms = require('ms');

// Comando
module.exports = {
  data: new SlashCommandBuilder()
    .setName('punir')
    .setDescription('Aplica punições a um usuário.')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuário a ser punido')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('motivo')
        .setDescription('Motivo da punição')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('tempo')
        .setDescription('Duração da punição')
        .setRequired(true)
    )
    .addAttachmentOption(option =>
      option.setName('prova1')
        .setDescription('Prova 1 (opcional)')
    )
    .addAttachmentOption(option =>
      option.setName('prova2')
        .setDescription('Prova 2 (opcional)')
    )
    .addAttachmentOption(option =>
      option.setName('prova3')
        .setDescription('Prova 3 (opcional)')
    ),

  // Variáveis de Cargos
  async execute(interaction) {
    const staffRoleId = '892746407549763584';
    const memberRoleId = '813788487782236240';
    const punishedRoleId = '1289775217497083914';
    const bannedRoleId = '1289808875494707292';
    const staffLogsChannelId = '1306310681141837904';

    // Condicional para erro de permissão para o registro de ação.
    if (!interaction.member.roles.cache.has(staffRoleId)) {
      return interaction.reply({ content: 'Você não tem permissão para usar este comando.', ephemeral: true });
    }
    
    // Constantes do comando de punição
    const user = interaction.options.getUser('usuario');
    const motivo = interaction.options.getString('motivo');
    const tempo = interaction.options.getString('tempo');
    const provas = [
      interaction.options.getAttachment('prova1'),
      interaction.options.getAttachment('prova2'),
      interaction.options.getAttachment('prova3')
    ].filter(Boolean);

    // Verifica se o tempo é válido
    const tempoEmMilissegundos = ms(tempo);
    if (!tempoEmMilissegundos) {
      return interaction.reply({ content: 'O tempo fornecido é inválido. Por favor, use um formato válido (exemplo: 1h, 30m, 2d).', ephemeral: true });
    }

    // Butões de castigo e banimento
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('castigar')
          .setLabel('Castigar')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('banir')
          .setLabel('Banir')
          .setStyle(ButtonStyle.Danger)
      );
    
    // Seleção do tipo de punição com base nos botões criados.
    await interaction.reply({
      content: `Escolha a punição para ${user.username}.`,
      components: [row],
      ephemeral: true
    });

    // Coletor para obter a resposta do tipo de punição em 60000 ms
    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 60000
    });

    collector.on('collect', async i => {
      const member = interaction.guild.members.cache.get(user.id);

      // Condicional para Castigo
      if (i.customId === 'castigar') {
        await member.roles.remove(memberRoleId);
        await member.roles.add(punishedRoleId);
        logPunishment('Castigo', interaction, user, motivo, tempo, provas, staffLogsChannelId, tempoEmMilissegundos);
      }

      // Condicional para Banimento
      else if (i.customId === 'banir') {
        await member.roles.remove(memberRoleId);
        await member.roles.add(bannedRoleId);
        logPunishment('Banimento', interaction, user, motivo, tempo, provas, staffLogsChannelId, tempoEmMilissegundos);
      }

      i.update({ content: `Punição aplicada ao usuário ${user.username}.`, components: [] });

    });
  }
};

// Função para logs de punição
function logPunishment(tipo, interaction, user, motivo, tempo, provas, staffLogsChannelId, tempoEmMilissegundos) {
    let logMessage = `# ${tipo}\n**Staff:** <@${interaction.user.id}>\n**Usuário:** <@${user.id}>\n**Duração:** ${tempo}\n**Motivo:** ${motivo}`;

    // Verifica se existem provas e as adiciona à mensagem
    if (provas.length > 0) {
        const provasLinks = provas.map((prova, index) => `Prova ${index + 1}: [Link](${prova.url})`).join('\n');
        logMessage += `\nProvas:\n${provasLinks}`;
    }  
    
    const logChannel = interaction.guild.channels.cache.get(staffLogsChannelId);
    if (logChannel) logChannel.send(logMessage);
  
    const dmMessage = `## ${tipo} <@${user.id}> \n**Duração:** ${tempo}\n**Motivo:** ${motivo}`;
    user.send(dmMessage).catch(() => console.log('Não foi possível enviar DM.'));
  
    // Calcular a data de término da punição
    const dataDeTermino = new Date(Date.now() + tempoEmMilissegundos).toISOString();
  
    const punishmentData = {
      user: user.id,
      staff: interaction.user.id,
      tipo,
      motivo,
      tempo,
      dataDeTermino,  // Adiciona a data de término
      provas: provas.map(p => p.url),
      data: new Date().toISOString()
    };
  
    const filePath = './punicoes.json';
  
    // Verifica se o arquivo existe e se está vazio
    let existingData = [];
    try {
      if (fs.existsSync(filePath)) {
        const rawData = fs.readFileSync(filePath, 'utf8');
        // Verifica se o arquivo não está vazio e tenta fazer o parse
        if (rawData.trim()) {
          existingData = JSON.parse(rawData);
        }
      }
    } 
    catch (error) {
      console.error('Erro ao ler o arquivo punicoes.json:', error);
    }
  
    existingData.push(punishmentData);
  
    // Escreve os dados no arquivo
    try {
      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
    } catch (error) {
      console.error('Erro ao salvar os dados no arquivo punicoes.json:', error);
    }
}
