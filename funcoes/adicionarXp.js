const fs = require('fs');
const path = require('path');

// Caminho do arquivo xp.json
const xpPath = path.join(__dirname, '../dados/xp.json');

// Multiplicadores baseados no rank
const MULTIPLICADORES = {
  Bronze: 2,
  Prata: 3,
  Ouro: 5,
  Platina: 10,
};

/**
 * Adiciona XP ao jogador com base nos pontos de honra recebidos.
 * @param {string} nomeJogador - Nome do jogador.
 * @param {number} pontosHonra - Pontos de honra recebidos.
 * @param {string} rank - Rank atual do jogador (Bronze, Prata, Ouro, Platina).
 */

function adicionarXp(nomeJogador, pontosHonra, rank) {
  // Leitura inicial do arquivo xp.json
  let xpData = {};
  if (fs.existsSync(xpPath)) {
    xpData = JSON.parse(fs.readFileSync(xpPath, 'utf8'));
  }

  // Multiplicador baseado no rank
  const multiplicador = MULTIPLICADORES[rank] || 1;

  // Calcular o XP a ser adicionado
  const xpGanho = pontosHonra * multiplicador;

  // Atualizar o XP do jogador
  if (!xpData[nomeJogador]) {
    xpData[nomeJogador] = 0;
  }
  xpData[nomeJogador] += xpGanho;

  // Salvar os dados atualizados
  fs.writeFileSync(xpPath, JSON.stringify(xpData, null, 2));

  console.log(`XP atualizado: ${nomeJogador} ganhou ${xpGanho} XP (Total: ${xpData[nomeJogador]} XP).`);
}

module.exports = adicionarXp;
