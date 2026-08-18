const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM frete_bairros ORDER BY bairro');
  res.json(rows);
});

router.post('/', requireAuth, async (req, res) => {
  const { bairro, valor } = req.body;
  if (!bairro || isNaN(Number(valor))) return res.status(400).json({ error: 'Bairro e valor são obrigatórios.' });
  await pool.query(
    'INSERT INTO frete_bairros (bairro, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)',
    [bairro, valor]
  );
  res.json({ ok: true });
});

router.delete('/:id', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM frete_bairros WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
