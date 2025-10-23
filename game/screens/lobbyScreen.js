import { navigateTo, socket, makeRequest } from "../app.js";

export default function renderLobbyScreen(data) {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div id="lobby-screen">
      <h2 id="nickname-display">${data.nickname}</h2>
      <p>
        Esperando a que otros se unan:
        <b id="users-count"><b>0</b></b> usuarios en la sala
      </p>
      <div id="players-in-lobby"></div>
      <div class="lobby-actions">
        <button id="start-button">Iniciar juego</button>
        <button id="back-to-home">Volver al Inicio</button>
        <button id="reset-game-button">Reiniciar juego completo</button>
      </div>
    </div>
  `;

  const startButton = document.getElementById("start-button");
  const backToHomeButton = document.getElementById("back-to-home");
  const resetGameButton = document.getElementById("reset-game-button");
  const usersCount = document.getElementById("users-count");
  const playersList = document.getElementById("players-in-lobby");

  usersCount.innerHTML = data?.players?.length || 0;
  updatePlayersList(data?.players || []);

  socket.on("userJoined", (data) => {
    usersCount.innerHTML = data?.players.length || 0;
    updatePlayersList(data?.players || []);
  });

  socket.on("gameReset", (data) => {
    usersCount.innerHTML = data?.players.length || 0;
    updatePlayersList(data?.players || []);
    alert("El juego ha sido reiniciado.");
  });

  startButton.addEventListener("click", async () => {
    await makeRequest("/api/game/start", "POST");
  });

  backToHomeButton.addEventListener("click", () => {
    navigateTo("/", {});
  });

  resetGameButton.addEventListener("click", async () => {
    if (
      confirm(
        "¿Estás seguro de que quieres reiniciar el juego completo? Esto limpiará todas las puntuaciones y enviará a todos al inicio."
      )
    ) {
      await makeRequest("/api/game/reset-game", "POST");
    }
  });

  socket.on("startGame", (role) => {
    navigateTo("/game", { nickname: data.nickname, role });
  });

  function updatePlayersList(players) {
    if (!players || players.length === 0) {
      playersList.innerHTML = "<p>No hay jugadores en el lobby</p>";
      return;
    }

    playersList.innerHTML = `
      <h4>Jugadores conectados:</h4>
      ${players
        .map(
          (player) => `
        <div class="lobby-player">
          <span class="player-name">${player.nickname}</span>
          <span class="player-score">${player.score || 0} pts</span>
          <span class="player-role">${player.role || "Esperando"}</span>
          ${
            player.nickname === data.nickname
              ? '<span class="you-indicator">(Tú)</span>'
              : ""
          }
        </div>
      `
        )
        .join("")}
    `;
  }
}
