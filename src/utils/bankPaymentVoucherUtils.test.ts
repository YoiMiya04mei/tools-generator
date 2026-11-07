import { describe, it, expect } from 'vitest';
import {
  getMonthRoman,
  getVoucherDateSuffix,
  generateVoucherNumber,
  formatCurrencyNumber,
  formatRupiahFull,
  calculateTotalAmount,
  generateBankPaymentVoucherWhatsAppText,
  generateBankPaymentVoucherFileName,
} from './bankPaymentVoucherUtils';
import type { BankPaymentVoucherItem } from '../types/bankPaymentVoucher';

describe('Bank Payment Voucher Utils', () => {
  it('converts months to Roman numerals correctly', () => {
    expect(getMonthRoman(1)).toBe('I');
    expect(getMonthRoman(6)).toBe('VI');
    expect(getMonthRoman(9)).toBe('IX');
    expect(getMonthRoman(11)).toBe('XI');
    expect(getMonthRoman(12)).toBe('XII');
  });

  it('generates voucher date suffix correctly', () => {
    expect(getVoucherDateSuffix('2026-09-17')).toBe('/IX/2026');
    expect(getVoucherDateSuffix('2026-06-04')).toBe('/VI/2026');
    expect(getVoucherDateSuffix('2026-11-04')).toBe('/XI/2026');
  });

  it('generates voucher number matching user sample format', () => {
    // When sequence is empty
    expect(generateVoucherNumber('VO-', '', '2026-09-17')).toBe('VO-           /IX/2026');
    expect(generateVoucherNumber('VO-', '', '2026-06-04')).toBe('VO-           /VI/2026');

    // When sequence is given
    expect(generateVoucherNumber('VO-', '001', '2026-09-17')).toBe('VO-001/IX/2026');
  });

  it('formats currency correctly', () => {
    expect(formatCurrencyNumber(883250)).toBe('883.250');
    expect(formatRupiahFull(883250)).toBe('Rp 883.250');
    expect(formatCurrencyNumber(1273891)).toBe('1.273.891');
  });

  it('calculates total amount from items correctly', () => {
    const items: BankPaymentVoucherItem[] = [
      { id: '1', description: 'Item 1', amount: 220000 },
      { id: '2', description: 'Item 2', amount: 32500 },
      { id: '3', description: 'Item 3', amount: 22500 },
      { id: '4', description: 'Item 4', amount: 30000 },
      { id: '5', description: 'Item 5', amount: 18500 },
      { id: '6', description: 'Item 6', amount: 220000 },
      { id: '7', description: 'Item 7', amount: 90000 },
      { id: '8', description: 'Item 8', amount: 249750 },
    ];
    expect(calculateTotalAmount(items)).toBe(883250);
  });

  it('generates WhatsApp text correctly', () => {
    const text = generateBankPaymentVoucherWhatsAppText({
      voucherNumber: 'VO-           /IX/2026',
      voucherDate: '2026-09-17',
      payTo: 'PERMADI PRATAMA',
      totalAmount: 883250,
      bankName: 'BCA',
      bankAccount: '0382576762',
      bankAccountName: 'PERMADI PRATAMA',
      preparedByName: 'Permadi Pratama',
      items: [{ id: '1', description: 'Travel', amount: 220000 }],
    });

    expect(text).toContain('*BANK PAYMENT VOUCHER*');
    expect(text).toContain('VO-           /IX/2026');
    expect(text).toContain('PERMADI PRATAMA');
    expect(text).toContain('Rp 883.250');
    expect(text).toContain('BCA');
  });

  it('generates valid file name', () => {
    const fileName = generateBankPaymentVoucherFileName({
      voucherNumber: 'VO-           /IX/2026',
      payTo: 'PERMADI PRATAMA',
    });
    expect(fileName).toBe('Bank-Payment-Voucher-VO-IX-2026-permadi-pratama.pdf');

    const excelFileName = generateBankPaymentVoucherFileName(
      {
        voucherNumber: 'VO-           /IX/2026',
        payTo: 'PERMADI PRATAMA',
      },
      'xlsx'
    );
    expect(excelFileName).toBe('Bank-Payment-Voucher-VO-IX-2026-permadi-pratama.xlsx');
  });
});

