const playersDb = require("../db/players.db");
const {
  emitEvent,
  emitToSpecificClient,
} = require("../services/socket.service");

const joinGame = async (req, res) => {
  try {
    const { nickname, socketId } = req.body;
    playersDb.addPlayer(nickname, socketId);

    const gameData = playersDb.getGameData();
    emitEvent("userJoined", gameData);
    emitEvent("scoreUpdate", playersDb.getPlayersSortedByScore());

    res.status(200).json({ success: true, players: gameData.players });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const startGame = async (req, res) => {
  try {
    const playersWithRoles = playersDb.assignPlayerRoles();

    playersWithRoles.forEach((player) => {
      emitToSpecificClient(player.id, "startGame", player.role);
    });

    emitEvent("rolesAssigned", playersWithRoles);

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const notifyMarco = async (req, res) => {
  try {
    const { socketId } = req.body;
    const marcoPlayer = playersDb.findPlayerById(socketId);

    const rolesToNotify = playersDb.findPlayersByRole([
      "polo",
      "polo-especial",
    ]);

    rolesToNotify.forEach((player) => {
      emitToSpecificClient(player.id, "notification", {
        message: "Marco!!!",
        userId: socketId,
        marcoNickname: marcoPlayer.nickname,
      });
    });

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const notifyPolo = async (req, res) => {
  try {
    const { socketId } = req.body;
    const poloPlayer = playersDb.findPlayerById(socketId);

    if (poloPlayer.role === "polo-especial") {
      playersDb.updatePlayerScore(socketId, 10);
      emitEvent("scoreUpdate", playersDb.getPlayersSortedByScore());
    }

    const rolesToNotify = playersDb.findPlayersByRole("marco");

    rolesToNotify.forEach((player) => {
      emitToSpecificClient(player.id, "notification", {
        message: "Polo!!",
        userId: socketId,
        poloNickname: poloPlayer.nickname,
      });
    });

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const selectPolo = async (req, res) => {
  try {
    const { socketId, poloId } = req.body;

    const myUser = playersDb.findPlayerById(socketId);
    const poloSelected = playersDb.findPlayerById(poloId);
    const allPlayers = playersDb.getAllPlayers();

    let gameMessage = "";

    if (poloSelected.role === "polo-especial") {
      playersDb.updatePlayerScore(socketId, 50);
      playersDb.updatePlayerScore(poloId, -10);
      gameMessage = `¡${myUser.nickname} atrapó a ${poloSelected.nickname} (Polo Especial)! +50 puntos`;
    } else {
      playersDb.updatePlayerScore(socketId, -10);
      gameMessage = `${myUser.nickname} atrapó a ${poloSelected.nickname} pero no era Polo Especial. -10 puntos`;
    }

    const winner = playersDb.getWinner();
    if (winner) {
      const sortedPlayers = playersDb.getPlayersSortedByScore();
      allPlayers.forEach((player) => {
        emitToSpecificClient(player.id, "gameWon", {
          winner: winner.nickname,
          players: sortedPlayers,
        });
      });

      emitEvent("gameWon", {
        winner: winner.nickname,
        players: sortedPlayers,
      });
    } else {
      emitEvent("scoreUpdate", playersDb.getPlayersSortedByScore());

      allPlayers.forEach((player) => {
        emitToSpecificClient(player.id, "notifyGameOver", {
          message: gameMessage,
        });
      });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const resetScores = async (req, res) => {
  try {
    playersDb.resetGame();
    emitEvent("scoresReset", { message: "Scores have been reset" });
    emitEvent("scoreUpdate", []);
    emitEvent("userJoined", { players: [] });

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getScores = async (req, res) => {
  try {
    const scores = playersDb.getPlayersSortedByScore();
    res.status(200).json(scores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getCurrentWinner = async (req, res) => {
  try {
    const winner = playersDb.getWinner();
    const scores = playersDb.getPlayersSortedByScore();

    if (winner) {
      res.status(200).json({
        hasWinner: true,
        winner: winner.nickname,
        players: scores,
      });
    } else {
      res.status(200).json({
        hasWinner: false,
        players: scores,
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const resetGame = async (req, res) => {
  try {
    const players = playersDb.getAllPlayers();

    players.forEach((player) => {
      player.score = 0;
      player.role = null;
    });

    emitEvent("gameReset", {
      message: "El juego ha sido reiniciado",
      players: players,
    });
    emitEvent("scoreUpdate", playersDb.getPlayersSortedByScore());

    res.status(200).json({ success: true, players });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  joinGame,
  startGame,
  notifyMarco,
  notifyPolo,
  selectPolo,
  resetScores,
  getScores,
  getCurrentWinner,
  resetGame,
};
