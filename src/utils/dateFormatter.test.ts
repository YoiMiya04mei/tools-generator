import { describe, it, expect } from 'vitest';
import { formatCreationTimestamp } from './dateFormatter';

describe('formatCreationTimestamp', () => {
  it('harus memformat tanggal dan waktu dengan benar', () => {
    const input = '2026-10-19T10:32:00+07:00';
    const result = formatCreationTimestamp(input);
    expect(result).toContain('19 Oktober 2026');
    expect(result).toContain('WIB');
  });

  it('harus memformat date-only tanpa jam midnight aneh', () => {
    const input = '2026-10-19';
    const result = formatCreationTimestamp(input);
    expect(result).toContain('19 Oktober 2026');
  });

  it('harus mengembalikan tanda "-" jika input kosong atau tidak valid', () => {
    expect(formatCreationTimestamp(null)).toBe('-');
    expect(formatCreationTimestamp(undefined)).toBe('-');
    expect(formatCreationTimestamp('invalid-date')).toBe('-');
  });
});
