const db = require('../db');

// GET /concursos
exports.listarConcursos = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM concursos');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar concursos' });
  }
};


