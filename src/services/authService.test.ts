import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage for Node test runner
const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storageMap.set(key, String(value));
  },
  removeItem: (key: string) => {
    storageMap.delete(key);
  },
  clear: () => {
    storageMap.clear();
  },
  key: (index: number) => Array.from(storageMap.keys())[index] ?? null,
  get length() {
    return storageMap.size;
  },
};

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
}

import { authService } from './authService';

describe('authService - Manajemen Pengguna & Password', () => {
  beforeEach(() => {
    localStorage.clear();
    // Re-initialize default users in fresh storage
    authService.initDefaultUsers();
  });

  it('harus memiliki daftar akun bawaan saat pertama kali dimuat', () => {
    const users = authService.getUsers();
    expect(users.length).toBeGreaterThanOrEqual(4);
    const admin = users.find((u) => u.username === 'admin');
    expect(admin).toBeDefined();
    expect(admin?.role).toBe('admin');
  });

  it('harus berhasil login dengan username dan password yang benar', () => {
    const res = authService.login('admin', 'password123');
    expect(res.success).toBe(true);
    expect(res.user?.username).toBe('admin');
  });

  it('harus menolak login jika password salah', () => {
    const res = authService.login('admin', 'password_salah');
    expect(res.success).toBe(false);
    expect(res.error).toContain('Password yang Anda masukkan salah');
  });

  it('harus berhasil memperbarui username dan password pengguna', () => {
    const users = authService.getUsers();
    const userToEdit = users.find((u) => u.username === 'noc')!;

    const result = authService.updateUser(userToEdit.id, {
      username: 'noc_senior',
      password: 'new_noc_password_456',
      name: 'Budi Santoso MT',
      position: 'Lead Senior NOC',
    });

    expect(result.success).toBe(true);
    expect(result.user?.username).toBe('noc_senior');
    expect(result.user?.name).toBe('Budi Santoso MT');

    // Login dengan kredensial baru
    const loginRes = authService.login('noc_senior', 'new_noc_password_456');
    expect(loginRes.success).toBe(true);
    expect(loginRes.user?.name).toBe('Budi Santoso MT');
  });

  it('harus menolak pembaruan jika username baru sudah dipakai pengguna lain', () => {
    const users = authService.getUsers();
    const userNoc = users.find((u) => u.username === 'noc')!;

    // Coba ganti username noc menjadi 'admin' yang sudah ada
    const result = authService.updateUser(userNoc.id, {
      username: 'admin',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('sudah digunakan');
  });

  it('harus menolak pembaruan jika username atau nama kosong', () => {
    const users = authService.getUsers();
    const user = users[0];

    const resEmptyUser = authService.updateUser(user.id, { username: '   ' });
    expect(resEmptyUser.success).toBe(false);
    expect(resEmptyUser.error).toContain('Username tidak boleh kosong');

    const resEmptyName = authService.updateUser(user.id, { name: '   ' });
    expect(resEmptyName.success).toBe(false);
    expect(resEmptyName.error).toContain('Nama Lengkap tidak boleh kosong');
  });

  it('harus memperbarui session aktif jika user yang login memperbarui akunnya sendiri', () => {
    // Login sebagai user
    const loginRes = authService.login('admin', 'password123');
    expect(loginRes.user).toBeDefined();

    // Update data akun admin
    authService.updateUser(loginRes.user!.id, {
      name: 'Reza Pahlawan S.Kom',
      username: 'super_reza',
    });

    const activeSession = authService.getCurrentUser();
    expect(activeSession?.name).toBe('Reza Pahlawan S.Kom');
    expect(activeSession?.username).toBe('super_reza');
  });
});
