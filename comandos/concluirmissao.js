const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const missoesPath = path.join(__dirname, '../dados/missoes.json');
const conquistasPath = path.join(__dirname, '../dados/conquistas.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('concluirmissao')
        .setDescription('Marca uma missão como concluída para um usuário.')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('O usuário para quem a missão será marcada como concluída.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('id')
                .setDescription('O ID da missão a ser marcada como concluída.')
                .setRequired(true)),
    async execute(interaction) {
        // Verifica se o usuário tem permissão de administrador
        if (!interaction.member.roles.cache.has('1310275274470064198')) {
            return await interaction.reply('Você não tem permissão para usar esse comando.');
        }

        const usuario = interaction.options.getUser('usuario');
        const idMissao = interaction.options.getInteger('id');

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

        // Verifica se o usuário possui missões
        if (!missoes[usuario.id] || missoes[usuario.id].length === 0) {
            return await interaction.reply(`O usuário ${usuario.username} não possui missões pendentes.`);
        }

        // Encontra a missão pelo ID
        const indiceMissao = missoes[usuario.id].findIndex(missao => missao.id === idMissao);
        if (indiceMissao === -1) {
            return await interaction.reply(`A missão com ID **${idMissao}** não foi encontrada para ${usuario.username}.`);
        }

        const missaoConcluida = missoes[usuario.id][indiceMissao];

        // Remove a missão do usuário
        missoes[usuario.id].splice(indiceMissao, 1);

        // Salva o arquivo atualizado
        try {
            fs.writeFileSync(missoesPath, JSON.stringify(missoes, null, 2));
        } catch (error) {
            console.error('Erro ao escrever no arquivo de missões:', error);
            return await interaction.reply('Houve um erro ao atualizar as missões. Tente novamente mais tarde.');
        }

        // Registra a missão concluída no arquivo de conquistas
        let conquistas = {};
        if (fs.existsSync(conquistasPath)) {
            try {
                const data = fs.readFileSync(conquistasPath, 'utf8');
                conquistas = JSON.parse(data);
            } catch (error) {
                console.error('Erro ao ler o arquivo de conquistas:', error);
                return await interaction.reply('Houve um erro ao registrar a missão concluída. Tente novamente mais tarde.');
            }
        }

        if (!conquistas[usuario.id]) {
            conquistas[usuario.id] = { missoes: [] };
        }
        conquistas[usuario.id].missoes.push({
            titulo: missaoConcluida.titulo,
            descricao: missaoConcluida.descricao,
            recompensa: missaoConcluida.recompensa,
            data: new Date().toISOString(),
        });

        // Salva o arquivo atualizado
        try {
            fs.writeFileSync(conquistasPath, JSON.stringify(conquistas, null, 2));
        } catch (error) {
            console.error('Erro ao escrever no arquivo de conquistas:', error);
            return await interaction.reply('Houve um erro ao registrar a missão concluída. Tente novamente mais tarde.');
        }

        // Resposta final
        await interaction.reply(`Missão **"${missaoConcluida.titulo}"** foi marcada como concluída para ${usuario.username}.`);
    },
};
