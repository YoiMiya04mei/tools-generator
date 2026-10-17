import { describe, it, expect } from 'vitest';
import { calculateDuration } from './duration';

describe('calculateDuration', () => {
  it('harus menghitung 45 menit dengan benar (< 1 jam)', () => {
    const start = '2026-10-11T18:00:00';
    const end = '2026-10-11T18:45:00';
    const result = calculateDuration(start, end);

    expect(result.isValid).toBe(true);
    expect(result.formatted).toBe('45 Menit');
    expect(result.totalMinutes).toBe(45);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(45);
  });

  it('harus menghitung tepat 1 jam dengan benar', () => {
    const start = '2026-10-11T18:00:00';
    const end = '2026-10-11T19:00:00';
    const result = calculateDuration(start, end);

    expect(result.isValid).toBe(true);
    expect(result.formatted).toBe('1 Jam');
    expect(result.totalMinutes).toBe(60);
    expect(result.hours).toBe(1);
    expect(result.minutes).toBe(0);
  });

  it('harus menghitung 3 jam 50 menit sesuai contoh spesifikasi', () => {
    // Contoh di prompt:
    // Waktu Mulai: 11 Oktober 2026 18:15 WIB
    // Waktu Selesai: 11 Oktober 2026 22:05 WIB
    // Hasil: 3 Jam 50 Menit
    const start = '2026-10-11T18:15:00';
    const end = '2026-10-11T22:05:00';
    const result = calculateDuration(start, end);

    expect(result.isValid).toBe(true);
    expect(result.formatted).toBe('3 Jam 50 Menit');
    expect(result.totalMinutes).toBe(230);
    expect(result.hours).toBe(3);
    expect(result.minutes).toBe(50);
  });

  it('harus menghitung 1 hari dengan benar', () => {
    const start = '2026-10-11T10:00:00';
    const end = '2026-10-12T10:00:00';
    const result = calculateDuration(start, end);

    expect(result.isValid).toBe(true);
    expect(result.formatted).toBe('1 Hari');
    expect(result.totalMinutes).toBe(1440);
    expect(result.days).toBe(1);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(0);
  });

  it('harus menghitung durasi kombinasi hari, jam, dan menit', () => {
    const start = '2026-10-11T10:00:00';
    const end = '2026-10-12T12:15:00';
    const result = calculateDuration(start, end);

    expect(result.isValid).toBe(true);
    expect(result.formatted).toBe('1 Hari 2 Jam 15 Menit');
    expect(result.days).toBe(1);
    expect(result.hours).toBe(2);
    expect(result.minutes).toBe(15);
  });

  it('harus menangani kasus lintas tengah malam (overnight outage)', () => {
    // Mulai 23:30, selesai 02:15 keesokan harinya -> 2 Jam 45 Menit
    const start = '2026-10-11T23:30:00';
    const end = '2026-10-12T02:15:00';
    const result = calculateDuration(start, end);

    expect(result.isValid).toBe(true);
    expect(result.formatted).toBe('2 Jam 45 Menit');
    expect(result.totalMinutes).toBe(165);
    expect(result.hours).toBe(2);
    expect(result.minutes).toBe(45);
  });

  it('harus menghasilkan error jika waktu selesai sebelum waktu mulai', () => {
    const start = '2026-10-11T22:00:00';
    const end = '2026-10-11T20:00:00';
    const result = calculateDuration(start, end);

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Waktu selesai tidak boleh lebih awal dari waktu mulai.');
  });

  it('harus menghasilkan error jika waktu selesai sama dengan waktu mulai', () => {
    const start = '2026-10-11T20:00:00';
    const end = '2026-10-11T20:00:00';
    const result = calculateDuration(start, end);

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Waktu selesai tidak boleh sama dengan waktu mulai.');
  });
});
