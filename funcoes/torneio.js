const { EmbedBuilder, ChannelType } = require('discord.js');

// Função para embaralhar um array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Troca os elementos
    }
    return array;
}

async function handleTorneioVoiceUpdate(oldState, newState, client, GUILD_ID) {
    const targetChannelId = '1316613903551041697'; // ID da call de torneio
    const guild = client.guilds.cache.get(GUILD_ID);

    // Verificar se a call atingiu 8 jogadores
    const channel = guild.channels.cache.get(targetChannelId);
    if (channel && channel.members.size === 8) {
        const jogadores = Array.from(channel.members.values());

        // Embaralhar jogadores para distribuir aleatoriamente
        const jogadoresEmbaralhados = shuffleArray(jogadores);

        // Criar 4 canais para as partidas
        const canaisPartidas = [];
        for (let i = 1; i <= 4; i++) {
            const canal = await guild.channels.create({
                name: `⚔️・Partida ${i}`,
                type: ChannelType.GuildVoice,
                parent: channel.parentId,
            });
            canaisPartidas.push(canal);
        }

        // Dividir jogadores em 4 partidas
        for (let i = 0; i < jogadoresEmbaralhados.length; i++) {
            const jogador = jogadoresEmbaralhados[i];
            const targetChannel = canaisPartidas[i % 4];
            await jogador.voice.setChannel(targetChannel);
        }

        // Criar canal de texto para o bracket
        const bracketChannel = await guild.channels.create({
            name: '📜・bracket',
            type: ChannelType.GuildText,
            parent: channel.parentId,
        });

        // Gerar bracket com jogadores
        const partidas = [
            { jogadores: [jogadoresEmbaralhados[0], jogadoresEmbaralhados[1]], partida: 'Partida 1' },
            { jogadores: [jogadoresEmbaralhados[2], jogadoresEmbaralhados[3]], partida: 'Partida 2' },
            { jogadores: [jogadoresEmbaralhados[4], jogadoresEmbaralhados[5]], partida: 'Partida 3' },
            { jogadores: [jogadoresEmbaralhados[6], jogadoresEmbaralhados[7]], partida: 'Partida 4' },
        ];

        const bracketEmbed = new EmbedBuilder()
            .setTitle('Torneio Bracket')
            .setColor('Random')
            .setDescription(
                partidas
                    .map(p => `**${p.partida}**: ${p.jogadores[0]?.user.username} 🆚 ${p.jogadores[1]?.user.username}`)
                    .join('\n')
            );

        // Enviar embed com o bracket
        await bracketChannel.send({
            embeds: [bracketEmbed],
        });

        // Monitorar saídas dos jogadores e deletar os canais
        const verificarSaidaDosJogadores = async () => {
            const canaisVazios = canaisPartidas.every(canal => canal.members.size === 0);

            if (canaisVazios) {
                await bracketChannel.delete(); // Apagar canal de texto do bracket
                for (const canal of canaisPartidas) {
                    await canal.delete(); // Apagar canais de voz das partidas
                }
            }
        };

        client.on('voiceStateUpdate', (oldState, newState) => {
            // Verificar se todos os canais estão vazios
            if (oldState.channel && canaisPartidas.some(c => c.id === oldState.channel.id)) {
                verificarSaidaDosJogadores();
            }
        });
    }
}
module.exports = handleTorneioVoiceUpdate;
