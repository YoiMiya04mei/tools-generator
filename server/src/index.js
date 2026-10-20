import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import {
  initDatabase,
  getStorageItem,
  getAllStorageItems,
  setStorageItem,
  removeStorageItem,
} from './db.js';

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// Middleware
app.use(cors());
// Batas 50mb agar lampiran foto di Berita Acara dapat disimpan dengan aman
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Healthcheck endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'jdp-tools-backend',
  });
});

// Ambil seluruh key-value storage (berguna saat sinkronisasi awal aplikasi)
app.get('/api/storage', async (req, res) => {
  try {
    const data = await getAllStorageItems();
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching all storage:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Ambil data per key
app.get('/api/storage/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const data = await getStorageItem(key);
    res.json({ success: true, key, data });
  } catch (err) {
    console.error(`Error fetching key "${req.params.key}":`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Simpan/update data per key
app.post('/api/storage/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ success: false, error: 'Field "value" wajib dikirim.' });
    }

    await setStorageItem(key, value);
    res.json({ success: true, key, message: 'Data berhasil disimpan ke database.' });
  } catch (err) {
    console.error(`Error saving key "${req.params.key}":`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Hapus data per key
app.delete('/api/storage/:key', async (req, res) => {
  try {
    const { key } = req.params;
    await removeStorageItem(key);
    res.json({ success: true, key, message: 'Data berhasil dihapus dari database.' });
  } catch (err) {
    console.error(`Error deleting key "${req.params.key}":`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Jalankan server setelah database siap
async function start() {
  try {
    await initDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Backend] Server berjalan di port ${PORT}`);
    });
  } catch (err) {
    console.error('[Backend] Gagal memulai server:', err);
    process.exit(1);
  }
}

start();
