-- ============================================================
-- Smart Cashless Self-Service Carwash System
-- PostgreSQL schema (Neon-compatible)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- provides gen_random_uuid()

-- ---- shared updated_at trigger ----
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- USERS  (staff only: admin / technician. Customers are anonymous in the MVP)
-- ============================================================
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'admin'
                CHECK (role IN ('admin','technician')),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- SERVICES  (Water / Soap / Air)
-- ============================================================
CREATE TABLE services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(30) NOT NULL UNIQUE,   -- 'water','soap','air'
  name        VARCHAR(80) NOT NULL,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- PRICING  (service + duration -> price)
-- ============================================================
CREATE TABLE pricing (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id       UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  price            NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  currency         VARCHAR(3) NOT NULL DEFAULT 'PHP',
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (service_id, duration_minutes)
);
CREATE TRIGGER trg_pricing_updated_at BEFORE UPDATE ON pricing
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- MACHINES  (wash bays). last_heartbeat reserved for future ESP32 IoT.
-- ============================================================
CREATE TABLE machines (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code           VARCHAR(40) NOT NULL UNIQUE,   -- encoded in the bay's QR code
  name           VARCHAR(80) NOT NULL,
  location       VARCHAR(160),
  status         VARCHAR(20) NOT NULL DEFAULT 'idle'
                 CHECK (status IN ('idle','running','finished','offline','maintenance')),
  last_heartbeat TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_machines_updated_at BEFORE UPDATE ON machines
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TRANSACTIONS  (one customer purchase). Amount/duration are SNAPSHOT here
-- so later price edits never rewrite historical receipts.
-- ============================================================
CREATE TABLE transactions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id         UUID NOT NULL REFERENCES machines(id),
  service_id         UUID NOT NULL REFERENCES services(id),
  duration_minutes   INTEGER NOT NULL CHECK (duration_minutes > 0),
  amount             NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  currency           VARCHAR(3) NOT NULL DEFAULT 'PHP',
  status             VARCHAR(20) NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','paid','activated','completed','failed','expired')),
  customer_reference VARCHAR(120),  -- optional phone/device id; customers are anonymous in the MVP
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at       TIMESTAMPTZ
);
CREATE INDEX idx_transactions_machine ON transactions(machine_id);
CREATE INDEX idx_transactions_status  ON transactions(status);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);

-- ============================================================
-- PAYMENTS  (simulated GCash for the MVP)
-- ============================================================
CREATE TABLE payments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id     UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  method             VARCHAR(20) NOT NULL DEFAULT 'gcash'
                     CHECK (method IN ('gcash','simulated')),
  provider_reference VARCHAR(120),
  amount             NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  status             VARCHAR(20) NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','success','failed')),
  raw_payload        JSONB,
  paid_at            TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_payments_transaction ON payments(transaction_id);

-- ============================================================
-- ACTIVATION TOKENS  (one-time, time-limited machine unlock)
-- ============================================================
CREATE TABLE activation_tokens (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  machine_id     UUID NOT NULL REFERENCES machines(id),
  token          VARCHAR(80) NOT NULL UNIQUE,
  status         VARCHAR(20) NOT NULL DEFAULT 'issued'
                 CHECK (status IN ('issued','consumed','expired')),
  issued_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at     TIMESTAMPTZ NOT NULL,
  consumed_at    TIMESTAMPTZ
);
CREATE INDEX idx_tokens_machine ON activation_tokens(machine_id);
CREATE INDEX idx_tokens_status  ON activation_tokens(status);

-- ============================================================
-- MACHINE LOGS  (audit trail; ESP32 will append heartbeats here later)
-- ============================================================
CREATE TABLE machine_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id     UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  event_type     VARCHAR(30) NOT NULL
                 CHECK (event_type IN ('status_change','activation','completion','error','heartbeat')),
  from_status    VARCHAR(20),
  to_status      VARCHAR(20),
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  token_id       UUID REFERENCES activation_tokens(id) ON DELETE SET NULL,
  message        TEXT,
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_logs_machine ON machine_logs(machine_id);
CREATE INDEX idx_logs_created ON machine_logs(created_at DESC);

-- ============================================================
-- SESSIONS  (express-session store via connect-pg-simple)
-- ============================================================
CREATE TABLE sessions (
  sid    VARCHAR NOT NULL PRIMARY KEY,
  sess   JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);
CREATE INDEX idx_sessions_expire ON sessions(expire);

-- ============================================================
-- SEED DATA (safe to re-run)
-- ============================================================
INSERT INTO services (code, name, description) VALUES
  ('water', 'Water', 'High-pressure water rinse'),
  ('soap',  'Soap',  'Foaming soap dispenser'),
  ('air',   'Air',   'Air blow / tire inflation')
ON CONFLICT (code) DO NOTHING;

-- Sample pricing: PHP, scaling with duration (tune freely)
INSERT INTO pricing (service_id, duration_minutes, price)
SELECT s.id, d.minutes, d.price
FROM services s
JOIN (VALUES (3, 15.00), (5, 25.00), (10, 45.00), (15, 65.00)) AS d(minutes, price) ON TRUE
ON CONFLICT (service_id, duration_minutes) DO NOTHING;

INSERT INTO machines (code, name, location) VALUES
  ('BAY-001', 'Bay 1', 'Front-left')
ON CONFLICT (code) DO NOTHING;
