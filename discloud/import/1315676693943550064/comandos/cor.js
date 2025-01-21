// Importações necessárias para criar comandos e interagir com o Discord
const { SlashCommandBuilder } = require('@discordjs/builders');
const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ComponentType } = require('discord.js');

module.exports = {
    // Configuração básica do comando /cor
    data: new SlashCommandBuilder()
        .setName('cor')
        .setDescription('Ativar ou remover uma cor.'),

    // Função executada ao usar o comando
    async execute(interaction) {
        const { member } = interaction; // Obter o membro que usou o comando

        // IDs dos cargos principais
        const Patrocinador = '1240366263889428671';
        const Investidor = '1285284762021531772';

        // Cores disponíveis para patrocinadores
        const coresPatrocinador = {
            'rosa': '1288138160769073243',
            'verde': '1320760491810750484',
            'vermelho': '1288138278100271164',
            'amarelo': '1288137611730489406',
            'azul': '1288137476853989467',
        };

        // Cores disponíveis para investidores (incluem as de patrocinadores)
        const coresInvestidor = {
            ...coresPatrocinador,
            'azul-realeza': '1288137218833256448',
            'dourado': '1320760780320280717',
            'salmao': '1320760784602533988',
            'verde-marinho': '1288138583407988759',
            'magenta': '1288137353763881070',
        };

        // Verifica quais cores estão disponíveis para o membro baseado nos cargos
        const coresPermitidas = member.roles.cache.has(Investidor)
            ? coresInvestidor
            : member.roles.cache.has(Patrocinador)
            ? coresPatrocinador
            : null;

        // Caso o membro não tenha os cargos necessários, retorna uma mensagem de erro
        if (!coresPermitidas) {
            return interaction.reply({
                content: 'Você não possui os cargos necessários para usar este comando.',
                ephemeral: true,
            });
        }

        // Adiciona a opção (remover cor) ao final das cores disponíveis
        const coresComDefault = { ...coresPermitidas, default: 'default' };

        // Cria o embed com as cores disponíveis
        const embed = new EmbedBuilder()
            .setTitle('Selecione uma cor <:Paint:1320879953348395049> ')
            .setDescription('Escolha uma das cores disponíveis abaixo ou remova sua cor.')
            .setColor('#01782D')
            .addFields(
                Object.keys(coresComDefault).map(cor => ({
                    name: cor === 'default' ? '**Remover Cor**' : cor.charAt(0).toUpperCase() + cor.slice(1),
                    value: cor === 'default' ? 'Remover cor atual e retornar à cor padrão' : `<@&${coresComDefault[cor]}>`,
                    inline: false, // Cores dispostas verticalmente
                }))
            );

        // Cria o menu de seleção com as opções de cores
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_cor') // ID do menu de seleção
            .setPlaceholder('Selecione uma cor...') // Placeholder do menu
            .addOptions(
                Object.keys(coresPermitidas).map(cor => ({
                    label: cor.charAt(0).toUpperCase() + cor.slice(1),
                    value: coresPermitidas[cor],
                }))
                .concat([
                    {
                        label: 'Remover cor',
                        value: 'default',
                        description: 'Remover cor atual e retornar à cor padrão',
                    },
                ])
            );

        // Cria a linha de componentes com o menu de seleção
        const row = new ActionRowBuilder().addComponents(selectMenu);

        // Responde ao comando com o embed e o menu de seleção
        await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true,
        });

        // Configura um coletor sem limite de tempo
        const message = await interaction.fetchReply();
        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
        });

        // Evento acionado ao selecionar uma opção no menu
        collector.on('collect', async i => {
            if (i.customId === 'select_cor' && i.user.id === interaction.user.id) {
                const corId = i.values[0]; // ID da cor selecionada

                // Remove todas as cores existentes antes de adicionar a nova
                const rolesToRemove = Object.values(coresPermitidas).filter(roleId => member.roles.cache.has(roleId));
                for (const roleId of rolesToRemove) {
                    await member.roles.remove(roleId).catch(console.error);
                }

                // Adiciona a nova cor ou remove caso seja DEFAULT
                if (corId !== 'default') {
                    await member.roles.add(corId).catch(console.error);
                    await i.reply({
                        content: `A cor foi alterada para <@&${corId}> com sucesso!`,
                        ephemeral: true,
                    });
                } else {
                    await i.reply({
                        content: 'A cor foi removida, voltando à cor padrão.',
                        ephemeral: true,
                    });
                }
            }
        });
    },
};
