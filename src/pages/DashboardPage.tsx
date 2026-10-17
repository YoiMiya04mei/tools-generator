import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  Clock,
  TrendingUp,
  PlusCircle,
  Copy,
  FolderClock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import type { RFODocument, RFOTemplate, ActiveTab } from '../types/rfo';
import { RFOService } from '../services/rfoService';
import type { DashboardStats } from '../services/rfoService';
import { formatIndonesianDateTime, formatIndonesianDateOnly } from '../utils/dateFormatter';
import type { ToastMessage } from '../components/Toast';


interface DashboardPageProps {
  template: RFOTemplate;
  setActiveTab: (tab: ActiveTab) => void;
  onEditRFO: (rfo: RFODocument) => void;
  onViewRFO: (rfo: RFODocument) => void;
  addToast: (type: ToastMessage['type'], title: string, message?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  template,
  setActiveTab,
  onEditRFO,
  onViewRFO,
  addToast,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const data = await RFOService.getDashboardStats();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCopyText = async (rfo: RFODocument) => {
    const text = RFOService.generatePlainText(rfo, template);
    try {
      await navigator.clipboard.writeText(text);
      addToast('success', 'Teks RFO Disalin', `RFO #${rfo.id} berhasil disalin ke clipboard.`);
    } catch {
      addToast('error', 'Gagal', 'Izin clipboard browser ditolak.');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Memuat dashboard operasional NOC...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto">
      {/* Top Banner with Quick Actions */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 p-6 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                PT Jembatan Data Pangrango
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Automatic RFO Generator System
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Network Operations Center & Customer Care
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Platform internal pembuatan laporan insiden (Reason For Outage) resmi perusahaan.
              Hitung durasi gangguan otomatis, preview format A4, cetak dokumen, dan ekspor instan.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('create')}
            className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-950 transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <PlusCircle className="w-5 h-5" />
            <span>+ Create New RFO</span>
          </button>
        </div>
      </div>

      {/* 4 Core Metric KPI Cards (Section 13) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total RFO */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total RFO Dibuat</span>
            <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-white tracking-tight font-mono">
              {stats?.totalRFO ?? 0}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">Dokumen tersimpan di arsip</p>
          </div>
        </div>

        {/* RFO Bulan Ini */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">RFO Bulan Ini</span>
            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-white tracking-tight font-mono">
              {stats?.thisMonthCount ?? 0}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">Insiden bulan berjalan</p>
          </div>
        </div>

        {/* RFO Minggu Ini */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">RFO Minggu Ini</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-white tracking-tight font-mono">
              {stats?.thisWeekCount ?? 0}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">Dalam 7 hari terakhir</p>
          </div>
        </div>

        {/* RFO Terakhir */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">RFO Terakhir</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-sm font-bold text-white tracking-tight truncate block">
              {stats?.latestRFO
                ? stats.latestRFO.totalDuration
                : 'Belum ada data'}
            </span>
            <p className="text-[11px] text-slate-400 truncate mt-1">
              {stats?.latestRFO
                ? formatIndonesianDateOnly(stats.latestRFO.rfoDate)
                : 'Arsip kosong'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Latest RFO Spotlight & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Latest RFO Spotlight (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Insiden Terakhir Tercatat</h3>
              </div>
              {stats?.latestRFO && (
                <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                  {stats.latestRFO.id}
                </span>
              )}
            </div>

            {stats?.latestRFO ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/50 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Waktu Mulai:</span>
                    <span className="text-white font-medium">
                      {formatIndonesianDateTime(stats.latestRFO.startTime)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Waktu Selesai:</span>
                    <span className="text-white font-medium">
                      {formatIndonesianDateTime(stats.latestRFO.endTime)}
                    </span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-700/60 flex items-center justify-between">
                    <span className="text-slate-400">Total Durasi Gangguan:</span>
                    <span className="font-bold text-cyan-300 font-mono text-sm">
                      {stats.latestRFO.totalDuration}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-400 mb-1">Root Cause:</h4>
                  <p className="text-sm text-slate-200 bg-slate-800/30 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                    {stats.latestRFO.rootCause}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-400 mb-1">Action Taken:</h4>
                  <p className="text-sm text-slate-200 bg-slate-800/30 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                    {stats.latestRFO.actionTaken}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500">
                <FolderClock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Belum ada insiden tersimpan.</p>
              </div>
            )}
          </div>

          {stats?.latestRFO && (
            <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => onViewRFO(stats.latestRFO!)}
                className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
              >
                <span>Lihat Dokumen Lengkap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQuickCopyText(stats.latestRFO!)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-blue-400" />
                  <span>Copy Text</span>
                </button>
                <button
                  onClick={() => onEditRFO(stats.latestRFO!)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                >
                  Edit / Duplikat
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Quick Recent List (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderClock className="w-4 h-4 text-cyan-400" />
                Riwayat RFO Terbaru
              </h3>
              <button
                onClick={() => setActiveTab('history')}
                className="text-xs text-cyan-400 hover:underline"
              >
                Semua Arsip
              </button>
            </div>

            <div className="space-y-3">
              {stats?.recentList && stats.recentList.length > 0 ? (
                stats.recentList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer group"
                    onClick={() => onViewRFO(item)}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-white group-hover:text-cyan-300">
                        {item.ticketNo || item.id}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatIndonesianDateOnly(item.rfoDate)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {item.rootCause}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="text-cyan-400 font-semibold">{item.totalDuration}</span>
                      <span className="text-slate-500 group-hover:text-slate-300 flex items-center gap-1">
                        Lihat <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 py-6 text-center">
                  Belum ada riwayat RFO tersimpan.
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={() => setActiveTab('create')}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-cyan-400" />
              <span>Buat RFO Baru Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
