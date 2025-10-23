const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");

const gameRouter = require("./routes/game.router");
const playersRouter = require("./routes/players.router");
const { initSocketInstance } = require("./services/socket.service");

const app = express();
const server = http.createServer(app);

initSocketInstance(server);

app.use(cors());
app.use(express.json());

app.use("/game", express.static(path.join(__dirname, "../game")));
app.use("/results", express.static(path.join(__dirname, "../results-screen")));

app.use("/api/game", gameRouter);
app.use("/api/players", playersRouter);

app.get("/", (req, res) => {
  res.redirect("/game");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

const PORT = process.env.PORT || 5050;
server.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
  console.log(` Game client: http://localhost:${PORT}/game`);
  console.log(`Results screen: http://localhost:${PORT}/results`);
});
