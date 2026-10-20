import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Eye,
  Edit3,
  Copy,
  Trash2,
  FileDown,
  Printer,
  MessageSquare,
  Calendar,
  X,
  FileText,
  ClipboardList,
  AlertCircle,
  Layers,
  UserCheck,
  RotateCcw,
  Plus,
  Clock,
  Loader2,
} from 'lucide-react';
import type { RFODocument, RFOTemplate, ActiveTab } from '../types/rfo';
import type { SuratTugasDocument, SuratTugasTemplate } from '../types/suratTugas';
import type { BeritaAcaraDocument, BeritaAcaraTemplate } from '../types/beritaAcara';
import type { UserAccount } from '../types/auth';
import type { ToastMessage } from '../components/Toast';
import { authService } from '../services/authService';
import { storageService } from '../services/storageService';
import { suratTugasStorage } from '../services/suratTugasStorage';
import { beritaAcaraStorage } from '../services/beritaAcaraStorage';
import { RFOService } from '../services/rfoService';
import { PDFService } from '../services/pdfService';
import { RFOPaperDocument } from '../components/RFOPaperDocument';
import { SuratTugasPaperDocument } from '../components/SuratTugasPaperDocument';
import { BeritaAcaraPaperDocument } from '../components/BeritaAcaraPaperDocument';
import { formatIndonesianDateOnly, formatCreationTimestamp } from '../utils/dateFormatter';
import {
  formatSuratTugasExecutionDate,
  generateSuratTugasWhatsAppText,
  generateSuratTugasFileName,
} from '../utils/suratTugasUtils';
import {
  formatBeritaAcaraExecutionDate,
  generateBeritaAcaraWhatsAppText,
  generateBeritaAcaraFileName,
} from '../utils/beritaAcaraUtils';

export type UnifiedDocType = 'rfo' | 'surat-tugas' | 'berita-acara';

export interface UnifiedDocumentItem {
  id: string;
  type: UnifiedDocType;
  typeLabel: string;
  number: string;
  title: string;
  subtitle?: string;
  date: string;
  createdDate: string;
  createdAt: string;
  creator?: string;
  creatorRole?: string;
  rawRFO?: RFODocument;
  rawSuratTugas?: SuratTugasDocument;
  rawBeritaAcara?: BeritaAcaraDocument;
}

