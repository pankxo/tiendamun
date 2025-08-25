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

  const { items, description, shipping, payer, metadata } = req.body || {};
    const origin = req.headers.origin || '';
    const host = req.headers.host || '';
    const baseUrl = origin || (host ? `https://${host}` : '');
    const single = req.body || {};
    let prefItems = [];
    if (Array.isArray(items) && items.length > 0) {
      prefItems = items.map(it => ({
        title: it.title,
        quantity: Number(it.quantity || 0),
        currency_id: it.currency_id || 'CLP',
        unit_price: Number(it.unit_price || 0),
        picture_url: it.picture_url,
        description: it.description || description,
        category_id: it.category_id || 'personal_care',
      })).filter(it => it.title && it.quantity > 0 && it.unit_price > 0);
      if (prefItems.length === 0) {
        return res.status(400).json({ error: 'Items inválidos' });
      }
    } else {
      const { title, quantity, unit_price, currency_id = 'CLP', picture_url, category_id = 'personal_care' } = single;
      if (!title || !quantity || !unit_price) {
        return res.status(400).json({ error: 'title, quantity y unit_price son requeridos' });
      }
      prefItems = [{ title, quantity: Number(quantity), currency_id, unit_price: Number(unit_price), picture_url, description, category_id }];
    }
    const back_urls = {
      success: `${origin}/?status=success`,
      failure: `${origin}/?status=failure`,
      pending: `${origin}/?status=pending`,
    };

    const prefBody = {
      items: prefItems,
      back_urls,
      auto_return: 'approved',
    };

    // Payer
    if (payer && (payer.name || payer.email || payer.phone)){
      prefBody.payer = {
        name: payer.name,
        email: payer.email,
        phone: payer.phone ? { number: payer.phone } : undefined,
      };
    }

    // Shipments
    if (shipping){
      if (shipping.local_pickup){
        prefBody.shipments = { local_pickup: true, cost: 0, mode: 'not_specified' };
      } else {
        const addr = shipping.address || {};
        prefBody.shipments = {
          mode: 'not_specified', // we provide our own shipping cost
          cost: Number(shipping.cost || 0),
          local_pickup: false,
          receiver_address: {
            zip_code: addr.zip || '',
            street_name: `${addr.street || ''} ${addr.number || ''}`.trim(),
            street_number: Number(addr.number) || undefined,
            apartment: addr.apartment || undefined,
            city_name: addr.city || '',
            state_name: addr.region || '',
          }
        };
      }
    }

    if (metadata){
      prefBody.metadata = metadata;
    }

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