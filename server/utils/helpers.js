/**
 * Asigna roles y ROTA los roles existentes
 * @param {Array} players
 * @returns {Array}
 */
const assignRoles = (players) => {
  if (players.length === 0) return players;

  // Si ya hay roles asignados, ROTARLOS
  const playersWithRoles = players.filter((p) => p.role);
  if (playersWithRoles.length > 0) {
    // Rotar roles: Marco -> Polo, Polo Especial -> Marco, Polo -> Polo Especial
    players.forEach((player) => {
      if (player.role === "marco") {
        player.role = "polo";
      } else if (player.role === "polo-especial") {
        player.role = "marco";
      } else if (player.role === "polo") {
        player.role = "polo-especial";
      }
    });

    return players;
  }

  // Primera vez: asignar roles aleatorios
  const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

  shuffledPlayers.forEach((player, index) => {
    if (index === 0) {
      player.role = "marco";
    } else if (index === 1) {
      player.role = "polo-especial";
    } else {
      player.role = "polo";
    }
  });

  return shuffledPlayers;
};

module.exports = {
  assignRoles,
};
