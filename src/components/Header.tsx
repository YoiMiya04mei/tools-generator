import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Clock,
  Menu,
  LogOut,
  ChevronDown,
  User,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import type { ActiveTab } from '../types/rfo';
import type { UserAccount } from '../types/auth';
import { ROLE_LABELS, ROLE_PERMISSIONS } from '../types/auth';
import { authService } from '../services/authService';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  toggleMobileMenu?: () => void;
  currentUser?: UserAccount | null;
  onLogout?: () => void;
  onSwitchAccount?: () => void;
  onUserUpdated?: (user: UserAccount) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  toggleMobileMenu,
  currentUser,
  onLogout,
  onSwitchAccount,
  onUserUpdated,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [profileOpen, setProfileOpen] = useState<boolean>(false);

  // Self Edit Profile states
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [selfName, setSelfName] = useState<string>('');
  const [selfUsername, setSelfUsername] = useState<string>('');
  const [selfPassword, setSelfPassword] = useState<string>('');
  const [showSelfPassword, setShowSelfPassword] = useState<boolean>(false);
  const [selfError, setSelfError] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format WIB
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Jakarta',
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      const formatted = new Intl.DateTimeFormat('id-ID', options).format(now);
      setTimeStr(`${formatted} WIB`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const titles: Record<ActiveTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'GENERATOR TOOLS Dashboard',
      subtitle: 'Pusat ringkasan operasional & manajemen dokumen (Surat Tugas, Berita Acara, & RFO)',
    },
    create: {
      title: 'Penerbitan Dokumen & Surat',
      subtitle: 'Pilih jenis dokumen (Surat Tugas, Berita Acara, atau RFO) untuk membuat surat baru',
    },
    history: {
      title: 'Arsip & Riwayat Dokumen',
      subtitle: 'Pusat arsip terpadu untuk dokumen Surat Tugas Visit, Berita Acara, dan RFO',
    },
    'create-st': {
      title: 'Penerbitan Dokumen & Surat',
      subtitle: 'Pilih jenis dokumen (Surat Tugas, Berita Acara, atau RFO) untuk membuat surat baru',
    },
    'history-st': {
      title: 'Arsip & Riwayat Dokumen',
      subtitle: 'Pusat arsip terpadu untuk dokumen Surat Tugas Visit, Berita Acara, dan RFO',
    },
    'templates-st': {
      title: 'Template Surat Tugas Configuration',
      subtitle: 'Pengaturan kop surat, penandatangan, TTD, dan cap stempel Surat Tugas',
    },
    'create-ba': {
      title: 'Penerbitan Dokumen & Surat',
      subtitle: 'Pilih jenis dokumen (Surat Tugas, Berita Acara, atau RFO) untuk membuat surat baru',
    },
    'history-ba': {
      title: 'Arsip & Riwayat Dokumen',
      subtitle: 'Pusat arsip terpadu untuk dokumen Surat Tugas Visit, Berita Acara, dan RFO',
    },
    'templates-ba': {
      title: 'Template Berita Acara Configuration',
      subtitle: 'Pengaturan kop surat, penandatangan, tanda tangan, dan stempel Berita Acara',
    },
    templates: {
      title: 'Template RFO Configuration',
      subtitle: 'Pengaturan kop surat perusahaan, kontak darurat, dan penandatangan',
    },
    'create-pm': {
      title: 'Penerbitan Surat Permit Masuk & Keluar Barang',
      subtitle: 'Formulir izin masuk & keluar perangkat dengan spesifikasi unit terperinci',
    },
    'history-pm': {
      title: 'Arsip Surat Permit Barang',
      subtitle: 'Pusat arsip terpadu untuk dokumen Surat Permit Masuk & Keluar Barang',
    },
    'templates-pm': {
      title: 'Template Permit Barang Configuration',
      subtitle: 'Pengaturan kop surat, penerima default, penandatangan, TTD, dan cap stempel',
    },
    users: {
      title: 'User Management & Access Control',
      subtitle: 'Kelola akun anggota terdaftar dan hak akses penerbitan dokumen',
    },
    settings: {
      title: 'System & Architecture Settings',
      subtitle: 'Status storage, export/import data, dan integrasi backend',
    },
    'traffic-qos': {
      title: 'Huawei Traffic Classifier & Behavior QoS Generator',
      subtitle: 'Generator skrip rate-limiting QoS (CIR, PIR, CBS, PBS) otomatis untuk router & switch Huawei',
    },
  };

  const current = titles[activeTab] || titles.dashboard;
  const canCreate = currentUser ? ROLE_PERMISSIONS[currentUser.role]?.canCreateRFO : true;
  const userBadge = currentUser ? ROLE_LABELS[currentUser.role] : null;

  return (
    <header className="no-print h-16 md:h-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between shrink-0 z-30 sticky top-0 shadow-xs">
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
        {toggleMobileMenu && (
          <button
            onClick={toggleMobileMenu}
            aria-label="Buka Menu Navigasi"
            className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition-colors shrink-0 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2 truncate max-w-[150px] xs:max-w-[210px] sm:max-w-none">
            {current.title}
          </h2>
          <p className="text-xs text-slate-500 hidden sm:block truncate">
            {current.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Live WIB Clock */}
        <div className="hidden xl:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-lg text-xs font-mono text-slate-700 shadow-xs">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>{timeStr || 'Memuat waktu WIB...'}</span>
        </div>

        {/* Quick Create Action Button (if allowed by role) */}
        {!['create', 'create-st', 'create-ba'].includes(activeTab) && canCreate && (
          <button
            onClick={() => setActiveTab('create')}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer active:scale-95 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">+ Buat Surat</span>
            <span className="sm:hidden font-bold">+ Surat</span>
          </button>
        )}

        {/* User Account Profile Pill */}
        {currentUser && (
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1 sm:px-3 sm:py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer text-left"
            >
              <div
                className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${
                  currentUser.avatarColor || 'from-blue-600 to-indigo-600'
                } flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0`}
              >
                {currentUser.name.charAt(0)}
              </div>

              <div className="hidden sm:flex flex-col overflow-hidden max-w-[130px]">
                <span className="text-xs font-bold text-slate-900 truncate leading-tight">
                  {currentUser.name}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase leading-tight ${
                      userBadge?.badgeClass || 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {userBadge?.label || currentUser.role}
                  </span>
                </div>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block shrink-0" />
            </button>

            {/* Profile Dropdown */}
            {profileOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-24px)] rounded-2xl bg-white border border-slate-200 shadow-2xl p-3 z-50 space-y-2 animate-scale-up">
                  <div className="p-3 bg-gradient-to-b from-slate-50 to-slate-100/70 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase shrink-0 ${
                          userBadge?.badgeClass || 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {userBadge?.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono truncate">
                      @{currentUser.username} • {currentUser.position}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setSelfName(currentUser.name);
                      setSelfUsername(currentUser.username);
                      setSelfPassword('');
                      setShowSelfPassword(false);
                      setSelfError('');
                      setEditModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ubah Username & Password</span>
                  </button>

                  {onSwitchAccount && (
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        onSwitchAccount();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <span>Ganti Akun (Switch Account)</span>
                    </button>
                  )}

                  {onLogout && (
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-600" />
                      <span>Keluar (Logout)</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal Self Edit Username & Password */}
      {editModalOpen && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Ubah Username & Password Anda
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Perbarui nama akun login dan kata sandi Anda
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {selfError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{selfError}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSelfError('');

                if (!selfUsername.trim()) {
                  setSelfError('Username tidak boleh kosong.');
                  return;
                }
                if (!selfName.trim()) {
                  setSelfError('Nama Lengkap tidak boleh kosong.');
                  return;
                }

                const res = authService.updateUser(currentUser.id, {
                  name: selfName,
                  username: selfUsername,
                  ...(selfPassword.trim() ? { password: selfPassword.trim() } : {}),
                });

                if (res.success && res.user) {
                  if (onUserUpdated) onUserUpdated(res.user);
                  setEditModalOpen(false);
                } else {
                  setSelfError(res.error || 'Gagal mengubah data.');
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nama Lengkap Pembuat RFO
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={selfName}
                    onChange={(e) => setSelfName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Username (Untuk Login)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs font-mono">
                    @
                  </div>
                  <input
                    type="text"
                    required
                    value={selfUsername}
                    onChange={(e) => setSelfUsername(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono shadow-xs"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Username unik untuk masuk ke sistem GENERATOR TOOLS.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Password Baru (Opsional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showSelfPassword ? 'text' : 'password'}
                    value={selfPassword}
                    onChange={(e) => setSelfPassword(e.target.value)}
                    placeholder="Kosongkan jika tidak ingin mengubah password"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-10 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSelfPassword(!showSelfPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showSelfPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Kosongkan jika tetap ingin memakai kata sandi yang sekarang.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
