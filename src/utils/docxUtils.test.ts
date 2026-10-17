import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { extractFromDocx } from './docxUtils';

describe('docxUtils', () => {
  it('extracts embedded images and company info from a docx file archive', async () => {
    const zip = new JSZip();

    // 1. Add a sample image in word/media/
    // 1x1 transparent png base64
    const samplePngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    zip.file('word/media/image1.png', samplePngBase64, { base64: true });

    // 2. Add header xml with company info
    const headerXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:p>
          <w:r><w:t>PT JEMBATAN DATA PANGRANGO</w:t></w:r>
        </w:p>
        <w:p>
          <w:r><w:t>Jl. Pabuaran No.51, Nyomplong, Sukabumi 43131</w:t></w:r>
        </w:p>
        <w:p>
          <w:r><w:t>Telp : +62 895-3182-5259</w:t></w:r>
        </w:p>
        <w:p>
          <w:r><w:t>Email : customerservice@jembatandata.com</w:t></w:r>
        </w:p>
        <w:p>
          <w:r><w:t>Web : Sukabuminetwork.net</w:t></w:r>
        </w:p>
      </w:hdr>`;
    zip.file('word/header1.xml', headerXml);

    const docxBlob = await zip.generateAsync({ type: 'blob' });
    const file = new File([docxBlob], 'template_kop_surat.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    const result = await extractFromDocx(file);

    expect(result.images.length).toBe(1);
    expect(result.headerImageUrl).toBeDefined();
    expect(result.headerImageUrl).toContain('data:image/png;base64');
    expect(result.extractedInfo?.companyName).toContain('PT JEMBATAN DATA PANGRANGO');
    expect(result.extractedInfo?.companyPhone).toBe('+62 895-3182-5259');
    expect(result.extractedInfo?.companyEmail).toBe('customerservice@jembatandata.com');
    expect(result.extractedInfo?.companyWebsite).toBe('Sukabuminetwork.net');
  });

  it('handles docx files without images gracefully', async () => {
    const zip = new JSZip();
    zip.file('word/document.xml', '<w:document><w:p><w:r><w:t>Surat Resmi</w:t></w:r></w:p></w:document>');

    const docxBlob = await zip.generateAsync({ type: 'blob' });
    const file = new File([docxBlob], 'empty.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    const result = await extractFromDocx(file);
    expect(result.images.length).toBe(0);
    expect(result.headerImageUrl).toBeUndefined();
    expect(result.extractedText).toBe('Surat Resmi');
  });
});
