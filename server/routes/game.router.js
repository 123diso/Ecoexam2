const express = require("express");
const gameController = require("../controllers/game.controller");
const router = express.Router();

router.post("/join", gameController.joinGame);
router.post("/start", gameController.startGame);
router.post("/marco", gameController.notifyMarco);
router.post("/polo", gameController.notifyPolo);
router.post("/select-polo", gameController.selectPolo);
router.post("/reset-scores", gameController.resetScores);
router.post("/reset-game", gameController.resetGame);
router.get("/scores", gameController.getScores);
router.get("/current-winner", gameController.getCurrentWinner);

module.exports = router;
