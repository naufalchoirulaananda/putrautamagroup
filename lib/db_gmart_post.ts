import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST_POST,
  port: process.env.DB_PORT_POST ? parseInt(process.env.DB_PORT_POST, 10) : 3307,
  user: process.env.DB_USER_POST,
  password: process.env.DB_PASSWORD_POST,
  database: process.env.DB_NAME_POST,
  timezone: '+07:00',
  waitForConnections: true,
  connectionLimit: 50,
  queueLimit: 0,
});

export async function query<T = any>(
  sql: string,
  values?: any[]
): Promise<T[]> {
  const [results] = await pool.execute(sql, values);
  return results as T[];
}

// Helper function untuk bulk insert
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
  const sql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES ${placeholders}`;

  await pool.execute(sql, flatValues);
}

export default pool;