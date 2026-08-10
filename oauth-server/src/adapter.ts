import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'oidc-data.db'));
db.pragma('journal_mode = WAL');

db.exec(`
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
`);

// Periodically purge expired rows so the file doesn't grow forever
setInterval(() => {
  db.prepare('DELETE FROM oidc_models WHERE expires_at IS NOT NULL AND expires_at < ?')
    .run(Math.floor(Date.now() / 1000));
}, 10 * 60 * 1000).unref();

const upsertStmt = db.prepare(`
  INSERT INTO oidc_models (model, id, payload, grant_id, user_code, uid, expires_at)
  VALUES (@model, @id, @payload, @grantId, @userCode, @uid, @expiresAt)
  ON CONFLICT (model, id) DO UPDATE SET
    payload = excluded.payload,
    grant_id = excluded.grant_id,
    user_code = excluded.user_code,
    uid = excluded.uid,
    expires_at = excluded.expires_at,
    consumed_at = NULL
`);

const findStmt = db.prepare(`
  SELECT payload, consumed_at FROM oidc_models
  WHERE model = ? AND id = ? AND (expires_at IS NULL OR expires_at > ?)
`);

const findByUserCodeStmt = db.prepare(`
  SELECT payload, consumed_at FROM oidc_models
  WHERE model = ? AND user_code = ? AND (expires_at IS NULL OR expires_at > ?)
`);

const findByUidStmt = db.prepare(`
  SELECT payload, consumed_at FROM oidc_models
  WHERE model = ? AND uid = ? AND (expires_at IS NULL OR expires_at > ?)
`);

const consumeStmt = db.prepare(`UPDATE oidc_models SET consumed_at = ? WHERE model = ? AND id = ?`);
const destroyStmt = db.prepare(`DELETE FROM oidc_models WHERE model = ? AND id = ?`);
const revokeByGrantIdStmt = db.prepare(`DELETE FROM oidc_models WHERE grant_id = ?`);

function rowToPayload(row: { payload: string; consumed_at: number | null } | undefined) {
  if (!row) return undefined;
  const payload = JSON.parse(row.payload);
  if (row.consumed_at) payload.consumed = row.consumed_at;
  return payload;
}

export class SqliteAdapter {
  model: string;

  constructor(name: string) {
    this.model = name;
  }

  async upsert(id: string, payload: any, expiresIn: number) {
    upsertStmt.run({
      model: this.model,
      id,
      payload: JSON.stringify(payload),
      grantId: payload.grantId ?? null,
      userCode: payload.userCode ?? null,
      uid: payload.uid ?? null,
      expiresAt: expiresIn ? Math.floor(Date.now() / 1000) + expiresIn : null,
    });
  }

  async find(id: string) {
    const row = findStmt.get(this.model, id, Math.floor(Date.now() / 1000)) as any;
    return rowToPayload(row);
  }

  async findByUserCode(userCode: string) {
    const row = findByUserCodeStmt.get(this.model, userCode, Math.floor(Date.now() / 1000)) as any;
    return rowToPayload(row);
  }

  async findByUid(uid: string) {
    const row = findByUidStmt.get(this.model, uid, Math.floor(Date.now() / 1000)) as any;
    return rowToPayload(row);
  }

  async consume(id: string) {
    consumeStmt.run(Math.floor(Date.now() / 1000), this.model, id);
  }

  async destroy(id: string) {
    destroyStmt.run(this.model, id);
  }

  async revokeByGrantId(grantId: string) {
    revokeByGrantIdStmt.run(grantId);
  }
}