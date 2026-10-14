-- Migration 001: identidade, viagens, reservas e pagamentos.
-- O sistema de motoristas foi deliberadamente deixado para uma fase posterior.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'passenger' CHECK (role IN ('passenger', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  origin_address TEXT NOT NULL,
  origin_latitude NUMERIC(9, 6) NOT NULL,
  origin_longitude NUMERIC(9, 6) NOT NULL,
  destination_address TEXT NOT NULL,
  destination_latitude NUMERIC(9, 6) NOT NULL,
  destination_longitude NUMERIC(9, 6) NOT NULL,
  vehicle_category TEXT NOT NULL CHECK (vehicle_category IN ('economico', 'comfort', 'black', 'xl', 'moto')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Pix', 'Cartão de crédito', 'Espécie')),
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'arriving', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  origin_address TEXT NOT NULL,
  origin_latitude NUMERIC(9, 6) NOT NULL,
  origin_longitude NUMERIC(9, 6) NOT NULL,
  destination_address TEXT NOT NULL,
  destination_latitude NUMERIC(9, 6) NOT NULL,
  destination_longitude NUMERIC(9, 6) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  vehicle_category TEXT NOT NULL CHECK (vehicle_category IN ('economico', 'comfort', 'black', 'xl', 'moto')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Pix', 'Cartão de crédito', 'Espécie')),
  amount_cents INTEGER CHECK (amount_cents IS NULL OR amount_cents > 0),
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'cancelled', 'completed')),
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  provider TEXT NOT NULL CHECK (provider IN ('mercadopago')),
  provider_payment_id TEXT UNIQUE,
  provider_preference_id TEXT UNIQUE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'authorized', 'in_process', 'rejected', 'cancelled', 'refunded')),
  raw_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trips_passenger_status_idx ON trips (passenger_id, status);
CREATE INDEX IF NOT EXISTS reservations_passenger_schedule_idx ON reservations (passenger_id, scheduled_at);
CREATE INDEX IF NOT EXISTS payments_provider_status_idx ON payments (provider, status);
