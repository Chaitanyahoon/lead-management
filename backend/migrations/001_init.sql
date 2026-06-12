-- ============================================================
-- Mini Lead Management System — Initial Migration
-- ============================================================

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'agent')),
    is_active     BOOLEAN DEFAULT true,
    created_at    TIMESTAMP DEFAULT NOW()
);

-- 2. Leads table
CREATE TABLE IF NOT EXISTS leads (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150),
    phone         VARCHAR(20),
    source        VARCHAR(50),
    status        VARCHAR(30) NOT NULL DEFAULT 'new'
                      CHECK (status IN ('new', 'contacted', 'qualified', 'lost', 'won')),
    assigned_to   UUID REFERENCES users(id) ON DELETE SET NULL,
    notes         TEXT,
    created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW(),
    deleted_at    TIMESTAMP DEFAULT NULL
);

-- Defensive check to add column to pre-existing tables
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

-- 3. Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id       UUID REFERENCES leads(id) ON DELETE CASCADE,
    action        VARCHAR(50) NOT NULL,
    performed_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    meta          JSONB,
    created_at    TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_leads_status      ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to  ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_at   ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_lead ON activity_logs(lead_id);

-- ============================================================
-- Seed data (password: password123)
-- Hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
-- ============================================================
INSERT INTO users (name, email, password_hash, role) VALUES
    ('Admin User',   'admin@test.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin'),
    ('Manager User', 'manager@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'manager'),
    ('Agent One',    'agent1@test.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'agent'),
    ('Agent Two',    'agent2@test.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'agent'),
    ('Agent Three',  'agent3@test.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'agent')
ON CONFLICT (email) DO NOTHING;
