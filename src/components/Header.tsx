import React, { useState, useEffect } from 'react';
import { PlusCircle, Clock, Menu, LogOut, ChevronDown, User } from 'lucide-react';
import type { ActiveTab } from '../types/rfo';
import type { UserAccount } from '../types/auth';
import { ROLE_LABELS, ROLE_PERMISSIONS } from '../types/auth';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  toggleMobileMenu?: () => void;
  currentUser?: UserAccount | null;
  onLogout?: () => void;
  onSwitchAccount?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  toggleMobileMenu,
  currentUser,
  onLogout,
  onSwitchAccount,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [profileOpen, setProfileOpen] = useState<boolean>(false);

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
      title: 'NOC Incident Dashboard',
      subtitle: 'Ringkasan operasional gangguan & status dokumen RFO',
    },
    create: {
      title: 'Automatic RFO Generator',
      subtitle: 'Buat dokumen Reason For Outage profesional dengan kalkulasi otomatis',
    },
    history: {
      title: 'RFO Archive & History',
      subtitle: 'Kelola, cari, cetak, dan duplikasi arsip gangguan tersimpan',
    },
    templates: {
      title: 'RFO Template Configuration',
      subtitle: 'Pengaturan kop surat perusahaan, kontak darurat, dan penandatangan',
    },
    users: {
      title: 'User Management & Access Control',
      subtitle: 'Kelola akun anggota terdaftar dan hak akses pembuatan RFO',
    },
    settings: {
      title: 'System & Architecture Settings',
      subtitle: 'Status storage, export/import data, dan integrasi backend',
    },
  };

  const current = titles[activeTab] || titles.dashboard;
  const canCreate = currentUser ? ROLE_PERMISSIONS[currentUser.role]?.canCreateRFO : true;
  const userBadge = currentUser ? ROLE_LABELS[currentUser.role] : null;

  return (
    <header className="no-print h-20 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between shrink-0 z-10 sticky top-0">
      <div className="flex items-center gap-4">
        {toggleMobileMenu && (
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            {current.title}
          </h2>
          <p className="text-xs text-slate-400 hidden sm:block">
            {current.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Live WIB Clock */}
        <div className="hidden xl:flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 px-3.5 py-1.5 rounded-lg text-xs font-mono text-cyan-300 shadow-inner">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{timeStr || 'Memuat waktu WIB...'}</span>
        </div>

        {/* Quick Create Action Button (if allowed by role) */}
        {activeTab !== 'create' && canCreate && (
          <button
            onClick={() => setActiveTab('create')}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-cyan-950 transition-all duration-200 cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">+ Create RFO</span>
          </button>
        )}

        {/* User Account Profile Pill */}
        {currentUser && (
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700/80 transition-all cursor-pointer text-left"
            >
              <div
                className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${
                  currentUser.avatarColor || 'from-cyan-600 to-blue-600'
                } flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0`}
              >
                {currentUser.name.charAt(0)}
              </div>

              <div className="hidden sm:flex flex-col overflow-hidden max-w-[130px]">
                <span className="text-xs font-bold text-white truncate leading-tight">
                  {currentUser.name}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase leading-tight ${
                      userBadge?.badgeClass || 'bg-slate-700 text-slate-300'
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
                  className="fixed inset-0 z-30"
                  onClick={() => setProfileOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-3 z-40 space-y-2 animate-scale-up">
                  <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                    <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono truncate">
                      @{currentUser.username} • {currentUser.position}
                    </p>
                    <div className="pt-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                          userBadge?.badgeClass || ''
                        }`}
                      >
                        {userBadge?.label}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    {onSwitchAccount && (
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          onSwitchAccount();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Ganti Akun (Switch Account)</span>
                      </button>
                    )}

                    {onLogout && (
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-red-400" />
                        <span>Keluar (Logout)</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
