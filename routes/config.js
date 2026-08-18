const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads', 'loja');
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, 'logo_' + Date.now() + path.extname(file.originalname).toLowerCase())
});
const upload = multer({ storage, limits: { fileSize: 3 * 1024 * 1024 } });

router.get('/', async (req, res) => {
  const [[cfg]] = await pool.query('SELECT * FROM configuracoes WHERE id = 1');
  res.json(cfg || {});
});

router.put('/', requireAuth, upload.single('logo'), async (req, res) => {
  const campos = ['nome_loja', 'whatsapp', 'endereco', 'pix_key', 'pix_name', 'pix_city', 'frete_padrao', 'mp_enabled'];
  const [[cfg]] = await pool.query('SELECT * FROM configuracoes WHERE id = 1');

  const valores = {};
  campos.forEach(c => { valores[c] = req.body[c] !== undefined ? req.body[c] : cfg[c]; });
  valores.mp_enabled = valores.mp_enabled === 'true' || valores.mp_enabled === true ? 1 : 0;
  valores.logo = req.file ? req.file.filename : cfg.logo;

  await pool.query(
    `UPDATE configuracoes SET nome_loja=?, whatsapp=?, endereco=?, pix_key=?, pix_name=?, pix_city=?, frete_padrao=?, mp_enabled=?, logo=? WHERE id = 1`,
    [valores.nome_loja, valores.whatsapp, valores.endereco, valores.pix_key, valores.pix_name, valores.pix_city, valores.frete_padrao, valores.mp_enabled, valores.logo]
  );
  const [[atualizado]] = await pool.query('SELECT * FROM configuracoes WHERE id = 1');
  res.json(atualizado);
});

module.exports = router;
