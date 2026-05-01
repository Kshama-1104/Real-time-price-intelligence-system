CREATE TABLE IF NOT EXISTS app_users (
  id VARCHAR(80) PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(24) NOT NULL DEFAULT 'client',
  company VARCHAR(120) NOT NULL DEFAULT 'Self Serve',
  organization_id VARCHAR(80) NOT NULL,
  preferences JSONB NOT NULL DEFAULT '{"weeklyDigest": true, "criticalAlerts": true, "reportFormat": "pdf"}'::jsonb,
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE app_users ADD COLUMN IF NOT EXISTS organization_id VARCHAR(80);
UPDATE app_users SET organization_id = CONCAT('org-', id) WHERE organization_id IS NULL;
ALTER TABLE app_users ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{"weeklyDigest": true, "criticalAlerts": true, "reportFormat": "pdf"}'::jsonb;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);
CREATE INDEX IF NOT EXISTS idx_app_users_status ON app_users(status);
CREATE INDEX IF NOT EXISTS idx_app_users_organization ON app_users(organization_id);
