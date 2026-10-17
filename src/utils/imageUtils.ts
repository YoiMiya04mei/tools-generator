/**
 * Utility to process uploaded image files (signatures, stamps, logos).
 * Converts file to a optimized base64 Data URL to fit cleanly in local storage.
 */
export function processImageFile(
  file: File,
  maxWidth: number = 600,
  maxHeight: number = 400
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('File tidak ditemukan.'));
      return;
    }

    if (!file.type.startsWith('image/')) {
      reject(new Error('Format file harus berupa gambar (PNG, JPG, WEBP, atau SVG).'));
      return;
    }

    // Limit raw upload size to 8MB
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error('Ukuran file terlalu besar. Maksimal 8MB.'));
      return;
    }

    // For SVG files, read directly as Data URL to keep crisp vector quality
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Gagal membaca file SVG.'));
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // If image is within bounds, return as is
        if (width <= maxWidth && height <= maxHeight && file.size <= 250 * 1024) {
          resolve(dataUrl);
          return;
        }

        // Scale proportionally if larger
        const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as PNG to preserve transparent background
        const compressed = canvas.toDataURL('image/png', 0.95);
        resolve(compressed);
      };

      img.onerror = () => reject(new Error('Gagal memproses gambar yang diunggah.'));
      img.src = dataUrl;
    };

    reader.onerror = () => reject(new Error('Gagal membaca file dari perangkat.'));
    reader.readAsDataURL(file);
  });
}
