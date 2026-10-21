import { describe, it, expect } from 'vitest';
import {
  formatPermitBarangDate,
  formatPermitBarangHeaderDate,
  generatePermitBarangNumber,
  generatePermitBarangWhatsAppText,
  generatePermitBarangPlainText,
  generatePermitBarangFileName,
  isPermitBarangMultiPage,
} from './permitBarangUtils';
import type { PermitBarangDocument } from '../types/permitBarang';

describe('permitBarangUtils', () => {
  it('formats dates into standard Indonesian format correctly', () => {
    expect(formatPermitBarangDate('2025-12-09')).toContain('Desember');
    expect(formatPermitBarangDate('09 Desember 2025')).toBe('09 Desember 2025');
  });

  it('formats header date with location', () => {
    const res = formatPermitBarangHeaderDate('Sukabumi', '2025-12-09');
    expect(res).toContain('Sukabumi,');
    expect(res).toContain('Desember 2025');
  });

  it('generates permit number with sequence and roman month', () => {
    const num = generatePermitBarangNumber(101, '2025-12-09');
    expect(num).toBe('PM/101/XII/2025/JDP');
  });

  it('generates WhatsApp message with device lists', () => {
    const doc: Partial<PermitBarangDocument> = {
      subject: 'Permit Keluar Barang',
      recipientTitle: 'Pihak Gedung / Security Wisma Bumi Putera',
      applicantName: 'Rahmat & Hendrik',
      applicantPosition: 'PIC',
      applicantPhone: '085759535195',
      permitDate: '2025-12-09',
      permitTime: '09.00 s.d 15.00',
      activity: 'Permit Keluar',
      location: 'Gedung Wisma Bumi Putera Suite 701A',
      devices: [
        { id: '1', name: 'Routerboard 1100AHx4' },
        { id: '2', name: 'Switch RG-NB3200-24SFP/8GT4XS' },
      ],
      signerName: 'Rio Prayoga',
      signerPosition: 'Direktur',
    };

    const wa = generatePermitBarangWhatsAppText(doc);
    expect(wa).toContain('PERMOHONAN PERMIT KELUAR BARANG');
    expect(wa).toContain('Rahmat & Hendrik');
    expect(wa).toContain('Routerboard 1100AHx4');
    expect(wa).toContain('Switch RG-NB3200-24SFP/8GT4XS');
    expect(wa).toContain('Rio Prayoga');
    expect(wa).toContain('saya siap memberikan informasi tambahan yang mungkin diperlukan');
    expect(wa).toContain('Atas perhatian dan kerjasama yang diberikan, kami ucapkan terima kasih.');
  });

  it('generates plain text accurately', () => {
    const doc: Partial<PermitBarangDocument> = {
      subject: 'Permit Masuk Barang',
      applicantName: 'Hendrik',
      applicantPosition: 'Staff NOC',
      devices: [{ id: '1', name: 'Server Dell' }],
    };
    const text = generatePermitBarangPlainText(doc);
    expect(text).toContain('Perihal: Permit Masuk Barang');
    expect(text).toContain('Server Dell');
    expect(text).toContain('Sebagai perwakilan dari PT. Jembatan Data Pangrango, dengan ini saya mengajukan permohonan Permit Masuk Barang untuk melakukan beberapa keperluan.');
    expect(text).toContain('Dengan ini kami sampaikan permohonan izin memasukkan perangkat kami Dengan spesifikasi yang terlampir dibawah ini :');
    expect(text).toContain('Demikian permohonan ini kami ajukan, kami berharap agar permohonan ini dapat segera diproses, saya siap memberikan informasi tambahan yang mungkin diperlukan terkait dengan permohonan ini.');
    expect(text).toContain('Atas perhatian dan kerjasama yang diberikan, kami ucapkan terima kasih.');
  });

  it('generates clean sanitized filenames', () => {
    const filename = generatePermitBarangFileName(
      'Permit Keluar Barang',
      'Wisma Bumi Putera Suite 701A',
      '2025-12-09'
    );
    expect(filename.toLowerCase()).toContain('permit-keluar-barang');
    expect(filename).toContain('2025-12-09');
    expect(filename.endsWith('.pdf')).toBe(true);
  });

  it('accurately identifies whether a document fits on 1 A4 page or needs 2 pages', () => {
    // Default template with 4 devices -> single page (fits comfortably in 1 sheet A4)
    const defaultDoc: Partial<PermitBarangDocument> = {
      subject: 'Permit Keluar Barang',
      devices: [
        { id: '1', name: 'Routerboard 1100AHx4' },
        { id: '2', name: 'Switch RG-NB3200-24SFP/8GT4XS' },
        { id: '3', name: 'Server Dell' },
        { id: '4', name: 'PC Rakitan' },
      ],
    };
    expect(isPermitBarangMultiPage(defaultDoc)).toBe(false);

    // Up to 10 short devices -> still single page
    const tenDevicesDoc: Partial<PermitBarangDocument> = {
      ...defaultDoc,
      devices: Array.from({ length: 10 }, (_, i) => ({
        id: String(i + 1),
        name: `Perangkat ${i + 1}`,
      })),
    };
    expect(isPermitBarangMultiPage(tenDevicesDoc)).toBe(false);

    // 11 or more devices -> cleanly triggers page 2 (lembar baru)
    const elevenDevicesDoc: Partial<PermitBarangDocument> = {
      ...defaultDoc,
      devices: Array.from({ length: 11 }, (_, i) => ({
        id: String(i + 1),
        name: `Perangkat ${i + 1}`,
      })),
    };
    expect(isPermitBarangMultiPage(elevenDevicesDoc)).toBe(true);

    // Document with long custom paragraphs -> triggers page 2
    const longTextDoc: Partial<PermitBarangDocument> = {
      ...defaultDoc,
      openingText: Array(10).fill('Baris permohonan tambahan').join('\n'),
    };
    expect(isPermitBarangMultiPage(longTextDoc)).toBe(true);
  });
});

