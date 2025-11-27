const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Cadastro do professor
exports.cadastrarProfessor = async (req, res) => {
  const {
    nome,
    sobrenome,
    email,
    senha,
    area_atuacao,
    foto_perfil,
    formacao,
    link_curriculo,
    metodo_gravacao
  } = req.body;

  try {
    const hash = await bcrypt.hash(senha, 10);
    const [result] = await db.execute(
      "INSERT INTO professores (nome, sobrenome, email, senha, area_atuacao, foto_perfil, formacao, link_curriculo, metodo_gravacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        nome,
        sobrenome,
        email,
        hash,
        area_atuacao,
        foto_perfil,
        formacao,
        link_curriculo,
        Array.isArray(metodo_gravacao) ? metodo_gravacao.join(',') : metodo_gravacao
      ]
    );

    res.status(201).json({ message: 'Professor cadastrado com sucesso!', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao cadastrar professor' });
  }
};

// Lista professores pendentes
exports.listarPendentes = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM professores WHERE status = 'pendente'");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar professores pendentes' });
  }
};

// Função para envio de e-mail
const enviarEmail = async (para, assunto, corpo) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  try {
    await transporter.sendMail({
      from: '"Equipe Concursos Aqui" <' + process.env.EMAIL_USER + '>',
      to: para,
      subject: assunto,
      text: corpo
    });
    console.log("✅ E-mail enviado para:", para);
  } catch (err) {
    console.error("❌ Erro ao enviar e-mail:", err);
  }
};

// Aprovar professor
exports.aprovarProfessor = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.execute("SELECT * FROM professores WHERE id = ?", [id]);
    const professor = rows[0];
    if (!professor) return res.status(404).json({ error: 'Professor não encontrado' });

    await db.execute("UPDATE professores SET status = 'aprovado' WHERE id = ?", [id]);

    const corpo = 'Olá ' + professor.nome + ', seu cadastro como professor foi aprovado! Em breve entraremos em contato com os próximos passos.';
    await enviarEmail(professor.email, 'Cadastro aprovado 🎉', corpo);

    res.json({ message: 'Professor aprovado e e-mail enviado com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao aprovar professor' });
  }
};

// Reprovar professor
exports.reprovarProfessor = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.execute("SELECT * FROM professores WHERE id = ?", [id]);
    const professor = rows[0];
    if (!professor) return res.status(404).json({ error: 'Professor não encontrado' });

    await db.execute("UPDATE professores SET status = 'reprovado' WHERE id = ?", [id]);

    const corpo = 'Olá ' + professor.nome + ', infelizmente seu cadastro como professor foi reprovado. Agradecemos seu interesse e desejamos sucesso na sua jornada.';
    await enviarEmail(professor.email, 'Cadastro reprovado 😢', corpo);

    res.json({ message: 'Professor reprovado e e-mail enviado com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao reprovar professor' });
  }
};

// Login do professor
exports.loginProfessor = async (req, res) => {
  const { email, senha } = req.body;

  try {
    const [rows] = await db.execute('SELECT * FROM professores WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ mensagem: 'Credenciais inválidas' });
    }

    const professor = rows[0];

    const senhaCorreta = await bcrypt.compare(senha, professor.senha);
    if (!senhaCorreta) {
      return res.status(401).json({ mensagem: 'Credenciais inválidas' });
    }

    if (professor.status !== 'aprovado') {
      return res.status(403).json({ mensagem: 'Cadastro ainda não aprovado' });
    }

    const token = jwt.sign(
      { id: professor.id, email: professor.email },
      'seuSegredoJWT',
      { expiresIn: '1d' }
    );

    res.json({
      token,
      professor: {
        id: professor.id,
        nome: professor.nome,
        email: professor.email,
        area_atuacao: professor.area_atuacao,
        foto_perfil:professor.foto_perfil
      }
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ mensagem: 'Erro interno no servidor' });
  }
};
// ====== PERFIL (GET /professores/me) ======
exports.getMeuPerfil = async (req, res) => {
  try {
    const id = req.user.id; // vem do authProfessor
    const [rows] = await db.execute(
      `SELECT id, nome, sobrenome, email, area_atuacao, foto_perfil, formacao, link_curriculo
       FROM professores
       WHERE id = ?`,
      [id]
    );
    const prof = rows[0];
    if (!prof) return res.status(404).json({ error: 'Professor não encontrado' });
    return res.json(prof);
  } catch (err) {
    console.error('getMeuPerfil:', err);
    return res.status(500).json({ error: 'Erro ao carregar perfil' });
  }
};

