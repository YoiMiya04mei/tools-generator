import React, { useState, useRef } from 'react';
import {
  Save,
  RotateCcw,
  Sliders,
  Building,
  UserCheck,
  FileText,
  Upload,
  Trash2,
  Stamp,
  PenTool,
  CheckCircle2,
  Eye,
  Sparkles,
  Lock,
  ShieldAlert,
} from 'lucide-react';
import type { RFOTemplate } from '../types/rfo';
import type { UserAccount } from '../types/auth';
import { storageService } from '../services/storageService';
import { RFOPaperDocument } from '../components/RFOPaperDocument';
import { SignatureBlock } from '../components/SignatureBlock';
import { processImageFile } from '../utils/imageUtils';
import { extractFromDocx } from '../utils/docxUtils';
import { extractFromPdf } from '../utils/pdfUtils';
import type { ToastMessage } from '../components/Toast';

interface TemplatePageProps {
  template: RFOTemplate;
  onUpdateTemplate: (template: RFOTemplate) => void;
  addToast: (type: ToastMessage['type'], title: string, message?: string) => void;
  currentUser?: UserAccount | null;
}

export const TemplatePage: React.FC<TemplatePageProps> = ({
  template,
  onUpdateTemplate,
  addToast,
  currentUser,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const [formData, setFormData] = useState<RFOTemplate>({ ...template });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploadingSig, setIsUploadingSig] = useState<boolean>(false);
  const [isUploadingStamp, setIsUploadingStamp] = useState<boolean>(false);
  const [isUploadingHeader, setIsUploadingHeader] = useState<boolean>(false);
  const [isDraggingSig, setIsDraggingSig] = useState<boolean>(false);
  const [isDraggingStamp, setIsDraggingStamp] = useState<boolean>(false);
  const [isDraggingHeader, setIsDraggingHeader] = useState<boolean>(false);

  const signatureInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);

  // Sample data for preview
  const sampleRFO = {
    rfoDate: '2026-10-12',
    startTime: '2026-10-11T18:15',
    endTime: '2026-10-11T22:05',
    totalDuration: '3 Jam 50 Menit',
    rootCause:
      'Lonjakan traffic sesaat (microburst) pada interface uplink MPLS di sisi NEX DC yang menyebabkan packet drop.',
    actionTaken: 'Penggantian interface dan reconfigure service.',
    disruptionDescription: formData.defaultDescription,
  };

  const handleSave = async () => {
    if (!isAdmin) {
      addToast('error', 'Akses Ditolak', 'Hanya akun Super Admin yang diizinkan mengubah dan menyimpan template.');
      return;
    }

    setIsSaving(true);
    try {
      const saved = await storageService.saveTemplate(formData);
      onUpdateTemplate(saved);
      addToast(
        'success',
        'Template Disimpan',
        'Kop surat dan pengaturan dokumen RFO berhasil diperbarui.'
      );
    } catch (e) {
      addToast('error', 'Gagal', 'Terjadi kesalahan saat menyimpan template.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!isAdmin) {
      addToast('error', 'Akses Ditolak', 'Hanya akun Super Admin yang diizinkan mereset template.');
      return;
    }

    if (
      window.confirm(
        'Apakah Anda yakin ingin mengembalikan template ke konfigurasi standar PT Jembatan Data Pangrango?'
      )
    ) {
      const reset = await storageService.resetTemplate();
      setFormData(reset);
      onUpdateTemplate(reset);
      addToast(
        'info',
        'Template Direset',
        'Konfigurasi template telah dikembalikan ke standar awal.'
      );
    }
  };

  const handleSignatureUpload = async (file: File) => {
    if (!isAdmin) {
      addToast('error', 'Akses Ditolak', 'Hanya akun Super Admin yang diizinkan mengunggah tanda tangan.');
      return;
    }

    setIsUploadingSig(true);
    try {
      const dataUrl = await processImageFile(file, 600, 300);
      setFormData((prev) => ({ ...prev, signatureImageUrl: dataUrl }));
      addToast(
        'success',
        'Tanda Tangan Diunggah',
        'Tanda tangan baru berhasil diterapkan ke pratinjau template.'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Format gambar tidak didukung.';
      addToast('error', 'Gagal Mengunggah TTD', msg);
    } finally {
      setIsUploadingSig(false);
    }
  };

  const handleStampUpload = async (file: File) => {
    if (!isAdmin) {
      addToast('error', 'Akses Ditolak', 'Hanya akun Super Admin yang diizinkan mengunggah cap stempel.');
      return;
    }

    setIsUploadingStamp(true);
    try {
      const dataUrl = await processImageFile(file, 500, 300);
      setFormData((prev) => ({ ...prev, stampImageUrl: dataUrl }));
      addToast(
        'success',
        'Cap Perusahaan Diunggah',
        'Cap stempel perusahaan berhasil diterapkan ke pratinjau template.'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Format gambar tidak didukung.';
      addToast('error', 'Gagal Mengunggah Cap', msg);
    } finally {
      setIsUploadingStamp(false);
    }
  };

  const handleRemoveSignature = () => {
    if (!isAdmin) {
      addToast('error', 'Akses Ditolak', 'Hanya akun Super Admin yang diizinkan mereset tanda tangan.');
      return;
    }

    setFormData((prev) => ({ ...prev, signatureImageUrl: '' }));
    addToast(
      'info',
      'TTD Direset',
      'Tanda tangan dikembalikan ke format vektor standar.'
    );
  };

  const handleRemoveStamp = () => {
    if (!isAdmin) {
      addToast('error', 'Akses Ditolak', 'Hanya akun Super Admin yang diizinkan mereset cap stempel.');
      return;
    }

    setFormData((prev) => ({ ...prev, stampImageUrl: '' }));
    addToast(
      'info',
      'Cap Direset',
      'Cap stempel dikembalikan ke format cap biru PT JDP standar.'
    );
  };

  const handleHeaderImageUpload = async (file: File) => {
    if (!isAdmin) {
      addToast('error', 'Akses Ditolak', 'Hanya akun Super Admin yang diizinkan mengunggah kop surat.');
      return;
    }

    setIsUploadingHeader(true);
    try {
      const isPdf =
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isDocx =
        file.name.toLowerCase().endsWith('.docx') ||
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      if (isPdf) {
        const result = await extractFromPdf(file);
        setFormData((prev) => ({
          ...prev,
          letterheadBackgroundUrl: result.backgroundUrl,
          headerImageUrl: result.headerImageUrl || '',
          footerImageUrl: result.footerImageUrl || '',
          ...(result.extractedInfo?.companyName ? { companyName: result.extractedInfo.companyName } : {}),
          ...(result.extractedInfo?.companyAddress ? { companyAddress: result.extractedInfo.companyAddress } : {}),
          ...(result.extractedInfo?.companyPhone ? { companyPhone: result.extractedInfo.companyPhone } : {}),
          ...(result.extractedInfo?.companyEmail ? { companyEmail: result.extractedInfo.companyEmail } : {}),
          ...(result.extractedInfo?.companyWebsite ? { companyWebsite: result.extractedInfo.companyWebsite } : {}),
        }));
        addToast(
          'success',
          'Kop Surat PDF Diterapkan',
          'Kop surat bagian atas, watermark, dan bagian bawah berhasil dimuat dari dokumen PDF.'
        );
        return;
      }

      if (isDocx) {
        const result = await extractFromDocx(file);

        if (result.headerImageUrl) {
          setFormData((prev) => ({
            ...prev,
            headerImageUrl: result.headerImageUrl,
            letterheadBackgroundUrl: '',
            ...(result.extractedInfo?.companyName ? { companyName: result.extractedInfo.companyName } : {}),
            ...(result.extractedInfo?.companyAddress ? { companyAddress: result.extractedInfo.companyAddress } : {}),
            ...(result.extractedInfo?.companyPhone ? { companyPhone: result.extractedInfo.companyPhone } : {}),
            ...(result.extractedInfo?.companyEmail ? { companyEmail: result.extractedInfo.companyEmail } : {}),
            ...(result.extractedInfo?.companyWebsite ? { companyWebsite: result.extractedInfo.companyWebsite } : {}),
          }));
          addToast(
            'success',
            'Kop Surat Word Diterapkan',
            'Banner kop surat dan data perusahaan berhasil dimuat dari dokumen Word.'
          );
        } else if (result.extractedInfo && Object.keys(result.extractedInfo).length > 0) {
          setFormData((prev) => ({
            ...prev,
            ...(result.extractedInfo?.companyName ? { companyName: result.extractedInfo.companyName } : {}),
            ...(result.extractedInfo?.companyAddress ? { companyAddress: result.extractedInfo.companyAddress } : {}),
            ...(result.extractedInfo?.companyPhone ? { companyPhone: result.extractedInfo.companyPhone } : {}),
            ...(result.extractedInfo?.companyEmail ? { companyEmail: result.extractedInfo.companyEmail } : {}),
            ...(result.extractedInfo?.companyWebsite ? { companyWebsite: result.extractedInfo.companyWebsite } : {}),
          }));
          addToast(
            'info',
            'Data Kontak Word Diterapkan',
            'Identitas perusahaan dan kontak berhasil dimuat dari dokumen Word.'
          );
        } else {
          throw new Error('Tidak ditemukan gambar banner atau teks kop surat pada file Word ini.');
        }
        return;
      }

      // Standard image processing (PNG, JPG, SVG, WebP)
      const dataUrl = await processImageFile(file, 1600, 2200);

      // Check aspect ratio to determine full page vs banner
      const img = new Image();
      img.src = dataUrl;
      await new Promise((res) => { img.onload = res; img.onerror = res; });

      if (img.height > img.width * 1.15) {
        setFormData((prev) => ({
          ...prev,
          letterheadBackgroundUrl: dataUrl,
          headerImageUrl: '',
          footerImageUrl: '',
        }));
        addToast(
          'success',
          'Kop Surat Lembar Penuh Diterapkan',
          'Kop surat bagian atas dan bawah berhasil diperbarui dari gambar A4.'
        );
      } else {
        setFormData((prev) => ({
          ...prev,
          headerImageUrl: dataUrl,
          letterheadBackgroundUrl: '',
        }));
        addToast(
          'success',
          'Banner Kop Surat Diterapkan',
          'Banner kop surat bagian atas berhasil diterapkan.'
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Format file tidak didukung.';
      addToast('error', 'Gagal Memproses Kop Surat', msg);
    } finally {
      setIsUploadingHeader(false);
    }
  };

  const handleRemoveHeaderImage = () => {
    if (!isAdmin) {
      addToast('error', 'Akses Ditolak', 'Hanya akun Super Admin yang diizinkan mereset kop surat.');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      headerImageUrl: '',
      footerImageUrl: '',
      letterheadBackgroundUrl: '',
    }));
    addToast(
      'info',
      'Kop Surat Direset',
      'Kop surat dikembalikan ke format standar JDP.'
    );
  };

  return (
    <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            Manajemen Template RFO Perusahaan
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Konfigurasi identitas perusahaan, alamat kantor, penandatangan, dan redaksi surat resmi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            disabled={!isAdmin}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
              !isAdmin
                ? 'bg-slate-900 text-slate-600 opacity-40 cursor-not-allowed'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer'
            }`}
            title={!isAdmin ? 'Hanya Super Admin yang berhak mereset template' : 'Reset ke standar'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>

          <button
            onClick={handleSave}
            disabled={!isAdmin || isSaving}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              !isAdmin
                ? 'bg-slate-800 text-slate-500 opacity-40 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-950 cursor-pointer'
            }`}
            title={!isAdmin ? 'Hanya Super Admin yang berhak menyimpan perubahan template' : 'Simpan template'}
          >
            {isAdmin ? <Save className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </div>

      {/* Non-Admin Warning Banner */}
      {!isAdmin && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3 text-amber-200 shadow-md">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <h4 className="font-bold text-white text-sm">Mode Hanya-Lihat (Read-Only)</h4>
            <p className="text-xs text-amber-200/90 mt-0.5">
              Anda masuk sebagai <strong>{currentUser?.name || 'Staf'}</strong> ({currentUser?.role}). Pengelolaan format Kop Surat, tanda tangan pejabat, dan template RFO resmi hanya dapat diubah dan disimpan oleh <strong>Super Admin</strong>.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Settings (6 cols) */}
        <fieldset disabled={!isAdmin} className="xl:col-span-6 space-y-5 border-none p-0 m-0">
          {/* Company Letterhead */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Building className="w-4 h-4 text-cyan-400" />
              Kop Surat Resmi Perusahaan
            </h3>

            {/* Upload Kop Surat Resmi (Support PDF, Word, Image) */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  Kop Surat Resmi (Support File PDF & Word)
                </span>
                {formData.letterheadBackgroundUrl || formData.headerImageUrl ? (
                  <span className="text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Kop Surat Aktif (Atas & Bawah)
                  </span>
                ) : (
                  <span className="text-[10px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Format Standar JDP
                  </span>
                )}
              </div>

              {formData.letterheadBackgroundUrl || formData.headerImageUrl ? (
                <div className="bg-white rounded-lg p-2.5 flex items-center justify-center border border-slate-700 shadow-inner overflow-hidden max-h-36">
                  <img
                    src={formData.letterheadBackgroundUrl || formData.headerImageUrl}
                    alt="Preview Kop Surat"
                    className="max-h-32 w-auto object-contain"
                  />
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingHeader(true);
                  }}
                  onDragLeave={() => setIsDraggingHeader(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingHeader(false);
                    if (e.dataTransfer.files?.[0]) {
                      handleHeaderImageUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => headerInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg h-28 flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all ${
                    isDraggingHeader
                      ? 'border-cyan-400 bg-cyan-950/20 text-cyan-300'
                      : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50 text-slate-400'
                  }`}
                >
                  <Upload className="w-6 h-6 mb-1 text-cyan-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    {isUploadingHeader ? 'Mengekstrak kop surat...' : 'Upload Kop Surat (PDF atau Word .docx)'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Mendukung dokumen PDF (.pdf), Microsoft Word (.docx), atau gambar (PNG/JPG)
                  </span>
                  <span className="text-[9px] text-cyan-400/90 mt-1 font-medium">
                    Otomatis memperbarui kop surat bagian atas, watermark, dan bagian bawah
                  </span>
                </div>
              )}

              <input
                ref={headerInputRef}
                type="file"
                accept=".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleHeaderImageUpload(e.target.files[0]);
                  }
                }}
              />

              <div className="flex items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => headerInputRef.current?.click()}
                  disabled={isUploadingHeader}
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    {formData.letterheadBackgroundUrl || formData.headerImageUrl
                      ? 'Ganti File Kop Surat'
                      : 'Pilih File Kop (PDF / Word / Gambar)'}
                  </span>
                </button>
                {(formData.letterheadBackgroundUrl || formData.headerImageUrl) && (
                  <button
                    type="button"
                    onClick={handleRemoveHeaderImage}
                    className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    title="Hapus dan gunakan kop surat teks standar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                )}
              </div>
            </div>

            {/* Setting Jarak Garis Kop Surat ke Tanggal/Teks */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  Jarak Garis Kop ke Tanggal & Kalimat Surat
                </span>
                <span className="text-[11px] font-mono text-cyan-300 font-bold bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
                  {formData.headerSpacerHeight ?? 4} mm
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Atur posisi agar tanggal dan kalimat surat berada pas di bawah garis kop surat:
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      headerSpacerHeight: Math.max(0, (prev.headerSpacerHeight ?? 4) - 2),
                    }))
                  }
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  title="Naikkan tanggal lebih dekat ke garis"
                >
                  <span>⬆ Lebih Naik (Rapat)</span>
                </button>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={formData.headerSpacerHeight ?? 4}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      headerSpacerHeight: Number(e.target.value),
                    }))
                  }
                  className="flex-1 accent-cyan-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      headerSpacerHeight: Math.min(30, (prev.headerSpacerHeight ?? 4) + 2),
                    }))
                  }
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  title="Turunkan tanggal lebih jauh dari garis"
                >
                  <span>⬇ Lebih Turun</span>
                </button>
              </div>
            </div>
          </div>

          {/* Letter Salutation and Text */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <FileText className="w-4 h-4 text-cyan-400" />
              Redaksi & Kalimat Resmi
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Kota Asal Surat
              </label>
              <input
                type="text"
                value={formData.letterLocation}
                onChange={(e) =>
                  setFormData({ ...formData, letterLocation: e.target.value })
                }
                placeholder="Sukabumi"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Format tampilan pada surat: <strong className="text-cyan-400 font-normal">{formData.letterLocation || 'Sukabumi'}, [Tanggal Surat]</strong>
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Salam Pembuka (Salutation)
              </label>
              <input
                type="text"
                value={formData.salutation}
                onChange={(e) =>
                  setFormData({ ...formData, salutation: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Kalimat Pembuka
              </label>
              <textarea
                rows={2}
                value={formData.openingGreeting}
                onChange={(e) =>
                  setFormData({ ...formData, openingGreeting: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Default Deskripsi Pemulihan Layanan
              </label>
              <textarea
                rows={2}
                value={formData.defaultDescription}
                onChange={(e) =>
                  setFormData({ ...formData, defaultDescription: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Kalimat Penutup & Kontak
              </label>
              <textarea
                rows={2}
                value={formData.closingContact}
                onChange={(e) =>
                  setFormData({ ...formData, closingContact: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Ucapan Penutup Akhir
              </label>
              <textarea
                rows={2}
                value={formData.closingRemarks}
                onChange={(e) =>
                  setFormData({ ...formData, closingRemarks: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Signer Details */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              Penandatangan Dokumen Resmi
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nama Penandatangan
                </label>
                <input
                  type="text"
                  value={formData.signerName}
                  onChange={(e) =>
                    setFormData({ ...formData, signerName: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Jabatan / Posisi
                </label>
                <input
                  type="text"
                  value={formData.signerPosition}
                  onChange={(e) =>
                    setFormData({ ...formData, signerPosition: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Signature & Stamp Upload Section */}
            <div className="border-t border-slate-800 pt-4 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <PenTool className="w-3.5 h-3.5 text-cyan-400" />
                  Upload Tanda Tangan & Cap Perusahaan
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Unggah file tanda tangan dan cap stempel resmi perusahaan. Susunan akan otomatis digabungkan secara proporsional seperti pada dokumen fisik resmi.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Upload Tanda Tangan */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5 text-blue-400" />
                      Tanda Tangan (Signature)
                    </span>
                    {formData.signatureImageUrl ? (
                      <span className="text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Kustom
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                        Standar
                      </span>
                    )}
                  </div>

                  {/* Preview / Drop area */}
                  {formData.signatureImageUrl ? (
                    <div className="bg-white rounded-lg p-2 flex items-center justify-center h-24 border border-slate-700 shadow-inner overflow-hidden">
                      <img
                        src={formData.signatureImageUrl}
                        alt="Preview TTD"
                        className="max-h-full max-w-full object-contain"
                        style={{ mixBlendMode: 'multiply' }}
                      />
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingSig(true);
                      }}
                      onDragLeave={() => setIsDraggingSig(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingSig(false);
                        if (e.dataTransfer.files?.[0]) {
                          handleSignatureUpload(e.dataTransfer.files[0]);
                        }
                      }}
                      onClick={() => signatureInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg h-24 flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all ${
                        isDraggingSig
                          ? 'border-cyan-400 bg-cyan-950/20 text-cyan-300'
                          : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50 text-slate-400'
                      }`}
                    >
                      <Upload className="w-5 h-5 mb-1 text-slate-400" />
                      <span className="text-xs font-medium">
                        {isUploadingSig ? 'Memproses...' : 'Upload File TTD'}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        PNG transparan disarankan
                      </span>
                    </div>
                  )}

                  <input
                    ref={signatureInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleSignatureUpload(e.target.files[0]);
                      }
                    }}
                  />

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => signatureInputRef.current?.click()}
                      disabled={isUploadingSig}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{formData.signatureImageUrl ? 'Ganti TTD' : 'Pilih File TTD'}</span>
                    </button>
                    {formData.signatureImageUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveSignature}
                        className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        title="Hapus dan gunakan TTD standar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Upload Cap Perusahaan */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <Stamp className="w-3.5 h-3.5 text-cyan-400" />
                      Cap Perusahaan (Stamp)
                    </span>
                    {formData.stampImageUrl ? (
                      <span className="text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Kustom
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                        Cap Standar
                      </span>
                    )}
                  </div>

                  {/* Preview / Drop area */}
                  {formData.stampImageUrl ? (
                    <div className="bg-white rounded-lg p-2 flex items-center justify-center h-24 border border-slate-700 shadow-inner overflow-hidden">
                      <img
                        src={formData.stampImageUrl}
                        alt="Preview Cap"
                        className="max-h-full max-w-full object-contain"
                        style={{ mixBlendMode: 'multiply' }}
                      />
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingStamp(true);
                      }}
                      onDragLeave={() => setIsDraggingStamp(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingStamp(false);
                        if (e.dataTransfer.files?.[0]) {
                          handleStampUpload(e.dataTransfer.files[0]);
                        }
                      }}
                      onClick={() => stampInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg h-24 flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all ${
                        isDraggingStamp
                          ? 'border-cyan-400 bg-cyan-950/20 text-cyan-300'
                          : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50 text-slate-400'
                      }`}
                    >
                      <Upload className="w-5 h-5 mb-1 text-slate-400" />
                      <span className="text-xs font-medium">
                        {isUploadingStamp ? 'Memproses...' : 'Upload File Cap'}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        PNG transparan stempel biru disarankan
                      </span>
                    </div>
                  )}

                  <input
                    ref={stampInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleStampUpload(e.target.files[0]);
                      }
                    }}
                  />

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => stampInputRef.current?.click()}
                      disabled={isUploadingStamp}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{formData.stampImageUrl ? 'Ganti Cap' : 'Pilih File Cap'}</span>
                    </button>
                    {formData.stampImageUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveStamp}
                        className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        title="Hapus dan gunakan Cap standar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Combined Result Preview in Left Column */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    Pratinjau Susunan Tanda Tangan & Cap (Sesuai Gambar Referensi)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Format Resmi
                  </span>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200/80 flex justify-start">
                  <SignatureBlock template={formData} />
                </div>
              </div>
            </div>
          </div>
        </fieldset>

        {/* Right Column: Live Document Preview using current form data (6 cols) */}
        <div className="xl:col-span-6 flex flex-col items-center">
          <div className="w-full max-w-[210mm] mb-2 px-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              Live Preview Kop & Format Surat
            </span>
            <span className="text-[11px] text-cyan-400 font-mono">
              Perubahan tampak real-time
            </span>
          </div>

          <div className="w-full overflow-x-auto flex justify-center pb-6">
            <div
              style={{
                transform: 'scale(0.8)',
                transformOrigin: 'top center',
              }}
              className="shadow-2xl rounded-sm"
            >
              <RFOPaperDocument
                id="template-preview-doc"
                rfo={sampleRFO}
                template={formData}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
