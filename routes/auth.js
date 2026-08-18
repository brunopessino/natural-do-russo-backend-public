const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { usuario, senha } = req.body;
  if (!usuario || !senha) return res.status(400).json({ error: 'Informe usuário e senha.' });

  const [rows] = await pool.query('SELECT * FROM admins WHERE usuario = ?', [usuario]);
  const admin = rows[0];
  if (!admin) return res.status(401).json({ error: 'Usuário ou senha inválidos.' });

  const ok = await bcrypt.compare(senha, admin.senha_hash);
  if (!ok) return res.status(401).json({ error: 'Usuário ou senha inválidos.' });

  const token = jwt.sign({ adminId: admin.id }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ ok: true, usuario: admin.usuario, token });
});

router.post('/logout', (req, res) => {
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.json({ logged: false });
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    res.json({ logged: true });
  } catch (e) {
    res.json({ logged: false });
  }
});

module.exports = router;
