import { describe, it, expect } from 'vitest';
import { extractFromPdf } from './pdfUtils';

describe('pdfUtils', () => {
  it('defines extractFromPdf function', () => {
    expect(typeof extractFromPdf).toBe('function');
  });
});
