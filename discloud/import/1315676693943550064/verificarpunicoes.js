const fs = require('fs');
const ms = require('ms');
const punishedRoleId = '1289775217497083914';
const bannedRoleId = '1289808875494707292';
const memberRoleId = '813788487782236240';
const filePath = './punicoes.json';
const staffLogsChannelId = '1306310681141837904'; // ID do canal de logs do staff

function verificarpunicoes(guild) {
  setInterval(() => {
    if (!fs.existsSync(filePath)) {
      return;
    }

    let existingData = [];
    try {
      const rawData = fs.readFileSync(filePath, 'utf8');
      if (rawData.trim()) {
        existingData = JSON.parse(rawData);
      }
    } catch (error) {
      console.error('Erro ao ler o arquivo punicoes.json:', error);
    }

    existingData.forEach(async (punishment, index) => {
      const currentDate = new Date();
      const dataDeTermino = new Date(punishment.dataDeTermino);

      if (currentDate >= dataDeTermino) {
        try {
          const member = await guild.members.fetch(punishment.user);

          // Remover a punição
          if (punishment.tipo === 'Castigo') {
            await member.roles.remove(punishedRoleId);
            await member.roles.add(memberRoleId);
          } 
          else if (punishment.tipo === 'Banimento') {
            await member.roles.remove(bannedRoleId);
            await member.roles.add(memberRoleId);
          }

          // Remover a punição do arquivo
          existingData.splice(index, 1);
          fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

          // Log da remoção da punição
          const staffTag = `<@${guild.client.user.id}>`;  // Mencionando o staff que removeu
          const userTag = `<@${punishment.user}>`;  // Mencionando o usuário punido

          const logMessage = `# Término de Punição\n**Staff:** ${staffTag}\n**Usuário:** ${userTag}\n**Tipo de Punição:** ${punishment.tipo}\n**Motivo:** ${punishment.motivo}\n**Duração:** ${punishment.tempo}`;
          const logChannel = guild.channels.cache.get(staffLogsChannelId);
          if (logChannel) logChannel.send(logMessage);

          // Enviar DM para o usuário
          const dmMessage = `## Punição Removida \n**Motivo da Punição**: ${punishment.motivo}\n**Duração:** ${punishment.tempo}`;
          const user = await guild.client.users.fetch(punishment.user);
          user.send(dmMessage).catch(() => console.log('Não foi possível enviar DM.'));

          console.log(`A punição de ${punishment.user} foi removida devido ao término.`);
        } 
        catch (err) {
          console.error(`Erro ao tentar buscar o membro ${punishment.user}:`, err);
        }
      }
    });
  }, 3000);  // Verifica a cada 30 segundos
}

module.exports = { verificarpunicoes };
