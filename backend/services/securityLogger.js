// securityLogger.js
import pool from "../db.js";

export async function logSecurityEvent({ username, ip, input, type }) {
  try {
    await pool.query(
      `INSERT INTO security_logs (username, ip_address, event_type, input)
       VALUES ($1, $2, $3, $4)`,
      [username, ip, type, input]
    );
  } catch (err) {
    console.error("Logging failed:", err);
  }
}

export async function checkAndLockIP(ip) {
  const suspiciousCount = await pool.query(
    `SELECT COUNT(*) FROM security_logs
     WHERE ip_address = $1 
     AND event_type = 'SUSPICIOUS_INPUT'
     AND created_at > NOW() - INTERVAL '10 minutes'`,
    [ip]
  );

  if (parseInt(suspiciousCount.rows[0].count) >= 3) {
    await pool.query(
      `INSERT INTO security_ip_locks (ip_address, lock_until)
       VALUES ($1, NOW() + INTERVAL '10 minutes')
       ON CONFLICT (ip_address)
       DO UPDATE SET lock_until = EXCLUDED.lock_until`,
      [ip]
    );
  }
}

export async function isIpLocked(ip) {
  const result = await pool.query(
    `SELECT lock_until
    FROM security_ip_locks
    WHERE ip_address = $1`,
    [ip]
  );

  const row = result.rows[0];
  return row?.lock_until && new Date(row.lock_until) > new Date();
}

