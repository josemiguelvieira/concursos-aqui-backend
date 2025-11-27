const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const candidatosRoutes = require('./routes/candidatos');
const concursosRoutes = require('./routes/concursos');
const professoresRoutes = require('./routes/professores');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Rotas
app.use('/candidatos', candidatosRoutes);
app.use('/concursos', concursosRoutes);
app.use('/professores', professoresRoutes);
app.use('/admin', adminRoutes);

// Inicialização do servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('Servidor rodando na porta ' + PORT);
});