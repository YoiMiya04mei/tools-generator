import React, { useState, useEffect, useMemo } from 'react';
import {
  Save,
  FileDown,
  Printer,
  Copy,
  MessageSquare,
  Clock,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Eye,
  ZoomIn,
  ZoomOut,
  FileText,
} from 'lucide-react';
import type { RFODocument, RFOTemplate, RFODraft } from '../types/rfo';
import { RFOPaperDocument } from '../components/RFOPaperDocument';
import { calculateDuration } from '../utils/duration';
import {
  formatIndonesianDateTime,
  toDatetimeLocalString,
  toDateInputString,
} from '../utils/dateFormatter';
import { RFOService } from '../services/rfoService';
import { PDFService } from '../services/pdfService';
import { storageService } from '../services/storageService';
import type { ToastMessage } from '../components/Toast';
import type { UserAccount } from '../types/auth';
import { ROLE_LABELS } from '../types/auth';

interface CreateRFOPageProps {
  template: RFOTemplate;
  addToast: (type: ToastMessage['type'], title: string, message?: string) => void;
  initialEditData?: RFODocument | null;
  onSaved?: () => void;
  currentUser?: UserAccount | null;
}

// Common incident templates for quick NOC operations
const NOC_TEMPLATES = [
  {
    name: 'Microburst MPLS (NEX DC)',
    rootCause:
      'Lonjakan traffic sesaat (microburst) pada interface uplink MPLS di sisi NEX DC yang menyebabkan packet drop.',
    actionTaken: 'Penggantian interface dan reconfigure service QoS uplink.',
    description:
      'Selama waktu tersebut, layanan JKT<>BDG sempat mengalami gangguan. Saat ini seluruh layanan telah kembali normal dan dapat digunakan seperti biasa.',
  },
  {
    name: 'Fiber Optic Cut (Backbone)',
    rootCause:
      'Putusnya kabel fiber optic backbone pada segmen Ciawi - Sukabumi akibat pengerjaan proyek galian pihak ketiga.',
    actionTaken:
      'Tim teknis melakukan penyambungan ulang (splicing core) dan rerouting traffic ke jalur proteksi sekunder.',
    description:
      'Selama waktu tersebut, layanan internet pelanggan area Sukabumi & sekitarnya mengalami penurunan performa dan degradasi sinyal. Saat ini seluruh layanan telah normal kembali.',
  },
  {
    name: 'Power Fluctuation / Genset Failover',
    rootCause:
      'Pemadaman suplai listrik utama PLN dan kegagalan otomatisasi transfer switch genset pada PoP distribusi.',
    actionTaken:
      'Manual override switch genset, pengecekan inverter UPS, dan normalisasi pasokan listrik cadangan.',
    description:
      'Selama waktu tersebut, layanan pada segmen distribusi sempat offline sesaat. Saat ini seluruh perangkat telah hidup kembali dan beroperasi stabil.',
  },
  {
    name: 'Core Router Memory Spike',
    rootCause:
      'Memory exhaustion dan high CPU utilization pada core BGP router akibat lonjakan routing table update.',
    actionTaken:
      'Restart BGP routing daemon, update filter prefix list, dan optimasi memory allocation.',
    description:
      'Selama waktu tersebut, terjadi packet loss dan flapping latency antar transit upstream. Saat ini traffic telah stabil.',
  },
];

