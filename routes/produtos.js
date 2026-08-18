const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads', 'produtos');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, 'produto_' + Date.now() + path.extname(file.originalname).toLowerCase())
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|webp/.test(file.mimetype);
    cb(ok ? null : new Error('Formato de imagem inválido.'), ok);
  }
});

// Público: cardápio (só disponíveis)
router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, nome, descricao, preco, categoria_id, imagem, estoque FROM produtos WHERE disponivel = 1 ORDER BY ordem, id'
  );
  res.json(rows);
});

// Admin: todos, inclusive indisponíveis
router.get('/admin', requireAuth, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM produtos ORDER BY ordem, id');
  res.json(rows);
});

router.post('/', requireAuth, upload.single('imagem'), async (req, res) => {
  try {
    const { nome, descricao, preco, categoria_id, disponivel, estoque, ordem } = req.body;
    if (!nome || isNaN(Number(preco))) return res.status(400).json({ error: 'Nome e preço são obrigatórios.' });
    const imagem = req.file ? req.file.filename : null;
    const [r] = await pool.query(
      'INSERT INTO produtos (nome, descricao, preco, categoria_id, imagem, disponivel, estoque, ordem) VALUES (?,?,?,?,?,?,?,?)',
      [nome, descricao || '', preco, categoria_id || null, imagem, disponivel === 'false' ? 0 : 1, estoque || null, ordem || 0]
    );
    res.json({ id: r.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar produto.' });
  }
});

router.put('/:id', requireAuth, upload.single('imagem'), async (req, res) => {
  try {
    const { nome, descricao, preco, categoria_id, disponivel, estoque, ordem } = req.body;
    const [[existing]] = await pool.query('SELECT imagem FROM produtos WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Produto não encontrado.' });

    let imagem = existing.imagem;
    if (req.file) {
      imagem = req.file.filename;
      if (existing.imagem) {
        const oldPath = path.join(uploadDir, existing.imagem);
        fs.unlink(oldPath, () => {});
      }
    }

    await pool.query(
      'UPDATE produtos SET nome=?, descricao=?, preco=?, categoria_id=?, imagem=?, disponivel=?, estoque=?, ordem=? WHERE id=?',
      [nome, descricao || '', preco, categoria_id || null, imagem, disponivel === 'false' ? 0 : 1, estoque || null, ordem || 0, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar produto.' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  const [[existing]] = await pool.query('SELECT imagem FROM produtos WHERE id = ?', [req.params.id]);
  await pool.query('DELETE FROM produtos WHERE id = ?', [req.params.id]);
  if (existing && existing.imagem) fs.unlink(path.join(uploadDir, existing.imagem), () => {});
  res.json({ ok: true });
});

module.exports = router;
