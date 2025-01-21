const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const missoesPath = path.join(__dirname, '../dados/missoes.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('adicionarmissao')
        .setDescription('Adiciona uma missão para um usuário.')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('O usuário a quem adicionar a missão.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('titulo')
                .setDescription('Título da missão.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('descricao')
                .setDescription('Descrição da missão.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('recompensa')
                .setDescription('Recompensa da missão.')
                .setRequired(true)),
    async execute(interaction) {
        
        // Verifica se o usuário tem permissão de administrador
        if (!interaction.member.roles.cache.has('1310275274470064198')) {
            return await interaction.reply('Você não tem permissão para usar esse comando.');
        }

        const usuario = interaction.options.getUser('usuario');
        const titulo = interaction.options.getString('titulo');
        const descricao = interaction.options.getString('descricao');
        const recompensa = interaction.options.getString('recompensa');

        // Lê o arquivo de missões existentes
        let missoes = {};
        if (fs.existsSync(missoesPath)) {
            try {
                const data = fs.readFileSync(missoesPath, 'utf8');
                missoes = JSON.parse(data);
            } catch (error) {
                console.error('Erro ao ler o arquivo de missões:', error);
                return await interaction.reply('Houve um erro ao ler as missões. Tente novamente mais tarde.');
            }
        }

        // Adiciona a nova missão ao usuário
        if (!missoes[usuario.id]) {
            missoes[usuario.id] = [];
        }
        const novaMissao = {
            id: missoes[usuario.id].length + 1,
            titulo,
            descricao,
            recompensa,
        };
        missoes[usuario.id].push(novaMissao);

        // Salva o arquivo atualizado
        try {
            fs.writeFileSync(missoesPath, JSON.stringify(missoes, null, 2));
        } catch (error) {
            console.error('Erro ao escrever no arquivo de missões:', error);
            return await interaction.reply('Houve um erro ao salvar a missão. Tente novamente mais tarde.');
        }

        await interaction.reply(`Missão **"${titulo}"** foi adicionada com sucesso para ${usuario.username}.`);
    },
};
