/**
 * Assign roles to players
 * @param {Array} players - Array of player objects
 * @returns {Array} Players with assigned roles
 */
const assignRoles = (players) => {
  if (players.length === 0) return players;

  // Shuffle players array
  const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

  // Assign one marco, one polo-especial, and the rest as polo
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
