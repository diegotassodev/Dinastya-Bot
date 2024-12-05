const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const pontosPath = path.join(__dirname, '../pontos.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('adicionarpontos')
        .setDescription('Adiciona pontos de honra a um usuário.')
        .addUserOption(option => option.setName('usuario').setDescription('O usuário a quem adicionar pontos').setRequired(true))
        .addIntegerOption(option => option.setName('quantidade').setDescription('Quantidade de pontos a adicionar').setRequired(true)),
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

        // Adiciona os pontos
        if (!pontos[usuario.id]) {
            pontos[usuario.id] = 0;
        }
        pontos[usuario.id] += quantidade;

        // Salva os pontos de volta no arquivo
        try {
            fs.writeFileSync(pontosPath, JSON.stringify(pontos, null, 2));
        } catch (error) {
            console.error('Erro ao escrever no arquivo de pontos:', error);
            return await interaction.reply('Houve um erro ao salvar os pontos. Tente novamente mais tarde.');
        }

        await interaction.reply(`Foram adicionados ${quantidade} **Pontos de Honra** para o ${usuario.username}.`);
    },
};
