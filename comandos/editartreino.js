const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const treinosPath = path.join(__dirname, '../dados/treinos.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('editartreino')
        .setDescription('Edita o treino de um jogador.')
        .addUserOption(option =>
            option.setName('jogador')
                .setDescription('O jogador cujo treino será editado.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('descricao')
                .setDescription('Novo treino.')
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName('pontos')
                .setDescription('Nova quantidade de pontos do treino.')
                .setRequired(false)
        ),
    async execute(interaction) {
        // Verifica permissão do líder
        if (!interaction.member.roles.cache.has('1310275274470064198')) {
            return await interaction.reply({ content: 'Você não tem permissão para usar este comando.', ephemeral: true });
        }

        const jogador = interaction.options.getUser('jogador');
        let novaDescricao = interaction.options.getString('descricao');
        const novosPontos = interaction.options.getInteger('pontos');

        // Lê ou inicializa o arquivo de treinos
        let treinos = {};
        if (fs.existsSync(treinosPath)) {
            const data = fs.readFileSync(treinosPath, 'utf-8');
            treinos = data.trim() ? JSON.parse(data) : {};
        }

        // Verifica se o jogador possui um treino ativo
        if (!treinos[jogador.id]) {
            return await interaction.reply({
                content: `${jogador.username} não possui um treino ativo para ser editado.`,
                ephemeral: true,
            });
        }

        // Atualiza os dados do treino
        const treinoAtual = treinos[jogador.id];
        if (novaDescricao) {
            novaDescricao = novaDescricao.replace(/\\n/g, '\n');
            treinoAtual.descricao = novaDescricao;
        }
        if (novosPontos !== null) {
            treinoAtual.pontos = novosPontos;
        }

        // Salva as alterações no arquivo
        fs.writeFileSync(treinosPath, JSON.stringify(treinos, null, 2));

        // Cria embed para o canal de logs
        const embed = new EmbedBuilder()
            .setColor(0x00bfff) // Azul
            .setTitle('Treino Editado')
            .setDescription(`**Jogador:** ${jogador.username}\n${treinoAtual.descricao}\n**Novos Pontos:** ${treinoAtual.pontos}`)
            .setTimestamp()
            .setFooter({ text: `Treino editado por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

        // Envia para o canal de logs
        const canalLogs = interaction.guild.channels.cache.get('1321090064519925812');
        if (canalLogs) {
            canalLogs.send({ embeds: [embed] });
        }

        // Resposta visível apenas para o líder
        await interaction.reply({
            content: `Treino de ${jogador.username} foi atualizado com sucesso.`,
            ephemeral: true,
        });
    },
};
