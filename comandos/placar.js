const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const pontosPath = path.join(__dirname, '../pontos.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('placar')
        .setDescription('Exibe os 10 membros com mais pontos de honra.'),
    async execute(interaction) {
        // Lê os pontos existentes
        let pontos = {};
        if (fs.existsSync(pontosPath)) {
            try {
                const data = fs.readFileSync(pontosPath, 'utf8');
                pontos = JSON.parse(data);
            } 
            catch (error) {
                console.error('Erro ao ler o arquivo de pontos:', error);
                return await interaction.reply('Houve um erro ao ler os pontos. Tente novamente mais tarde.');
            }
        }

        // Ordena os usuários por pontos de forma decrescente
        const leaderboard = Object.entries(pontos)
            .map(([usuarioId, pontosUsuario]) => ({ usuarioId, pontos: pontosUsuario }))
            .sort((a, b) => b.pontos - a.pontos)  // Ordena em ordem decrescente
            .slice(0, 10);  // Pega apenas os 10 primeiros

        // Criação do embed
        const embed = new EmbedBuilder()
            .setColor('#F5723A')  // Cor dourada
            .setTitle('Placar Dinastya 🏆')
            .setFooter({ text: '© Dinastya' })
            .setTimestamp();

        // Adiciona os top 10 membros no embed
        leaderboard.forEach((entry, index) => {
            const usuario = interaction.client.users.cache.get(entry.usuarioId);  // Obtém o usuário com o ID
            if (usuario) {
                embed.addFields({
                    name: `${index + 1}. ${usuario.username}`,
                    value: `<:CF8:1314024497518481428>  ${entry.pontos} Pontos 🎓`,
                    inline: false,
                });
            }
        });

        // Envia o embed
        await interaction.reply({ embeds: [embed] });
    },
};
