const playersDb = require("../db/players.db");

const getPlayers = async (req, res) => {
  try {
    const players = playersDb.getAllPlayers();
    res.status(200).json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getPlayers,
};
