const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const treinosPath = path.join(__dirname, '../dados/treinos.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removertreino')
        .setDescription('Remove o treino ativo de um jogador.')
        .addUserOption(option => option.setName('jogador').setDescription('O jogador cujo treino será removido').setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.roles.cache.has('1310275274470064198')) {
            return await interaction.reply({ content: 'Você não tem permissão para usar esse comando.', ephemeral: true });
        }

        const jogador = interaction.options.getUser('jogador');

        let treinos = {};
        if (fs.existsSync(treinosPath)) {
            treinos = JSON.parse(fs.readFileSync(treinosPath));
        }

        if (!treinos[jogador.id]) {
            return await interaction.reply({ content: `${jogador.username} não possui um treino ativo para remover.`, ephemeral: true });
        }

        const treinoRemovido = treinos[jogador.id];
        delete treinos[jogador.id];

        try {
            fs.writeFileSync(treinosPath, JSON.stringify(treinos, null, 2));
        } catch (error) {
            console.error('Erro ao remover o treino:', error);
            return await interaction.reply({ content: 'Houve um erro ao remover o treino. Tente novamente mais tarde.', ephemeral: true });
        }

        // Envia log para o canal
        const logChannel = interaction.client.channels.cache.get('1321090064519925812');
        if (logChannel) {
            logChannel.send(
                `🗑️ **Treino Removido**\n**Jogador:** ${jogador.toString()} (${jogador.tag})\n**Descrição:** ${treinoRemovido.descricao}\n**Pontos:** ${treinoRemovido.pontos}\n**Removido por:** ${interaction.user.tag}`
            );
        }

        await interaction.reply({ content: `O treino de ${jogador.username} foi removido com sucesso.`, ephemeral: true });
    },
};
