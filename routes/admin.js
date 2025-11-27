const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const professoresController = require('../controllers/professoresController');

// Rota de login do administrador
router.post('/login', adminController.loginAdmin);

// Listar professores pendentes
router.get('/professores/pendentes', professoresController.listarPendentes);

// Aprovar/Reprovar professor
router.post('/professores/:id/aprovar', professoresController.aprovarProfessor);
router.post('/professores/:id/reprovar', professoresController.reprovarProfessor);

module.exports = router;