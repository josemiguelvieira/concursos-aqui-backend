// controllers/candidatosController.js
const db = require('../db');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

/** Utilitário: transporter do Nodemailer (usa .env) */
function makeTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
}

/**
 * POST /candidatos
 * body: { nome, email, senha }
 */
async function cadastrarCandidato(req, res) {
  const { nome, email, senha } = req.body;

  try {
    const hash = await bcrypt.hash(senha, 10);
    const avatar = 'https://api.dicebear.com/6.x/thumbs/svg?seed=' + encodeURIComponent(nome);

    await db.execute(
      'INSERT INTO candidatos (nome, email, senha, foto_perfil) VALUES (?, ?, ?, ?)',
      [nome, email, hash, avatar]
    );

    return res.status(201).json({ message: 'Candidato cadastrado com sucesso!' });
  } catch (err) {
    console.error('cadastrarCandidato:', err);
    return res.status(500).json({ error: 'Erro ao cadastrar candidato' });
  }
}

/**
 * POST /candidatos/login
 * body: { email, senha }
 */
async function loginCandidato(req, res) {
  const { email, senha } = req.body;

  try {
    const [rows] = await db.execute('SELECT * FROM candidatos WHERE email = ?', [email]);
    const candidato = rows[0];
    if (!candidato) {
      return res.status(401).json({ error: 'Candidato não encontrado' });
    }

    const ok = await bcrypt.compare(String(senha).trim(), candidato.senha);
    if (!ok) return res.status(401).json({ error: 'Senha incorreta' });

    return res.json({
      id: candidato.id,
      nome: candidato.nome,
      email: candidato.email,
      foto_perfil: candidato.foto_perfil,
    });
  } catch (err) {
    console.error('loginCandidato:', err);
    return res.status(500).json({ error: 'Erro ao fazer login' });
  }
}

/**
 * PUT /candidatos/senha
 * body: { id, senhaAtual, novaSenha }
 */
async function alterarSenha(req, res) {
  const { id, senhaAtual, novaSenha } = req.body;

  if (!id || !senhaAtual || !novaSenha) {
    return res.status(422).json({ error: 'Informe id, senhaAtual e novaSenha' });
  }
  if (String(novaSenha).length < 8) {
    return res.status(422).json({ error: 'Nova senha deve ter pelo menos 8 caracteres' });
  }

  try {
    const [rows] = await db.execute(
      'SELECT id, senha AS senha_hash FROM candidatos WHERE id = ?',
      [id]
    );
    const cand = rows[0];
    if (!cand) return res.status(404).json({ error: 'Candidato não encontrado' });

    const confere = await bcrypt.compare(String(senhaAtual).trim(), cand.senha_hash);
    if (!confere) return res.status(401).json({ error: 'Senha atual incorreta' });

    const igual = await bcrypt.compare(String(novaSenha).trim(), cand.senha_hash);
    if (igual) return res.status(422).json({ error: 'Nova senha não pode ser igual à atual' });

    const novoHash = await bcrypt.hash(String(novaSenha).trim(), 10);
    await db.execute('UPDATE candidatos SET senha = ? WHERE id = ?', [novoHash, cand.id]);

    return res.status(200).json({ message: 'Senha alterada com sucesso' });
  } catch (err) {
    console.error('alterarSenha:', err);
    return res.status(500).json({ error: 'Erro ao alterar senha' });
  }
}

/**
 * PUT /candidatos/dados
 * body: { id, nome, email, senha }  // "senha" = senha atual para confirmar
 */
async function atualizarDados(req, res) {
  console.log('Body recebido em /candidatos/dados:', req.body);
  const { id, nome, email, senha } = req.body;

  if (!id || !nome || !email || !senha) {
    return res.status(422).json({ error: 'Informe id, nome, email e senha' });
  }
  const emailOk = String(email).includes('@') && String(email).includes('.');
  if (!emailOk) return res.status(422).json({ error: 'E-mail inválido' });

  try {
    const [rows] = await db.execute(
      'SELECT id, senha AS senha_hash FROM candidatos WHERE id = ?',
      [id]
    );
    const cand = rows[0];
    if (!cand) return res.status(404).json({ error: 'Candidato não encontrado' });

    const confere = await bcrypt.compare(String(senha).trim(), cand.senha_hash);
    if (!confere) return res.status(401).json({ error: 'Senha atual incorreta' });

    const [dup] = await db.execute(
      'SELECT id FROM candidatos WHERE email = ? AND id <> ?',
      [email, id]
    );
    if (dup.length) return res.status(409).json({ error: 'E-mail já está em uso' });

    await db.execute('UPDATE candidatos SET nome = ?, email = ? WHERE id = ?', [
      nome.trim(),
      email.trim(),
      id,
    ]);

    return res.status(200).json({ message: 'Dados atualizados com sucesso' });
  } catch (err) {
    console.error('atualizarDados:', err);
    return res.status(500).json({ error: 'Erro ao atualizar dados' });
  }
}

