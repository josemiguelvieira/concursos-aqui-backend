const jwt = require('jsonwebtoken');

module.exports = function authProfessor(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const [scheme, token] = auth.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Token ausente ou malformado' });
    }

    // ⚙️ mesmo segredo usado no loginProfessor
    const secret = 'seuSegredoJWT';

    const payload = jwt.verify(token, secret);

    // Disponibiliza o id/email do professor autenticado
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};