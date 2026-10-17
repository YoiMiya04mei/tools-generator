import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import { generateRFOFileName } from '../utils/slugify';

export interface PDFExportOptions {
  elementId?: string;
  element?: HTMLElement;
  rfoDate: string;
  rootCause: string;
  onProgress?: (progress: number) => void;
}

export class PDFService {
  /**
   * Generates and downloads an A4 PDF document matching the on-screen preview.
   */
  static async exportToPDF(options: PDFExportOptions): Promise<string> {
    const { elementId, element: directElement, rfoDate, rootCause } = options;
    const element =
      directElement ||
      (typeof document !== 'undefined' && elementId
        ? document.getElementById(elementId)
        : null);

    if (!element) {
      throw new Error(`Elemen dokumen ${elementId ? `#${elementId}` : ''} tidak ditemukan.`);
    }

    const filename = generateRFOFileName(rfoDate, rootCause);

    // Save previous styles if needed
    const originalShadow = element.style.boxShadow;
    element.style.boxShadow = 'none';

    try {
      const canvas = await html2canvas(element, {
        scale: 2.5, // High resolution for crisp print
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1200, // Ensure desktop layout render
        onclone: (clonedDoc) => {
          const targetId = elementId || element.id;
          const clonedElement = targetId
            ? clonedDoc.getElementById(targetId)
            : clonedDoc.querySelector('.rfo-document-container');

          if (clonedElement) {
            const el = clonedElement as HTMLElement;
            el.style.boxShadow = 'none';
            el.style.width = '210mm';
            el.style.maxWidth = '210mm';

            // Reset any parent transforms if element is wrapped in a scaled container (e.g. preview zoom)
            let parent = el.parentElement;
            while (parent && parent !== clonedDoc.body) {
              parent.style.transform = 'none';
              parent = parent.parentElement;
            }
          }
        },
      });

      element.style.boxShadow = originalShadow;

      // Dimensions in mm for standard A4
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidth = 210;
      const pageHeight = 297;

      // Calculate scaled height matching the exact A4 width
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const contentHeight = (canvasHeight * pageWidth) / canvasWidth;

      const imgData = canvas.toDataURL('image/jpeg', 0.98);

      // Fit into 1 page with slight tolerance (4mm) for subpixel/padding rounding
      if (contentHeight <= pageHeight + 4) {
        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, Math.min(contentHeight, pageHeight));
      } else {
        // True multi-page document support
        let heightLeft = contentHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, contentHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position -= pageHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, contentHeight);
          heightLeft -= pageHeight;
        }
      }

      pdf.save(filename);
      return filename;
    } catch (error) {
      element.style.boxShadow = originalShadow;
      console.error('Gagal membuat PDF:', error);
      throw error;
    }
  }

  /**
   * Trigger native browser print dialog configured for A4
   */
  static printDocument(): void {
    window.print();
  }
}

