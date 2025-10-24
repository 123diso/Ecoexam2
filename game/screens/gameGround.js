import { navigateTo, socket, makeRequest } from "../app.js";

export default function renderGameGround(data) {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div id="game-ground">
      <h2>Jugador: ${data.nickname}</h2>
      <p>Tu rol es:</p>
      <h2 id="role-display" class="role-${data.role}">${data.role}</h2>
      <h3 id="score-display">Puntuación: 0</h3>
      
      <div id="action-area">
        ${
          data.role === "marco"
            ? `
          <div id="marco-actions">
            <button id="shout-button">¡Gritar Marco!</button>
            <div id="polo-choices" style="display: none;">
              <p>Polos que han respondido (elige uno al azar):</p>
              <div id="pool-players"></div>
            </div>
          </div>
        `
            : `
          <div id="polo-actions">
            <div id="waiting-message">Esperando a que Marco grite...</div>
            <button id="shout-button" style="display: none;">¡Responder Polo!</button>
          </div>
        `
        }
      </div>
      
      <div id="message-display"></div>
      
      <div id="current-players">
        <h4>Jugadores en la partida:</h4>
        <div id="players-list"></div>
      </div>
      
      <div id="game-rules">
        <h4>Reglas de Puntuación:</h4>
        <ul>
          <li> Marco atrapa Polo Especial: <strong>+50 puntos</strong></li>
          <li> Marco atrapa Polo normal: <strong>-10 puntos</strong></li>
          <li> Polo Especial no atrapado: <strong>+10 puntos</strong></li>
          <li> Polo Especial atrapado: <strong>-10 puntos</strong></li>
          <li> Ganador: <strong>≥100 puntos</strong></li>
        </ul>
      </div>
    </div>
  `;

  const nickname = data.nickname;
  const myRole = data.role;
  const shoutbtn = document.getElementById("shout-button");
  const messageDisplay = document.getElementById("message-display");
  const scoreDisplay = document.getElementById("score-display");
  const poolPlayers = document.getElementById("pool-players");
  const poloChoices = document.getElementById("polo-choices");
  const waitingMessage = document.getElementById("waiting-message");
  const playersList = document.getElementById("players-list");

  let availablePolos = []; // Array para almacenar Polos que han gritado

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

  // ✅ Escuchar cuando se ACTUALIZA el rol individualmente
  socket.on("roleUpdated", (data) => {
    console.log("🔄 Rol actualizado:", data.role);

    const roleDisplay = document.getElementById("role-display");
    if (roleDisplay) {
      roleDisplay.textContent = data.role;
      roleDisplay.className = `role-${data.role}`;
    }

    // ✅ Actualizar la interfaz según el nuevo rol
    const actionArea = document.getElementById("action-area");
    if (data.role === "marco") {
      actionArea.innerHTML = `
        <div id="marco-actions">
          <button id="shout-button">¡Gritar Marco!</button>
          <div id="polo-choices" style="display: none;">
            <p>Polos que han respondido (elige uno al azar):</p>
            <div id="pool-players"></div>
          </div>
        </div>
      `;

      // Re-conectar event listeners para Marco
      setTimeout(() => {
        const newShoutBtn = document.getElementById("shout-button");
        if (newShoutBtn) {
          newShoutBtn.addEventListener("click", handleMarcoShout);
        }
      }, 100);
    } else {
      actionArea.innerHTML = `
        <div id="polo-actions">
          <div id="waiting-message">Esperando a que Marco grite...</div>
          <button id="shout-button" style="display: none;">¡Responder Polo!</button>
        </div>
      `;

      // Re-conectar event listeners para Polo
      setTimeout(() => {
        const newShoutBtn = document.getElementById("shout-button");
        if (newShoutBtn) {
          newShoutBtn.addEventListener("click", handlePoloShout);
        }
      }, 100);
    }

    messageDisplay.innerHTML = `
      <div class="alert alert-info">
        ¡Nuevo rol asignado! Ahora eres: <strong>${data.role}</strong>
      </div>
    `;

    // Resetear estado
    availablePolos = [];
  });

  // ✅ Actualizar puntuación en tiempo real
  socket.on("scoreUpdate", (players) => {
    const currentPlayer = players.find((p) => p.nickname === nickname);
    if (currentPlayer) {
      scoreDisplay.textContent = `Puntuación: ${currentPlayer.score}`;
      // ✅ Aplicar clase para puntuaciones negativas
      scoreDisplay.className =
        currentPlayer.score >= 0 ? "positive-score" : "negative-score";
    }
    updatePlayersList(players);
  });

  // Función para manejar grito de Marco
  async function handleMarcoShout() {
    await makeRequest("/api/game/marco", "POST", {
      socketId: socket.id,
    });
    console.log(`🔊 ${nickname} gritó "Marco"`);
    shoutbtn.disabled = true;
    shoutbtn.textContent = "Esperando respuestas...";
  }

  // Función para manejar respuesta de Polo
  async function handlePoloShout() {
    await makeRequest("/api/game/polo", "POST", {
      socketId: socket.id,
    });
    console.log(`🔊 ${nickname} (${myRole}) gritó "Polo"`);
    shoutbtn.disabled = true;
    shoutbtn.textContent = "Respuesta enviada";
  }

  // Lógica específica para MARCO
  if (myRole === "marco") {
    shoutbtn.addEventListener("click", handleMarcoShout);

    // Marco escucha cuando los Polos gritan
    socket.on("poloShouted", (data) => {
      console.log("🔔 Polo gritó:", data);

      // Agregar el Polo a la lista de disponibles (SOLO NOMBRE, SIN ROL)
      if (!availablePolos.find((p) => p.userId === data.userId)) {
        availablePolos.push({
          userId: data.userId,
          nickname: data.poloNickname,
          // ❌ NO guardar el rol - Marco no debe saber
        });
      }

      // Mostrar las opciones
      poloChoices.style.display = "block";
      updatePoloChoices();

      messageDisplay.innerHTML = `
        <div class="alert alert-info">
          <strong>${data.poloNickname}</strong> gritó: ${data.message}
        </div>
      `;
    });

    // Confirmación de que Marco gritó
    socket.on("marcoShoutSent", (data) => {
      messageDisplay.innerHTML = `
        <div class="alert alert-success">
          ${data.message}
        </div>
      `;
    });

    // Event listener para seleccionar Polos
    if (poolPlayers) {
      poolPlayers.addEventListener("click", async function (event) {
        if (event.target.tagName === "BUTTON") {
          const poloId = event.target.dataset.key;
          const poloName = event.target.dataset.name;

          console.log(`🎯 ${nickname} intenta atrapar a ${poloName}`);

          await makeRequest("/api/game/select-polo", "POST", {
            socketId: socket.id,
            poloId: poloId,
          });

          // Limpiar después de seleccionar
          availablePolos = [];
          poloChoices.style.display = "none";
          shoutbtn.disabled = false;
          shoutbtn.textContent = "¡Gritar Marco!";
        }
      });
    }
  }
  // Lógica específica para POLOS
  else if (myRole === "polo" || myRole === "polo-especial") {
    // Polo escucha cuando Marco grita
    socket.on("marcoShouted", (data) => {
      console.log("🔔 Marco gritó:", data);

      if (waitingMessage) waitingMessage.style.display = "none";
      shoutbtn.style.display = "block";

      messageDisplay.innerHTML = `
        <div class="alert alert-warning">
          <strong>${data.marcoNickname}</strong> ${data.message}
        </div>
      `;
    });

    shoutbtn.addEventListener("click", handlePoloShout);

    // Confirmación de que Polo gritó
    socket.on("poloShoutSent", (data) => {
      messageDisplay.innerHTML = `
        <div class="alert alert-success">
          ${data.message}
        </div>
      `;
    });
  }

  // Función para actualizar las opciones de Polos para Marco
  function updatePoloChoices() {
    if (!poolPlayers) return;

    poolPlayers.innerHTML = "";

    availablePolos.forEach((polo) => {
      const button = document.createElement("button");
      button.innerHTML = `Atrapar a <strong>${polo.nickname}</strong>`;
      button.setAttribute("data-key", polo.userId);
      button.setAttribute("data-name", polo.nickname);
      button.className = `polo-choice`; // ❌ TODOS iguales - sin indicar rol
      poolPlayers.appendChild(button);
    });
  }

  // Game over notification
  socket.on("notifyGameOver", (data) => {
    console.log("🏁 Game Over:", data.message);

    // Reiniciar interfaz para nueva ronda
    if (myRole === "marco") {
      shoutbtn.disabled = false;
      shoutbtn.textContent = "¡Gritar Marco!";
      poloChoices.style.display = "none";
      availablePolos = [];
    } else {
      shoutbtn.disabled = false;
      shoutbtn.textContent = "¡Responder Polo!";
      shoutbtn.style.display = "none";
      if (waitingMessage) waitingMessage.style.display = "block";
    }

    messageDisplay.innerHTML = `
      <div class="alert alert-info">
        ${data.message}
      </div>
    `;
  });

  // ✅ Pantalla final cuando alguien alcanza ≥100 puntos
  socket.on("gameWon", (data) => {
    console.log("🏆 Juego ganado por:", data.winner);
    navigateTo("/gameOver", {
      message: `¡${data.winner} ha ganado el juego con ${data.winnerScore} puntos!`,
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
      <div class="player-info ${
        player.nickname === nickname ? "current-player" : ""
      }">
        <strong>${player.nickname}</strong> 
        <!-- ❌ NO mostrar el rol de otros jugadores -->
        <span class="score ${player.score >= 0 ? "positive" : "negative"}">${
          player.score || 0
        } pts</span>
        ${
          player.nickname === nickname
            ? `<span class="you-badge">(Tú) - ${player.role}</span>`
            : ""
        }
      </div>
    `
      )
      .join("");
  }
}
