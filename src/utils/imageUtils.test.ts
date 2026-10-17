import { describe, it, expect } from 'vitest';
import { processImageFile } from './imageUtils';

describe('imageUtils', () => {
  it('harus menolak file jika bukan bertipe gambar', async () => {
    const fakeFile = new File(['dummy content'], 'document.txt', { type: 'text/plain' });
    await expect(processImageFile(fakeFile)).rejects.toThrow('Format file harus berupa gambar');
  });

  it('harus menolak file jika ukurannya melebihi batas 8MB', async () => {
    const hugeBlob = new Blob([new Uint8Array(9 * 1024 * 1024)], { type: 'image/png' });
    const hugeFile = new File([hugeBlob], 'huge.png', { type: 'image/png' });
    await expect(processImageFile(hugeFile)).rejects.toThrow('terlalu besar');
  });
});
