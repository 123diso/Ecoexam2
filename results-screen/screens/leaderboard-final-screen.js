import { navigateTo, makeRequest, socket } from "../app.js";

export default function renderLeaderboardFinalScreen(data) {
  const app = document.getElementById("app");

  let currentPlayers = [...data.players].sort((a, b) => b.score - a.score);
  let isSortedByScore = true;

  app.innerHTML = `
    <div id="leaderboard-final">
      <h1>¡Juego Terminado!</h1>
      <h2>🏆 Ganador: ${data.winner} 🏆</h2>
      <h3>Puntuación: ${
        data.players.find((p) => p.nickname === data.winner)?.score || 0
      } puntos</h3>
      
      <div id="ranking-controls">
        <button id="sort-by-score" class="active">Ordenar por Puntuación</button>
        <button id="sort-alphabetically">Ordenar Alfabéticamente</button>
      </div>
      
      <div id="final-players-list">
        ${renderPlayersList(currentPlayers, true)}
      </div>
      
      <div class="final-buttons">
        <button id="back-to-live">Volver a Vista en Tiempo Real</button>
        <button id="new-game">Nuevo Juego</button>
        <button id="reset-scores">Reiniciar Puntuaciones</button>
      </div>
    </div>
  `;

  const playersList = document.getElementById("final-players-list");
  const sortByScoreBtn = document.getElementById("sort-by-score");
  const sortAlphabeticallyBtn = document.getElementById("sort-alphabetically");
  const backToLiveBtn = document.getElementById("back-to-live");
  const newGameBtn = document.getElementById("new-game");
  const resetScoresBtn = document.getElementById("reset-scores");

  sortByScoreBtn.addEventListener("click", () => {
    currentPlayers = [...data.players].sort((a, b) => b.score - a.score);
    playersList.innerHTML = renderPlayersList(currentPlayers, true);
    updateButtonStates(true);
  });

  sortAlphabeticallyBtn.addEventListener("click", () => {
    currentPlayers = [...data.players].sort((a, b) =>
      a.nickname.localeCompare(b.nickname)
    );
    playersList.innerHTML = renderPlayersList(currentPlayers, false);
    updateButtonStates(false);
  });

  backToLiveBtn.addEventListener("click", () => {
    navigateTo("/");
  });

  newGameBtn.addEventListener("click", async () => {
    try {
      const result = await makeRequest("/api/game/reset-game", "POST");
      if (result.success) {
        alert(
          "¡Nuevo juego iniciado! Los jugadores pueden comenzar una nueva partida."
        );
        navigateTo("/");
      }
    } catch (error) {
      console.error("Error starting new game:", error);
      alert("Error al iniciar nuevo juego. Intenta de nuevo.");
    }
  });

  resetScoresBtn.addEventListener("click", async () => {
    try {
      const result = await makeRequest("/api/game/reset-scores", "POST");
      if (result.success) {
        alert("Puntuaciones reiniciadas.");
        navigateTo("/");
      }
    } catch (error) {
      console.error("Error resetting scores:", error);
      alert("Error al reiniciar puntuaciones.");
    }
  });

  socket.on("gameReset", (data) => {
    alert(data.message);
    navigateTo("/");
  });

  function updateButtonStates(byScore) {
    if (byScore) {
      sortByScoreBtn.classList.add("active");
      sortAlphabeticallyBtn.classList.remove("active");
    } else {
      sortByScoreBtn.classList.remove("active");
      sortAlphabeticallyBtn.classList.add("active");
    }
  }

  function renderPlayersList(players, showPositions = true) {
    if (!players || players.length === 0) {
      return "<p>No hay jugadores</p>";
    }

    if (showPositions) {
      return `
        <div class="players-header with-positions">
          <span>Posición</span>
          <span>Jugador</span>
          <span>Puntuación</span>
          <span>Rol</span>
        </div>
        ${players
          .map(
            (player, index) => `
          <div class="player-row with-positions ${
            player.nickname === data.winner ? "winner" : ""
          }">
            <span>${index + 1}</span>
            <span class="player-name">${player.nickname}</span>
            <span class="player-score">${player.score} pts</span>
            <span class="player-role">${player.role || "-"}</span>
          </div>
        `
          )
          .join("")}
      `;
    } else {
      return `
        <div class="players-header">
          <span>Jugador</span>
          <span>Puntuación</span>
          <span>Rol</span>
        </div>
        ${players
          .map(
            (player) => `
          <div class="player-row ${
            player.nickname === data.winner ? "winner" : ""
          }">
            <span class="player-name">${player.nickname}</span>
            <span class="player-score">${player.score} pts</span>
            <span class="player-role">${player.role || "-"}</span>
          </div>
        `
          )
          .join("")}
      `;
    }
  }
}
