import pool from './db';

const rowToPayload = (row: { payload: string; consumed_at: number | null } | undefined) => {
  if (!row) return undefined;
  const payload = JSON.parse(row.payload);
  if (row.consumed_at) payload.consumed = row.consumed_at;
  return payload;
};

export class PostgresAdapter {
  model: string;

  constructor(name: string) {
    this.model = name;
  }

  async upsert(id: string, payload: any, expiresIn: number) {
    const expiresAt = expiresIn ? Math.floor(Date.now() / 1000) + expiresIn : null;
    const query = `
      INSERT INTO oidc_models (model, id, payload, grant_id, user_code, uid, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (model, id) DO UPDATE SET
        payload = excluded.payload,
        grant_id = excluded.grant_id,
        user_code = excluded.user_code,
        uid = excluded.uid,
        expires_at = excluded.expires_at,
        consumed_at = NULL
    `;
    await pool.query(query, [
      this.model,
      id,
      JSON.stringify(payload),
      payload.grantId ?? null,
      payload.userCode ?? null,
      payload.uid ?? null,
      expiresAt,
    ]);
  }

  async find(id: string) {
    const query = `
      SELECT payload, consumed_at FROM oidc_models
      WHERE model = $1 AND id = $2 AND (expires_at IS NULL OR expires_at > $3)
    `;
    const { rows } = await pool.query(query, [this.model, id, Math.floor(Date.now() / 1000)]);
    return rowToPayload(rows[0]);
  }

  async findByUserCode(userCode: string) {
    const query = `
      SELECT payload, consumed_at FROM oidc_models
      WHERE model = $1 AND user_code = $2 AND (expires_at IS NULL OR expires_at > $3)
    `;
    const { rows } = await pool.query(query, [this.model, userCode, Math.floor(Date.now() / 1000)]);
    return rowToPayload(rows[0]);
  }

  async findByUid(uid: string) {
    const query = `
      SELECT payload, consumed_at FROM oidc_models
      WHERE model = $1 AND uid = $2 AND (expires_at IS NULL OR expires_at > $3)
    `;
    const { rows } = await pool.query(query, [this.model, uid, Math.floor(Date.now() / 1000)]);
    return rowToPayload(rows[0]);
  }

  async consume(id: string) {
    const query = `UPDATE oidc_models SET consumed_at = $1 WHERE model = $2 AND id = $3`;
    await pool.query(query, [Math.floor(Date.now() / 1000), this.model, id]);
  }

  async destroy(id: string) {
    const query = `DELETE FROM oidc_models WHERE model = $1 AND id = $2`;
    await pool.query(query, [this.model, id]);
  }

  async revokeByGrantId(grantId: string) {
    const query = `DELETE FROM oidc_models WHERE grant_id = $1`;
    await pool.query(query, [grantId]);
  }
}
