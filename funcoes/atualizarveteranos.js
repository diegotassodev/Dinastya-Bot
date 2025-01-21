const fs = require('fs');
const path = require('path');
const xpPath = path.join(__dirname, '../dados/xp.json');

const cargoTop3Id = '1325917239647666288';

async function atualizarveteranos(client, guildId) {
  let xp = {};

  // Ler os dados de XP do arquivo
  if (fs.existsSync(xpPath)) {
    try {
      const data = fs.readFileSync(xpPath, 'utf8');
      xp = JSON.parse(data);
    } catch (error) {
      console.error('Erro ao ler o arquivo de XP:', error);
      return;
    }
  }

  // Identificar os top 3 usuários com mais XP
  const top3 = Object.entries(xp)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([id]) => id);

  const guild = await client.guilds.fetch(guildId);
  const membros = await guild.members.fetch();

  // Atualizar os cargos dos membros
  await Promise.all(
    membros.map(async (membro) => {
      if (top3.includes(membro.id)) {
        if (!membro.roles.cache.has(cargoTop3Id)) {
          await membro.roles.add(cargoTop3Id).catch(console.error);
        }
      } else {
        if (membro.roles.cache.has(cargoTop3Id)) {
          await membro.roles.remove(cargoTop3Id).catch(console.error);
        }
      }
    })
  );
}

module.exports = { atualizarveteranos };