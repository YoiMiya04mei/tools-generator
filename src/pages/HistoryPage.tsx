import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Eye,
  Edit3,
  Copy,
  Trash2,
  FileDown,
  MessageSquare,
  Clock,
  Filter,
  AlertCircle,
  X,
  UserCheck,
} from 'lucide-react';
import type { RFODocument, RFOTemplate, ActiveTab } from '../types/rfo';
import type { UserAccount } from '../types/auth';
import { ROLE_LABELS } from '../types/auth';
import { authService } from '../services/authService';
import { storageService } from '../services/storageService';
import { RFOService } from '../services/rfoService';
import { PDFService } from '../services/pdfService';
import {
  formatIndonesianDateOnly,
} from '../utils/dateFormatter';
import { RFOPaperDocument } from '../components/RFOPaperDocument';
import type { ToastMessage } from '../components/Toast';

interface HistoryPageProps {
  template: RFOTemplate;
  setActiveTab: (tab: ActiveTab) => void;
  onEditRFO: (rfo: RFODocument) => void;
  onDuplicateRFO: (rfo: RFODocument) => void;
  addToast: (type: ToastMessage['type'], title: string, message?: string) => void;
  currentUser?: UserAccount | null;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  template,
  setActiveTab,
  onEditRFO,
  onDuplicateRFO,
  addToast,
  currentUser,
}) => {
  const [rfos, setRfos] = useState<RFODocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterCreator, setFilterCreator] = useState<string>('');

  // Permissions based on currentUser
  const canCreate = currentUser ? authService.hasPermission(currentUser.role, 'canCreateRFO') : true;
  const canEdit = currentUser ? authService.hasPermission(currentUser.role, 'canEditRFO') : true;
  const canDelete = currentUser ? authService.hasPermission(currentUser.role, 'canDeleteRFO') : false;

  // Modal View state
  const [selectedRFO, setSelectedRFO] = useState<RFODocument | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    loadRFOs();
  }, []);

  const loadRFOs = async () => {
    setLoading(true);
    try {
      const list = await storageService.getAllRFOs();
      setRfos(list);
    } catch (e) {
      console.error(e);
      addToast('error', 'Gagal Memuat Data', 'Tidak dapat mengambil data arsip RFO.');
    } finally {
      setLoading(false);
    }
  };

  // Distinct creator options from registered users and stored RFOs
  const registeredUsers = useMemo(() => authService.getUsers(), []);
  const creatorOptions = useMemo(() => {
    const names = new Set<string>();
    registeredUsers.forEach((u) => names.add(u.name));
    rfos.forEach((r) => {
      if (r.createdByName) names.add(r.createdByName);
    });
    return Array.from(names);
  }, [rfos, registeredUsers]);

  // Filtered RFOs based on search, date, and creator filter
  const filteredList = useMemo(() => {
    return rfos.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.ticketNo && item.ticketNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.rootCause.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.actionTaken.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.createdByName && item.createdByName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDate =
        !filterDate ||
        (item.rfoDate && item.rfoDate.startsWith(filterDate)) ||
        (item.startTime && item.startTime.startsWith(filterDate));

      const matchesCreator =
        !filterCreator ||
        (item.createdByName && item.createdByName.toLowerCase() === filterCreator.toLowerCase()) ||
        (item.createdBy && item.createdBy === filterCreator);

      return matchesSearch && matchesDate && matchesCreator;
    });
  }, [rfos, searchQuery, filterDate, filterCreator]);

  // Copy Plain Text
  const handleCopyText = async (item: RFODocument) => {
    const text = RFOService.generatePlainText(item, template);
    try {
      await navigator.clipboard.writeText(text);
      addToast('success', 'Teks RFO Disalin', `Dokumen #${item.id} siap digunakan.`);
    } catch {
      addToast('error', 'Gagal Menyalin', 'Izin clipboard ditolak oleh browser.');
    }
  };

  // Copy WhatsApp
  const handleCopyWhatsApp = async (item: RFODocument) => {
    const text = RFOService.generateWhatsAppText(item, template);
    try {
      await navigator.clipboard.writeText(text);
      addToast('success', 'WhatsApp Format Disalin', 'Teks telah diformat rapi untuk WhatsApp.');
    } catch {
      addToast('error', 'Gagal Menyalin', 'Izin clipboard ditolak oleh browser.');
    }
  };

  // Download PDF
  const handleDownloadPDF = async (item: RFODocument) => {
    if (downloadingId) return;
    setDownloadingId(item.id);
    addToast('info', 'Membuat PDF...', 'Sedang merender layout PDF A4.');

    const isAlreadyMounted =
      selectedRFO?.id === item.id && !!document.getElementById('history-preview-modal-doc');

    const executeExport = async () => {
      try {
        const filename = await PDFService.exportToPDF({
          elementId: 'history-preview-modal-doc',
          rfoDate: item.rfoDate,
          rootCause: item.rootCause,
        });
        addToast('success', 'PDF Berhasil Diunduh', filename);
      } catch (err) {
        console.error('Error exportToPDF:', err);
        addToast('error', 'Gagal Mengunduh PDF', 'Terjadi kesalahan saat memproses PDF.');
      } finally {
        setDownloadingId(null);
      }
    };

    if (isAlreadyMounted) {
      setTimeout(executeExport, 50);
    } else {
      setSelectedRFO(item);
      setTimeout(executeExport, 300);
    }
  };

  // Delete Action
  const handleDelete = async (id: string) => {
    if (!canDelete) {
      addToast('error', 'Akses Ditolak', 'Hanya akun Super Admin yang berhak menghapus arsip RFO.');
      setDeleteConfirmId(null);
      return;
    }

    try {
      const success = await storageService.deleteRFO(id);
      if (success) {
        setRfos((prev) => prev.filter((item) => item.id !== id));
        addToast('info', 'Dokumen Dihapus', `RFO #${id} telah dihapus dari arsip.`);
        if (selectedRFO?.id === id) {
          setSelectedRFO(null);
        }
      }
    } catch (e) {
      console.error(e);
      addToast('error', 'Gagal Menghapus', 'Terjadi kesalahan sistem.');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto">
      {/* Top Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan Root Cause, Action Taken, No Tiket, Pembuat, atau ID..."
            className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Creator Filter */}
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <select
              value={filterCreator}
              onChange={(e) => setFilterCreator(e.target.value)}
              className="bg-transparent text-white focus:outline-none text-xs cursor-pointer max-w-[150px]"
            >
              <option value="" className="bg-slate-900 text-slate-300">
                Semua Pembuat
              </option>
              {creatorOptions.map((name) => (
                <option key={name} value={name} className="bg-slate-900 text-white">
                  {name}
                </option>
              ))}
            </select>
            {filterCreator && (
              <button
                onClick={() => setFilterCreator('')}
                className="text-slate-400 hover:text-white"
                title="Hapus filter pembuat"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-transparent text-white focus:outline-none text-xs font-mono"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="text-slate-400 hover:text-white"
                title="Hapus filter tanggal"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {canCreate && (
            <button
              onClick={() => setActiveTab('create')}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors shrink-0 whitespace-nowrap cursor-pointer shadow-md shadow-cyan-950"
            >
              + Buat RFO Baru
            </button>
          )}
        </div>
      </div>

      {/* RFO History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-300 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">ID & Tanggal</th>
                <th className="py-3 px-4">Pembuat Dokumen</th>
                <th className="py-3 px-4">Rentang Waktu Gangguan</th>
                <th className="py-3 px-4">Total Durasi</th>
                <th className="py-3 px-4">Root Cause & Action Taken</th>
                <th className="py-3 px-4 text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Memuat data arsip...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Tidak ada dokumen RFO yang cocok dengan pencarian atau filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* ID & Date */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-mono font-bold text-white group-hover:text-cyan-300">
                        {item.ticketNo || item.id}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {formatIndonesianDateOnly(item.rfoDate)}
                      </div>
                    </td>

                    {/* Creator Column */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                          {(item.createdByName || 'Staff NOC').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div
                            className="font-semibold text-slate-200 text-xs truncate max-w-[130px]"
                            title={item.createdByName || 'Staff NOC'}
                          >
                            {item.createdByName || 'Staff NOC'}
                          </div>
                          <div className="mt-0.5">
                            {item.createdByRole && ROLE_LABELS[item.createdByRole] ? (
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                  ROLE_LABELS[item.createdByRole].badgeClass
                                }`}
                              >
                                {ROLE_LABELS[item.createdByRole].label}
                              </span>
                            ) : (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border bg-slate-500/15 text-slate-300 border-slate-500/30">
                                Staff NOC
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Start - End Time */}
                    <td className="py-3.5 px-4 align-top font-mono text-[11px] text-slate-300">
                      <div>
                        <span className="text-slate-500">Mulai: </span>
                        {item.startTime ? item.startTime.replace('T', ' ') : '-'}
                      </div>
                      <div className="mt-0.5">
                        <span className="text-slate-500">Selesai: </span>
                        {item.endTime ? item.endTime.replace('T', ' ') : '-'}
                      </div>
                    </td>

                    {/* Duration Badge */}
                    <td className="py-3.5 px-4 align-top">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 font-bold font-mono text-xs">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        {item.totalDuration}
                      </span>
                    </td>

                    {/* Root Cause & Action Taken */}
                    <td className="py-3.5 px-4 align-top max-w-md">
                      <div className="line-clamp-2 text-slate-200 font-medium">
                        {item.rootCause}
                      </div>
                      <div className="line-clamp-1 text-slate-400 text-[11px] mt-1 italic">
                        ↳ {item.actionTaken}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 align-top text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View Modal */}
                        <button
                          onClick={() => setSelectedRFO(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Lihat Dokumen A4"
                        >
                          <Eye className="w-4 h-4 text-cyan-400" />
                        </button>

                        {/* Edit (Restricted by permission) */}
                        {canEdit ? (
                          <button
                            onClick={() => onEditRFO(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Edit RFO"
                          >
                            <Edit3 className="w-4 h-4 text-blue-400" />
                          </button>
                        ) : (
                          <button
                            disabled
                            className="p-1.5 rounded-lg bg-slate-900 text-slate-600 opacity-40 cursor-not-allowed"
                            title="Akses View-Only: Tidak diizinkan mengedit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Duplicate (Restricted by canCreate) */}
                        {canCreate ? (
                          <button
                            onClick={() => onDuplicateRFO(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Duplikasi Dokumen"
                          >
                            <Copy className="w-4 h-4 text-amber-400" />
                          </button>
                        ) : null}

                        {/* Download PDF */}
                        <button
                          onClick={() => handleDownloadPDF(item)}
                          disabled={downloadingId === item.id}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Download PDF"
                        >
                          <FileDown className={`w-4 h-4 text-emerald-400 ${downloadingId === item.id ? 'animate-bounce' : ''}`} />
                        </button>

                        {/* Copy WhatsApp */}
                        <button
                          onClick={() => handleCopyWhatsApp(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Copy WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4 text-emerald-500" />
                        </button>

                        {/* Delete (Admin only) */}
                        {canDelete ? (
                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Hapus RFO (Super Admin)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            disabled
                            className="p-1.5 rounded-lg bg-slate-900 text-slate-600 opacity-30 cursor-not-allowed"
                            title="Hanya Super Admin yang berhak menghapus arsip RFO"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <AlertCircle className="w-6 h-6" />
              <h4 className="font-bold text-white text-base">Konfirmasi Hapus</h4>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-5">
              Apakah Anda yakin ingin menghapus dokumen RFO{' '}
              <strong className="text-white">#{deleteConfirmId}</strong>? Tindakan ini
              tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-950"
              >
                Ya, Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Document Modal (Full A4 Preview with Quick Actions) */}
      {selectedRFO && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-sm font-bold text-white">
                  RFO: {selectedRFO.ticketNo || selectedRFO.id}
                </span>
                <span className="text-xs text-slate-400">
                  ({formatIndonesianDateOnly(selectedRFO.rfoDate)})
                </span>
                {/* Creator Badge in Modal */}
                <div className="flex items-center gap-1.5 pl-3 border-l border-slate-700 text-xs text-slate-300">
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Pembuat:</span>
                  <strong className="text-white font-semibold">
                    {selectedRFO.createdByName || 'Staff NOC'}
                  </strong>
                  {selectedRFO.createdByRole && ROLE_LABELS[selectedRFO.createdByRole] && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                        ROLE_LABELS[selectedRFO.createdByRole].badgeClass
                      }`}
                    >
                      {ROLE_LABELS[selectedRFO.createdByRole].label}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyText(selectedRFO)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5 text-blue-400" />
                  <span>Copy Text</span>
                </button>
                <button
                  onClick={() => handleCopyWhatsApp(selectedRFO)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => handleDownloadPDF(selectedRFO)}
                  disabled={downloadingId === selectedRFO.id}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-700/50 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <FileDown className={`w-3.5 h-3.5 ${downloadingId === selectedRFO.id ? 'animate-bounce' : ''}`} />
                  <span>{downloadingId === selectedRFO.id ? 'Mengunduh...' : 'Unduh PDF'}</span>
                </button>
                <button
                  onClick={() => setSelectedRFO(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: A4 Paper Preview */}
            <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-slate-950/50">
              <div className="w-full max-w-[210mm] shadow-2xl">
                <RFOPaperDocument
                  id="history-preview-modal-doc"
                  rfo={selectedRFO}
                  template={template}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
