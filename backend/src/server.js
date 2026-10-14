import Fastify from 'fastify';
import cors from '@fastify/cors';
import argon2 from 'argon2';
import crypto from 'node:crypto';
import { z } from 'zod';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { config } from './config.js';
import { checkDatabase, query } from './db.js';

const app = Fastify({ logger: true });
await app.register(cors, { origin: config.FRONTEND_ORIGIN });

const authInput = z.object({
  email: z.string().email().transform(value => value.toLowerCase().trim()),
  password: z.string().min(8).max(128),
  fullName: z.string().min(2).max(120).optional(),
  phone: z.string().min(8).max(30).optional()
});
const loginInput = z.object({ identifier: z.string().min(3).max(120), password: z.string().min(8).max(128) });
const point = z.object({
  address: z.string().min(2).max(300),
  latitude: z.number().finite(),
  longitude: z.number().finite()
});
const tripInput = z.object({
  origin: point,
  destination: point,
  vehicleCategory: z.enum(['economico', 'comfort', 'black', 'xl', 'moto']),
  paymentMethod: z.enum(['Pix', 'Cartão de crédito', 'Espécie'])
});
const reservationInput = tripInput.extend({
  scheduledAt: z.string().datetime({ offset: true }),
  idempotencyKey: z.string().min(16).max(100),
  amountCents: z.number().int().positive().optional()
});
const routeInput = z.object({ origin: point, destination: point });

function signToken(userId) {
  const payload = Buffer.from(JSON.stringify({ sub: userId, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 })).toString('base64url');
  const signature = crypto.createHmac('sha256', config.JWT_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}
function verifyToken(token) {
  const [payload, signature] = String(token || '').split('.');
  if (!payload || !signature) return null;
  const expected = crypto.createHmac('sha256', config.JWT_SECRET).update(payload).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
  return data.exp > Date.now() ? data : null;
}
async function requireUser(request, reply) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
  const data = verifyToken(token);
  if (!data) return reply.code(401).send({ error: 'unauthorized' });
  const result = await query('SELECT id, email, full_name, phone, role FROM users WHERE id = $1', [data.sub]);
  if (!result.rows[0]) return reply.code(401).send({ error: 'unauthorized' });
  request.user = result.rows[0];
}
function mapDbPoint(prefix, value) {
  return [value[`${prefix}_address`], Number(value[`${prefix}_latitude`]), Number(value[`${prefix}_longitude`])];
}

app.get('/api/health', async (_request, reply) => {
  let database = 'unavailable';
  try { database = await checkDatabase() ? 'connected' : 'unavailable'; } catch {}
  return reply.send({
    ok: database === 'connected',
    service: 'uber-coroata-backend',
    database,
    integrations: {
      auth: 'ready',
      trips: 'ready_without_dispatch',
      reservations: 'ready_without_tariff_engine',
      googleMapsRoutes: config.GOOGLE_MAPS_SERVER_KEY ? 'configured' : 'credential_required',
      mercadoPago: config.MERCADOPAGO_ACCESS_TOKEN ? 'configured' : 'credential_required',
      drivers: 'deferred_by_product_scope'
    }
  });
});

app.post('/api/auth/register', async (request, reply) => {
  const parsed = authInput.safeParse(request.body);
  if (!parsed.success || !parsed.data.fullName) return reply.code(400).send({ error: 'invalid_registration' });
  const { email, password, fullName, phone } = parsed.data;
  const passwordHash = await argon2.hash(password);
  try {
    const result = await query('INSERT INTO users(email, phone, password_hash, full_name) VALUES ($1,$2,$3,$4) RETURNING id,email,phone,full_name,role', [email, phone || null, passwordHash, fullName]);
    const user = result.rows[0];
    return reply.code(201).send({ user, token: signToken(user.id) });
  } catch (error) {
    if (error.code === '23505') return reply.code(409).send({ error: 'email_or_phone_already_registered' });
    throw error;
  }
});

app.post('/api/auth/login', async (request, reply) => {
  const parsed = loginInput.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: 'invalid_login' });
  const identifier = parsed.data.identifier.trim();
  const email = identifier.toLowerCase();
  const phone = identifier.replace(/\D/g, '');
  const result = await query("SELECT id,email,phone,password_hash,full_name,role FROM users WHERE email = $1 OR regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') = $2 LIMIT 1", [email, phone]);
  const user = result.rows[0];
  if (!user || !(await argon2.verify(user.password_hash, parsed.data.password))) return reply.code(401).send({ error: 'invalid_credentials' });
  delete user.password_hash;
  return reply.send({ user, token: signToken(user.id) });
});

app.get('/api/me', { preHandler: requireUser }, async request => ({ user: request.user }));

app.get('/api/maps/browser-config', async (_request, reply) => {
  if (!config.GOOGLE_MAPS_BROWSER_KEY) return reply.code(503).send({ error: 'google_maps_browser_key_required' });
  return reply.send({ key: config.GOOGLE_MAPS_BROWSER_KEY });
});

app.post('/api/maps/route', async (request, reply) => {
  if (!config.GOOGLE_MAPS_SERVER_KEY) return reply.code(503).send({ error: 'google_maps_server_key_required' });
  const parsed = routeInput.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: 'invalid_route' });
  const { origin, destination } = parsed.data;
  const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': config.GOOGLE_MAPS_SERVER_KEY,
      'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'
    },
    body: JSON.stringify({
      origin: { location: { latLng: { latitude: origin.latitude, longitude: origin.longitude } } },
      destination: { location: { latLng: { latitude: destination.latitude, longitude: destination.longitude } } },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE'
    })
  });
  if (!response.ok) return reply.code(502).send({ error: 'google_routes_unavailable' });
  const data = await response.json();
  return reply.send(data);
});

