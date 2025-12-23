import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3307,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  enableKeepAlive: true,
  keepAliveInitialDelay: 0,

  idleTimeout: 30000,

  connectTimeout: 10000,
});

pool.on("connection", (connection) => {});

pool.on("release", (connection) => {});

const withTimeout = <T>(promise: Promise<T>, ms: number) => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Query Timed Out after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
};

export async function query<T = any>(
  sql: string,
  values?: any[]
): Promise<T[]> {
  try {
    const [results] = (await withTimeout(pool.execute(sql, values), 15000)) as [
      any,
      any
    ];
    return results as T[];
  } catch (error: any) {
    if (
      error.code === "PROTOCOL_CONNECTION_LOST" ||
      error.code === "ECONNRESET" ||
      error.code === "EPIPE" ||
      error.code === "ETIMEDOUT" ||
      error.message.includes("Query Timed Out")
    ) {
      console.warn(
        `⚠️ Koneksi Basi/Timeout terdeteksi! Mencoba query ulang... (${error.message})`
      );

      try {
        const [results] = await pool.execute(sql, values);
        return results as T[];
      } catch (retryError) {
        console.error("❌ Retry gagal:", retryError);
        throw retryError;
      }
    }

    throw error;
  }
}

export async function bulkInsert(
  table: string,
  columns: string[],
  values: any[][]
): Promise<void> {
  if (values.length === 0) return;

  const placeholders = values
    .map(() => `(${columns.map(() => "?").join(", ")})`)
    .join(", ");
  const flatValues = values.flat();
  const sql = `INSERT INTO ${table} (${columns.join(
    ", "
  )}) VALUES ${placeholders}`;

  await query(sql, flatValues);
}

export default pool;
