-- Cloud Postgres Schema (Chapter 20 & Appendix B.2)
-- Digital Handwriting Synthesis Engine (DHSE)

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,       -- argon2id
    tier TEXT NOT NULL CHECK (tier IN ('free','pro','teams','edu','enterprise')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    tier TEXT NOT NULL,
    seats INT NOT NULL DEFAULT 1,
    starts_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS watermark_registry (
    doc_serial UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    user_hash BYTEA NOT NULL,         -- SHA-256(userId + salt)
    exported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    nonce BYTEA NOT NULL,             -- 16 bytes
    revoked_at TIMESTAMPTZ,
    revoke_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_watermark_user ON watermark_registry(user_id);
CREATE INDEX IF NOT EXISTS idx_watermark_revoked ON watermark_registry(revoked_at) WHERE revoked_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,             -- 'export', 'delete_profile', 'license_validate', etc.
    doc_serial UUID REFERENCES watermark_registry(doc_serial),
    ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_hash TEXT,                     -- SHA-256(ip + salt), never raw IP
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_audit_user_ts ON audit_log(user_id, ts DESC);
