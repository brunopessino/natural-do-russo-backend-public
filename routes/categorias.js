const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM categorias ORDER BY ordem, id');
  res.json(rows);
});

router.post('/', requireAuth, async (req, res) => {
  const { nome, ordem } = req.body;
  if (!nome) return res.status(400).json({ error: 'Nome é obrigatório.' });
  const [r] = await pool.query('INSERT INTO categorias (nome, ordem) VALUES (?, ?)', [nome, ordem || 0]);
  res.json({ id: r.insertId });
});

router.put('/:id', requireAuth, async (req, res) => {
  const { nome, ordem } = req.body;
  await pool.query('UPDATE categorias SET nome=?, ordem=? WHERE id=?', [nome, ordem || 0, req.params.id]);
  res.json({ ok: true });
});

router.delete('/:id', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM categorias WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
