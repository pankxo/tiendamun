tiendamun

## Mercado Pago backend (serverless)

Este proyecto incluye un endpoint serverless compatible con Vercel para crear preferencias de pago de Mercado Pago sin exponer tu Access Token.

Ruta: `POST /api/mercadopago/preference`

- Envía en el body JSON:
  - `title` (string)
  - `quantity` (number)
  - `unit_price` (number)
  - `currency_id` (string, ej. `CLP`)
  - `picture_url` (string, opcional)
  - `category_id` (string, opcional)
  - `description` (string, opcional)

El backend llamará a `https://api.mercadopago.com/checkout/preferences` usando tu Access Token en el header `Authorization: Bearer ...` y devolverá `{ id }` de la preferencia.

### Variables de entorno

Configura en Vercel (Project Settings → Environment Variables):

- `MP_ACCESS_TOKEN` = tu Access Token de Mercado Pago (usa `TEST-…` para pruebas o `APP_USR-…` para producción). No lo compartas ni lo publiques.

### Deploy en Vercel

1. Importa este repo en Vercel.
2. Agrega `MP_ACCESS_TOKEN` en Environment Variables (Preview y Production).
3. Deploy. El frontend ya apunta a `/api/mercadopago/preference`.

### Prueba local con Vercel CLI

```bash
npm i -g vercel
vercel dev
```

Luego prueba el endpoint:

```bash
curl -s -X POST http://localhost:3000/api/mercadopago/preference \
  -H 'Content-Type: application/json' \
  -d '{
    "title":"Shampoo Cabello Anticaída 60g",
    "quantity": 2,
    "unit_price": 7000,
    "currency_id": "CLP",
    "picture_url": "",
    "category_id": "personal_care",
    "description": "Compra de prueba"
  }'
```

Debe responder algo como:

```json
{"id":"PREF-1234567890"}
```

Si recibes un error 500 que indica `missing MP_ACCESS_TOKEN`, asegúrate de exportar la variable en tu entorno local antes de `vercel dev`.
