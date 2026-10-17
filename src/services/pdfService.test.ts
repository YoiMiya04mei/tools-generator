import { describe, it, expect } from 'vitest';
import { PDFService } from './pdfService';
import { generateRFOFileName, slugifyRootCause } from '../utils/slugify';

describe('PDFService & Slugify', () => {
  it('harus menghasilkan nama file PDF RFO yang sesuai format standar', () => {
    const filename = generateRFOFileName('2026-10-16', 'Kabel FO Putus Jalur Cibadak');
    expect(filename).toBe('RFO_2026-10-16_Kabel-FO-Putus-Jalur-Cibadak.pdf');
  });

  it('harus menangani root cause kosong dengan fallback yang aman', () => {
    const slug = slugifyRootCause('');
    expect(slug).toBe('General-Outage');
  });

  it('harus melempar error jika elemen target tidak ditemukan', async () => {
    await expect(
      PDFService.exportToPDF({
        elementId: 'elemen-yang-tidak-ada',
        rfoDate: '2026-10-16',
        rootCause: 'Testing',
      })
    ).rejects.toThrow('tidak ditemukan');
  });
});
