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

    // Notificar a TODOS los Polos que Marco gritó
    const allPolos = playersDb.findPlayersByRole(["polo", "polo-especial"]);

    allPolos.forEach((player) => {
      emitToSpecificClient(player.id, "marcoShouted", {
        marcoNickname: marcoPlayer.nickname,
        message: "¡Marco ha gritado! Responde con Polo...",
      });
    });

    // Notificar a Marco que su grito fue enviado
    emitToSpecificClient(socketId, "marcoShoutSent", {
      message: "Has gritado Marco. Espera a que los Polos respondan...",
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

    // Solo los Polos pueden gritar "Polo"
    if (poloPlayer.role !== "polo" && poloPlayer.role !== "polo-especial") {
      return res
        .status(400)
        .json({ error: "Solo los Polos pueden gritar Polo" });
    }

    // ✅ REGLA 3: Polo especial no atrapado suma +10 puntos cuando grita "Polo"
    if (poloPlayer.role === "polo-especial") {
      playersDb.updatePlayerScore(socketId, 10);
      console.log(
        `✅ ${
          poloPlayer.nickname
        } (Polo Especial) gritó "Polo" y suma +10 puntos. Puntuación actual: ${
          poloPlayer.score + 10
        }`
      );
    }

    // Notificar SOLO a Marco que un Polo gritó (PERO OCULTANDO EL ROL)
    const marcoPlayers = playersDb.findPlayersByRole("marco");

    marcoPlayers.forEach((player) => {
      emitToSpecificClient(player.id, "poloShouted", {
        message: "Polo!!",
        userId: socketId,
        poloNickname: poloPlayer.nickname,
        // ❌ NO enviar el rol - Marco no debe saber quién es el Polo especial
      });
    });

    // Notificar al Polo que su grito fue enviado
    emitToSpecificClient(socketId, "poloShoutSent", {
      message: "Has gritado Polo. Marco te está buscando...",
    });

    // Emitir actualización de puntuación después de sumar puntos (solo si fue Polo Especial)
    if (poloPlayer.role === "polo-especial") {
      emitEvent("scoreUpdate", playersDb.getPlayersSortedByScore());
    }

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

    // Verificar que solo Marco puede seleccionar Polos
    if (myUser.role !== "marco") {
      return res
        .status(400)
        .json({ error: "Solo Marco puede seleccionar Polos" });
    }

    let gameMessage = "";

    if (poloSelected.role === "polo-especial") {
      // ✅ REGLA 1: Marco atrapa Polo especial: +50 puntos para Marco
      playersDb.updatePlayerScore(socketId, 50);
      // ✅ REGLA 4: Polo especial atrapado: -10 puntos (PUEDE QUEDAR NEGATIVO)
      playersDb.updatePlayerScore(poloId, -10);
      gameMessage = `¡${myUser.nickname} atrapó a ${poloSelected.nickname}! ¡Era el Polo Especial! +50 puntos para ${myUser.nickname}, -10 puntos para ${poloSelected.nickname}`;
      console.log(
        `✅ ${myUser.nickname} (Marco) atrapó a ${poloSelected.nickname} (Polo Especial): +50/-10`
      );
    } else {
      // ✅ REGLA 2: Marco no atrapa Polo especial: -10 puntos para Marco (PUEDE QUEDAR NEGATIVO)
      playersDb.updatePlayerScore(socketId, -10);
      gameMessage = `${myUser.nickname} atrapó a ${poloSelected.nickname} pero no era el Polo Especial. -10 puntos para ${myUser.nickname}`;
      console.log(
        `✅ ${myUser.nickname} (Marco) atrapó a ${poloSelected.nickname} (Polo normal): -10 puntos`
      );
    }

    // ✅ FORZAR ACTUALIZACIÓN INMEDIATA de puntuaciones
    const updatedScores = playersDb.getPlayersSortedByScore();
    emitEvent("scoreUpdate", updatedScores);

    // Verificar si hay un ganador (≥100 puntos)
    const winner = playersDb.getWinner(100);
    if (winner) {
      const sortedPlayers = playersDb.getPlayersSortedByScore();

      // ✅ Mostrar pantalla final cuando alguien alcanza ≥100 puntos
      allPlayers.forEach((player) => {
        emitToSpecificClient(player.id, "gameWon", {
          winner: winner.nickname,
          winnerScore: winner.score,
          players: sortedPlayers,
        });
      });

      emitEvent("gameWon", {
        winner: winner.nickname,
        winnerScore: winner.score,
        players: sortedPlayers,
      });

      console.log(
        `🏆 ${winner.nickname} ha ganado el juego con ${winner.score} puntos!`
      );
    } else {
      // ✅ Actualizar puntuación en tiempo real para todos los clientes
      emitEvent("scoreUpdate", updatedScores);

      // Mostrar en consola las puntuaciones actualizadas
      console.log(
        "📊 Puntuaciones actualizadas:",
        updatedScores.map((p) => `${p.nickname}: ${p.score}`).join(", ")
      );

      // Notificar fin de ronda a todos los jugadores
      allPlayers.forEach((player) => {
        emitToSpecificClient(player.id, "notifyGameOver", {
          message: gameMessage,
        });
      });

      // ✅ ROTAR ROLES después de cada ronda (después de 2 segundos)
      setTimeout(() => {
        console.log("🔄 Iniciando rotación de roles...");
        const playersWithNewRoles = playersDb.assignPlayerRoles();

        // ✅ Notificar a cada jugador su nuevo rol individualmente
        playersWithNewRoles.forEach((player) => {
          emitToSpecificClient(player.id, "roleUpdated", {
            role: player.role,
          });
        });

        console.log("✅ Roles rotados y notificados a todos los jugadores");
      }, 2000);
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
    const winner = playersDb.getWinner(100);
    const scores = playersDb.getPlayersSortedByScore();

    if (winner) {
      res.status(200).json({
        hasWinner: true,
        winner: winner.nickname,
        winnerScore: winner.score,
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
