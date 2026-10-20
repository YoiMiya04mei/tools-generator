import mysql from 'mysql2/promise';

let pool = null;

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'jdp_user',
  password: process.env.DB_PASSWORD || 'jdppassword123',
  database: process.env.DB_NAME || 'jdp_tools_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

/**
 * Inisialisasi koneksi MySQL dengan retry loop hingga database siap
 */
export async function initDatabase(retries = 15, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[Database] Menghubungkan ke MySQL/MariaDB (${dbConfig.host}:${dbConfig.port})... Percobaan ${attempt}/${retries}`);
      pool = mysql.createPool(dbConfig);

      // Tes koneksi
      const [rows] = await pool.query('SELECT 1 as test');
      console.log('[Database] Terhubung ke MySQL/MariaDB dengan sukses!');

      // Inisialisasi tabel storage aplikasi jika belum ada
      await pool.query(`
        CREATE TABLE IF NOT EXISTS app_storage (
          storage_key VARCHAR(191) NOT NULL PRIMARY KEY,
          storage_value LONGTEXT NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      console.log('[Database] Tabel app_storage siap digunakan.');
      return pool;
    } catch (err) {
      console.warn(`[Database] Percobaan ${attempt} gagal: ${err.message}`);
      if (attempt === retries) {
        throw new Error(`Gagal terhubung ke database setelah ${retries} percobaan: ${err.message}`);
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

export function getPool() {
  if (!pool) {
    throw new Error('Database pool belum diinisialisasi.');
  }
  return pool;
}

export async function getStorageItem(key) {
  const p = getPool();
  const [rows] = await p.query(
    'SELECT storage_value, updated_at FROM app_storage WHERE storage_key = ? LIMIT 1',
    [key]
  );
  if (!rows || rows.length === 0) {
    return null;
  }
  try {
    return JSON.parse(rows[0].storage_value);
  } catch {
    return rows[0].storage_value;
  }
}

export async function getAllStorageItems() {
  const p = getPool();
  const [rows] = await p.query('SELECT storage_key, storage_value, updated_at FROM app_storage');
  const result = {};
  for (const row of rows) {
    try {
      result[row.storage_key] = JSON.parse(row.storage_value);
    } catch {
      result[row.storage_key] = row.storage_value;
    }
  }
  return result;
}

export async function setStorageItem(key, value) {
  const p = getPool();
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  await p.query(
    `INSERT INTO app_storage (storage_key, storage_value)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE storage_value = VALUES(storage_value), updated_at = CURRENT_TIMESTAMP`,
    [key, serialized]
  );
  return true;
}

export async function removeStorageItem(key) {
  const p = getPool();
  await p.query('DELETE FROM app_storage WHERE storage_key = ?', [key]);
  return true;
}
