import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST_GET,
  user: process.env.DB_USER_GET,
  password: process.env.DB_PASSWORD_GET,
  database: process.env.DB_NAME_GET,
  port: process.env.DB_PORT_GET ? Number(process.env.DB_PORT_GET) : 3307,

  waitForConnections: true,
  connectionLimit: 50,
  queueLimit: 0,

  // Sangat penting untuk Next.js SSR dan Turbopack
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export async function query<T = any>(sql: string, values: any[] = []): Promise<T> {
  const [rows] = await pool.execute(sql, values);
  return rows as T;
}
