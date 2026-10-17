import React, { useState, useEffect } from 'react';
import { PlusCircle, Clock, Menu } from 'lucide-react';
import type { ActiveTab } from '../types/rfo';


interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  toggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  toggleMobileMenu,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

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
    settings: {
      title: 'System & Architecture Settings',
      subtitle: 'Status storage, export/import data, dan integrasi backend',
    },
  };

  const current = titles[activeTab] || titles.dashboard;

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

      <div className="flex items-center gap-4">
        {/* Live WIB Clock */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 px-3.5 py-1.5 rounded-lg text-xs font-mono text-cyan-300 shadow-inner">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{timeStr || 'Memuat waktu WIB...'}</span>
        </div>

        {/* Quick Create Action Button */}
        {activeTab !== 'create' && (
          <button
            onClick={() => setActiveTab('create')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-cyan-950 transition-all duration-200 cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Create RFO</span>
          </button>
        )}
      </div>
    </header>
  );
};
