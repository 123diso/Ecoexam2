import { makeRequest, navigateTo, socket } from "../app.js";

export default function renderGameOverScreen(data) {
  const app = document.getElementById("app");

  let content = "";

  if (data.isGameWon && data.players) {
    content = `
      <div id="game-final">
        <h1>🎉 ¡Juego Terminado! 🎉</h1>
        <h2>🏆 Ganador: ${data.winner} 🏆</h2>
        <h3>${data.message}</h3>
        
        <div class="final-ranking">
          <h4>Ranking Final:</h4>
          <div id="ranking-list">
            ${data.players
              .map(
                (player, index) =>
                  `<div class="rank-item ${
                    player.nickname === data.winner ? "winner" : ""
                  }">
                <span class="position">${index + 1}.</span>
                <span class="name">${player.nickname}</span>
                <span class="score">${player.score} pts</span>
                <span class="role">${player.role || "-"}</span>
              </div>`
              )
              .join("")}
          </div>
        </div>
        
        <div class="final-actions">
          <button id="back-to-home">Volver al Inicio</button>
          <button id="view-results">Ver Resultados Detallados</button>
        </div>
      </div>
    `;
  } else {
    content = `
      <div id="game-over">
        <h1>Ronda Terminada</h1>
        <h2 id="game-result">${data.message}</h2>
        <div class="final-actions">
          <button id="back-to-home">Volver al Inicio</button>
          <button id="view-results">Ver Resultados</button>
        </div>
      </div>
    `;
  }

  app.innerHTML = content;

  const backToHomeButton = document.getElementById("back-to-home");
  const viewResultsButton = document.getElementById("view-results");

  backToHomeButton.addEventListener("click", () => {
    // Volver a la pantalla de inicio para permitir nuevo ingreso
    navigateTo("/", {});
  });

  if (viewResultsButton) {
    viewResultsButton.addEventListener("click", () => {
      window.open("/results", "_blank");
    });
  }

  // Escuchar cuando el juego se reinicia
  socket.on("gameReset", (data) => {
    alert("¡Nuevo juego iniciado! Serás redirigido al inicio.");
    navigateTo("/", {});
  });

  socket.on("scoresReset", (data) => {
    alert("Puntuaciones reiniciadas. Serás redirigido al inicio.");
    navigateTo("/", {});
  });
}
