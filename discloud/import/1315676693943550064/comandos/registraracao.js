// Importações necessárias para criar comandos e interagir com o Discord
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    // Configuração básica do comando /registrar_ação
    data: new SlashCommandBuilder()
        .setName('registrar_ação')
        .setDescription('Registra uma ação com até três imagens.')
        .addStringOption(option =>
            option.setName('acao')
                .setDescription('A ação a ser registrada')
                .setRequired(true))
        .addAttachmentOption(option =>
            option.setName('imagem1')
                .setDescription('Primeira imagem')
                .setRequired(false))
        .addAttachmentOption(option =>
            option.setName('imagem2')
                .setDescription('Segunda imagem')
                .setRequired(false))
        .addAttachmentOption(option =>
            option.setName('imagem3')
                .setDescription('Terceira imagem')
                .setRequired(false)),

    // Função executada ao usar o comando
    async execute(interaction) {
        const { user, options, member } = interaction; // Obter o usuário, opções e membro
        const acao = options.getString('acao');
        const imagem1 = options.getAttachment('imagem1');
        const imagem2 = options.getAttachment('imagem2');
        const imagem3 = options.getAttachment('imagem3');

        // ID do canal de logs
        const STAFF_LOGS = '1306310681141837904'; // Substitua pelo ID do seu canal
        // ID do cargo permitido
        const CARGO_PERMITIDO = '892746407549763584'; // Substitua pelo ID do cargo permitido

        // Verifica se o membro possui o cargo permitido
        if (!member.roles.cache.has(CARGO_PERMITIDO)) {
            return await interaction.reply({
                content: 'Você não tem permissão para usar este comando.',
                ephemeral: true, // Mensagem visível apenas para o usuário
            });
        }

        // Enviar mensagem para o canal #staff-logs
        const channel = await interaction.client.channels.fetch(STAFF_LOGS);
        if (channel) {
            // Monta a mensagem a ser enviada
            let mensagem = `# Registro de ação\n` +
                           `**Staff:** <@${user.id}>\n` + // Menciona o usuário
                           `**Ação:** ${acao}\n`;

            // Adiciona as imagens se existirem
            if (imagem1) mensagem += `Imagem 1: ${imagem1.url}\n`;
            if (imagem2) mensagem += `Imagem 2: ${imagem2.url}\n`;
            if (imagem3) mensagem += `Imagem 3: ${imagem3.url}\n`;

            await channel.send(mensagem);
        }

        // Responder ao usuário que a ação foi registrada
        await interaction.reply('Ação registrada com sucesso.');
    },
};