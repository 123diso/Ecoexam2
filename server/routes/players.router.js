const express = require('express');
const playersController = require('../controllers/players.controller');
const router = express.Router();

// Define routes and link them to controller methods
router.get('/players', playersController.getPlayers);

module.exports = router;