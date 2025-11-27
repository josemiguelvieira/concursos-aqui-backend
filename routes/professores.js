const express = require('express');
const router = express.Router();
const professoresController = require('../controllers/professoresController');
const authProfessor = require('../middleware/authProfessor'); // passei aqui ✅

// 📌 ROTAS PÚBLICAS
router.post('/', professoresController.cadastrarProfessor);
router.get('/pendentes', professoresController.listarPendentes);
router.post('/admin/professores/:id/aprovar', professoresController.aprovarProfessor);
router.post('/admin/professores/:id/reprovar', professoresController.reprovarProfessor);
router.post('/login', professoresController.loginProfessor);

// 📌 ROTAS PROTEGIDAS (precisam do token JWT)
router.get('/me', authProfessor, professoresController.getMeuPerfil);
router.put('/perfil', authProfessor, professoresController.atualizarPerfil);
router.put('/senha', authProfessor, professoresController.alterarSenhaProfessor);

// Esqueci minha senha (professor)
router.post('/forgot-password', professoresController.solicitarResetSenhaProfessor);

// Redefinir senha (professor)
router.post('/reset-password', professoresController.confirmarResetSenhaProfessor);

// ✅ passei aqui
module.exports = router;