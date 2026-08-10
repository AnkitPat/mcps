import getPool from './db.js';

const rowToPayload = (row: { payload: string; consumed_at: number | null } | undefined) => {
  if (!row) return undefined;
  const payload = JSON.parse(row.payload);
  if (row.consumed_at) payload.consumed = row.consumed_at;
  return payload;
};

export class PostgresAdapter {
  model: string;
  pool: any;

  constructor(name: string, poolInstance?: any) {
    this.model = name;
    this.pool = poolInstance || getPool();
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
    try {
      await this.pool.query(query, [
        this.model,
        id,
        JSON.stringify(payload),
        payload.grantId ?? null,
        payload.userCode ?? null,
        payload.uid ?? null,
        expiresAt,
      ]);
    } catch (error) {
      console.error('Error in PostgresAdapter.upsert:', error);
      throw error;
    }
  }

  async find(id: string) {
    const query = `
      SELECT payload, consumed_at FROM oidc_models
      WHERE model = $1 AND id = $2 AND (expires_at IS NULL OR expires_at > $3)
    `;
    try {
      const { rows } = await this.pool.query(query, [this.model, id, Math.floor(Date.now() / 1000)]);
      return rowToPayload(rows[0]);
    } catch (error) {
      console.error('Error in PostgresAdapter.find:', error);
      throw error;
    }
  }

  async findByUserCode(userCode: string) {
    const query = `
      SELECT payload, consumed_at FROM oidc_models
      WHERE model = $1 AND user_code = $2 AND (expires_at IS NULL OR expires_at > $3)
    `;
    try {
      const { rows } = await this.pool.query(query, [this.model, userCode, Math.floor(Date.now() / 1000)]);
      return rowToPayload(rows[0]);
    } catch (error) {
      console.error('Error in PostgresAdapter.findByUserCode:', error);
      throw error;
    }
  }

  async findByUid(uid: string) {
    const query = `
      SELECT payload, consumed_at FROM oidc_models
      WHERE model = $1 AND uid = $2 AND (expires_at IS NULL OR expires_at > $3)
    `;
    try {
      const { rows } = await this.pool.query(query, [this.model, uid, Math.floor(Date.now() / 1000)]);
      return rowToPayload(rows[0]);
    } catch (error) {
      console.error('Error in PostgresAdapter.findByUid:', error);
      throw error;
    }
  }

  async consume(id: string) {
    const query = `UPDATE oidc_models SET consumed_at = $1 WHERE model = $2 AND id = $3`;
    try {
      await this.pool.query(query, [Math.floor(Date.now() / 1000), this.model, id]);
    } catch (error) {
      console.error('Error in PostgresAdapter.consume:', error);
      throw error;
    }
  }

  async destroy(id: string) {
    const query = `DELETE FROM oidc_models WHERE model = $1 AND id = $2`;
    try {
      await this.pool.query(query, [this.model, id]);
    } catch (error) {
      console.error('Error in PostgresAdapter.destroy:', error);
      throw error;
    }
  }

  async revokeByGrantId(grantId: string) {
    const query = `DELETE FROM oidc_models WHERE grant_id = $1`;
    try {
      await this.pool.query(query, [grantId]);
    } catch (error) {
      console.error('Error in PostgresAdapter.revokeByGrantId:', error);
      throw error;
    }
  }
}
