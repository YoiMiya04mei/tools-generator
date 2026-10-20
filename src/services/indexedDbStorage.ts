/**
 * IndexedDB storage provider for JDP NOC Tools.
 *
 * Provides virtually unlimited storage capacity for documents with photo attachments,
 * avoiding the 5MB browser quota limit of localStorage ('QuotaExceededError').
 *
 * Features:
 * - Native IndexedDB storage (hundreds of MBs/GBs capacity)
 * - Automatic background migration from localStorage so existing data is never lost
 * - Safe fallback to localStorage in environments without IndexedDB (e.g. SSR, tests)
 * - Silent localStorage mirroring that catches QuotaExceededError without crashing
 */

const DB_NAME = 'jdp_tools_database_v1';
const STORE_NAME = 'keyval_store';
const DB_VERSION = 1;

class IndexedDbStorageService {
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  private getDB(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return Promise.resolve(null);
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve) => {
        try {
          const request = indexedDB.open(DB_NAME, DB_VERSION);

          request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
              db.createObjectStore(STORE_NAME);
            }
          };

          request.onsuccess = () => {
            resolve(request.result);
          };

          request.onerror = (e) => {
            console.warn('IndexedDB failed to open, falling back to localStorage:', e);
            resolve(null);
          };
        } catch (err) {
          console.warn('IndexedDB initialization exception:', err);
          resolve(null);
        }
      });
    }

    return this.dbPromise;
  }

  async getItem<T>(key: string): Promise<T | null> {
    const db = await this.getDB();

    if (db) {
      try {
        const val = await new Promise<T | null>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.get(key);
          req.onsuccess = () => resolve(req.result !== undefined ? req.result : null);
          req.onerror = () => reject(req.error);
        });

        if (val !== null && val !== undefined) {
          return val;
        }
      } catch (err) {
        console.warn(`IndexedDB getItem("${key}") error:`, err);
      }
    }

    // Check localStorage (initial run or legacy data)
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          // Migrate to IndexedDB in background
          if (db) {
            this.setItem(key, parsed).catch(() => {});
          }
          return parsed as T;
        }
      } catch (err) {
        console.warn(`localStorage fallback getItem("${key}") error:`, err);
      }
    }

    return null;
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    const db = await this.getDB();

    if (db) {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(value, key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    }

    // Mirror to localStorage if possible, but safely catch QuotaExceededError
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Silently ignore QuotaExceededError since data is already safely persisted in IndexedDB!
      }
    }
  }

  async removeItem(key: string): Promise<void> {
    const db = await this.getDB();

    if (db) {
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = store.delete(key);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      } catch (err) {
        console.warn(`IndexedDB removeItem("${key}") error:`, err);
      }
    }

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
  }
}

export const indexedDbStorage = new IndexedDbStorageService();
