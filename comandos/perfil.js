const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const conquistasPath = path.join(__dirname, '../dados/conquistas.json');
const pontosPath = path.join(__dirname, '../dados/pontos.json');
const xpPath = path.join(__dirname, '../dados/xp.json');
const niveisPath = path.join(__dirname, '../dados/niveis.json');

// Ranks com os requisitos de pontos para subir (ordem do mais alto para o mais baixo)
const RANKS = {
  Platina: { roleId: '1312827612682256444', emoji: '<:platinumBadge:1318279736023056464>' },
  Ouro: { roleId: '1312827534400028692', emoji: '<:goldbadge:1318279733104087061>' },
  Prata: { roleId: '1312827605384429690', emoji: '<:silverbadge:1318279738950942810>' },
  Bronze: { roleId: '1312827608857186384', emoji: '<:bronzebadge:1318279730210013265>' },
  DinastyaPlus: { roleId: '1310275311614562306', emoji: '' },
  Dinastya: { roleId: '1310275345861054464', emoji: '' },
};

// Função para calcular o nível baseado no xpp
function calcularNivel(xp) {
  let niveis = [];
  if (fs.existsSync(niveisPath)) {
    try {
      const data = fs.readFileSync(niveisPath, 'utf8');
      niveis = JSON.parse(data).niveis;
    } catch (error) {
      console.error('Erro ao carregar os níveis:', error);
      return { nivel: 0, xpProximoNivel: 100 }; // Valores padrão
    }
  }

  let nivel = 0;
  for (let i = 0; i < niveis.length; i++) {
    if (xp < niveis[i]) break;
    nivel++;
  }

  // Determinar o XP necessário para o próximo nível
  const xpProximoNivel = niveis[nivel] || 1000000; // Limite padrão para níveis além do máximo definido

  return { nivel, xpProximoNivel };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('perfil')
    .setDescription('Exibe um dashboard com informações sobre seus pontos e progresso.')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('O usuário a quem verificar os pontos (somente disponível para quem tem cargo de Líder)')
        .setRequired(false)),
  async execute(interaction) {
    const usuarioId = interaction.user.id;
    const isAdmin = interaction.member.roles.cache.has('1310275274470064198'); // Verifica se o usuário tem o cargo de Líder
    let usuario = interaction.options.getUser('usuario') || interaction.user;

    if (usuario !== interaction.user && !isAdmin) {
      return await interaction.reply('Você não tem permissão para ver os pontos de outros usuários.');
    }

    // Lê os pontos existentes
    let pontos = {};
    if (fs.existsSync(pontosPath)) {
      const data = fs.readFileSync(pontosPath, 'utf8');
      pontos = JSON.parse(data);
    }

    // Lê as conquistas existentes
    let conquistas = {};
    if (fs.existsSync(conquistasPath)) {
      const data = fs.readFileSync(conquistasPath, 'utf8');
      conquistas = JSON.parse(data);
    }

    // Lê os XP do usuário do arquivo xp.json
    let xp = {};
    if (fs.existsSync(xpPath)) {
      const data = fs.readFileSync(xpPath, 'utf8');
      xp = JSON.parse(data);
    }

    // Garantir que o valor de XP seja 0 se o usuário não estiver no arquivo
    const quantidadeXP = xp[usuario.id] || 0;  // Valor padrão 0 caso não haja XP registrado para o usuário

    // Quantidade de Pontos
    const quantidadePontos = pontos[usuario.id] || 0;

    // Calcular o nível do usuário com base no XP
    const { nivel, xpProximoNivel } = calcularNivel(quantidadeXP);

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
    let emojiRank = ''; // Emoji padrão caso o rank não seja encontrado

    for (let rank in RANKS) {
      if (membro.roles.cache.has(RANKS[rank].roleId)) {
        rankAtual = `<@&${RANKS[rank].roleId}>`; // Faz a menção ao cargo
        emojiRank = RANKS[rank].emoji; // Define o emoji correspondente
        break;
      }
    }

    // Missões concluídas pelo usuário
    const missoesUsuario = conquistas[usuario.id]?.missoes || [];
    const missoesTexto = Array.isArray(missoesUsuario) && missoesUsuario.length > 0
      ? missoesUsuario.map(m => `• **${m.titulo}**: ${m.descricao}`).join('\n')
      : 'Nenhuma missão concluída.';

    // Criando o Menu Principal
    const embed = new EmbedBuilder()
      .setColor('#F5723A') // Cor do embed
      .setTitle(`Perfil do ${membro.displayName || 'Usuário desconhecido'} [**${nivel}**] ${emojiRank}`) // Título com emoji e nome
      .setDescription('\n')
      .setThumbnail(usuario.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: ' 🎓 Pontos', value: `${quantidadePontos}`, inline: false },
        { name: ' 🎖️ Rank Atual', value: `${rankAtual}`, inline: false },
        { name: ' 🚀 Progresso de XP', value: ` [${quantidadeXP}/${xpProximoNivel}]`, inline: false }
      )
      .setFooter({ text: '© Dinastya' })
      .setTimestamp();

    // Adiciona a field de missões somente se houver missões concluídas
    if (missoesUsuario.length > 0) {
      embed.addFields({
        name: '<:CheckMark:1317322283861413908> Missões Concluídas',
        value: missoesUsuario.map(m => `・ **${m.titulo}**: ${m.descricao} [${m.recompensa || 'Sem recompensa'}]`).join('\n'),
        inline: false,
      });
    }

    // Envia o embed
    await interaction.reply({ embeds: [embed] });
  },
};
