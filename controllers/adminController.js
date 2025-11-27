const db = require('../db');
const bcrypt = require('bcrypt');

exports.loginAdmin = async (req, res) => {
  const { email, senha } = req.body;

  try {
    const [rows] = await db.execute('SELECT * FROM admins WHERE email = ?', [email]);
    const admin = rows[0];

    if (!admin) {
      return res.status(401).json({ error: 'Admin não encontrado' });
    }

    const senhaCorreta = await bcrypt.compare(senha, admin.senha);
    if (!senhaCorreta) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    //  consigo gerar um token com JWT se eu quiser!
    res.json({ message: 'Login realizado com sucesso', admin: { id: admin.id, nome: admin.nome } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
};