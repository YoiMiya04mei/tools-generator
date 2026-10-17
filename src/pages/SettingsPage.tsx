import React, { useState } from 'react';
import {
  Settings,
  Database,
  Server,
  Shield,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { storageService } from '../services/storageService';
import type { ToastMessage } from '../components/Toast';


interface SettingsPageProps {
  addToast: (type: ToastMessage['type'], title: string, message?: string) => void;
  onRefreshData?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  addToast,
  onRefreshData,
}) => {
  const [activeRole, setActiveRole] = useState<'NOC' | 'Customer Service' | 'Admin'>('NOC');

  // Export all RFO and Template data to JSON file
  const handleExportBackup = async () => {
    try {
      const rfos = await storageService.getAllRFOs();
      const template = await storageService.getTemplate();
      const backupData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        company: 'PT Jembatan Data Pangrango',
        rfos,
        template,
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `JDP_RFO_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      addToast('success', 'Backup Berhasil', 'Seluruh data RFO diekspor ke file JSON.');
    } catch {
      addToast('error', 'Gagal', 'Gagal membuat file backup.');
    }
  };

  // Import JSON backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.rfos && Array.isArray(parsed.rfos)) {
          for (const rfo of parsed.rfos) {
            await storageService.saveRFO(rfo);
          }
          if (parsed.template) {
            await storageService.saveTemplate(parsed.template);
          }
          addToast(
            'success',
            'Impor Sukses',
            `Berhasil memuat ${parsed.rfos.length} data arsip RFO.`
          );
          if (onRefreshData) onRefreshData();
        } else {
          addToast('error', 'Format Tidak Sesuai', 'File JSON tidak memiliki struktur RFO valid.');
        }
      } catch {
        addToast('error', 'Gagal', 'File JSON rusak atau tidak terbaca.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Clear data
  const handleClearAll = () => {
    if (
      window.confirm(
        'PERINGATAN: Seluruh arsip RFO dan draft di browser ini akan dihapus permanen. Lanjutkan?'
      )
    ) {
      localStorage.clear();
      addToast('info', 'Storage Dibersihkan', 'Seluruh data lokal telah dikosongkan.');
      if (onRefreshData) onRefreshData();
      window.location.reload();
    }
  };

  return (
    <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto max-w-5xl">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          Pengaturan Sistem & Kesiapan Backend
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Arsitektur modular siap integrasi ke PostgreSQL/MySQL REST API dan Multi-role Access.
        </p>
      </div>

      {/* Role Simulation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Simulasi Role Pengguna</h3>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
            Current: {activeRole}
          </span>
        </div>

        <p className="text-xs text-slate-300">
          Aplikasi dirancang dengan isolasi hak akses antara tim NOC (teknis/insiden), Customer Service (distribusi pelanggan), dan Administrator (konfigurasi template).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {(['NOC', 'Customer Service', 'Admin'] as const).map((role) => (
            <button
              key={role}
              onClick={() => {
                setActiveRole(role);
                addToast('info', 'Role Diubah', `Beralih ke mode profil ${role}.`);
              }}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                activeRole === role
                  ? 'bg-cyan-500/10 border-cyan-500 text-white font-semibold'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold">{role}</span>
                {activeRole === role && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
              </div>
              <p className="text-[11px] text-slate-400">
                {role === 'NOC' && 'Akses penuh input gangguan & durasi insiden.'}
                {role === 'Customer Service' && 'Akses copy text, kirim WhatsApp, & cetak PDF.'}
                {role === 'Admin' && 'Akses ubah template kop surat & kelola database.'}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Future Backend & Architecture Readiness */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Backend & Database Abstraction</h3>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
            Storage: IStorageProvider (Decoupled)
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Seluruh interaksi data menggunakan abstraction layer <code>storageService.ts</code>. Untuk menghubungkan ke backend PostgreSQL atau MySQL, cukup buat implementasi <code>ApiStorageProvider</code> tanpa perlu memodifikasi komponen antarmuka.
        </p>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
          <div className="text-slate-500">// REST API Endpoints Contract Ready:</div>
          <div><span className="text-emerald-400 font-bold">GET</span>    /api/v1/rfos                 <span className="text-slate-500">// List & search history</span></div>
          <div><span className="text-blue-400 font-bold">POST</span>   /api/v1/rfos                 <span className="text-slate-500">// Save new RFO</span></div>
          <div><span className="text-amber-400 font-bold">PUT</span>    /api/v1/rfos/:id             <span className="text-slate-500">// Update existing RFO</span></div>
          <div><span className="text-rose-400 font-bold">DELETE</span> /api/v1/rfos/:id             <span className="text-slate-500">// Delete archive</span></div>
          <div><span className="text-emerald-400 font-bold">GET</span>    /api/v1/template             <span className="text-slate-500">// Fetch company template</span></div>
          <div><span className="text-blue-400 font-bold">POST</span>   /api/v1/template             <span className="text-slate-500">// Update template</span></div>
        </div>
      </div>

      {/* Backup & Data Management */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Database className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">Manajemen Data & Backup</h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Ekspor Backup JSON</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Impor Data Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>

          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold border border-rose-800/40 transition-colors ml-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>Bersihkan Semua Data Lokal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
