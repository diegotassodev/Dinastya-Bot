const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ChannelType } = require('discord.js');
const mapas = require('../dados/mapas.json'); // Importar os mapas

// Função para embaralhar um array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Troca os elementos
    }
    return array;
}

async function handleVoiceStateUpdate(oldState, newState, client, GUILD_ID) {
    const targetChannelId = '1314261347625730170'; // ID da call principal
    const guild = client.guilds.cache.get(GUILD_ID);

    // Verificar se a call atingiu 8 jogadores
    const channel = guild.channels.cache.get(targetChannelId);
    if (channel && channel.members.size === 8) {
        const jogadores = Array.from(channel.members.values());

        // Escolher mapa aleatório
        const mapaAleatorio = mapas.mapas[Math.floor(Math.random() * mapas.mapas.length)];

        // Criar canal "Esperando"
        const esperandoChannel = await guild.channels.create({
            name: '⏳・Esperando',
            type: ChannelType.GuildVoice,
            parent: channel.parentId,
        });

        // Mover jogadores para o canal "Esperando"
        for (const jogador of jogadores) {
            await jogador.voice.setChannel(esperandoChannel);
        }

        // Criar chat temporário
        const esperandoChat = await guild.channels.create({
            name: '🗺️・mapa-escolhido',
            type: ChannelType.GuildText,
            parent: channel.parentId,
        });

        // Criar embed com o mapa
        const embed = new EmbedBuilder()
            .setTitle('Mapa Selecionado')
            .setDescription(`O mapa selecionado é: **${mapaAleatorio}** 🗺️ `)
            .setColor('Random');

        // Enviar embed para o chat
        await esperandoChat.send({
            embeds: [embed],
        });

        // Criar canais para os times aleatórios
        const time1Channel = await guild.channels.create({
            name: '🏰・Time 1',
            type: ChannelType.GuildVoice,
            parent: channel.parentId,
        });

        const time2Channel = await guild.channels.create({
            name: '🏰・Time 2',
            type: ChannelType.GuildVoice,
            parent: channel.parentId,
        });

        // Embaralhar jogadores para distribuir aleatoriamente
        const jogadoresEmbaralhados = shuffleArray(jogadores);

        // Distribuir jogadores aleatoriamente entre os times
        for (let i = 0; i < jogadoresEmbaralhados.length; i++) {
            const jogador = jogadoresEmbaralhados[i];
            const targetChannel = i % 2 === 0 ? time1Channel : time2Channel;
            await jogador.voice.setChannel(targetChannel);
        }

        // Verificar se todos saíram dos canais "Time 1" e "Time 2"
        const verificarSaidaDosJogadores = async () => {
            const time1Members = time1Channel.members.size;
            const time2Members = time2Channel.members.size;

            // Se ambos os canais estiverem vazios, deletar os canais
            if (time1Members === 0 && time2Members === 0) {
                await esperandoChat.delete();  // Apagar chat do mapa
                await esperandoChannel.delete(); // Apagar canal "Esperando"
                await time1Channel.delete();   // Apagar canal do time 1
                await time2Channel.delete();   // Apagar canal do time 2
            }
        };

        // Monitorar saída dos jogadores
        client.on('voiceStateUpdate', (oldState, newState) => {
            // Quando um jogador sair dos canais "Time 1" ou "Time 2", verificar se todos saíram
            if (oldState.channel && (oldState.channel.id === time1Channel.id || oldState.channel.id === time2Channel.id)) {
                verificarSaidaDosJogadores();
            }
        });
    }
}

module.exports = handleVoiceStateUpdate;
