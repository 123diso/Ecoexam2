import { navigateTo, socket, makeRequest } from "../app.js";

export default function renderGameGround(data) {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div id="game-ground">
      <h2 id="game-nickname-display">${data.nickname}</h2>
      <p>Tu rol es:</p>
      <h2 id="role-display">${data.role}</h2>
      <h3 id="score-display">Puntuación: 0</h3>
      <h2 id="shout-display"></h2>
      <div id="pool-players"></div>
      <button id="shout-button">Gritar ${data.role}</button>
      <div id="current-players">
        <h4>Jugadores en la partida:</h4>
        <div id="players-list"></div>
      </div>
    </div>
  `;

  const nickname = data.nickname;
  const polos = [];
  const myRole = data.role;
  const shoutbtn = document.getElementById("shout-button");
  const shoutDisplay = document.getElementById("shout-display");
  const scoreDisplay = document.getElementById("score-display");
  const container = document.getElementById("pool-players");
  const playersList = document.getElementById("players-list");

  if (myRole !== "marco") {
    shoutbtn.style.display = "none";
  }

  shoutDisplay.style.display = "none";

  // Cargar jugadores actuales
  loadCurrentPlayers();

  // Escuchar cuando nuevos jugadores se unen
  socket.on("userJoined", (data) => {
    updatePlayersList(data.players);
  });

  // Escuchar cuando se asignan roles
  socket.on("rolesAssigned", (players) => {
    updatePlayersList(players);
  });

  // Actualizar puntuación cuando llegue
  socket.on("scoreUpdate", (players) => {
    const currentPlayer = players.find((p) => p.nickname === nickname);
    if (currentPlayer) {
      scoreDisplay.textContent = `Puntuación: ${currentPlayer.score}`;
    }
    updatePlayersList(players);
  });

  // Replace socket.emit with HTTP requests
  shoutbtn.addEventListener("click", async () => {
    if (myRole === "marco") {
      await makeRequest("/api/game/marco", "POST", {
        socketId: socket.id,
      });
    }
    if (myRole === "polo" || myRole === "polo-especial") {
      await makeRequest("/api/game/polo", "POST", {
        socketId: socket.id,
      });
    }
    shoutbtn.style.display = "none";
  });

  // Add event listener to the container for all buttons: this is called event delegation
  container.addEventListener("click", async function (event) {
    if (event.target.tagName === "BUTTON") {
      const key = event.target.dataset.key;
      await makeRequest("/api/game/select-polo", "POST", {
        socketId: socket.id,
        poloId: key,
      });
    }
  });

  // Keep socket.on listeners for receiving notifications
  socket.on("notification", (data) => {
    console.log("Notification", data);
    if (myRole === "marco") {
      container.innerHTML =
        "<p>Haz click sobre el polo que quieres escoger:</p>";
      // Limpiar polos anteriores y agregar solo el nuevo
      polos.length = 0;
      polos.push(data);
      polos.forEach((elemt) => {
        const button = document.createElement("button");
        button.innerHTML = `${elemt.poloNickname || "Un jugador"} gritó: ${
          elemt.message
        }`;
        button.setAttribute("data-key", elemt.userId);
        container.appendChild(button);
      });
    } else {
      shoutbtn.style.display = "block";
      shoutDisplay.innerHTML = `${data.marcoNickname || "Marco"} ha gritado: ${
        data.message
      }`;
      shoutDisplay.style.display = "block";
    }
  });

  // Keep socket.on listeners for game over notification
  socket.on("notifyGameOver", (data) => {
    // En lugar de navegar inmediatamente, mostrar mensaje y esperar nueva ronda
    alert(data.message);
    // Reiniciar interfaz para nueva ronda
    container.innerHTML = "";
    shoutDisplay.style.display = "none";
    if (myRole === "marco") {
      shoutbtn.style.display = "block";
    }
  });

  // Listen for game won event
  socket.on("gameWon", (data) => {
    navigateTo("/gameOver", {
      message: `¡${data.winner} ha ganado el juego con ${data.players[0].score} puntos!`,
      nickname,
      isGameWon: true,
      players: data.players,
    });
  });

  async function loadCurrentPlayers() {
    try {
      const players = await makeRequest("/api/players/players", "GET");
      updatePlayersList(players);
    } catch (error) {
      console.error("Error loading players:", error);
    }
  }

  function updatePlayersList(players) {
    if (!players || players.length === 0) {
      playersList.innerHTML = "<p>No hay jugadores</p>";
      return;
    }

    playersList.innerHTML = players
      .map(
        (player) => `
      <div class="player-info">
        <strong>${player.nickname}</strong> 
        - ${player.role || "Esperando"} 
        - ${player.score || 0} pts
        ${player.nickname === nickname ? " (Tú)" : ""}
      </div>
    `
      )
      .join("");
  }
}
