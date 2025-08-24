export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!ACCESS_TOKEN) {
    return res.status(500).json({ error: 'Server misconfiguration: missing MP_ACCESS_TOKEN' });
  }

  try {
    const { title, quantity, unit_price, currency_id, picture_url, category_id, description } = req.body || {};

    if (!title || !quantity || !unit_price || !currency_id) {
      return res.status(400).json({ error: 'Invalid payload: title, quantity, unit_price and currency_id are required.' });
    }

    const qty = Math.max(1, Math.min(99, Number(quantity) || 1));
    const price = Number(unit_price);

    const preferencePayload = {
      items: [
        {
          title,
          quantity: qty,
          unit_price: price,
          currency_id,
          picture_url,
          category_id,
          description
        }
      ],
      back_urls: {
        success: 'https://tiendamun.cl/?status=success',
        failure: 'https://tiendamun.cl/?status=failure',
        pending: 'https://tiendamun.cl/?status=pending'
      },
      auto_return: 'approved'
    };

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferencePayload)
    });

    const text = await mpRes.text();
    if (!mpRes.ok) {
      return res.status(mpRes.status).json({ error: 'Mercado Pago error', details: text });
    }

    const data = JSON.parse(text);
    return res.status(200).json({ id: data.id });
  } catch (err) {
    console.error('Mercado Pago preference error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}