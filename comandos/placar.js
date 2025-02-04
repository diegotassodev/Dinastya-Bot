const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const pontosPath = path.join(__dirname, '../dados/pontos.json');

// Ranks com emojis
const RANKS = {
    Platina: { roleId: '1312827612682256444', emoji: '<:platinumBadge:1318279736023056464>' },
    Ouro: { roleId: '1312827534400028692', emoji: '<:goldbadge:1318279733104087061>' },
    Prata: { roleId: '1312827605384429690', emoji: '<:silverbadge:1318279738950942810>' },
    Bronze: { roleId: '1312827608857186384', emoji: '<:bronzebadge:1318279730210013265>' },
    DinastyaPlus: { roleId: '1310275311614562306', emoji: '' },
    Dinastya: { roleId: '1310275345861054464', emoji: '' },
};

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
            } catch (error) {
                console.error('Erro ao ler o arquivo de pontos:', error);
                return await interaction.reply('Houve um erro ao ler os pontos. Tente novamente mais tarde.');
            }
        }

        // Ordena os usuários por pontos de forma decrescente
        const leaderboard = Object.entries(pontos)
            .map(([usuarioId, pontosUsuario]) => ({ usuarioId, pontos: pontosUsuario }))
            .sort((a, b) => b.pontos - a.pontos) // Ordena em ordem decrescente
            .slice(0, 10); // Pega apenas os 10 primeiros

        // Criação do embed
        const embed = new EmbedBuilder()
            .setColor('#F5723A') // Cor dourada
            .setTitle(' Jogadores mais Honrados da Dinastya')
            .setFooter({ text: '© Dinastya' })
            .setTimestamp();

        // Adiciona os top 10 membros no embed
        for (const [index, entry] of leaderboard.entries()) {
            const usuario = interaction.client.users.cache.get(entry.usuarioId); // Obtém o usuário pelo ID
            if (usuario) {
                // Busca o membro para verificar os cargos
                const membro = await interaction.guild.members.fetch(entry.usuarioId).catch(() => null);
                let emojiRank = '❓'; // Emoji padrão caso o rank não seja encontrado

                if (membro) {
                    for (const rank in RANKS) {
                        if (membro.roles.cache.has(RANKS[rank].roleId)) {
                            emojiRank = RANKS[rank].emoji; // Define o emoji do rank correspondente
                            break;
                        }
                    }
                }

                embed.addFields({
                    name: `${index + 1}. ${usuario.username} ${emojiRank}`,
                    value: `<:CF8:1314024497518481428> ${entry.pontos} Pontos`,
                    inline: false,
                });
            }
        }

        // Envia o embed
        await interaction.reply({ embeds: [embed] });
    },
};
