const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const pontosPath = path.join(__dirname, '../pontos.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removerpontos')
        .setDescription('Remove pontos de honra de um usuário.')
        .addUserOption(option => option.setName('usuario').setDescription('O usuário a quem remover pontos').setRequired(true))
        .addIntegerOption(option => option.setName('quantidade').setDescription('Quantidade de pontos a remover').setRequired(true)),
    async execute(interaction) {
        // Verifica se o usuário tem permissão de administrador
        if (!interaction.member.roles.cache.has('1310275274470064198')) {
            return await interaction.reply('Você não tem permissão para usar esse comando.');
        }

        const usuario = interaction.options.getUser('usuario');
        const quantidade = interaction.options.getInteger('quantidade');

        // Lê os pontos existentes
        let pontos = {};
        if (fs.existsSync(pontosPath)) {
            try {
                const data = fs.readFileSync(pontosPath);
                pontos = JSON.parse(data);
            } catch (error) {
                console.error('Erro ao ler o arquivo de pontos:', error);
                return await interaction.reply('Houve um erro ao ler os pontos. Tente novamente mais tarde.');
            }
        }

        // Verifica se o usuário tem pontos suficientes para remover
        if (!pontos[usuario.id] || pontos[usuario.id] < quantidade) {
            return await interaction.reply(`${usuario.username} não possui pontos suficientes para essa operação.`);
        }

        // Remove os pontos
        pontos[usuario.id] -= quantidade;

        // Se a quantidade de pontos do usuário for zero ou negativa, remove o usuário do arquivo
        if (pontos[usuario.id] <= 0) {
            delete pontos[usuario.id];
        }

        // Salva os pontos de volta no arquivo
        try {
            fs.writeFileSync(pontosPath, JSON.stringify(pontos, null, 2));
        } catch (error) {
            console.error('Erro ao escrever no arquivo de pontos:', error);
            return await interaction.reply('Houve um erro ao salvar os pontos. Tente novamente mais tarde.');
        }

        await interaction.reply(`Foram removidos ${quantidade} **Pontos de Honra** do ${usuario.username}.`);
    },
};
