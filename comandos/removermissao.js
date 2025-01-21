const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const missoesPath = path.join(__dirname, '../dados/missoes.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removermissao')
    .setDescription('Remove uma missão específica de um usuário.')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('O usuário de quem remover a missão.')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('missaoid')
        .setDescription('O ID da missão a ser removida.')
        .setRequired(true)),
  async execute(interaction) {
    const isLeader = interaction.member.roles.cache.has('1310275274470064198'); // ID do cargo de Líder
    const targetUser = interaction.options.getUser('usuario'); // Usuário alvo
    const missaoId = interaction.options.getInteger('missaoid'); // ID da missão

    // Verifica se o usuário tem permissão de líder
    if (!isLeader) {
      return interaction.reply({
        content: 'Você não tem permissão para usar esse comando.',
        ephemeral: true,
      });
    }

    // Lê o arquivo de missões
    let missoesData = {};
    if (fs.existsSync(missoesPath)) {
      try {
        const data = fs.readFileSync(missoesPath, 'utf8');
        missoesData = JSON.parse(data);
      } catch (error) {
        console.error('Erro ao ler o arquivo de missões:', error);
        return interaction.reply('Houve um erro ao acessar as missões. Tente novamente mais tarde.');
      }
    }

    // Verifica se o usuário alvo tem missões
    if (!missoesData[targetUser.id] || missoesData[targetUser.id].length === 0) {
      return interaction.reply({
        content: `${targetUser.username} não possui missões ativas no momento.`,
        ephemeral: true,
      });
    }

    // Encontra a missão pelo ID
    const missaoIndex = missoesData[targetUser.id].findIndex(m => m.id === missaoId);
    if (missaoIndex === -1) {
      return interaction.reply({
        content: `Não foi encontrada uma missão com o ID **${missaoId}** para ${targetUser.username}.`,
        ephemeral: true,
      });
    }

    // Remove a missão
    const missaoRemovida = missoesData[targetUser.id].splice(missaoIndex, 1)[0];

    // Atualiza o arquivo de missões
    try {
      fs.writeFileSync(missoesPath, JSON.stringify(missoesData, null, 2));
    } catch (error) {
      console.error('Erro ao salvar o arquivo de missões:', error);
      return interaction.reply('Houve um erro ao salvar as alterações. Tente novamente mais tarde.');
    }

    // Responde confirmando a remoção
    await interaction.reply(`A missão **"${missaoRemovida.titulo}"** foi removida com sucesso de ${targetUser.username}.`);
  },
};
