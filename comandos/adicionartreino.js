const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const treinosPath = path.join(__dirname, '../dados/treinos.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('adicionartreino')
        .setDescription('Adiciona um treino para um jogador.')
        .addUserOption(option => option.setName('jogador').setDescription('O jogador que receberá o treino').setRequired(true))
        .addStringOption(option => option.setName('descricao').setDescription('Descrição do treino').setRequired(true))
        .addIntegerOption(option => option.setName('pontos').setDescription('Pontos atribuídos ao treino').setRequired(true)),
    async execute(interaction) {
        // Verifica se o usuário é líder
        if (!interaction.member.roles.cache.has('1310275274470064198')) {
            return await interaction.reply({ content: 'Você não tem permissão para usar esse comando.', ephemeral: true });
        }

        const jogador = interaction.options.getUser('jogador');
        const descricao = interaction.options.getString('descricao').replace(/\\n/g, '\n');
        const pontos = interaction.options.getInteger('pontos');

        let treinos = {};
        if (fs.existsSync(treinosPath)) {
            treinos = JSON.parse(fs.readFileSync(treinosPath));
        }

        // Verifica se o jogador já tem um treino
        if (treinos[jogador.id]) {
            return await interaction.reply({ content: `${jogador.username} já possui um treino ativo. Modifique o treino atual antes de adicionar outro.`, ephemeral: true });
        }

        // Adiciona o treino
        treinos[jogador.id] = { descricao, pontos, criadoPor: interaction.user.tag, data: new Date().toISOString() };

        try {
            fs.writeFileSync(treinosPath, JSON.stringify(treinos, null, 2));
        } catch (error) {
            console.error('Erro ao salvar o treino:', error);
            return await interaction.reply({ content: 'Houve um erro ao salvar o treino. Tente novamente mais tarde.', ephemeral: true });
        }

        // Envia log para o canal
        const logChannel = interaction.client.channels.cache.get('1321090064519925812');
        if (logChannel) {
            logChannel.send(
                `🏋️ **Treino Adicionado**\n**Jogador:** ${jogador.toString()} (${jogador.tag})\n${descricao}\n**Pontos:** ${pontos}\n**Adicionado por:** ${interaction.user.tag}`
            );
        }

        await interaction.reply({ content: `Treino adicionado para ${jogador.username} com sucesso!`, ephemeral: true });
    },
};
