// Vercel Serverless Function (Node 18+)
// Crea una preferencia en Mercado Pago usando el Access Token del servidor
export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
    if (!ACCESS_TOKEN) {
      return res.status(500).json({ error: 'Falta MP_ACCESS_TOKEN en el servidor' });
    }

    const {
      title,
      quantity,
      unit_price,
      currency_id = 'CLP',
      picture_url,
      description,
      category_id = 'personal_care',
    } = req.body || {};

    if (!title || !quantity || !unit_price) {
      return res.status(400).json({ error: 'title, quantity y unit_price son requeridos' });
    }

    const origin = req.headers.origin || '';
    const back_urls = {
      success: `${origin}/?status=success`,
      failure: `${origin}/?status=failure`,
      pending: `${origin}/?status=pending`,
    };

    const prefBody = {
      items: [
        {
          title,
          quantity: Number(quantity),
          currency_id,
          unit_price: Number(unit_price),
          picture_url,
          description,
          category_id,
        },
      ],
      back_urls,
      auto_return: 'approved',
    };

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(prefBody),
    });

    if (!mpRes.ok) {
      const txt = await mpRes.text();
      return res.status(mpRes.status).json({ error: `Mercado Pago error: ${txt}` });
    }

    const data = await mpRes.json();
    // data.id es la preferencia que usa el frontend para redirigir al checkout
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    return res.status(200).json({ id: data.id });
  } catch (err) {
    console.error('Error creando preferencia MP:', err);
    return res.status(500).json({ error: 'Error interno creando preferencia' });
  }
}