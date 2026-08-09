CREATE TABLE IF NOT EXISTS oidc_models (
  model TEXT NOT NULL,
  id TEXT NOT NULL,
  payload TEXT NOT NULL,
  grant_id TEXT,
  user_code TEXT,
  uid TEXT,
  expires_at INTEGER,
  consumed_at INTEGER,
  PRIMARY KEY (model, id)
);
CREATE INDEX IF NOT EXISTS idx_grant_id ON oidc_models (model, grant_id);
CREATE INDEX IF NOT EXISTS idx_user_code ON oidc_models (model, user_code);
CREATE INDEX IF NOT EXISTS idx_uid ON oidc_models (model, uid);
