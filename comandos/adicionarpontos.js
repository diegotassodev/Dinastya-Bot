// Imports Iniciais
const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const adicionarXP = require('../funcoes/adicionarXp');
const pontosPath = path.join(__dirname, '../dados/pontos.json');

// Informações inciais
module.exports = {
    data: new SlashCommandBuilder()
        .setName('adicionarpontos')
        .setDescription('Adiciona pontos de honra a um usuário.')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('O usuário a quem adicionar pontos')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('quantidade')
                .setDescription('Quantidade de pontos a adicionar')
                .setRequired(true)),
    async execute(interaction) {
        // Verificar permissão
        if (!interaction.member.roles.cache.has('1310275274470064198')) {
            return await interaction.reply({ content: 'Você não tem permissão para usar esse comando.', ephemeral: true });
        }

        // Variáveis
        const usuario = interaction.options.getUser('usuario');
        const quantidade = interaction.options.getInteger('quantidade');
        const logChannelId = '1321089978574573598'; // ID do canal de logs

        // Lógica para carregar e atualizar pontos
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

        if (!pontos[usuario.id]) {
            pontos[usuario.id] = 0;
        }
        pontos[usuario.id] += quantidade;

        // Escrever no arquivo de pontos
        try {
            fs.writeFileSync(pontosPath, JSON.stringify(pontos, null, 2));
        } catch (error) {
            console.error('Erro ao escrever no arquivo de pontos:', error);
            return await interaction.reply({ content: 'Houve um erro ao salvar os pontos. Tente novamente mais tarde.', ephemeral: true });
        }

        // Determinar o rank do jogador e aplicar o booster de XP
        const membro = await interaction.guild.members.fetch(usuario.id);

        let xpGanhos = quantidade;
        const rank = 
            membro.roles.cache.has('1312827608857186384') ? 'Bronze' :
            membro.roles.cache.has('1312827605384429690') ? 'Prata' :
            membro.roles.cache.has('1312827534400028692') ? 'Ouro' :
            membro.roles.cache.has('1312827612682256444') ? 'Platina' : null;

        if (rank) {
            xpGanhos = Math.floor(xpGanhos); // Aplica o multiplicador do rank
        }

        // Adicionar XP
        adicionarXP(usuario.id, xpGanhos, rank || 'Sem rank');

        // Enviar log para o canal específico
        const logChannel = interaction.client.channels.cache.get(logChannelId);
        if (logChannel) {
            logChannel.send(`Foram adicionados ${quantidade} **Pontos de Honra** para ${usuario.toString()} por ${interaction.user.toString()}.`);
        }

        // Enviar mensagem privada ao usuário
        try {
            await usuario.send(`Você recebeu ${quantidade} **Pontos de Honra** de ${interaction.user.toString()}.`);
        } catch (error) {
            console.error('Erro ao enviar mensagem privada:', error);
        }

        // Responder ao comando
        await interaction.reply({ 
            content: `Foram adicionados ${quantidade} **Pontos de Honra** (${xpGanhos} XP) para ${usuario.id}.`, 
            ephemeral: true 
        });
    },
};
