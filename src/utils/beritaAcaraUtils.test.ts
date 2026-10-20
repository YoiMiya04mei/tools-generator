import { describe, it, expect } from 'vitest';
import {
  generateBeritaAcaraNumber,
  parseBeritaAcaraNumber,
  formatBeritaAcaraIntroDate,
  formatBeritaAcaraExecutionDate,
  generateBeritaAcaraFileName,
  resolveBeritaAcaraOpeningText,
} from './beritaAcaraUtils';

describe('beritaAcaraUtils', () => {
  it('generates correct Berita Acara number according to user specification', () => {
    // 05 Oktober 2026 -> Month 10 is 'X'
    const num = generateBeritaAcaraNumber(121, '2026-10-05');
    expect(num).toBe('BA/121/X/2026/JDP');

    // Sequence 120
    const num120 = generateBeritaAcaraNumber(120, '2026-09-15');
    expect(num120).toBe('BA/120/IX/2026/JDP');

    // Next sequence 122
    const num122 = generateBeritaAcaraNumber(122, '2026-10-20');
    expect(num122).toBe('BA/122/X/2026/JDP');
  });

  it('parses valid Berita Acara number components', () => {
    const parsed = parseBeritaAcaraNumber('BA/121/X/2026/JDP');
    expect(parsed).toEqual({
      sequenceNumber: 121,
      romanMonth: 'X',
      year: 2026,
    });
  });

  it('formats single-day intro date range correctly', () => {
    // 2026-10-05 is Monday
    const intro = formatBeritaAcaraIntroDate('2026-10-05', '2026-10-05');
    expect(intro).toBe('pada hari Senin, 5 Oktober 2026 sd. 5 Oktober 2026');
  });

  it('formats multi-day intro date range correctly', () => {
    const intro = formatBeritaAcaraIntroDate('2026-10-05', '2026-10-07');
    expect(intro).toBe('pada hari Senin, 5 Oktober 2026 sd. Rabu, 7 Oktober 2026');
  });

  it('formats execution date range correctly', () => {
    const exec = formatBeritaAcaraExecutionDate('2026-10-05', '2026-10-05');
    expect(exec).toBe('5 Oktober 2026 - 5 Oktober 2026');
  });

  it('generates clean sanitized PDF file name', () => {
    const fileName = generateBeritaAcaraFileName(
      'BA/121/X/2026/JDP',
      'Device Instalation',
      'Data Center Neucentrix Karet'
    );
    expect(fileName).toBe('Berita_Acara_BA-121-X-2026-JDP_Device-Instalation_Data-Center-Neucentrix.pdf');
  });

  it('resolves opening paragraph with custom text and tags', () => {
    const defaultResolved = resolveBeritaAcaraOpeningText(
      undefined,
      'pada hari Senin, 5 Oktober 2026 sd. 5 Oktober 2026',
      'Data Center Neucentrix Karet',
      'Device Instalation'
    );
    expect(defaultResolved).toBe(
      'Bersama ini kami sampaikan bahwa pada hari Senin, 5 Oktober 2026 sd. 5 Oktober 2026 akan dilakukan visit ke data center neucentrix karet . Adapun informasi terkait perihal tersebut adalah sebagai berikut :'
    );

    const customResolved = resolveBeritaAcaraOpeningText(
      'Telah dilaksanakan pekerjaan {kepentingan} pada {tanggal} di {lokasi} dengan rincian data:',
      'pada hari Senin, 5 Oktober 2026',
      'Data Center Cyber 1',
      'Perbaikan Switch Core'
    );
    expect(customResolved).toBe(
      'Telah dilaksanakan pekerjaan Perbaikan Switch Core pada pada hari Senin, 5 Oktober 2026 di data center cyber 1 dengan rincian data:'
    );
  });
});
