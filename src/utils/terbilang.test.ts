import { describe, it, expect } from 'vitest';
import { terbilangRupiah } from './terbilang';

describe('Indonesian Terbilang Rupiah', () => {
  it('converts basic numbers', () => {
    expect(terbilangRupiah(0)).toBe('Nol Rupiah');
    expect(terbilangRupiah(1)).toBe('Satu Rupiah');
    expect(terbilangRupiah(10)).toBe('Sepuluh Rupiah');
    expect(terbilangRupiah(11)).toBe('Sebelas Rupiah');
    expect(terbilangRupiah(15)).toBe('Lima Belas Rupiah');
    expect(terbilangRupiah(20)).toBe('Dua Puluh Rupiah');
    expect(terbilangRupiah(99)).toBe('Sembilan Puluh Sembilan Rupiah');
    expect(terbilangRupiah(100)).toBe('Seratus Rupiah');
    expect(terbilangRupiah(105)).toBe('Seratus Lima Rupiah');
    expect(terbilangRupiah(110)).toBe('Seratus Sepuluh Rupiah');
    expect(terbilangRupiah(111)).toBe('Seratus Sebelas Rupiah');
    expect(terbilangRupiah(1000)).toBe('Seribu Rupiah');
    expect(terbilangRupiah(1500)).toBe('Seribu Lima Ratus Rupiah');
  });

  it('converts sample 1 from user prompt correctly', () => {
    // 883250
    expect(terbilangRupiah(883250)).toBe(
      'Delapan Ratus Delapan Puluh Tiga Ribu Dua Ratus Lima Puluh Rupiah'
    );
  });

  it('converts sample 2 from user prompt correctly', () => {
    // 1273891
    expect(terbilangRupiah(1273891)).toBe(
      'Satu Juta Dua Ratus Tujuh Puluh Tiga Ribu Delapan Ratus Sembilan Puluh Satu Rupiah'
    );
  });

  it('handles millions and billions correctly', () => {
    expect(terbilangRupiah(1000000)).toBe('Satu Juta Rupiah');
    expect(terbilangRupiah(2500000)).toBe('Dua Juta Lima Ratus Ribu Rupiah');
    expect(terbilangRupiah(1000000000)).toBe('Satu Miliar Rupiah');
  });
});

