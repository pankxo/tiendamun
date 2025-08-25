// Serverless function to quote Bluexpress shipping.
// Note: This uses a placeholder logic unless BLUEXPRESS_API_KEY is configured.
// Replace the mock with real API calls once you have Bluexpress credentials.

import fs from 'fs';
import path from 'path';

// Load optional commune-based rates from assets if present
let COMMUNE_RATES = null;
try {
  const p = path.join(process.cwd(), 'assets', 'bluexpress-rates-by-commune.json');
  if (fs.existsSync(p)) {
    const raw = fs.readFileSync(p, 'utf8');
    COMMUNE_RATES = JSON.parse(raw);
  }
} catch(_) { COMMUNE_RATES = null; }

export default async function handler(req, res) {
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
    const origin = req.headers.origin || '*';
    const { region, city, zip, street, number, apartment, weightKg } = req.body || {};

    if (!region || !city || !street || !number || !(weightKg >= 0)) {
      return res.status(400).json({ error: 'region, city, street, number y weightKg son requeridos' });
    }

    const API_KEY = process.env.BLUEXPRESS_API_KEY;
    // If you have Bluexpress API, implement real call here using fetch with API_KEY
    if (!API_KEY) {
      // Basic region mapping cost similar to frontend fallback
      const baseByRegion = {
        'Región Metropolitana': { base1: 3490, extraKg: 2000 },
        'Valparaíso': { base1: 4990, extraKg: 2200 },
        "O'Higgins": { base1: 4990, extraKg: 2200 },
        'Maule': { base1: 5490, extraKg: 2500 },
        'Ñuble': { base1: 5490, extraKg: 2500 },
        'Biobío': { base1: 5490, extraKg: 2500 },
        'La Araucanía': { base1: 5990, extraKg: 2800 },
        'Los Ríos': { base1: 5990, extraKg: 2800 },
        'Los Lagos': { base1: 6490, extraKg: 3000 },
        'Aysén': { base1: 7490, extraKg: 3200 },
        'Magallanes': { base1: 7990, extraKg: 3500 },
        'Coquimbo': { base1: 5490, extraKg: 2500 },
        'Atacama': { base1: 5990, extraKg: 2800 },
        'Antofagasta': { base1: 6490, extraKg: 3000 },
        'Tarapacá': { base1: 6490, extraKg: 3000 },
        'Arica y Parinacota': { base1: 6990, extraKg: 3200 }
      };
      // Prefer per-commune rate if provided
      let base1, extraKg;
      if (COMMUNE_RATES && COMMUNE_RATES[region] && COMMUNE_RATES[region][city]){
        ({ base1, extraKg } = COMMUNE_RATES[region][city]);
      } else if (baseByRegion[region]) {
        ({ base1, extraKg } = baseByRegion[region]);
      } else {
        ({ base1, extraKg } = { base1: 6000, extraKg: 2500 });
      }
      let cost = 0;
      if (weightKg > 0) {
        cost = weightKg <= 1 ? base1 : base1 + Math.ceil(weightKg - 1) * extraKg;
      }
      res.setHeader('Access-Control-Allow-Origin', origin);
      return res.status(200).json({ cost, currency: 'CLP', mode: 'mock' });
    }

    // Example real call (placeholder URL):
    // const apiRes = await fetch('https://api.bluexpress.cl/rates', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    //   body: JSON.stringify({ destination: { region, city, zip, street, number, apartment }, weightKg })
    // });
    // if (!apiRes.ok) {
    //   const txt = await apiRes.text();
    //   return res.status(apiRes.status).json({ error: `Bluexpress error: ${txt}` });
    // }
    // const data = await apiRes.json();
    // res.setHeader('Access-Control-Allow-Origin', origin);
    // return res.status(200).json({ cost: data.price, currency: data.currency || 'CLP', mode: 'live' });

  } catch (err) {
    console.error('Error cotizando Bluexpress:', err);
    return res.status(500).json({ error: 'Error interno cotizando Bluexpress' });
  }
}