interface HistoryPageProps {
  template: RFOTemplate;
  suratTugasTemplate?: SuratTugasTemplate;
  beritaAcaraTemplate?: BeritaAcaraTemplate;
  setActiveTab: (tab: ActiveTab) => void;
  onEditRFO: (rfo: RFODocument) => void;
  onDuplicateRFO: (rfo: RFODocument) => void;
  onEditSuratTugas: (doc: SuratTugasDocument) => void;
  onDuplicateSuratTugas: (doc: SuratTugasDocument) => void;
  onEditBeritaAcara: (doc: BeritaAcaraDocument) => void;
  onDuplicateBeritaAcara: (doc: BeritaAcaraDocument) => void;
  addToast: (type: ToastMessage['type'], title: string, message?: string) => void;
  currentUser?: UserAccount | null;
  initialTypeFilter?: 'all' | 'rfo' | 'surat-tugas' | 'berita-acara';
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  template,
  suratTugasTemplate,
  beritaAcaraTemplate,
  setActiveTab,
  onEditRFO,
  onDuplicateRFO,
  onEditSuratTugas,
  onDuplicateSuratTugas,
  onEditBeritaAcara,
  onDuplicateBeritaAcara,
  addToast,
  currentUser,
  initialTypeFilter = 'all',
}) => {
  // Raw documents from storages
  const [rfos, setRfos] = useState<RFODocument[]>([]);
  const [suratTugasList, setSuratTugasList] = useState<SuratTugasDocument[]>([]);
  const [beritaAcaraList, setBeritaAcaraList] = useState<BeritaAcaraDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Search
  const [typeFilter, setTypeFilter] = useState<'all' | 'rfo' | 'surat-tugas' | 'berita-acara'>(
    initialTypeFilter
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterCreator, setFilterCreator] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Preview Modals
  const [selectedRFO, setSelectedRFO] = useState<RFODocument | null>(null);
  const [selectedSuratTugas, setSelectedSuratTugas] = useState<SuratTugasDocument | null>(null);
  const [selectedBeritaAcara, setSelectedBeritaAcara] = useState<BeritaAcaraDocument | null>(null);
  const [baModalPageTab, setBaModalPageTab] = useState<'all' | number>('all');

  // Delete Confirmation State
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{
    id: string;
    type: UnifiedDocType;
    number: string;
  } | null>(null);

  // Downloading State indicator
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Background PDF Export (direct download without opening overview modal)
  const [exportingItem, setExportingItem] = useState<UnifiedDocumentItem | null>(null);

  // Permissions based on currentUser
  const canDelete = currentUser ? authService.hasPermission(currentUser.role, 'canDeleteRFO') : false;

  useEffect(() => {
    loadAllDocuments();
  }, []);

  const loadAllDocuments = async () => {
    setLoading(true);
    try {
      const [rfoDocs, stDocs, baDocs] = await Promise.all([
        storageService.getAllRFOs().catch(() => []),
        suratTugasStorage.getAllSuratTugas().catch(() => []),
        beritaAcaraStorage.getAllBeritaAcara().catch(() => []),
      ]);
      setRfos(rfoDocs);
      setSuratTugasList(stDocs);
      setBeritaAcaraList(baDocs);
    } catch (e) {
      console.error('Failed to load documents:', e);
      addToast('error', 'Gagal Memuat Data', 'Tidak dapat mengambil arsip dokumen.');
    } finally {
      setLoading(false);
    }
  };

  // Convert all items into UnifiedDocumentItem format
  const unifiedItems: UnifiedDocumentItem[] = useMemo(() => {
    const list: UnifiedDocumentItem[] = [];

    // 1. Process RFO
    rfos.forEach((r) => {
      list.push({
        id: r.id,
        type: 'rfo',
        typeLabel: 'Reason For Outage',
        number: r.ticketNo ? `#${r.ticketNo}` : `#${r.id}`,
        title: r.rootCause || 'Insiden Gangguan Jaringan',
        subtitle: r.customerName
          ? `Pelanggan: ${r.customerName} • Tindakan: ${r.actionTaken}`
          : `Tindakan: ${r.actionTaken || '-'}`,
        date: formatIndonesianDateOnly(r.rfoDate),
        createdDate: r.rfoDate || (r.createdAt ? r.createdAt.slice(0, 10) : ''),
        createdAt: r.createdAt || r.rfoDate || new Date().toISOString(),
        creator: r.createdByName || 'Staff NOC',
        creatorRole: r.createdByRole || 'engineer',
        rawRFO: r,
      });
    });

    // 2. Process Surat Tugas
    suratTugasList.forEach((st) => {
      const execDate = formatSuratTugasExecutionDate(st.startDate, st.endDate);
      const teamNames = st.personnel.map((p) => p.name).filter(Boolean).join(', ');
      list.push({
        id: st.id,
        type: 'surat-tugas',
        typeLabel: 'Surat Tugas',
        number: st.letterNumber,
        title: st.visitLocation || 'Visit Teknis Data Center',
        subtitle: `Petugas: ${teamNames || 'Personil teknis'} • Periode: ${execDate}`,
        date: execDate,
        createdDate: st.createdDate || (st.createdAt ? st.createdAt.slice(0, 10) : ''),
        createdAt: st.createdAt || st.createdDate || new Date().toISOString(),
        creator: st.createdByName || 'Staff NOC',
        creatorRole: st.createdByRole || 'engineer',
        rawSuratTugas: st,
      });
    });

    // 3. Process Berita Acara
    beritaAcaraList.forEach((ba) => {
      const execDate = formatBeritaAcaraExecutionDate(ba.startDate, ba.endDate);
      const teamNames = ba.personnel.map((p) => p.name).filter(Boolean).join(', ');
      const photosCount = ba.attachments?.length || 0;
      list.push({
        id: ba.id,
        type: 'berita-acara',
        typeLabel: 'Berita Acara',
        number: ba.letterNumber,
        title: `${ba.visitLocation || 'Visit Data Center'} — ${ba.purpose || 'Kegiatan Teknis'}`,
        subtitle: `Tim: ${teamNames || 'Petugas'} • ${photosCount} Foto Dokumentasi`,
        date: execDate,
        createdDate: ba.createdDate || (ba.createdAt ? ba.createdAt.slice(0, 10) : ''),
        createdAt: ba.createdAt || ba.createdDate || new Date().toISOString(),
        creator: ba.createdByName || 'Staff NOC',
        creatorRole: ba.createdByRole || 'engineer',
        rawBeritaAcara: ba,
      });
    });

    // Sort
    return list.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime() || 0;
      const timeB = new Date(b.createdAt).getTime() || 0;
      return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
    });
  }, [rfos, suratTugasList, beritaAcaraList, sortBy]);

  // Distinct Creator Options
  const creatorOptions = useMemo(() => {
    const set = new Set<string>();
    unifiedItems.forEach((item) => {
      if (item.creator) set.add(item.creator);
    });
    return Array.from(set);
  }, [unifiedItems]);

  // Filtered List
  const filteredList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return unifiedItems.filter((item) => {
      // 1. Type Filter
      if (typeFilter !== 'all' && item.type !== typeFilter) {
        return false;
      }

      // 2. Search Query
      if (q) {
        const matchesNumber = item.number.toLowerCase().includes(q);
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesSubtitle = item.subtitle ? item.subtitle.toLowerCase().includes(q) : false;
        const matchesCreator = item.creator ? item.creator.toLowerCase().includes(q) : false;
        const matchesType = item.typeLabel.toLowerCase().includes(q);

        if (!matchesNumber && !matchesTitle && !matchesSubtitle && !matchesCreator && !matchesType) {
          return false;
        }
      }

      // 3. Date Filter: Filter khusus berdasarkan Tanggal Pembuatan Surat
      if (filterDate) {
        const candidates = new Set<string>();

        if (item.createdDate) {
          candidates.add(item.createdDate.slice(0, 10));
        }

        if (item.type === 'rfo' && item.rawRFO?.rfoDate) {
          candidates.add(item.rawRFO.rfoDate.slice(0, 10));
        }
        if (item.type === 'surat-tugas' && item.rawSuratTugas?.createdDate) {
          candidates.add(item.rawSuratTugas.createdDate.slice(0, 10));
        }
        if (item.type === 'berita-acara' && item.rawBeritaAcara?.createdDate) {
          candidates.add(item.rawBeritaAcara.createdDate.slice(0, 10));
        }

        if (item.createdAt) {
          candidates.add(item.createdAt.slice(0, 10));
          const d = new Date(item.createdAt);
          if (!isNaN(d.getTime())) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            candidates.add(`${y}-${m}-${day}`);
          }
        }

        if (!candidates.has(filterDate)) {
          return false;
        }
      }

      // 4. Creator Filter
      if (filterCreator) {
        if (!item.creator || item.creator.toLowerCase() !== filterCreator.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [unifiedItems, typeFilter, searchQuery, filterDate, filterCreator]);

  // Document Counts
  const counts = useMemo(() => {
    return {
      all: unifiedItems.length,
      rfo: rfos.length,
      suratTugas: suratTugasList.length,
      beritaAcara: beritaAcaraList.length,
    };
  }, [unifiedItems.length, rfos.length, suratTugasList.length, beritaAcaraList.length]);

  // Reset Filters
  const handleResetFilters = () => {
    setTypeFilter('all');
    setSearchQuery('');
    setFilterDate('');
    setFilterCreator('');
  };

  const hasActiveFilters =
    typeFilter !== 'all' || searchQuery !== '' || filterDate !== '' || filterCreator !== '';

  // ================= ACTION HANDLERS =================

  // 1. Preview Modal Open
  const handlePreview = (item: UnifiedDocumentItem) => {
    if (item.type === 'rfo' && item.rawRFO) {
      setSelectedRFO(item.rawRFO);
    } else if (item.type === 'surat-tugas' && item.rawSuratTugas) {
      setSelectedSuratTugas(item.rawSuratTugas);
    } else if (item.type === 'berita-acara' && item.rawBeritaAcara) {
      setSelectedBeritaAcara(item.rawBeritaAcara);
      setBaModalPageTab('all');
    }
  };

  // 2. Download PDF (Direct download without opening overview modal)
  const handleDownloadPDF = async (item: UnifiedDocumentItem) => {
    if (downloadingId) return;
    setDownloadingId(item.id);

    try {
      if (item.type === 'rfo' && item.rawRFO) {
        addToast('info', 'Membuat PDF RFO...', 'Sedang merender layout dokumen.');
        const isModalOpen = selectedRFO?.id === item.id;
        if (!isModalOpen) {
          setExportingItem(item);
        }

        setTimeout(async () => {
          try {
            const targetId = isModalOpen
              ? 'history-rfo-preview-modal-doc'
              : 'direct-export-rfo-doc';
            const element = document.getElementById(targetId);
            if (!element) {
              addToast('error', 'Gagal', 'Elemen dokumen tidak ditemukan.');
              return;
            }

            const filename = await PDFService.exportToPDF({
              element,
              rfoDate: item.rawRFO!.rfoDate,
              rootCause: item.rawRFO!.rootCause,
            });
            addToast('success', 'PDF Berhasil Diunduh', filename);
          } catch (e) {
            console.error('PDF error:', e);
            addToast('error', 'Gagal', 'Terjadi kesalahan saat memproses PDF.');
          } finally {
            setDownloadingId(null);
            setExportingItem(null);
          }
        }, 250);
      } else if (item.type === 'surat-tugas' && item.rawSuratTugas) {
        addToast('info', 'Membuat PDF Surat Tugas...', 'Sedang merender layout dokumen.');
        const isModalOpen = selectedSuratTugas?.id === item.id;
        if (!isModalOpen) {
          setExportingItem(item);
        }

        setTimeout(async () => {
          try {
            const targetId = isModalOpen
              ? 'history-surat-tugas-modal-doc'
              : 'direct-export-st-doc';
            const element = document.getElementById(targetId);
            if (!element) {
              addToast('error', 'Gagal', 'Elemen dokumen tidak ditemukan.');
              return;
            }

            const filename = generateSuratTugasFileName(
              item.rawSuratTugas!.letterNumber,
              item.rawSuratTugas!.visitLocation
            );
            await PDFService.exportSinglePagePDF(element, filename);
            addToast('success', 'PDF Terunduh', filename);
          } catch (e) {
            console.error('ST PDF error:', e);
            addToast('error', 'Gagal', 'Terjadi kesalahan saat mengekspor PDF.');
          } finally {
            setDownloadingId(null);
            setExportingItem(null);
          }
        }, 250);
      } else if (item.type === 'berita-acara' && item.rawBeritaAcara) {
        addToast('info', 'Membuat PDF Berita Acara...', 'Sedang merender seluruh halaman dokumen.');
        const isModalOpen = selectedBeritaAcara?.id === item.id;
        if (!isModalOpen) {
          setExportingItem(item);
        } else {
          setBaModalPageTab('all');
        }

        setTimeout(async () => {
          try {
            const selector = isModalOpen
              ? '#history-berita-acara-modal-doc .berita-acara-page, #history-berita-acara-modal-doc .berita-acara-single-page'
              : '#direct-export-ba-doc .berita-acara-page, #direct-export-ba-doc .berita-acara-single-page';
            const pageElements = document.querySelectorAll<HTMLElement>(selector);
            if (pageElements.length === 0) {
              addToast('error', 'Gagal', 'Gagal merender dokumen untuk unduhan PDF.');
              return;
            }

            const filename = generateBeritaAcaraFileName(
              item.rawBeritaAcara!.letterNumber,
              item.rawBeritaAcara!.purpose,
              item.rawBeritaAcara!.visitLocation
            );
            await PDFService.exportMultiPagePDF(pageElements, filename);
            addToast('success', 'PDF Berhasil Diunduh', filename);
          } catch (e) {
            console.error('BA PDF error:', e);
            addToast('error', 'Gagal', 'Terjadi kesalahan saat memproses rendering.');
          } finally {
            setDownloadingId(null);
            setExportingItem(null);
          }
        }, 300);
      }
    } catch {
      setDownloadingId(null);
      setExportingItem(null);
    }
  };

  // 3. WhatsApp Copy
  const handleCopyWhatsApp = async (item: UnifiedDocumentItem) => {
    try {
      let text = '';
      if (item.type === 'rfo' && item.rawRFO) {
        text = RFOService.generateWhatsAppText(item.rawRFO, template);
      } else if (item.type === 'surat-tugas' && item.rawSuratTugas) {
        text = generateSuratTugasWhatsAppText(
          item.rawSuratTugas,
          suratTugasTemplate?.companyName || template.companyName
        );
      } else if (item.type === 'berita-acara' && item.rawBeritaAcara) {
        text = generateBeritaAcaraWhatsAppText(
          item.rawBeritaAcara,
          beritaAcaraTemplate?.companyName || template.companyName
        );
      }

      await navigator.clipboard.writeText(text);
      addToast(
        'success',
        'Format WhatsApp Disalin',
        `Ringkasan pesan ${item.typeLabel} siap dikirimkan.`
      );
    } catch {
      addToast('error', 'Gagal', 'Izin clipboard browser ditolak.');
    }
  };

  // 4. Edit Document
  const handleEdit = (item: UnifiedDocumentItem) => {
    if (item.type === 'rfo' && item.rawRFO) {
      onEditRFO(item.rawRFO);
    } else if (item.type === 'surat-tugas' && item.rawSuratTugas) {
      onEditSuratTugas(item.rawSuratTugas);
    } else if (item.type === 'berita-acara' && item.rawBeritaAcara) {
      onEditBeritaAcara(item.rawBeritaAcara);
    }
  };

  // 5. Duplicate Document
  const handleDuplicate = (item: UnifiedDocumentItem) => {
    if (item.type === 'rfo' && item.rawRFO) {
      onDuplicateRFO(item.rawRFO);
    } else if (item.type === 'surat-tugas' && item.rawSuratTugas) {
      onDuplicateSuratTugas(item.rawSuratTugas);
    } else if (item.type === 'berita-acara' && item.rawBeritaAcara) {
      onDuplicateBeritaAcara(item.rawBeritaAcara);
    }
  };

  // 6. Delete Confirmation & Execution
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmItem) return;
    const { id, type, number } = deleteConfirmItem;

    try {
      let success = false;
      if (type === 'rfo') {
        success = await storageService.deleteRFO(id);
        if (success) setRfos((prev) => prev.filter((r) => r.id !== id));
      } else if (type === 'surat-tugas') {
        success = await suratTugasStorage.deleteSuratTugas(id);
        if (success) setSuratTugasList((prev) => prev.filter((st) => st.id !== id));
      } else if (type === 'berita-acara') {
        success = await beritaAcaraStorage.deleteBeritaAcara(id);
        if (success) setBeritaAcaraList((prev) => prev.filter((ba) => ba.id !== id));
      }

      if (success) {
        addToast('success', 'Dokumen Dihapus', `${number} berhasil dihapus dari arsip.`);
        if (selectedRFO?.id === id) setSelectedRFO(null);
        if (selectedSuratTugas?.id === id) setSelectedSuratTugas(null);
        if (selectedBeritaAcara?.id === id) setSelectedBeritaAcara(null);
      } else {
        addToast('error', 'Gagal', 'Dokumen tidak ditemukan.');
      }
    } catch (e) {
      console.error(e);
      addToast('error', 'Gagal Menghapus', 'Terjadi kesalahan saat menghapus dokumen.');
    } finally {
      setDeleteConfirmItem(null);
    }
  };

  // Helper for Type Badge Styling
  const renderTypeBadge = (type: UnifiedDocType) => {
    switch (type) {
      case 'rfo':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            RFO
          </span>
        );
      case 'surat-tugas':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <ClipboardList className="w-3 h-3 text-blue-600" />
            Surat Tugas
          </span>
        );
      case 'berita-acara':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <FileText className="w-3 h-3 text-emerald-600" />
            Berita Acara
          </span>
        );
    }
  };

  return (
    <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto bg-slate-50">
      {/* Main archive page content (hidden when printing modal) */}
      <div className="no-print space-y-6">
        {/* 1. Header Banner & Quick Create Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Pusat Arsip Dokumen
              </span>
              <span className="text-xs text-slate-500">Total {counts.all} dokumen</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
              Arsip & Riwayat Dokumen
            </h1>
            <p className="text-xs md:text-sm text-slate-500">
              Akses riwayat terpusat untuk dokumen Reason For Outage (RFO), Surat Tugas Visit, dan Berita Acara Visit.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('create')}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Buat RFO</span>
            </button>
            <button
              onClick={() => setActiveTab('create-st')}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Buat Surat Tugas</span>
            </button>
            <button
              onClick={() => setActiveTab('create-ba')}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Buat Berita Acara</span>
            </button>
          </div>
        </div>

        {/* 2. Interactive Document Type Filter Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => setTypeFilter('all')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              typeFilter === 'all'
                ? 'bg-white border-blue-600 shadow-xs ring-2 ring-blue-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Semua Dokumen</p>
                <p className="text-lg font-black text-slate-900">{counts.all}</p>
              </div>
            </div>
            {typeFilter === 'all' && (
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            )}
          </button>

          <button
            onClick={() => setTypeFilter('rfo')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              typeFilter === 'rfo'
                ? 'bg-white border-amber-600 shadow-xs ring-2 ring-amber-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Reason For Outage</p>
                <p className="text-lg font-black text-amber-700">{counts.rfo}</p>
              </div>
            </div>
            {typeFilter === 'rfo' && (
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
            )}
          </button>

          <button
            onClick={() => setTypeFilter('surat-tugas')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              typeFilter === 'surat-tugas'
                ? 'bg-white border-blue-600 shadow-xs ring-2 ring-blue-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Surat Tugas Visit</p>
                <p className="text-lg font-black text-blue-700">{counts.suratTugas}</p>
              </div>
            </div>
            {typeFilter === 'surat-tugas' && (
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            )}
          </button>

          <button
            onClick={() => setTypeFilter('berita-acara')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              typeFilter === 'berita-acara'
                ? 'bg-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Berita Acara Visit</p>
                <p className="text-lg font-black text-emerald-700">{counts.beritaAcara}</p>
              </div>
            </div>
            {typeFilter === 'berita-acara' && (
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            )}
          </button>
        </div>

        {/* 3. Search and Filtering Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="flex-1 w-full flex items-center gap-2.5 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor dokumen, lokasi visit, root cause, kepentingan, atau nama petugas..."
              className="w-full bg-transparent text-sm text-slate-900 focus:outline-none placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters Group */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Creator Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700">
              <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <select
                value={filterCreator}
                onChange={(e) => setFilterCreator(e.target.value)}
                className="bg-transparent text-slate-800 focus:outline-none text-xs cursor-pointer max-w-[140px]"
              >
                <option value="" className="bg-white text-slate-700">
                  Semua Pembuat
                </option>
                {creatorOptions.map((name) => (
                  <option key={name} value={name} className="bg-white text-slate-900">
                    {name}
                  </option>
                ))}
              </select>
              {filterCreator && (
                <button
                  onClick={() => setFilterCreator('')}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Date Filter */}
            <div
              className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 shadow-2xs hover:border-blue-400 transition-colors"
              title="Cari berdasarkan Tanggal Pembuatan Surat"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap hidden sm:inline">
                Tgl Surat:
              </span>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                aria-label="Cari berdasarkan tanggal pembuatan surat"
                title="Cari berdasarkan tanggal pembuatan surat"
                className="bg-transparent text-slate-800 focus:outline-none text-xs cursor-pointer"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate('')}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5 rounded hover:bg-slate-200"
                  title="Hapus Filter Tanggal"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Toggle */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-white text-slate-900">
                Terbaru Dulu
              </option>
              <option value="oldest" className="bg-white text-slate-900">
                Terlama Dulu
              </option>
            </select>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-medium border border-slate-200 flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
                title="Reset Semua Filter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* 4. Document List / Table */}
        {loading ? (
          <div className="p-16 text-center bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-slate-500">Memuat seluruh arsip dokumen...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <p className="text-base font-semibold text-slate-900">Tidak ada dokumen yang ditemukan</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {hasActiveFilters
                ? 'Tidak ada dokumen yang cocok dengan filter atau kata kunci pencarian Anda. Coba ubah kata kunci atau reset filter.'
                : 'Belum ada dokumen yang dibuat atau tersimpan di sistem.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium cursor-pointer shadow-xs"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="divide-y divide-slate-100">
              {filteredList.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="p-4 lg:p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left Info */}
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {renderTypeBadge(item.type)}
                      <span className="font-mono font-bold text-sm text-slate-900 tracking-wide">
                        {item.number}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span
                        className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md font-medium flex items-center gap-1"
                        title="Tanggal Pembuatan Surat"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>
                          Tgl Surat:{' '}
                          <strong className="font-semibold text-slate-900">
                            {formatIndonesianDateOnly(item.createdDate)}
                          </strong>
                        </span>
                      </span>
                      {item.type !== 'rfo' && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span
                            className="text-xs text-slate-500 flex items-center gap-1"
                            title="Periode Pelaksanaan Visit"
                          >
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Pelaksanaan: {item.date}</span>
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-slate-800 line-clamp-1">
                      {item.title}
                    </h3>

                    {item.subtitle && (
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {item.subtitle}
                      </p>
                    )}

                    {/* Creation Metadata: Tanggal & Waktu Pembuatan serta Pembuat */}
                    <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-slate-100 mt-1">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-50 text-slate-700 border border-slate-200">
                        <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Dibuat: <strong className="font-semibold text-slate-900">{formatCreationTimestamp(item.createdAt)}</strong></span>
                      </span>

                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-50 text-slate-700 border border-slate-200">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Oleh: <strong className="font-semibold text-slate-900">{item.creator}</strong> {item.creatorRole ? `(${item.creatorRole})` : ''}</span>
                      </span>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handlePreview(item)}
                      className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs transition-colors cursor-pointer"
                      title="Lihat / Pratinjau Dokumen"
                    >
                      <Eye className="w-4 h-4 text-blue-600" />
                    </button>

                    <button
                      onClick={() => handleDownloadPDF(item)}
                      disabled={downloadingId === item.id}
                      className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                      title="Unduh PDF Langsung"
                    >
                      {downloadingId === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      ) : (
                        <FileDown className="w-4 h-4 text-slate-700" />
                      )}
                    </button>

                    <button
                      onClick={() => handleCopyWhatsApp(item)}
                      className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-xs transition-colors cursor-pointer"
                      title="Salin Format WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 shadow-xs transition-colors cursor-pointer"
                      title="Edit Dokumen"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDuplicate(item)}
                      className="p-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 shadow-xs transition-colors cursor-pointer"
                      title="Duplikasi Dokumen"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {canDelete && (
                      <button
                        onClick={() =>
                          setDeleteConfirmItem({
                            id: item.id,
                            type: item.type,
                            number: item.number,
                          })
                        }
                        className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 shadow-xs transition-colors cursor-pointer"
                        title="Hapus Dokumen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL PREVIEW RFO ================= */}
      {selectedRFO && (
        <div className="print-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="print-modal-container relative bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="no-print px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  RFO Preview
                </span>
                <span className="font-mono text-sm text-slate-900 font-bold">
                  {selectedRFO.ticketNo || selectedRFO.id}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs text-slate-700 border border-slate-200 font-medium shadow-xs flex items-center gap-1.5 cursor-pointer"
                  title="Cetak Dokumen"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cetak</span>
                </button>
                <button
                  onClick={() => {
                    const item = unifiedItems.find((u) => u.id === selectedRFO.id && u.type === 'rfo');
                    if (item) handleDownloadPDF(item);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs text-white font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Unduh PDF Resmi"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Ekspor PDF</span>
                </button>
                <button
                  onClick={() => setSelectedRFO(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Subheader: Metadata Waktu Pembuatan & Pembuat */}
            <div className="no-print px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600 shrink-0">
              <span className="flex items-center gap-1.5 text-blue-700 font-medium">
                <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Waktu Pembuatan: <strong className="text-slate-900 font-semibold">{formatCreationTimestamp(selectedRFO.createdAt)}</strong></span>
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Dibuat Oleh: <strong className="text-slate-900 font-semibold">{selectedRFO.createdByName || 'Staff NOC'}</strong> {selectedRFO.createdByRole ? `(${selectedRFO.createdByRole})` : ''}</span>
              </span>
            </div>

            {/* Modal Body: A4 Paper Document */}
            <div className="print-modal-body p-4 lg:p-8 overflow-y-auto bg-slate-100/70 flex justify-center">
              <div id="history-rfo-preview-modal-doc" className="print-modal-doc-wrapper w-full max-w-[210mm] shadow-lg shadow-slate-300/60 rounded-sm">
                <RFOPaperDocument
                  rfo={selectedRFO}
                  template={template}
                  id="rfo-paper-doc"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL PREVIEW SURAT TUGAS ================= */}
      {selectedSuratTugas && (
        <div className="print-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="print-modal-container relative bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="no-print px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Surat Tugas Preview
                </span>
                <span className="font-mono text-sm text-slate-900 font-bold">
                  {selectedSuratTugas.letterNumber}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs text-slate-700 border border-slate-200 font-medium shadow-xs flex items-center gap-1.5 cursor-pointer"
                  title="Cetak Dokumen"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cetak</span>
                </button>
                <button
                  onClick={() => {
                    const item = unifiedItems.find((u) => u.id === selectedSuratTugas.id && u.type === 'surat-tugas');
                    if (item) handleDownloadPDF(item);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs text-white font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Unduh PDF Resmi"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Ekspor PDF</span>
                </button>
                <button
                  onClick={() => setSelectedSuratTugas(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Subheader: Metadata Waktu Pembuatan & Pembuat */}
            <div className="no-print px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600 shrink-0">
              <span className="flex items-center gap-1.5 text-blue-700 font-medium">
                <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Waktu Pembuatan: <strong className="text-slate-900 font-semibold">{formatCreationTimestamp(selectedSuratTugas.createdAt)}</strong></span>
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Dibuat Oleh: <strong className="text-slate-900 font-semibold">{selectedSuratTugas.createdByName || 'Staff NOC'}</strong> {selectedSuratTugas.createdByRole ? `(${selectedSuratTugas.createdByRole})` : ''}</span>
              </span>
            </div>

            {/* Modal Body: A4 Paper Document */}
            <div className="print-modal-body p-4 lg:p-8 overflow-y-auto bg-slate-100/70 flex justify-center">
              <div id="history-surat-tugas-modal-doc" className="print-modal-doc-wrapper w-full max-w-[210mm] shadow-lg shadow-slate-300/60 rounded-sm">
                <SuratTugasPaperDocument
                  doc={selectedSuratTugas}
                  template={suratTugasTemplate}
                  id="surat-tugas-paper-doc"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL PREVIEW BERITA ACARA ================= */}
      {selectedBeritaAcara && (
        <div className="print-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="print-modal-container relative bg-white border border-slate-200 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="no-print px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Berita Acara Preview
                </span>
                <span className="font-mono text-sm text-slate-900 font-bold">
                  {selectedBeritaAcara.letterNumber}
                </span>
              </div>

              {/* Multi-page tabs */}
              <div className="hidden md:flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg p-1 text-xs">
                <button
                  onClick={() => setBaModalPageTab('all')}
                  className={`px-2.5 py-1 rounded cursor-pointer font-medium ${
                    baModalPageTab === 'all'
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setBaModalPageTab(1)}
                  className={`px-2.5 py-1 rounded cursor-pointer font-medium ${
                    baModalPageTab === 1
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Hal 1: Utama
                </button>
                {selectedBeritaAcara.attachments && selectedBeritaAcara.attachments.length > 0 && (
                  <button
                    onClick={() => setBaModalPageTab(2)}
                    className={`px-2.5 py-1 rounded cursor-pointer font-medium ${
                      baModalPageTab === 2
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Lampiran
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setBaModalPageTab('all');
                    setTimeout(() => window.print(), 100);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs text-slate-700 border border-slate-200 font-medium shadow-xs flex items-center gap-1.5 cursor-pointer"
                  title="Cetak Dokumen"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cetak</span>
                </button>
                <button
                  onClick={() => {
                    const item = unifiedItems.find((u) => u.id === selectedBeritaAcara.id && u.type === 'berita-acara');
                    if (item) handleDownloadPDF(item);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs text-white font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Unduh PDF Resmi"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Ekspor PDF</span>
                </button>
                <button
                  onClick={() => setSelectedBeritaAcara(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Subheader: Metadata Waktu Pembuatan & Pembuat */}
            <div className="no-print px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600 shrink-0">
              <span className="flex items-center gap-1.5 text-blue-700 font-medium">
                <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Waktu Pembuatan: <strong className="text-slate-900 font-semibold">{formatCreationTimestamp(selectedBeritaAcara.createdAt)}</strong></span>
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Dibuat Oleh: <strong className="text-slate-900 font-semibold">{selectedBeritaAcara.createdByName || 'Staff NOC'}</strong> {selectedBeritaAcara.createdByRole ? `(${selectedBeritaAcara.createdByRole})` : ''}</span>
              </span>
            </div>

            {/* Modal Body: A4 Paper Document */}
            <div className="print-modal-body p-4 lg:p-8 overflow-y-auto bg-slate-100/70 flex justify-center">
              <div id="history-berita-acara-modal-doc" className="print-modal-doc-wrapper w-full max-w-[210mm] shadow-lg shadow-slate-300/60 rounded-sm">
                <BeritaAcaraPaperDocument
                  doc={selectedBeritaAcara}
                  template={beritaAcaraTemplate || template}
                  id="berita-acara-paper-doc"
                  previewPageFilter={baModalPageTab}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deleteConfirmItem && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Apakah Anda yakin ingin menghapus arsip{' '}
              <strong className="text-slate-900 uppercase font-bold">{deleteConfirmItem.type}</strong> dengan nomor{' '}
              <code className="text-blue-700 font-mono font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                {deleteConfirmItem.number}
              </code>
              ? Dokumen ini akan dihapus secara permanen dari penyimpanan.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-300 shadow-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
              >
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offscreen background rendering container for direct PDF download without opening modal */}
      {exportingItem && (
        <div
          id="pdf-direct-export-hidden-container"
          aria-hidden="true"
          className="no-print"
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            width: '794px',
            opacity: 0,
            pointerEvents: 'none',
            zIndex: -1,
          }}
        >
          {exportingItem.type === 'rfo' && exportingItem.rawRFO && (
            <div id="direct-export-rfo-doc" className="w-[794px]">
              <RFOPaperDocument
                rfo={exportingItem.rawRFO}
                template={template}
                id="direct-export-rfo-paper"
              />
            </div>
          )}

          {exportingItem.type === 'surat-tugas' && exportingItem.rawSuratTugas && (
            <div id="direct-export-st-doc" className="w-[794px]">
              <SuratTugasPaperDocument
                doc={exportingItem.rawSuratTugas}
                template={suratTugasTemplate}
                id="direct-export-st-paper"
              />
            </div>
          )}

          {exportingItem.type === 'berita-acara' && exportingItem.rawBeritaAcara && (
            <div id="direct-export-ba-doc" className="w-[794px] flex flex-col gap-4">
              <BeritaAcaraPaperDocument
                doc={exportingItem.rawBeritaAcara}
                template={beritaAcaraTemplate}
                id="direct-export-ba-paper"
                previewPageFilter="all"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
