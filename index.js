const express = require("express");
const path = require("path");
const { createServer } = require("http");

const playersRouter = require("./server/routes/players.router");
const gameRouter = require("./server/routes/game.router");
const { initSocketInstance } = require("./server/services/socket.service");

const PORT = 5050;

const app = express();
const httpServer = createServer(app);

app.use(express.json());
app.use("/game", express.static(path.join(__dirname, "game")));
app.use("/results", express.static(path.join(__dirname, "results-screen")));

app.use("/api", playersRouter);
app.use("/api/game", gameRouter);

initSocketInstance(httpServer);

httpServer.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