// ====== ATUALIZAR PERFIL (PUT /professores/perfil) ======
// Campos editáveis: formacao (bio) e link_curriculo (LinkedIn/CV)
exports.atualizarPerfil = async (req, res) => {
  try {
    const id = req.user.id;
    const { formacao, link_curriculo } = req.body;

    const formacaoTrim = (formacao || '').trim();
    const linkTrim = (link_curriculo || '').trim();

    if (linkTrim && !/^https?:\/\//i.test(linkTrim)) {
      return res.status(422).json({ error: 'Link deve começar com http:// ou https://' });
    }

    const [chk] = await db.execute('SELECT id FROM professores WHERE id = ?', [id]);
    if (!chk.length) return res.status(404).json({ error: 'Professor não encontrado' });

    await db.execute(
      'UPDATE professores SET formacao = ?, link_curriculo = ? WHERE id = ?',
      [formacaoTrim || null, linkTrim || null, id]
    );

    return res.json({ message: 'Perfil atualizado com sucesso' });
  } catch (err) {
    console.error('atualizarPerfil:', err);
    return res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
};

// ====== ALTERAR SENHA (PUT /professores/senha) ======
exports.alterarSenhaProfessor = async (req, res) => {
  try {
    const id = req.user.id;
    const { senhaAtual, novaSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
      return res.status(422).json({ error: 'Informe senhaAtual e novaSenha' });
    }
    if (String(novaSenha).length < 8) {
      return res.status(422).json({ error: 'Nova senha deve ter pelo menos 8 caracteres' });
    }

    const [rows] = await db.execute(
      'SELECT id, senha AS senha_hash FROM professores WHERE id = ?',
      [id]
    );
    const prof = rows[0];
    if (!prof) return res.status(404).json({ error: 'Professor não encontrado' });

    const confere = await bcrypt.compare(String(senhaAtual).trim(), prof.senha_hash);
    if (!confere) return res.status(401).json({ error: 'Senha atual incorreta' });

    const igual = await bcrypt.compare(String(novaSenha).trim(), prof.senha_hash);
    if (igual) return res.status(422).json({ error: 'Nova senha não pode ser igual à atual' });

    const novoHash = await bcrypt.hash(String(novaSenha).trim(), 10);
    await db.execute('UPDATE professores SET senha = ? WHERE id = ?', [novoHash, prof.id]);

    return res.json({ message: 'Senha alterada com sucesso' });
  } catch (err) {
    console.error('alterarSenhaProfessor:', err);
    return res.status(500).json({ error: 'Erro ao alterar senha' });
  }
};
// ====== ESQUECI MINHA SENHA (PROFESSOR) ======
exports.solicitarResetSenhaProfessor = async (req, res) => {
  const { email } = req.body;

  if (!email || !String(email).includes('@')) {
    return res.status(422).json({ error: 'Informe um e-mail válido' });
  }

  try {
    const [rows] = await db.execute(
      'SELECT id, nome, email FROM professores WHERE email = ?',
      [email]
    );
    const prof = rows[0];

    // resposta genérica para não revelar existência
    const okMsg = { message: 'Se existir uma conta, enviaremos um código por e-mail.' };
    if (!prof) return res.status(200).json(okMsg);

    // gera código 6 dígitos (igual candidato)
    const token = String(Math.floor(100000 + Math.random() * 900000));
    // aqui use 15 minutos (texto do e-mail) — mantenha consistente
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await db.execute(
      'UPDATE professores SET reset_token = ?, reset_expires = ? WHERE id = ?',
      [token, expires, prof.id]
    );

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    const assunto = 'Seu código para redefinir a senha';
    const corpo =
      'Olá, ' + prof.nome + '!\n\n' +
      'Recebemos um pedido para redefinir a sua senha no Concursos Aqui.\n' +
      'Use este código para prosseguir: ' + token + '\n\n' +
      'Validade: 60 segundos.\n\n' +
      'Se você não solicitou, ignore este e-mail.\n\n' +
      '— Equipe Concursos Aqui';

    await transporter.sendMail({
      from: '"Equipe Concursos Aqui" <' + process.env.EMAIL_USER + '>',
      to: prof.email,
      subject: assunto,
      text: corpo,
    });

    return res.status(200).json(okMsg);
  } catch (err) {
    console.error('solicitarResetSenhaProfessor:', err);
    // mantém resposta genérica
    return res.status(200).json({ message: 'Se existir uma conta, enviaremos um código por e-mail.' });
  }
};

exports.confirmarResetSenhaProfessor = async (req, res) => {
  const { email, token, novaSenha } = req.body;

  if (!email || !token || !novaSenha) {
    return res.status(422).json({ error: 'Informe email, token e novaSenha' });
  }
  if (String(novaSenha).length < 8) {
    return res.status(422).json({ error: 'Nova senha deve ter pelo menos 8 caracteres' });
  }

  try {
    const [rows] = await db.execute(
      'SELECT id, reset_token, reset_expires FROM professores WHERE email = ?',
      [email]
    );
    const prof = rows[0];
    if (!prof) return res.status(404).json({ error: 'Professor não encontrado' });

    if (!prof.reset_token || !prof.reset_expires) {
      return res.status(400).json({ error: 'Nenhum pedido de redefinição ativo' });
    }

    const agora = new Date();
    const expiraEm = new Date(prof.reset_expires);

    if (String(token).trim() !== String(prof.reset_token).trim()) {
      return res.status(401).json({ error: 'Código inválido' });
    }
    if (agora > expiraEm) {
      return res.status(401).json({ error: 'Código expirado' });
    }

    const novoHash = await bcrypt.hash(String(novaSenha).trim(), 10);
    await db.execute(
      'UPDATE professores SET senha = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?',
      [novoHash, prof.id]
    );

    return res.status(200).json({ message: 'Senha redefinida com sucesso' });
  } catch (err) {
    console.error('confirmarResetSenhaProfessor:', err);
    return res.status(500).json({ error: 'Erro ao redefinir a senha' });
  }
};