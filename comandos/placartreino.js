// Imports Principais
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Arquivo de Treinos
const treinoPath = path.join(__dirname, '../dados/conclusoestreino.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('placartreino')
        .setDescription('Exibe os 10 jogadores que mais concluíram treinos.'),

    async execute(interaction) {
        let treinoData = {};

        if (fs.existsSync(treinoPath)) {
            try {
                const data = fs.readFileSync(treinoPath, 'utf8');
                treinoData = JSON.parse(data);
            } catch (error) {
                console.error('Erro ao ler o arquivo de treinos:', error);
                return interaction.reply('Houve um erro ao ler os dados de treinos.');
            }
        }

        // Conta quantos treinos cada jogador concluiu
        const leaderboardTreino = Object.entries(treinoData)
            .map(([usuarioId, treinos]) => ({
                usuarioId,
                treinosConcluidos: Array.isArray(treinos) ? treinos.length : 0, // Conta corretamente
            }))
            .sort((a, b) => b.treinosConcluidos - a.treinosConcluidos)
            .slice(0, 10);

        const embedTreino = new EmbedBuilder()
            .setColor('#F5723A')
            .setTitle('Jogadores com a maior quantia de treinos concluídos.')
            .setFooter({ text: '© Dinastya' })
            .setTimestamp();

        for (const [index, entry] of leaderboardTreino.entries()) {
            const usuario = await interaction.client.users.fetch(entry.usuarioId).catch(() => null);
            if (usuario) {
                embedTreino.addFields({
                    name: `${index + 1}. ${usuario.username}`,
                    value: `<:CF8:1314024497518481428> **${entry.treinosConcluidos}** Treinos Concluídos`,
                    inline: false,
                });
            }
        }

        await interaction.reply({ embeds: [embedTreino] });
    },
};