export const CreateRFOPage: React.FC<CreateRFOPageProps> = ({
  template,
  addToast,
  initialEditData,
  onSaved,
  currentUser,
}) => {
  // Form State
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [rfoDate, setRfoDate] = useState<string>(toDateInputString());
  const [rootCause, setRootCause] = useState<string>('');
  const [actionTaken, setActionTaken] = useState<string>('');
  const [disruptionDescription, setDisruptionDescription] = useState<string>('');
  const [ticketNo, setTicketNo] = useState<string>('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);

  // Draft state & banner
  const [hasUnfinishedDraft, setHasUnfinishedDraft] = useState<boolean>(false);
  const [cachedDraft, setCachedDraft] = useState<RFODraft | null>(null);

  // UI state
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [previewZoom, setPreviewZoom] = useState<number>(90);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Duration calculation
  const durationResult = useMemo(() => {
    return calculateDuration(startTime, endTime);
  }, [startTime, endTime]);

  // Check initial edit data or load draft on mount
  useEffect(() => {
    if (initialEditData) {
      setEditingId(initialEditData.id);
      setStartTime(initialEditData.startTime);
      setEndTime(initialEditData.endTime);
      setRfoDate(initialEditData.rfoDate || toDateInputString());
      setRootCause(initialEditData.rootCause);
      setActionTaken(initialEditData.actionTaken);
      setDisruptionDescription(initialEditData.disruptionDescription || '');
      setTicketNo(initialEditData.ticketNo || '');
      return;
    }

    // Set default times (e.g. today 18:15 to 22:05 or current time)
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3.5 * 60 * 60 * 1000);
    setStartTime(toDatetimeLocalString(threeHoursAgo));
    setEndTime(toDatetimeLocalString(now));

    // Check saved draft
    storageService.getDraft().then((draft) => {
      if (
        draft &&
        (draft.rootCause || draft.actionTaken || draft.disruptionDescription)
      ) {
        setCachedDraft(draft);
        setHasUnfinishedDraft(true);
      }
    });
  }, [initialEditData]);

  // Auto-save draft whenever user makes changes (unless editing existing RFO)
  useEffect(() => {
    if (editingId) return; // Don't overwrite draft while editing saved RFO

    // Only save if there's meaningful user input
    if (rootCause || actionTaken || disruptionDescription) {
      const draftObj: RFODraft = {
        startTime,
        endTime,
        rfoDate,
        rootCause,
        actionTaken,
        disruptionDescription,
        ticketNo,
        savedAt: new Date().toISOString(),
      };
      storageService.saveDraft(draftObj);
    }
  }, [
    startTime,
    endTime,
    rfoDate,
    rootCause,
    actionTaken,
    disruptionDescription,
    ticketNo,
    editingId,
  ]);

  // Handle restoring draft
  const handleRestoreDraft = () => {
    if (!cachedDraft) return;
    if (cachedDraft.startTime) setStartTime(cachedDraft.startTime);
    if (cachedDraft.endTime) setEndTime(cachedDraft.endTime);
    if (cachedDraft.rfoDate) setRfoDate(cachedDraft.rfoDate);
    setRootCause(cachedDraft.rootCause || '');
    setActionTaken(cachedDraft.actionTaken || '');
    setDisruptionDescription(cachedDraft.disruptionDescription || '');
    if (cachedDraft.ticketNo) setTicketNo(cachedDraft.ticketNo);
    setHasUnfinishedDraft(false);
    addToast('info', 'Draft Dipulihkan', 'Melanjutkan draft RFO yang belum selesai disimpan.');
  };

  // Handle discarding draft
  const handleDiscardDraft = async () => {
    await storageService.clearDraft();
    setCachedDraft(null);
    setHasUnfinishedDraft(false);
    addToast('info', 'Draft Dihapus', 'Draft sebelumnya telah dibersihkan.');
  };

  // Apply quick NOC template
  const applyTemplate = (t: (typeof NOC_TEMPLATES)[0]) => {
    setRootCause(t.rootCause);
    setActionTaken(t.actionTaken);
    setDisruptionDescription(t.description);
    addToast('success', 'Template Diterapkan', `Memuat template: ${t.name}`);
  };

  // Construct current RFO object
  const currentRFO: RFODocument = useMemo(() => {
    return {
      id: editingId || `RFO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      rfoDate: rfoDate || toDateInputString(),
      startTime,
      endTime,
      totalDuration: durationResult.isValid ? durationResult.formatted : 'Durasi tidak valid',
      durationMinutes: durationResult.totalMinutes,
      rootCause,
      actionTaken,
      disruptionDescription,
      ticketNo,
      createdAt: initialEditData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: initialEditData?.createdBy || currentUser?.id,
      createdByName: initialEditData?.createdByName || currentUser?.name || 'Staff NOC',
      createdByRole: initialEditData?.createdByRole || currentUser?.role || 'engineer',
    };
  }, [
    editingId,
    rfoDate,
    startTime,
    endTime,
    durationResult,
    rootCause,
    actionTaken,
    disruptionDescription,
    ticketNo,
    initialEditData,
    currentUser,
  ]);

  // Save RFO Action
  const handleSaveRFO = async () => {
    const validation = RFOService.validate({
      startTime,
      endTime,
      rootCause,
      actionTaken,
    });

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      addToast('error', 'Validasi Gagal', 'Mohon lengkapi seluruh field wajib dengan benar.');
      return;
    }

    setValidationErrors({});

    try {
      await storageService.saveRFO(currentRFO);
      await storageService.clearDraft();
      setHasUnfinishedDraft(false);
      addToast(
        'success',
        'RFO Berhasil Disimpan',
        `Dokumen RFO telah tercatat di arsip History.`
      );
      if (onSaved) {
        onSaved();
      }
    } catch (e) {
      console.error(e);
      addToast('error', 'Gagal Menyimpan', 'Terjadi kesalahan saat menyimpan dokumen ke storage.');
    }
  };

  // Generate & Export PDF
  const handleGeneratePDF = async () => {
    const validation = RFOService.validate({
      startTime,
      endTime,
      rootCause,
      actionTaken,
    });

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      addToast('error', 'Validasi Gagal', 'Lengkapi form sebelum mengunduh PDF.');
      return;
    }

    setIsExportingPDF(true);
    addToast('info', 'Membuat PDF...', 'Sedang merender layout dokumen A4.');

    try {
      // Auto save first if not saved yet
      await storageService.saveRFO(currentRFO);

      const filename = await PDFService.exportToPDF({
        elementId: 'rfo-paper-doc',
        rfoDate: currentRFO.rfoDate,
        rootCause: currentRFO.rootCause,
      });

      addToast('success', 'PDF Berhasil Dibuat', `File diunduh sebagai: ${filename}`);
    } catch (error) {
      console.error(error);
      addToast('error', 'Gagal Membuat PDF', 'Terjadi kesalahan saat memproses ekspor PDF.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Print RFO
  const handlePrint = () => {
    const validation = RFOService.validate({
      startTime,
      endTime,
      rootCause,
      actionTaken,
    });

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      addToast('error', 'Validasi Gagal', 'Perbaiki isian form sebelum mencetak.');
      return;
    }

    PDFService.printDocument();
  };

  // Copy Plain Text
  const handleCopyText = async () => {
    const text = RFOService.generatePlainText(currentRFO, template);
    try {
      await navigator.clipboard.writeText(text);
      addToast(
        'success',
        'Text RFO Berhasil Disalin',
        'Format teks siap ditempel ke Email, Telegram, atau Ticketing system.'
      );
    } catch (err) {
      addToast('error', 'Gagal Menyalin', 'Izin clipboard browser ditolak.');
    }
  };

  // Copy WhatsApp
  const handleCopyWhatsApp = async () => {
    const text = RFOService.generateWhatsAppText(currentRFO, template);
    try {
      await navigator.clipboard.writeText(text);
      addToast(
        'success',
        'WhatsApp Text Disalin',
        'Format pesan WhatsApp yang ringkas dan rapi siap dikirim.'
      );
    } catch (err) {
      addToast('error', 'Gagal Menyalin', 'Izin clipboard browser ditolak.');
    }
  };

  // Reset form
  const handleResetForm = () => {
    if (
      window.confirm('Apakah Anda yakin ingin mengosongkan form? Draft akan dibersihkan.')
    ) {
      const now = new Date();
      const threeHoursAgo = new Date(now.getTime() - 3.5 * 60 * 60 * 1000);
      setStartTime(toDatetimeLocalString(threeHoursAgo));
      setEndTime(toDatetimeLocalString(now));
      setRfoDate(toDateInputString());
      setRootCause('');
      setActionTaken('');
      setDisruptionDescription('');
      setTicketNo('');
      setEditingId(null);
      setValidationErrors({});
      storageService.clearDraft();
      addToast('info', 'Form Direset', 'Formulir telah dikosongkan.');
    }
  };

  return (
    <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
      {/* Draft Notification Banner */}
      {hasUnfinishedDraft && !editingId && (
        <div className="no-print mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-amber-200 text-sm">
                Terdapat draft RFO yang belum selesai.
              </p>
              <p className="text-xs text-amber-300/80 mt-0.5">
                Sistem menyimpan progres terakhir Anda secara otomatis.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleRestoreDraft}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors shadow-sm"
            >
              Lanjutkan Draft
            </button>
            <button
              onClick={handleDiscardDraft}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
            >
              Hapus Draft
            </button>
          </div>
        </div>
      )}

      {/* Editing notice if in edit mode */}
      {editingId && (
        <div className="no-print mb-6 p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-300 text-sm">
            <FileText className="w-4 h-4" />
            <span>Sedang mengedit dokumen tersimpan: <strong>{editingId}</strong></span>
          </div>
          <button
            onClick={() => {
              setEditingId(null);
              handleResetForm();
            }}
            className="text-xs text-slate-400 hover:text-white underline"
          >
            Batal Edit & Buat Baru
          </button>
        </div>
      )}

      {/* Current Author / Creator Banner */}
      {currentUser && (
        <div className="no-print mb-5 p-3 px-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${
                currentUser.avatarColor || 'from-cyan-600 to-blue-600'
              } flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0`}
            >
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Pembuat Dokumen:</span>
                <strong className="text-xs text-white">{currentUser.name}</strong>
                <span className="text-slate-400 text-xs hidden sm:inline">({currentUser.position})</span>
              </div>
              <p className="text-[11px] text-cyan-400/90 mt-0.5">
                Nama Anda otomatis tersimpan ke dalam arsip History RFO saat dokumen ini disimpan.
              </p>
            </div>
          </div>
          <span
            className={`self-start sm:self-auto text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
              ROLE_LABELS[currentUser.role]?.badgeClass || ''
            }`}
          >
            {ROLE_LABELS[currentUser.role]?.label || currentUser.role}
          </span>
        </div>
      )}

      {/* Main Grid: Left Form, Right Live A4 Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form & Controls (5 Cols on XL) */}
        <div className="no-print xl:col-span-5 space-y-6">
          {/* Quick Incident Templates Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Quick Presets NOC (Incident Common)
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {NOC_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  onClick={() => applyTemplate(tmpl)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 text-[11px] font-medium transition-colors"
                >
                  {tmpl.name}
                </button>
              ))}
            </div>
          </div>

          {/* Core Input Form Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Data Insiden & Waktu Gangguan
              </h3>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                WIB Timezone
              </span>
            </div>

            {/* Date of Letter / Report */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Tanggal Dokumen RFO
              </label>
              <input
                type="date"
                value={rfoDate}
                onChange={(e) => setRfoDate(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
              />
            </div>

            {/* Time Grid: Start Time & End Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Start Time */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Waktu Mulai <span className="text-rose-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={`w-full bg-slate-800/90 border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 font-mono ${
                    validationErrors.startTime
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-slate-700 focus:ring-cyan-500'
                  }`}
                />
                <p className="text-[11px] text-slate-400 mt-1 truncate">
                  {startTime ? formatIndonesianDateTime(startTime) : 'Pilih waktu mulai'}
                </p>
                {validationErrors.startTime && (
                  <p className="text-[11px] text-rose-400 mt-0.5">
                    {validationErrors.startTime}
                  </p>
                )}
              </div>

              {/* End Time */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Waktu Selesai <span className="text-rose-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={`w-full bg-slate-800/90 border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 font-mono ${
                    validationErrors.endTime || !durationResult.isValid
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-slate-700 focus:ring-cyan-500'
                  }`}
                />
                <p className="text-[11px] text-slate-400 mt-1 truncate">
                  {endTime ? formatIndonesianDateTime(endTime) : 'Pilih waktu selesai'}
                </p>
                {validationErrors.endTime && (
                  <p className="text-[11px] text-rose-400 mt-0.5">
                    {validationErrors.endTime}
                  </p>
                )}
              </div>
            </div>

            {/* Total Duration Calculated Badge (Section 4) */}
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                durationResult.isValid
                  ? 'bg-slate-800/80 border-cyan-500/40 text-cyan-200'
                  : 'bg-rose-950/30 border-rose-500/50 text-rose-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium flex items-center gap-1.5 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Total Durasi Gangguan:
                </span>
                <span
                  className={`text-sm font-bold font-mono px-2.5 py-0.5 rounded ${
                    durationResult.isValid
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {durationResult.isValid
                    ? durationResult.formatted
                    : 'Error Perhitungan'}
                </span>
              </div>
              {!durationResult.isValid && durationResult.error && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-400 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{durationResult.error}</span>
                </div>
              )}
            </div>

            {/* Root Cause Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Root Cause <span className="text-rose-400">*</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  {rootCause.length} karakter
                </span>
              </div>
              <textarea
                rows={3}
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                placeholder="Contoh: Lonjakan traffic sesaat (microburst) pada interface uplink MPLS di sisi NEX DC yang menyebabkan packet drop."
                className={`w-full bg-slate-800/90 border rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 resize-y placeholder:text-slate-500 ${
                  validationErrors.rootCause
                    ? 'border-rose-500 focus:ring-rose-500'
                    : 'border-slate-700 focus:ring-cyan-500'
                }`}
              />
              {validationErrors.rootCause && (
                <p className="text-[11px] text-rose-400 mt-1">
                  {validationErrors.rootCause}
                </p>
              )}
            </div>

            {/* Action Taken Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Action Taken <span className="text-rose-400">*</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  {actionTaken.length} karakter
                </span>
              </div>
              <textarea
                rows={3}
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                placeholder="Contoh: Penggantian interface dan reconfigure service."
                className={`w-full bg-slate-800/90 border rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 resize-y placeholder:text-slate-500 ${
                  validationErrors.actionTaken
                    ? 'border-rose-500 focus:ring-rose-500'
                    : 'border-slate-700 focus:ring-cyan-500'
                }`}
              />
              {validationErrors.actionTaken && (
                <p className="text-[11px] text-rose-400 mt-1">
                  {validationErrors.actionTaken}
                </p>
              )}
            </div>

            {/* Optional Disruption Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Deskripsi Gangguan <span className="text-slate-500 font-normal">(Opsional)</span>
                </label>
              </div>
              <textarea
                rows={2}
                value={disruptionDescription}
                onChange={(e) => setDisruptionDescription(e.target.value)}
                placeholder="Kosongkan untuk menggunakan kalimat default resmi perusahaan..."
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-y placeholder:text-slate-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Jika dikosongkan, sistem memakai default:{' '}
                <em>"{template.defaultDescription}"</em>
              </p>
            </div>

            {/* Optional Ticket Number for NOC tracking */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                No. Tiket / Referensi Insiden{' '}
                <span className="text-slate-500 font-normal">(Opsional)</span>
              </label>
              <input
                type="text"
                value={ticketNo}
                onChange={(e) => setTicketNo(e.target.value)}
                placeholder="Contoh: INC-20261011-889"
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Action Buttons Panel (Save, PDF, Print, Copy Text, Copy WA) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Save RFO */}
              <button
                onClick={handleSaveRFO}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-sm shadow-md shadow-cyan-950 transition-all cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>{editingId ? 'Update RFO' : 'Simpan RFO'}</span>
              </button>

              {/* Generate PDF */}
              <button
                onClick={handleGeneratePDF}
                disabled={isExportingPDF}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-emerald-950 transition-all cursor-pointer active:scale-95"
              >
                <FileDown className="w-4 h-4" />
                <span>{isExportingPDF ? 'Merender...' : 'Generate PDF'}</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Print */}
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-all"
                title="Cetak dokumen format A4"
              >
                <Printer className="w-3.5 h-3.5 text-cyan-400" />
                <span>Print</span>
              </button>

              {/* Copy Plain Text */}
              <button
                onClick={handleCopyText}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-all"
                title="Salin teks untuk Email / Ticketing"
              >
                <Copy className="w-3.5 h-3.5 text-blue-400" />
                <span>Copy Text</span>
              </button>

              {/* Copy WhatsApp */}
              <button
                onClick={handleCopyWhatsApp}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-emerald-900/40 border border-slate-700 hover:border-emerald-500/40 text-emerald-300 text-xs font-medium transition-all"
                title="Salin format ringkas untuk WhatsApp"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex justify-end">
              <button
                onClick={handleResetForm}
                className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset / Bersihkan Form</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live A4 Paper Preview (7 Cols on XL) */}
        <div className="xl:col-span-7 flex flex-col items-center">
          {/* Preview Toolbar */}
          <div className="no-print w-full max-w-[210mm] mb-3 flex items-center justify-between bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-slate-300">
                Live A4 Preview
              </span>
              <span className="text-[10px] text-slate-500 hidden sm:inline">
                (Standard PT Jembatan Data Pangrango)
              </span>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPreviewZoom(Math.max(60, previewZoom - 10))}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                title="Perkecil"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-slate-400 font-mono w-12 text-center">
                {previewZoom}%
              </span>
              <button
                onClick={() => setPreviewZoom(Math.min(120, previewZoom + 10))}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                title="Perbesar"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewZoom(90)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                title="Reset zoom"
              >
                Fit
              </button>
            </div>
          </div>

          {/* Paper Container with scale wrapper */}
          <div className="w-full flex justify-center overflow-x-auto pb-8">
            <div
              style={{
                transform: `scale(${previewZoom / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
              }}
              className="shadow-2xl shadow-black/80 rounded-sm"
            >
              <RFOPaperDocument
                id="rfo-paper-doc"
                rfo={currentRFO}
                template={template}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
