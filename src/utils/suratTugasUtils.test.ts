import { describe, it, expect } from 'vitest';
import {
  getRomanMonth,
  generateSuratTugasNumber,
  parseSuratTugasNumber,
  formatSuratTugasIntroDate,
  formatSuratTugasExecutionDate,
  generateSuratTugasFileName,
  resolveSuratTugasOpeningText,
} from './suratTugasUtils';

describe('suratTugasUtils', () => {
  it('converts month numbers to correct Roman numerals', () => {
    expect(getRomanMonth(1)).toBe('I');
    expect(getRomanMonth(5)).toBe('V');
    expect(getRomanMonth(9)).toBe('IX');
    expect(getRomanMonth(10)).toBe('X');
    expect(getRomanMonth(12)).toBe('XII');
  });

  it('generates Surat Tugas number according to specifications', () => {
    // Test with sample date: September 2026, sequence 120
    const num1 = generateSuratTugasNumber(120, '2026-09-23');
    expect(num1).toBe('ST/120/IX/2026/JDP');

    // Test with auto-incremented sequence: 121 in October 2026
    const num2 = generateSuratTugasNumber(121, '2026-10-19');
    expect(num2).toBe('ST/121/X/2026/JDP');
  });

  it('parses Surat Tugas number correctly', () => {
    const parsed = parseSuratTugasNumber('ST/120/IX/2026/JDP');
    expect(parsed).toEqual({
      sequenceNumber: 120,
      romanMonth: 'IX',
      year: 2026,
    });
  });

  it('formats execution date correctly', () => {
    const rangeSame = formatSuratTugasExecutionDate('2026-09-23', '2026-09-23');
    expect(rangeSame).toBe('23 September 2026 - 23 September 2026');

    const rangeDiff = formatSuratTugasExecutionDate('2026-09-23', '2026-09-25');
    expect(rangeDiff).toBe('23 September 2026 - 25 September 2026');
  });

  it('formats intro sentence date range correctly', () => {
    const intro = formatSuratTugasIntroDate('2026-09-23', '2026-09-23');
    expect(intro).toBe('pada hari Rabu, 23 September 2026 sd. 23 September 2026');
  });

  it('generates clean filename for PDF export', () => {
    const filename = generateSuratTugasFileName(
      'ST/121/X/2026/JDP',
      'Data Center Neucentrix Karet'
    );
    expect(filename).toBe('Surat_Tugas_ST-121-X-2026-JDP_Data-Center-Neucentrix-Karet.pdf');
  });

  it('resolves opening paragraph with custom text and tags', () => {
    const defaultResolved = resolveSuratTugasOpeningText(
      undefined,
      'pada hari Rabu, 23 September 2026 sd. 23 September 2026',
      'Data Center Neucentrix Karet'
    );
    expect(defaultResolved).toBe(
      'Bersama ini kami sampaikan bahwa pada hari Rabu, 23 September 2026 sd. 23 September 2026 akan dilakukan visit ke data center neucentrix karet . Adapun informasi terkait perihal tersebut adalah sebagai berikut :'
    );

    const customResolved = resolveSuratTugasOpeningText(
      'Sehubungan dengan penugasan teknis pada {tanggal}, tim akan melaksanakan instalasi di {lokasi}. Rincian tugas:',
      'pada hari Rabu, 23 September 2026',
      'PoP Sukabumi'
    );
    expect(customResolved).toBe(
      'Sehubungan dengan penugasan teknis pada pada hari Rabu, 23 September 2026, tim akan melaksanakan instalasi di pop sukabumi. Rincian tugas:'
    );
  });
});
