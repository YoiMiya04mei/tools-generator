import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { generateBankPaymentVoucherExcelBlob } from './bankPaymentVoucherExcelService';
import type { BankPaymentVoucherDocument } from '../types/bankPaymentVoucher';

describe('BankPaymentVoucherExcelService', () => {
  it('generates a valid Excel blob based on the template', async () => {
    const doc: Partial<BankPaymentVoucherDocument> = {
      payTo: 'PERMADI PRATAMA',
      voucherDate: '2026-09-17',
      voucherNumber: 'VO-           /IX/2026',
      totalAmount: 883250,
      inWord: 'Delapan Ratus Delapan Puluh Tiga Ribu Dua Ratus Lima Puluh Rupiah',
      items: [
        { id: '1', description: 'Reimburse Pembayaran Travel SKBM<>JKT 2 orang', amount: 220000 },
        { id: '2', description: 'Reimburse Pembayaran gocar Shuttle <> Gedung Cyber', amount: 32500 },
      ],
      bankName: 'BCA',
      bankAccount: '0382576762',
      bankAccountName: 'PERMADI PRATAMA',
      preparedByName: 'Permadi Pratama',
      processedName: 'Elsya',
      recordedByName: 'Sarah',
      approvedByName: 'Manager',
      acknowledgedByName: 'Nandar Munandar',
    };

    const blob = await generateBankPaymentVoucherExcelBlob(doc);
    expect(blob).toBeDefined();
    expect(blob.size).toBeGreaterThan(10000);
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // Verify OpenXML inner content
    const arrayBuffer = await blob.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const s1Xml = await zip.file('xl/worksheets/sheet1.xml')?.async('text') || '';

    // Check cells
    expect(s1Xml).toContain('PERMADI PRATAMA');
    expect(s1Xml).toContain('VO-           /IX/2026');
    expect(s1Xml).toContain('883250');
    expect(s1Xml).toContain('Delapan Ratus Delapan Puluh Tiga Ribu Dua Ratus Lima Puluh Rupiah');
    expect(s1Xml).toContain('Reimburse Pembayaran Travel SKBM&lt;&gt;JKT 2 orang');
    expect(s1Xml).toContain(': BCA');
    expect(s1Xml).toContain(': 0382576762');
    expect(s1Xml).toContain('Nandar Munandar');
  });

  it('adjusts row count dynamically for 1 item without empty rows below it', async () => {
    const doc: Partial<BankPaymentVoucherDocument> = {
      payTo: 'PERMADI PRATAMA',
      totalAmount: 219845,
      items: [
        { id: '1', description: 'Reimburse Pembayaran Travel SKBM<>JKT 2 orang', amount: 219845 },
      ],
      bankName: 'BCA',
    };

    const blob = await generateBankPaymentVoucherExcelBlob(doc);
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const s1Xml = await zip.file('xl/worksheets/sheet1.xml')?.async('text') || '';

    // Only 1 item row (row 11), Total row should be shifted up to row 12
    expect(s1Xml).toContain('<row r="11"');
    expect(s1Xml).toContain('<row r="12"');
    expect(s1Xml).toContain('219845');
    // Rows 13, 14, etc. exist as Total / Bank / Signatures, but unused item rows were removed
    // Row count total should be 25 rows (1 to 25)
    const rows = s1Xml.match(/<row\s+r="(\d+)"/g) || [];
    const rowNums = rows.map((r) => parseInt(r.match(/\d+/)![0]));
    expect(rowNums).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));
  });

  it('adjusts row count dynamically for 4 items without empty rows below it', async () => {
    const doc: Partial<BankPaymentVoucherDocument> = {
      payTo: 'PERMADI PRATAMA',
      totalAmount: 304845,
      items: [
        { id: '1', description: 'Travel SKBM<>JKT 2 orang', amount: 219845 },
        { id: '2', description: 'Gocar Shuttle <> Cyber', amount: 32500 },
        { id: '3', description: 'Gocar Cyber <> NeuCentrix', amount: 22500 },
        { id: '4', description: 'Gocar NeuCentrix <> Cyber', amount: 30000 },
      ],
      bankName: 'BCA',
    };

    const blob = await generateBankPaymentVoucherExcelBlob(doc);
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const s1Xml = await zip.file('xl/worksheets/sheet1.xml')?.async('text') || '';

    // Total row should be row 15 (11 + 4 = 15)
    const rows = s1Xml.match(/<row\s+r="(\d+)"/g) || [];
    const rowNums = rows.map((r) => parseInt(r.match(/\d+/)![0]));
    expect(rowNums).toEqual(Array.from({ length: 28 }, (_, i) => i + 1));
    expect(s1Xml).toContain('304845');
  });

  it('handles dynamic expansion when items count exceeds 8', async () => {
    const items = Array.from({ length: 12 }, (_, i) => ({
      id: `item-${i + 1}`,
      description: `Item transaksi ke-${i + 1}`,
      amount: 100000 * (i + 1),
    }));

    const doc: Partial<BankPaymentVoucherDocument> = {
      payTo: 'PERMADI PRATAMA',
      voucherDate: '2026-06-04',
      voucherNumber: 'VO-           /VI/2026',
      totalAmount: 7800000,
      inWord: 'Tujuh Juta Delapan Ratus Ribu Rupiah',
      items,
      bankName: 'BCA',
      bankAccount: '0382576762',
      bankAccountName: 'PERMADI PRATAMA',
    };

    const blob = await generateBankPaymentVoucherExcelBlob(doc);
    expect(blob).toBeDefined();

    const arrayBuffer = await blob.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const s1Xml = await zip.file('xl/worksheets/sheet1.xml')?.async('text') || '';

    // Check that row 22 is present for 12 items (11 + 12 - 1 = row 22)
    expect(s1Xml).toContain('<row r="22"');
    expect(s1Xml).toContain('Item transaksi ke-12');
  });
});

