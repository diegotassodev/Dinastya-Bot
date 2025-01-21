const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const pontosPath = path.join(__dirname, '../dados/pontos.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removerpontos')
        .setDescription('Remove pontos de honra de um usuário.')
        .addUserOption(option => option.setName('usuario').setDescription('O usuário a quem remover pontos').setRequired(true))
        .addIntegerOption(option => option.setName('quantidade').setDescription('Quantidade de pontos a remover').setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.roles.cache.has('1310275274470064198')) {
            return await interaction.reply({ content: 'Você não tem permissão para usar esse comando.', ephemeral: true });
        }

        // Variáveis do sistema
        const usuario = interaction.options.getUser('usuario');
        const quantidade = interaction.options.getInteger('quantidade');
        const logChannelId = '1321089978574573598'; // ID do canal de logs

        // Tentativa de Leitura do .json de pontos para Remoção
        let pontos = {};
        if (fs.existsSync(pontosPath)) {
            try {
                const data = fs.readFileSync(pontosPath);
                pontos = JSON.parse(data);
            } catch (error) {
                console.error('Erro ao ler o arquivo de pontos:', error);
                return await interaction.reply({ content: 'Houve um erro ao ler os pontos. Tente novamente mais tarde.', ephemeral: true });
            }
        }

        if (!pontos[usuario.id] || pontos[usuario.id] < quantidade) {
            return await interaction.reply({ content: `${usuario.username} não possui pontos suficientes para essa operação.`, ephemeral: true });
        }

        pontos[usuario.id] -= quantidade;

        if (pontos[usuario.id] <= 0) {
            delete pontos[usuario.id];
        }

        // Tentativa de Escrita dos pontos no .Json de Pontos
        try {
            fs.writeFileSync(pontosPath, JSON.stringify(pontos, null, 2));
        } catch (error) {
            console.error('Erro ao escrever no arquivo de pontos:', error);
            return await interaction.reply({ content: 'Houve um erro ao salvar os pontos. Tente novamente mais tarde.', ephemeral: true });
        }

        // Envio da mensagem no canal de Logs
        const logChannel = interaction.client.channels.cache.get(logChannelId);
        if (logChannel) {
            logChannel.send(`Foram removidos ${quantidade} **Pontos de Honra** de ${usuario.toString()} por ${interaction.user.toString()}.`);
        }

        // Enviar mensagem privada ao usuário
        try {
            await usuario.send(`Você perdeu ${quantidade} **Pontos de Honra**.`);
        } catch (error) {
            console.error('Erro ao enviar mensagem privada:', error);
        }

        // Responder ao comando
        await interaction.reply({ content: `Foram removidos ${quantidade} **Pontos de Honra** de ${usuario.username}.`, ephemeral: true });
    },
};
