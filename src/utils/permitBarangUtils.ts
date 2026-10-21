import type { PermitBarangDocument } from '../types/permitBarang';
import { formatIndonesianDateOnly, formatIndonesianLetterDate } from './dateFormatter';
import { getRomanMonth } from './suratTugasUtils';
import { slugifyRootCause } from './slugify';

/**
 * Formats a date into Indonesian standard date (e.g. "09 Desember 2025")
 */
export function formatPermitBarangDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  if (typeof dateInput === 'string' && /^\d{2}\s+[A-Za-z]+\s+\d{4}$/.test(dateInput.trim())) {
    return dateInput.trim();
  }
  return formatIndonesianDateOnly(dateInput);
}

/**
 * Formats top-right letter date header: "Sukabumi, 09 Desember 2025"
 */
export function formatPermitBarangHeaderDate(
  location: string = 'Sukabumi',
  dateInput?: string | Date | null
): string {
  return formatIndonesianLetterDate(location || 'Sukabumi', dateInput || new Date());
}

/**
 * Optional auto-generated official number: e.g. PM/101/XII/2025/JDP
 */
export function generatePermitBarangNumber(sequence: number, dateStr?: string | Date): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  const roman = getRomanMonth(d.getMonth() + 1);
  const year = d.getFullYear();
  return `PM/${sequence}/${roman}/${year}/JDP`;
}

/**
 * Formats WhatsApp text message
 */
export function generatePermitBarangWhatsAppText(
  doc: Partial<PermitBarangDocument>,
  companyName = 'PT JEMBATAN DATA PANGRANGO'
): string {
  const subject = doc.subject || 'Permit Keluar Barang';
  const recipient = doc.recipientTitle || 'Pihak Gedung / Security';
  const dateStr = formatPermitBarangDate(doc.permitDate || doc.createdDate || new Date());
  const timeStr = doc.permitTime || '09.00 s.d 15.00';
  const activity = doc.activity || 'Permit Keluar';
  const applicantName = doc.applicantName || '-';
  const applicantPos = doc.applicantPosition ? ` (${doc.applicantPosition})` : '';
  const applicantPhone = doc.applicantPhone || '-';
  const location = doc.location || '-';

  const deviceList =
    doc.devices && doc.devices.length > 0
      ? doc.devices
          .map((d, i) => {
            const extra = [d.quantity, d.serialNumber ? `SN: ${d.serialNumber}` : '']
              .filter(Boolean)
              .join(' - ');
            return `   ${i + 1}. ${d.name}${extra ? ` (${extra})` : ''}`;
          })
          .join('\n')
      : '   - (Belum ada perangkat terdaftar)';

  return `*PERMOHONAN ${subject.toUpperCase()}*
*${companyName}*

Kepada Yth.
*${recipient}*
${doc.recipientAddress ? `${doc.recipientAddress}\n` : ''}${doc.recipientCity || ''}

Dengan hormat,
Bersama ini kami mengajukan permohonan *${subject}* dengan rincian sebagai berikut:

👤 *Pemohon / PIC:*
• Nama: ${applicantName}${applicantPos}
• Kontak: ${applicantPhone}

📅 *Waktu Pelaksanaan:*
• Hari / Tanggal: ${dateStr}
• Pukul: ${timeStr}
• Aktivitas: ${activity}
• Lokasi: ${location}

📦 *Daftar Perangkat:*
${deviceList}

Demikian permohonan ini kami ajukan, kami berharap agar permohonan ini dapat segera diproses, saya siap memberikan informasi tambahan yang mungkin diperlukan terkait dengan permohonan ini.

Atas perhatian dan kerjasama yang diberikan, kami ucapkan terima kasih.

Hormat kami,
*${companyName}*
_${doc.signerName || 'Rio Prayoga'} (${doc.signerPosition || 'Direktur'})_`.trim();
}

/**
 * Formats plain text for clipboard
 */
