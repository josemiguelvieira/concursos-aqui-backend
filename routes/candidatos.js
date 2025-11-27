const express = require('express');
const router = express.Router();
const candidatosController = require('../controllers/candidatosController');

// Cadastro e login
router.post('/', candidatosController.cadastrarCandidato);
router.post('/login', candidatosController.loginCandidato);

// Alterar senha
router.put('/senha', candidatosController.alterarSenha);

// Alterar dados (nome, email, confirmando senha atual)
router.put('/dados', candidatosController.atualizarDados);

// Esqueci minha senha -> envia token por e-mail
router.post('/forgot-password', candidatosController.solicitarResetSenha);

// Redefinir senha com token
router.post('/reset-password', candidatosController.confirmarResetSenha);

// Excluir conta
router.delete('/:id', candidatosController.excluirConta);

module.exports = router;