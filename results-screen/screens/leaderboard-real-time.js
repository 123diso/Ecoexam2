import { navigateTo, socket, makeRequest } from "../app.js";

export default function renderLeaderboardRealTime() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div id="leaderboard-real-time">
      <h2>Tabla de Puntuaciones en Tiempo Real</h2>
      <div id="players-list">
        <p>Cargando jugadores...</p>
      </div>
      
      <div class="action-buttons">
        <button id="reset-scores-btn">Reiniciar Puntuaciones</button>
        <button id="view-final-btn">Ver Pantalla Final</button>
        <button id="back-to-game">Ir al Juego</button>
      </div>
    </div>
  `;

  const playersList = document.getElementById("players-list");
  const resetButton = document.getElementById("reset-scores-btn");
  const viewFinalButton = document.getElementById("view-final-btn");
  const backToGameButton = document.getElementById("back-to-game");

  loadScores();

  socket.on("scoreUpdate", (players) => {
    updatePlayersList(players);
  });

  socket.on("userJoined", (data) => {
    updatePlayersList(data.players);
  });

  socket.on("scoresReset", () => {
    playersList.innerHTML =
      "<p>Puntuaciones reiniciadas. Esperando jugadores...</p>";
  });

  resetButton.addEventListener("click", async () => {
    await makeRequest("/api/game/reset-scores", "POST");
  });

  viewFinalButton.addEventListener("click", async () => {
    const scores = await makeRequest("/api/game/scores", "GET");
    if (scores && scores.length > 0) {
      navigateTo("/final", {
        winner: scores[0].nickname,
        players: scores,
      });
    }
  });

  backToGameButton.addEventListener("click", () => {
    // Redirigir al juego principal
    window.open("/game", "_blank");
  });

  async function loadScores() {
    try {
      const scores = await makeRequest("/api/game/scores", "GET");
      updatePlayersList(scores);
    } catch (error) {
      playersList.innerHTML = "<p>Error cargando puntuaciones</p>";
    }
  }

  function updatePlayersList(players) {
    if (!players || players.length === 0) {
      playersList.innerHTML = "<p>No hay jugadores conectados</p>";
      return;
    }

    playersList.innerHTML = `
      <div class="players-header">
        <span>Posición</span>
        <span>Jugador</span>
        <span>Puntuación</span>
        <span>Rol</span>
      </div>
      ${players
        .map(
          (player, index) => `
        <div class="player-row">
          <span>${index + 1}</span>
          <span>${player.nickname}</span>
          <span>${player.score} pts</span>
          <span>${player.role || "Esperando"}</span>
        </div>
      `
        )
        .join("")}
    `;
  }
}
