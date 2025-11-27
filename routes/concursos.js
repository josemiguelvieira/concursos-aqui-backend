const express = require('express');
const router = express.Router();
const concursosController = require('../controllers/concursosController');

// Rota GET /concursos → lista todos os concursos
router.get('/', concursosController.listarConcursos);

module.exports = router;