export function generatePermitBarangPlainText(
  doc: Partial<PermitBarangDocument>,
  companyName = 'PT JEMBATAN DATA PANGRANGO'
): string {
  const headerDate = formatPermitBarangHeaderDate(
    doc.letterLocation || 'Sukabumi',
    doc.createdDate || new Date()
  );
  const subject = doc.subject || 'Permit Keluar Barang';
  const dateStr = formatPermitBarangDate(doc.permitDate || doc.createdDate || new Date());

  const deviceList =
    doc.devices && doc.devices.length > 0
      ? doc.devices
          .map((d, i) => {
            const extra = [d.quantity, d.serialNumber ? `SN: ${d.serialNumber}` : '']
              .filter(Boolean)
              .join(' - ');
            return `  ${i + 1}. ${d.name}${extra ? ` (${extra})` : ''}`;
          })
          .join('\n')
      : '  - (Perangkat belum diisi)';

  const isMasuk =
    doc.permitType === 'masuk' ||
    Boolean(doc.subject && doc.subject.toLowerCase().includes('masuk'));

  const actionText = isMasuk
    ? 'memasukkan'
    : doc.permitType === 'keluar'
    ? 'mengeluarkan'
    : 'mengeluarkan';

  const displayCompany = companyName.toLowerCase().includes('jembatan data pangrango')
    ? 'PT. Jembatan Data Pangrango'
    : companyName;

  return `${companyName}
${headerDate}

Perihal: ${subject}

Kepada Yth.
${doc.recipientTitle || 'Pihak Gedung / Security'}
${doc.recipientAddress || ''}
${doc.recipientCity || ''}

Dengan hormat,
Saya yang bertandatangan di bawah ini:
Nama          : ${doc.applicantName || '-'}
Jabatan       : ${doc.applicantPosition || '-'}
Nomor Telepon : ${doc.applicantPhone || '-'}

Sebagai perwakilan dari ${displayCompany}, dengan ini saya mengajukan permohonan ${subject} untuk melakukan beberapa keperluan.
Dengan ini kami sampaikan permohonan izin ${actionText} perangkat kami Dengan spesifikasi yang terlampir dibawah ini :

Waktu           : ${dateStr}
Pukul           : ${doc.permitTime || '09.00 s.d 15.00'}
Aktifitas       : ${doc.activity || subject}
Jenis Perangkat :
${deviceList}
Lokasi          : ${doc.location || '-'}

Demikian permohonan ini kami ajukan, kami berharap agar permohonan ini dapat segera diproses, saya siap memberikan informasi tambahan yang mungkin diperlukan terkait dengan permohonan ini.

Atas perhatian dan kerjasama yang diberikan, kami ucapkan terima kasih.

Hormat kami,
${doc.signerName || 'Rio Prayoga'}
${doc.signerPosition || 'Direktur'}`.trim();
}

/**
 * Generates clean download filename for PDF export
 */
export function generatePermitBarangFileName(
  subject: string,
  location?: string,
  dateStr?: string
): string {
  const cleanSubject = slugifyRootCause(subject || 'Permit-Barang', 30);
  const cleanLocation = location ? `_${slugifyRootCause(location, 25)}` : '';
  const d = dateStr ? new Date(dateStr) : new Date();
  const datePart = !isNaN(d.getTime())
    ? d.toISOString().slice(0, 10)
    : String(dateStr || '').slice(0, 10);

  return `${cleanSubject}${cleanLocation}_${datePart}.pdf`;
}

/**
 * Determines whether a Permit Barang document needs a second sheet (Page 2)
 * Default template content (4 devices, standard text) fits comfortably on 1 A4 sheet (~205mm / 297mm).
 * When additional content (devices > 5, long custom text, etc.) is entered,
 * it safely activates Page 2 (lembar baru) positioned cleanly below the Kop Surat.
 */
export function isPermitBarangMultiPage(doc?: Partial<PermitBarangDocument> | null): boolean {
  if (!doc) return false;
  const devices = doc.devices || [];
  const openingLen = doc.openingText?.trim().length || 0;
  const closingLen = doc.closingText?.trim().length || 0;
  const openingLineCount = doc.openingText ? doc.openingText.split('\n').filter(Boolean).length : 2;
  const closingLineCount = doc.closingText ? doc.closingText.split('\n').filter(Boolean).length : 2;

  const deviceLinesWeight = devices.reduce(
    (acc, d) => acc + (d.name && d.name.length > 40 ? 2 : 1),
    0
  );

  return (
    devices.length > 5 ||
    deviceLinesWeight > 5 ||
    openingLineCount > 3 ||
    closingLineCount > 3 ||
    openingLen + closingLen > 350
  );
}
