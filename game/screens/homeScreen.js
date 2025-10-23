import { navigateTo, socket, makeRequest } from "../app.js";

export default function renderHomeScreen() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div id="home-welcome-screen">
      <h2>Bienvenidos</h2>
      <p>Ingresa tu nombre de usuario para unirte al juego</p>
      <div id="form">
        <input type="text" id="nickname" placeholder="nickname" />
        <button id="join-button">Join Game</button>
      </div>
    </div>
  `;

  const nicknameInput = document.getElementById("nickname");
  const joinButton = document.getElementById("join-button");

  joinButton.addEventListener("click", async () => {
    const userName = nicknameInput.value;
    if (!userName.trim()) {
      alert("Please enter a nickname");
      return;
    }

    // Instead of emitting, make an API request
    const result = await makeRequest("/api/game/join", "POST", {
      nickname: userName,
      socketId: socket.id,
    });

    if (result.success !== false) {
      navigateTo("/lobby", { nickname: userName, players: result.players });
    } else {
      alert("Failed to join game. Please try again.");
    }
  });
}
