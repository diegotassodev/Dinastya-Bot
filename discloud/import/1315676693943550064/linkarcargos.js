const dotenv = require('dotenv');
dotenv.config();
const { GUILD_ID, GUILD_ID2 } = process.env;

const roleMapping = {
  '1213254729031753758': '872815968517242900', // Divisão 1
  '1213254720123047986': '872817816632451073',  // Divisão 2
  '1213254677165117551': '872826632010862663'   // Divisão 3
};

async function sincronizarCargos(client) {
  const servidor1 = client.guilds.cache.get(GUILD_ID);
  const servidor2 = client.guilds.cache.get(GUILD_ID2);

  if (!servidor1 || !servidor2) {
    console.log('GUILD_ID:', GUILD_ID);
    console.log('GUILD_ID2:', GUILD_ID2);
    return console.error('Um ou ambos os servidores não foram encontrados.');
  }

  const membrosServidor2 = await servidor2.members.fetch(); // Membros do servidor 2
  const membrosServidor1 = await servidor1.members.fetch(); // Membros do servidor 1

  for (const [memberId, membroServidor1] of membrosServidor1) {
    const membroServidor2 = membrosServidor2.get(memberId);

    if (!membroServidor2) {
      // Usuário não está no servidor 2, remover todos os cargos mapeados no servidor 1
      for (const [roleIdServidor1] of Object.entries(roleMapping)) {
        const cargoRemover = servidor1.roles.cache.get(roleIdServidor1);
        if (cargoRemover && membroServidor1.roles.cache.has(roleIdServidor1)) {
          await membroServidor1.roles.remove(cargoRemover).catch(console.error);
          console.log(`Cargo ${cargoRemover.name} removido do membro ${membroServidor1.user.tag} no servidor 1 (usuário não está no servidor 2).`);
        }
      }
      continue; // Pula para o próximo membro
    }

    // Sincronizar cargos para usuários que estão no servidor 2
    for (const [roleIdServidor2, roleIdServidor1] of Object.entries(roleMapping)) {
      const temCargoServidor2 = membroServidor2.roles.cache.has(roleIdServidor2);
      const temCargoServidor1 = membroServidor1.roles.cache.has(roleIdServidor1);

      if (temCargoServidor2 && !temCargoServidor1) {
        // Adicionar cargo no servidor 1
        const cargoAdicionar = servidor1.roles.cache.get(roleIdServidor1);
        if (cargoAdicionar) {
          await membroServidor1.roles.add(cargoAdicionar).catch(console.error);
          console.log(`Cargo ${cargoAdicionar.name} adicionado ao membro ${membroServidor1.user.tag} no servidor 1.`);
        }
      } else if (!temCargoServidor2 && temCargoServidor1) {
        // Remover cargo no servidor 1 se não estiver no servidor 2
        const cargoRemover = servidor1.roles.cache.get(roleIdServidor1);
        if (cargoRemover) {
          await membroServidor1.roles.remove(cargoRemover).catch(console.error);
          console.log(`Cargo ${cargoRemover.name} removido do membro ${membroServidor1.user.tag} no servidor 1.`);
        }
      }
    }
  }
}

function iniciarSincronizacao(client) {
  setInterval(() => {
    sincronizarCargos(client).catch(console.error);
  }, 5000); // Intervalo de 5 segundos
}

module.exports = { iniciarSincronizacao };