import renderLeaderboardRealTime from "./screens/leaderboard-real-time.js";
import renderLeaderboardFinalScreen from "./screens/leaderboard-final-screen.js";

const socket = io("/", { path: "/real-time" });

function clearScripts() {
  document.getElementById("app").innerHTML = "";
}

let route = { path: "/", data: {} };
renderRoute(route);

function renderRoute(currentRoute) {
  switch (currentRoute?.path) {
    case "/":
      clearScripts();
      renderLeaderboardRealTime(currentRoute?.data);
      break;
    case "/final":
      clearScripts();
      renderLeaderboardFinalScreen(currentRoute?.data);
      break;
    default:
      const app = document.getElementById("app");
      app.innerHTML = `<h1>404 - Not Found</h1><p>The page you are looking for does not exist.</p>`;
  }
}

function navigateTo(path, data) {
  route = { path, data };
  renderRoute(route);
}

async function makeRequest(url, method, body) {
  try {
    const BASE_URL = "http://localhost:5050";
    let response = await fetch(`${BASE_URL}${url}`, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("API request failed:", error);
    return { success: false, error: error.message };
  }
}

// Escuchar evento de juego ganado para mostrar pantalla final automáticamente
socket.on("gameWon", (data) => {
  navigateTo("/final", {
    winner: data.winner,
    players: data.players,
  });
});

export { navigateTo, socket, makeRequest };
