const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const treinosPath = path.join(__dirname, '../dados/treinos.json');
const conclusosPath = path.join(__dirname, '../dados/conclusoestreino.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vertreino')
        .setDescription('Exibe o treino ativo de um jogador.')
        .addUserOption(option => 
            option
                .setName('jogador')
                .setDescription('Selecione o jogador cujo treino deseja visualizar.')
                .setRequired(true)),
    async execute(interaction) {
        const lider = interaction.user;
        const jogador = interaction.options.getUser('jogador');

        // Verifica se o usuário possui a tag necessária
        if (
            !interaction.member.roles.cache.has('1310275345861054464') &&
            !interaction.member.roles.cache.has('1310275311614562306')
        ) {
            return await interaction.reply({ 
                content: 'Você não tem permissão para usar este comando.', 
                ephemeral: true 
            });
        }

        // Verifica se o arquivo de treinos existe
        let treinos = {};
        if (fs.existsSync(treinosPath)) {
            treinos = JSON.parse(fs.readFileSync(treinosPath));
        }

        // Verifica se o jogador tem um treino ativo
        const treino = treinos[jogador.id];
        if (!treino) {
            return await interaction.reply({ content: `O jogador ${jogador.username} não possui um treino ativo no momento.`, ephemeral: true });
        }

        // Criação do embed para o treino ativo
        const treinoEmbed = new EmbedBuilder()
            .setColor(0x0099ff) // Cor azul
            .setTitle('Prática')
            .setAuthor({ name: jogador.username, iconURL: jogador.displayAvatarURL() }) // Nome + Avatar do jogador
            .setDescription(treino.descricao) // Descrição do treino
            .addFields({ name: 'Pontos de Honra para Conclusão', value: `**${treino.pontos}**`, inline: false }) // Pontos em negrito
            .setTimestamp();

        // Criação do botão para ver histórico de treinos concluídos
        const historicoButton = new ButtonBuilder()
            .setCustomId(`historico_concluidos_${jogador.id}`)
            .setLabel('Ver Histórico de Treinos Concluídos')
            .setStyle(ButtonStyle.Primary);

        const actionRow = new ActionRowBuilder().addComponents(historicoButton);

        // Resposta com o embed e o botão
        await interaction.reply({ embeds: [treinoEmbed], components: [actionRow], ephemeral: true });

        // Função para exibir o histórico de treinos concluídos
        const showHistorico = async (paginaAtual = 1) => {
            let conclusos = {};
            if (fs.existsSync(conclusosPath)) {
                conclusos = JSON.parse(fs.readFileSync(conclusosPath));
            }

            if (!conclusos[jogador.id] || conclusos[jogador.id].length === 0) {
                return await interaction.followUp({ content: `O jogador ${jogador.username} não possui treinos concluídos.`, ephemeral: true });
            }

            const historico = conclusos[jogador.id];
            const totalPaginas = Math.ceil(historico.length / 5); // Cada página exibe até 5 treinos

            const pageData = historico.slice((paginaAtual - 1) * 5, paginaAtual * 5);
            const historicoEmbed = new EmbedBuilder()
                .setColor(0x28a745) // Cor verde
                .setTitle(`Histórico de Treinos Concluídos de ${jogador.username}`)
                .setDescription(`Página ${paginaAtual}/${totalPaginas}`)
                .setTimestamp();

            pageData.forEach((treino, index) => {
                historicoEmbed.addFields({
                    name: `Treino ${index + 1 + ((paginaAtual - 1) * 5)}`,
                    value: `${treino.descricao}\n**Pontos**: ${treino.pontos}\n**Data de Conclusão**: ${new Date(treino.data).toLocaleString()}`,
                    inline: false,
                });
            });

            const navigationButtons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`prev_page_${jogador.id}`)
                    .setLabel('Página Anterior')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(paginaAtual === 1),
                new ButtonBuilder()
                    .setCustomId(`next_page_${jogador.id}`)
                    .setLabel('Próxima Página')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(paginaAtual === totalPaginas)
            );

            const reply = await interaction.followUp({ embeds: [historicoEmbed], components: [navigationButtons], ephemeral: true });

            // Collector para navegação entre as páginas
            const filter = (i) => i.customId.startsWith(`prev_page_${jogador.id}`) || i.customId.startsWith(`next_page_${jogador.id}`);
            const collector = reply.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async (buttonInteraction) => {
                if (buttonInteraction.customId.startsWith('prev_page') && paginaAtual > 1) {
                    await showHistorico(paginaAtual - 1);
                } else if (buttonInteraction.customId.startsWith('next_page') && paginaAtual < totalPaginas) {
                    await showHistorico(paginaAtual + 1);
                }

                await buttonInteraction.deferUpdate();
            });

            collector.on('end', () => {
                interaction.editReply({ components: [] });
            });
        };

        // Filtra a interação para o botão de histórico de treinos
        const filter = (i) => i.customId === `historico_concluidos_${jogador.id}` && i.user.id === lider.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (buttonInteraction) => {
            collector.stop();
            await showHistorico();
        });

        collector.on('end', () => {
            interaction.editReply({ components: [] });
        });
    },
};
