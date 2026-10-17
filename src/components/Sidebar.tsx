import React from 'react';
import {
  LayoutDashboard,
  FilePlus2,
  FolderClock,
  Sliders,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import type { ActiveTab } from '../types/rfo';
import type { UserAccount } from '../types/auth';
import { ROLE_PERMISSIONS } from '../types/auth';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  hasDraft?: boolean;
  currentUser?: UserAccount | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  hasDraft = false,
  currentUser,
}) => {
  const canCreate = currentUser ? ROLE_PERMISSIONS[currentUser.role]?.canCreateRFO : true;
  const isAdmin = currentUser?.role === 'admin';

  const allNavItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
      badge: null,
      show: true,
    },
    {
      id: 'create' as ActiveTab,
      label: 'Create RFO',
      icon: canCreate ? (
        <FilePlus2 className="w-5 h-5 shrink-0" />
      ) : (
        <Lock className="w-5 h-5 shrink-0 text-slate-500" />
      ),
      badge: !canCreate ? 'Viewer' : hasDraft ? 'Draft' : null,
      show: canCreate,
    },
    {
      id: 'history' as ActiveTab,
      label: 'RFO History',
      icon: <FolderClock className="w-5 h-5 shrink-0" />,
      badge: null,
      show: true,
    },
    {
      id: 'templates' as ActiveTab,
      label: 'Kop Surat & Template',
      icon: <Sliders className="w-5 h-5 shrink-0" />,
      badge: 'Admin',
      show: isAdmin, // HANYA Super Admin yang dapat mengakses & mengelola kop surat dan template!
    },
    {
      id: 'users' as ActiveTab,
      label: 'Kelola Akun',
      icon: <Users className="w-5 h-5 shrink-0" />,
      badge: 'Admin',
      show: isAdmin, // HANYA Super Admin yang dapat mengelola akun pengguna!
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Settings',
      icon: <Settings className="w-5 h-5 shrink-0" />,
      badge: null,
      show: isAdmin, // HANYA Super Admin yang dapat mengelola backup & database!
    },
  ];

  const navItems = allNavItems.filter((item) => item.show);

  return (
    <aside
      className={`no-print relative bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col justify-between shrink-0 z-20 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Branding */}
      <div>
        <div className="h-20 flex items-center px-4 border-b border-slate-800/80 gap-3">
          {/* Logo Icon */}
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-950 shrink-0">
            <svg className="w-7 h-7" viewBox="0 0 140 100" fill="none">
              <path d="M38 18L10 50L38 82L48 72L28 50L48 28L38 18Z" fill="#ffffff" />
              <path d="M50 28L32 50L50 72L58 64L46 50L58 36L50 28Z" fill="#38bdf8" />
            </svg>
          </div>

          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-extrabold text-sm text-white tracking-wide truncate">
                PT JEMBATAN DATA
              </span>
              <span className="text-[11px] font-semibold text-cyan-400 tracking-wider uppercase">
                PANGRANGO • NOC
              </span>
            </div>
          )}
        </div>

        {/* System Status Indicator */}
        {!collapsed && (
          <div className="mx-4 my-4 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-slate-300">NOC System Active</span>
              <span className="text-[10px] text-emerald-400 font-mono">Timezone: WIB (UTC+7)</span>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`}
              >
                <div
                  className={`transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-cyan-400'
                  }`}
                >
                  {item.icon}
                </div>

                {!collapsed && <span className="truncate">{item.label}</span>}

                {/* Badge if any */}
                {item.badge && !collapsed && (
                  <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
                {item.badge && collapsed && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-900" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer & Collapse Toggle */}
      <div className="p-3 border-t border-slate-800">
        {!collapsed ? (
          <div className="flex items-center justify-between text-xs text-slate-400 px-2 py-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>RFO Generator v1.0</span>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Kecilkan Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center py-2">
            <button
              onClick={() => setCollapsed(false)}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Perluas Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