app.post('/api/trips', { preHandler: requireUser }, async (request, reply) => {
  const parsed = tripInput.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: 'invalid_trip', details: parsed.error.flatten() });
  const { origin, destination, vehicleCategory, paymentMethod } = parsed.data;
  const result = await query(`INSERT INTO trips (passenger_id, origin_address, origin_latitude, origin_longitude, destination_address, destination_latitude, destination_longitude, vehicle_category, payment_method)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, [request.user.id, origin.address, origin.latitude, origin.longitude, destination.address, destination.latitude, destination.longitude, vehicleCategory, paymentMethod]);
  return reply.code(201).send({ trip: result.rows[0] });
});

app.post('/api/reservations', { preHandler: requireUser }, async (request, reply) => {
  const parsed = reservationInput.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: 'invalid_reservation', details: parsed.error.flatten() });
  const { origin, destination, vehicleCategory, paymentMethod, scheduledAt, idempotencyKey, amountCents } = parsed.data;
  try {
    const result = await query(`INSERT INTO reservations (passenger_id, origin_address, origin_latitude, origin_longitude, destination_address, destination_latitude, destination_longitude, scheduled_at, vehicle_category, payment_method, idempotency_key, amount_cents)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (idempotency_key) DO UPDATE SET updated_at = now() RETURNING *`, [request.user.id, origin.address, origin.latitude, origin.longitude, destination.address, destination.latitude, destination.longitude, scheduledAt, vehicleCategory, paymentMethod, idempotencyKey, amountCents || null]);
    return reply.code(201).send({ reservation: result.rows[0] });
  } catch (error) { throw error; }
});

app.post('/api/payments/mercadopago/preference', { preHandler: requireUser }, async (request, reply) => {
  if (!config.MERCADOPAGO_ACCESS_TOKEN) return reply.code(503).send({ error: 'mercadopago_access_token_required' });
  const body = z.object({ reservationId: z.string().uuid() }).safeParse(request.body);
  if (!body.success) return reply.code(400).send({ error: 'invalid_reservation_id' });
  const result = await query('SELECT * FROM reservations WHERE id = $1 AND passenger_id = $2', [body.data.reservationId, request.user.id]);
  const reservation = result.rows[0];
  if (!reservation || !reservation.amount_cents) return reply.code(409).send({ error: 'reservation_tariff_required' });
  const client = new MercadoPagoConfig({ accessToken: config.MERCADOPAGO_ACCESS_TOKEN, options: { timeout: 5000 } });
  const preference = new Preference(client);
  const created = await preference.create({ body: {
    items: [{ id: reservation.id, title: `Reserva Uber Coroatá - ${reservation.vehicle_category}`, quantity: 1, currency_id: 'BRL', unit_price: Number(reservation.amount_cents) / 100 }],
    external_reference: reservation.id,
    back_urls: { success: config.MERCADOPAGO_SUCCESS_URL, failure: config.MERCADOPAGO_FAILURE_URL, pending: config.MERCADOPAGO_PENDING_URL },
    auto_return: 'approved',
    notification_url: config.MERCADOPAGO_NOTIFICATION_URL
  }});
  await query('INSERT INTO payments (user_id, reservation_id, provider, provider_preference_id, amount_cents) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (provider_preference_id) DO NOTHING', [request.user.id, reservation.id, 'mercadopago', created.id, reservation.amount_cents]);
  return reply.code(201).send({ id: created.id, initPoint: created.init_point, sandboxInitPoint: created.sandbox_init_point });
});

app.post('/api/payments/mercadopago/webhook', async (request, reply) => {
  if (!config.MERCADOPAGO_WEBHOOK_SECRET) return reply.code(503).send({ error: 'mercadopago_webhook_secret_required' });
  const signature = request.headers['x-signature'];
  const requestId = request.headers['x-request-id'];
  const dataId = request.body?.data?.id;
  if (!signature || !requestId || !dataId) return reply.code(400).send({ error: 'invalid_webhook_headers' });
  const parts = Object.fromEntries(String(signature).split(',').map(item => item.trim().split('=')));
  const manifest = `id:${dataId};request-id:${requestId};ts:${parts.ts};`;
  const expected = crypto.createHmac('sha256', config.MERCADOPAGO_WEBHOOK_SECRET).update(manifest).digest('hex');
  if (!parts.v1 || parts.v1.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(parts.v1), Buffer.from(expected))) return reply.code(401).send({ error: 'invalid_webhook_signature' });
  if (request.body.type !== 'payment') return reply.code(200).send({ received: true });
  const client = new MercadoPagoConfig({ accessToken: config.MERCADOPAGO_ACCESS_TOKEN });
  const paymentApi = new Payment(client);
  const payment = await paymentApi.get({ id: dataId });
  await query('UPDATE payments SET provider_payment_id = $1, status = $2, raw_status = $3, updated_at = now() WHERE reservation_id = $4 OR provider_payment_id = $1', [String(payment.id), payment.status, payment.status_detail || null, payment.external_reference]);
  return reply.code(200).send({ received: true });
});

app.setNotFoundHandler((request, reply) => reply.code(404).send({ error: 'route_not_found', path: request.url }));
app.setErrorHandler((error, request, reply) => { request.log.error(error); reply.code(error.statusCode && error.statusCode < 500 ? error.statusCode : 500).send({ error: 'internal_error' }); });

try { await app.listen({ port: config.PORT, host: config.HOST }); }
catch (error) { app.log.error(error); process.exit(1); }
