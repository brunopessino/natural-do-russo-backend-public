const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// Público: cliente cria o pedido ao finalizar o checkout
router.post('/', async (req, res) => {
  try {
    const { id, cliente_nome, cliente_telefone, endereco, bairro, itens, subtotal, frete, total, forma_pagamento } = req.body;
    if (!id || !Array.isArray(itens) || itens.length === 0) return res.status(400).json({ error: 'Pedido inválido.' });

    await pool.query(
      `INSERT INTO pedidos (id, cliente_nome, cliente_telefone, endereco, bairro, subtotal, frete, total, forma_pagamento, status)
       VALUES (?,?,?,?,?,?,?,?,?, 'aguardando_pagamento')`,
      [id, cliente_nome, cliente_telefone, endereco, bairro, subtotal, frete, total, forma_pagamento || 'whatsapp']
    );
    for (const it of itens) {
      await pool.query(
        'INSERT INTO pedido_itens (pedido_id, produto_id, nome, preco, quantidade) VALUES (?,?,?,?,?)',
        [id, it.id || null, it.nome, it.preco, it.qty]
      );
    }
    res.json({ ok: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar pedido.' });
  }
});

// Público: usado pra checar status depois do redirect do Mercado Pago
router.get('/:id/status', async (req, res) => {
  const [[pedido]] = await pool.query('SELECT status FROM pedidos WHERE id = ?', [req.params.id]);
  res.json(pedido || { status: 'unknown' });
});

// Admin: lista pedidos (mais recentes primeiro)
router.get('/', requireAuth, async (req, res) => {
  const [pedidos] = await pool.query('SELECT * FROM pedidos ORDER BY criado_em DESC LIMIT 300');
  const [itens] = await pool.query(
    'SELECT * FROM pedido_itens WHERE pedido_id IN (?)',
    [pedidos.length ? pedidos.map(p => p.id) : ['__none__']]
  );
  const porPedido = {};
  itens.forEach(it => { (porPedido[it.pedido_id] = porPedido[it.pedido_id] || []).push(it); });
  res.json(pedidos.map(p => ({ ...p, itens: porPedido[p.id] || [] })));
});

router.put('/:id/status', requireAuth, async (req, res) => {
  const statusValidos = ['aguardando_pagamento', 'pago', 'em_preparo', 'pronto', 'saiu_para_entrega', 'entregue', 'cancelado'];
  const { status } = req.body;
  if (!statusValidos.includes(status)) return res.status(400).json({ error: 'Status inválido.' });
  await pool.query('UPDATE pedidos SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ ok: true });
});

// Admin: números do dashboard
router.get('/relatorios/resumo', requireAuth, async (req, res) => {
  const statusConfirmados = ['pago', 'em_preparo', 'pronto', 'saiu_para_entrega', 'entregue'];
  const [[hoje]] = await pool.query(
    `SELECT COUNT(*) AS pedidos_hoje, COALESCE(SUM(total),0) AS faturamento_hoje
     FROM pedidos WHERE DATE(criado_em) = CURDATE() AND status IN (?)`,
    [statusConfirmados]
  );
  const [[pendentes]] = await pool.query(`SELECT COUNT(*) AS c FROM pedidos WHERE status = 'aguardando_pagamento'`);
  const [[preparo]] = await pool.query(`SELECT COUNT(*) AS c FROM pedidos WHERE status = 'em_preparo'`);
  const [[entregues]] = await pool.query(`SELECT COUNT(*) AS c FROM pedidos WHERE status = 'entregue' AND DATE(criado_em) = CURDATE()`);
  res.json({
    pedidosHoje: hoje.pedidos_hoje,
    faturamentoHoje: Number(hoje.faturamento_hoje),
    pendentes: pendentes.c,
    emPreparo: preparo.c,
    entreguesHoje: entregues.c
  });
});

module.exports = router;
