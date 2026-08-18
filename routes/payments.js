const express = require('express');
const pool = require('../db');

const router = express.Router();

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const PUBLIC_URL = process.env.PUBLIC_URL;
const SITE_URL = process.env.SITE_URL;
const OWNER_WHATSAPP = process.env.OWNER_WHATSAPP;
const CALLMEBOT_API_KEY = process.env.CALLMEBOT_API_KEY;

// O pedido já deve existir (criado via POST /api/pedidos) antes de chamar isso.
router.post('/create-preference', async (req, res) => {
  try {
    const { orderId, itens, frete } = req.body;
    if (!orderId || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ error: 'Pedido inválido.' });
    }

    const mpItems = itens.map(i => ({ title: i.nome, quantity: i.qty, unit_price: Number(i.preco), currency_id: 'BRL' }));
    if (frete && frete > 0) mpItems.push({ title: 'Entrega', quantity: 1, unit_price: Number(frete), currency_id: 'BRL' });

    const preference = {
      items: mpItems,
      external_reference: orderId,
      notification_url: `${PUBLIC_URL}/api/payments/webhook`,
      back_urls: {
        success: `${SITE_URL}/?pedido=${orderId}&status=success`,
        failure: `${SITE_URL}/?pedido=${orderId}&status=failure`,
        pending: `${SITE_URL}/?pedido=${orderId}&status=pending`
      },
      auto_return: 'approved'
    };

    const mpResp = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
      body: JSON.stringify(preference)
    });
    const data = await mpResp.json();
    if (!data.init_point) { console.error('Erro do Mercado Pago:', data); return res.status(500).json({ error: 'Não foi possível criar o pagamento.' }); }

    await pool.query("UPDATE pedidos SET forma_pagamento = 'cartao' WHERE id = ?", [orderId]);
    res.json({ init_point: data.init_point, orderId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

function mapStatusMp(mpStatus) {
  if (mpStatus === 'approved') return 'pago';
  if (mpStatus === 'rejected') return 'cancelado';
  return 'aguardando_pagamento'; // pending, in_process etc.
}

router.post('/webhook', async (req, res) => {
  res.sendStatus(200); // responde rápido; o MP reenvia se demorar
  try {
    const paymentId = req.query['data.id'] || (req.body.data && req.body.data.id);
    const topic = req.query.type || req.body.type;
    if (topic !== 'payment' || !paymentId) return;

    const paymentResp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` }
    });
    const payment = await paymentResp.json();
    const orderId = payment.external_reference;
    if (!orderId) return;

    const [[pedido]] = await pool.query('SELECT status FROM pedidos WHERE id = ?', [orderId]);
    if (!pedido) return;

    const novoStatus = mapStatusMp(payment.status);
    const jaEstavaPago = pedido.status !== 'aguardando_pagamento';
    await pool.query('UPDATE pedidos SET status = ?, payment_id = ? WHERE id = ?', [novoStatus, paymentId, orderId]);

    if (novoStatus === 'pago' && !jaEstavaPago) await notifyOwner(orderId);
  } catch (err) {
    console.error('Erro no webhook:', err);
  }
});

async function notifyOwner(orderId) {
  if (!OWNER_WHATSAPP || !CALLMEBOT_API_KEY) { console.log('Notificação não configurada. Pedido pago:', orderId); return; }
  const [[pedido]] = await pool.query('SELECT * FROM pedidos WHERE id = ?', [orderId]);
  const [itens] = await pool.query('SELECT * FROM pedido_itens WHERE pedido_id = ?', [orderId]);
  const lista = itens.map(i => `${i.quantidade}x ${i.nome}`).join(', ');
  const text = `Novo pedido pago! ${pedido.cliente_nome || ''} - ${lista} - Total R$ ${Number(pedido.total).toFixed(2)}`;
  try {
    await fetch(`https://api.callmebot.com/whatsapp.php?phone=${OWNER_WHATSAPP}&text=${encodeURIComponent(text)}&apikey=${CALLMEBOT_API_KEY}`);
  } catch (err) {
    console.error('Erro ao notificar dono da loja:', err);
  }
}

module.exports = router;
