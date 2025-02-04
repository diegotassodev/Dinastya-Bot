const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const xpPath = path.join(__dirname, '../dados/xp.json');
const niveisPath = path.join(__dirname, '../dados/niveis.json'); // Caminho para os níveis

// Função para calcular o nível baseado no XP
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

    const xpProximoNivel = niveis[nivel] || 1000000; // Evita erro caso o nível máximo seja atingido

    return { nivel, xpProximoNivel };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('placarxp')
        .setDescription('Exibe os 10 jogadores com mais XP e seus níveis.'),

    async execute(interaction) {
        let xpData = {};

        // Lê o arquivo de XP
        if (fs.existsSync(xpPath)) {
            try {
                const data = fs.readFileSync(xpPath, 'utf8');
                xpData = JSON.parse(data);
            } catch (error) {
                console.error('Erro ao ler o arquivo de XP:', error);
                return await interaction.reply('Houve um erro ao ler os dados de XP.');
            }
        }

        // Ordena os jogadores por XP corretamente com a nova estrutura do JSON
        const leaderboardXP = Object.entries(xpData)
            .map(([usuarioId, xp]) => {
                const { nivel } = calcularNivel(xp);
                return {
                    usuarioId,
                    xp,
                    nivel
                };
            })
            .sort((a, b) => b.xp - a.xp)
            .slice(0, 10);

        const embedXP = new EmbedBuilder()
            .setColor('#F5723A')
            .setTitle('Jogadores com a maior quantia de pontos de experiência.')
            .setFooter({ text: '© Dinastya' })
            .setTimestamp();

        for (const [index, entry] of leaderboardXP.entries()) {
            const usuario = await interaction.client.users.fetch(entry.usuarioId).catch(() => null);
            if (usuario) {
                embedXP.addFields({
                    name: `${index + 1}. ${usuario.username}・Nível ${entry.nivel}`,
                    value: `<:CF8:1314024497518481428> **${entry.xp}** Pontos de XP`,
                    inline: false,
                });
            }
        }

        await interaction.reply({ embeds: [embedXP] });
    },
};