/**
 * POST /candidatos/forgot-password
 * body: { email }
 */
async function solicitarResetSenha(req, res) {
  const { email } = req.body;

  if (!email || !String(email).includes('@')) {
    return res.status(422).json({ error: 'Informe um e-mail válido' });
  }

  try {
    const [rows] = await db.execute(
      'SELECT id, nome, email FROM candidatos WHERE email = ?',
      [email]
    );
    const cand = rows[0];

    if (!cand) {
      return res.status(200).json({ message: 'Se existir uma conta, enviaremos um código por e-mail.' });
    }

    const token = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + 60 * 1000);

    await db.execute(
      'UPDATE candidatos SET reset_token = ?, reset_expires = ? WHERE id = ?',
      [token, expires, cand.id]
    );

    const transporter = makeTransporter();
    const assunto = 'Seu código para redefinir a senha';
    const corpo =
      'Olá, ' + cand.nome + '!\n\n' +
      'Recebemos um pedido para redefinir a sua senha no Concursos Aqui.\n' +
      'Use este código para prosseguir: ' + token + '\n\n' +
      'Validade: 60 segundos.\n\n' +
      'Se você não solicitou, ignore este e-mail.\n\n' +
      '— Equipe Concursos Aqui';

    await transporter.sendMail({
      from: '"Equipe Concursos Aqui" <' + process.env.EMAIL_USER + '>',
      to: cand.email,
      subject: assunto,
      text: corpo,
    });

    return res.status(200).json({ message: 'Se existir uma conta, enviaremos um código por e-mail.' });
  } catch (err) {
    console.error('solicitarResetSenha:', err);
    return res.status(500).json({ error: 'Erro ao solicitar redefinição de senha' });
  }
}

/**
 * POST /candidatos/reset-password
 * body: { email, token, novaSenha }
 */
async function confirmarResetSenha(req, res) {
  const { email, token, novaSenha } = req.body;

  if (!email || !token || !novaSenha) {
    return res.status(422).json({ error: 'Informe email, token e novaSenha' });
  }
  if (String(novaSenha).length < 8) {
    return res.status(422).json({ error: 'Nova senha deve ter pelo menos 8 caracteres' });
  }

  try {
    const [rows] = await db.execute(
      'SELECT id, reset_token, reset_expires FROM candidatos WHERE email = ?',
      [email]
    );
    const cand = rows[0];
    if (!cand) return res.status(404).json({ error: 'Candidato não encontrado' });

    if (!cand.reset_token || !cand.reset_expires) {
      return res.status(400).json({ error: 'Nenhum pedido de redefinição ativo' });
    }

    const agora = new Date();
    const expiraEm = new Date(cand.reset_expires);

    if (String(token).trim() !== String(cand.reset_token).trim()) {
      return res.status(401).json({ error: 'Código inválido' });
    }
    if (agora > expiraEm) {
      return res.status(401).json({ error: 'Código expirado' });
    }

    const novoHash = await bcrypt.hash(String(novaSenha).trim(), 10);
    await db.execute(
      'UPDATE candidatos SET senha = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?',
      [novoHash, cand.id]
    );

    return res.status(200).json({ message: 'Senha redefinida com sucesso' });
  } catch (err) {
    console.error('confirmarResetSenha:', err);
    return res.status(500).json({ error: 'Erro ao redefinir a senha' });
  }
}
async function excluirConta(req, res) {
  console.log("DELETE /candidatos/:id -> params:", req.params);

  const idNum = parseInt(req.params.id, 10);

  if (!Number.isInteger(idNum)) {
    return res.status(422).json({ error: "Informe id válido" });
  }

  try {
    const [rows] = await db.execute(
      "SELECT id FROM candidatos WHERE id = ?",
      [idNum]
    );
    if (!rows.length) {
      return res.status(404).json({ error: "Candidato não encontrado" });
    }

    await db.execute("DELETE FROM candidatos WHERE id = ?", [idNum]);
    return res.status(200).json({ message: "Conta excluída com sucesso" });
  } catch (err) {
    console.error("excluirConta:", err);
    return res.status(500).json({ error: "Erro ao excluir conta" });
  }
}
module.exports = {
  cadastrarCandidato,
  loginCandidato,
  alterarSenha,
  atualizarDados,
  solicitarResetSenha,
  confirmarResetSenha,
  excluirConta,
};