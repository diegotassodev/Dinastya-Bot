const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const treinosPath = path.join(__dirname, '../dados/treinos.json');
const conclusosPath = path.join(__dirname, '../dados/conclusoestreino.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('concluirtreino')
        .setDescription('Conclui o treino ativo.')
        .addStringOption(option => option.setName('descricao').setDescription('Descrição opcional sobre o treino concluído.')),
    async execute(interaction) {
        const usuario = interaction.user;
        const descricaoOpcional = interaction.options.getString('descricao');

        let treinos = {};
        if (fs.existsSync(treinosPath)) {
            treinos = JSON.parse(fs.readFileSync(treinosPath));
        }

        if (!treinos[usuario.id]) {
            return await interaction.reply({ content: 'Você não possui um treino ativo para concluir.', ephemeral: true });
        }

        const treino = treinos[usuario.id];

        const confirmButton = new ButtonBuilder()
            .setCustomId('confirmar_conclusao')
            .setLabel('Confirmar')
            .setStyle(ButtonStyle.Success);

        const actionRow = new ActionRowBuilder().addComponents(confirmButton);

        const reply = await interaction.reply({
            content: `Você deseja concluir o treino:\n${treino.descricao}\n`,
            components: [actionRow],
            ephemeral: true,
        });

        const filter = (i) => i.customId === 'confirmar_conclusao' && i.user.id === usuario.id;
        const collector = reply.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (buttonInteraction) => {
            collector.stop();

            // Salva no arquivo de treinos concluídos
            let conclusos = {};
            if (fs.existsSync(conclusosPath)) {
                conclusos = JSON.parse(fs.readFileSync(conclusosPath));
            }

            if (!conclusos[usuario.id]) {
                conclusos[usuario.id] = [];
            }

            conclusos[usuario.id].push({
                descricao: treino.descricao,
                pontos: treino.pontos,
                descricaoOpcional,
                data: new Date().toISOString(),
            });

            try {
                fs.writeFileSync(conclusosPath, JSON.stringify(conclusos, null, 2));
            } catch (error) {
                console.error('Erro ao salvar a conclusão:', error);
                return await buttonInteraction.reply({ content: 'Houve um erro ao concluir o treino. Tente novamente mais tarde.', ephemeral: true });
            }

            const logChannel = interaction.client.channels.cache.get('1321090064519925812');
            if (logChannel) {
                logChannel.send(`Treino concluído por ${usuario.toString()} em ${new Date().toLocaleString()}.\nDescrição: ${descricaoOpcional || 'Nenhuma'}\n<@376896777124577291>, venha validar o treino!`);
            }

            // Criação do embed de conclusão
            const concluidoEmbed = new EmbedBuilder()
                .setColor(0x28a745) // Cor verde
                .setTitle('Prática Concluída!')
                .setDescription(`Parabéns, ${usuario.username}!\nVocê concluiu a sua prática diária.`)
                .addFields(
                    { name: 'Descrição do Treino', value: treino.descricao, inline: false },
                    { name: 'Pontos de Honra', value: `${treino.pontos}`, inline: false }
                )
                .setTimestamp();

            await buttonInteraction.update({ embeds: [concluidoEmbed], components: [] });
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                interaction.editReply({ content: 'O tempo para confirmar a conclusão expirou.', components: [] });
            }
        });
    },
};
