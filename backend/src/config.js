import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8787),
  HOST: z.string().default('0.0.0.0'),
  FRONTEND_ORIGIN: z.string().url().default('http://127.0.0.1:4173'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  GOOGLE_MAPS_SERVER_KEY: z.string().optional(),
  GOOGLE_MAPS_BROWSER_KEY: z.string().optional(),
  MERCADOPAGO_ACCESS_TOKEN: z.string().optional(),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().optional(),
  MERCADOPAGO_SUCCESS_URL: z.string().url().optional(),
  MERCADOPAGO_FAILURE_URL: z.string().url().optional(),
  MERCADOPAGO_PENDING_URL: z.string().url().optional(),
  MERCADOPAGO_NOTIFICATION_URL: z.string().url().optional()
});

export const config = envSchema.parse({
  PORT: process.env.PORT,
  HOST: process.env.HOST || '0.0.0.0',
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  GOOGLE_MAPS_SERVER_KEY: process.env.GOOGLE_MAPS_SERVER_KEY || undefined,
  GOOGLE_MAPS_BROWSER_KEY: process.env.GOOGLE_MAPS_BROWSER_KEY || undefined,
  MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN || undefined,
  MERCADOPAGO_WEBHOOK_SECRET: process.env.MERCADOPAGO_WEBHOOK_SECRET || undefined,
  MERCADOPAGO_SUCCESS_URL: process.env.MERCADOPAGO_SUCCESS_URL || undefined,
  MERCADOPAGO_FAILURE_URL: process.env.MERCADOPAGO_FAILURE_URL || undefined,
  MERCADOPAGO_PENDING_URL: process.env.MERCADOPAGO_PENDING_URL || undefined,
  MERCADOPAGO_NOTIFICATION_URL: process.env.MERCADOPAGO_NOTIFICATION_URL || undefined
});
