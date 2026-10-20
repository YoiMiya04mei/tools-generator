import React, { useState, useEffect } from 'react';
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
  ClipboardList,
  FileText,
  ChevronDown,
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
  const isTemplatesActive =
    activeTab === 'templates' || activeTab === 'templates-st' || activeTab === 'templates-ba';
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState<boolean>(true);

  useEffect(() => {
    if (isTemplatesActive) {
      setIsTemplateMenuOpen(true);
    }
  }, [isTemplatesActive]);

  const allNavItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
      badge: null,
      show: true,
      dividerBefore: null,
    },
    {
      id: 'create' as ActiveTab,
      label: 'Buat Surat',
      icon: canCreate ? (
        <FilePlus2 className="w-5 h-5 shrink-0" />
      ) : (
        <Lock className="w-5 h-5 shrink-0 text-slate-500" />
      ),
      badge: !canCreate ? 'Viewer' : hasDraft ? 'Draft' : null,
      show: canCreate,
      dividerBefore: 'DOKUMEN & SURAT',
    },
    {
      id: 'history' as ActiveTab,
      label: 'Arsip Dokumen',
      icon: <FolderClock className="w-5 h-5 shrink-0" />,
      badge: null,
      show: true,
      dividerBefore: null,
    },
    {
      id: 'templates' as ActiveTab,
      label: 'Template Surat',
      icon: <Sliders className="w-5 h-5 shrink-0" />,
      badge: 'Admin',
      show: isAdmin,
      dividerBefore: 'PENGATURAN',
    },
    {
      id: 'users' as ActiveTab,
      label: 'Kelola Akun',
      icon: <Users className="w-5 h-5 shrink-0" />,
      badge: 'Admin',
      show: isAdmin,
      dividerBefore: null,
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Settings',
      icon: <Settings className="w-5 h-5 shrink-0" />,
      badge: null,
      show: isAdmin,
      dividerBefore: null,
    },
  ];

  const navItems = allNavItems.filter((item) => item.show);

  return (
    <aside
      className={`no-print relative bg-white border-r border-slate-200 transition-all duration-300 flex flex-col justify-between shrink-0 z-20 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Branding */}
      <div>
        <div className="h-20 flex items-center px-4 border-b border-slate-200 gap-3">
          {/* Logo Icon */}
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <svg className="w-7 h-7" viewBox="0 0 140 100" fill="none">
              <path d="M38 18L10 50L38 82L48 72L28 50L48 28L38 18Z" fill="#ffffff" />
              <path d="M50 28L32 50L50 72L58 64L46 50L58 36L50 28Z" fill="#93c5fd" />
            </svg>
          </div>

          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-extrabold text-sm text-slate-900 tracking-wide truncate">
                GENERATOR TOOLS
              </span>
              <span className="text-[10px] font-bold text-blue-600 tracking-wider uppercase truncate">
                PT Jembatan Data Pangrango
              </span>
            </div>
          )}
        </div>

        {/* System Status Indicator */}
        {!collapsed && (
          <div className="mx-4 my-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-700">GENERATOR TOOLS Active</span>
              <span className="text-[10px] text-emerald-600 font-mono font-medium">Timezone: WIB (UTC+7)</span>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            if (item.id === 'templates') {
              const isGroupActive = activeTab === 'templates' || activeTab === 'templates-st' || activeTab === 'templates-ba';
              return (
                <React.Fragment key={item.id}>
                  {item.dividerBefore && !collapsed && (
                    <div className="pt-3 pb-1 px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      {item.dividerBefore}
                    </div>
                  )}
                  {item.dividerBefore && collapsed && (
                    <div className="my-1.5 border-t border-slate-200" />
                  )}

                  {/* Parent Button: Template Surat */}
                  <button
                    onClick={() => {
                      if (collapsed) {
                        setCollapsed(false);
                        setIsTemplateMenuOpen(true);
                        setActiveTab('templates');
                        return;
                      }
                      setIsTemplateMenuOpen((prev) => !prev);
                      if (!isGroupActive) {
                        setActiveTab('templates');
                      }
                    }}
                    title={collapsed ? 'Template Surat (RFO & Surat Tugas)' : undefined}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                      isGroupActive
                        ? 'bg-slate-100 text-slate-900 font-semibold border border-slate-200 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`transition-colors ${
                        isGroupActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'
                      }`}
                    >
                      {item.icon}
                    </div>

                    {!collapsed && <span className="truncate">{item.label}</span>}

                    {!collapsed && (
                      <div className="ml-auto flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Admin
                        </span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                            isTemplateMenuOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    )}

                    {collapsed && isGroupActive && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
                    )}
                  </button>

                  {/* Sub Menu: 1. Template RFO & 2. Template Surat Tugas & 3. Template Berita Acara */}
                  {isTemplateMenuOpen && !collapsed && (
                    <div className="ml-5 pl-3 py-1 space-y-1 border-l-2 border-slate-200 animate-in fade-in slide-in-from-top-1 duration-150">
                      {/* Sub 1: Template RFO */}
                      <button
                        onClick={() => setActiveTab('templates')}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${
                          activeTab === 'templates'
                            ? 'bg-blue-600 text-white font-bold shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                        }`}
                      >
                        <FileText
                          className={`w-3.5 h-3.5 shrink-0 ${
                            activeTab === 'templates' ? 'text-white' : 'text-blue-600'
                          }`}
                        />
                        <span className="truncate">Template RFO</span>
                      </button>

                      {/* Sub 2: Template Surat Tugas */}
                      <button
                        onClick={() => setActiveTab('templates-st')}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                          activeTab === 'templates-st'
                            ? 'bg-blue-600 text-white font-bold shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <ClipboardList
                            className={`w-3.5 h-3.5 shrink-0 ${
                              activeTab === 'templates-st' ? 'text-white' : 'text-blue-600'
                            }`}
                          />
                          <span className="truncate">Template Surat Tugas</span>
                        </div>
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full shrink-0 ${
                          activeTab === 'templates-st' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          Resmi
                        </span>
                      </button>

                      {/* Sub 3: Template Berita Acara */}
                      <button
                        onClick={() => setActiveTab('templates-ba')}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                          activeTab === 'templates-ba'
                            ? 'bg-blue-600 text-white font-bold shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <FileText
                            className={`w-3.5 h-3.5 shrink-0 ${
                              activeTab === 'templates-ba' ? 'text-white' : 'text-blue-600'
                            }`}
                          />
                          <span className="truncate">Template Berita Acara</span>
                        </div>
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full shrink-0 ${
                          activeTab === 'templates-ba' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          Baru
                        </span>
                      </button>
                    </div>
                  )}
                </React.Fragment>
              );
            }

            const isActive =
              item.id === 'create'
                ? activeTab === 'create' || activeTab === 'create-st' || activeTab === 'create-ba'
                : item.id === 'history'
                ? activeTab === 'history' || activeTab === 'history-st' || activeTab === 'history-ba'
                : activeTab === item.id;
            return (
              <React.Fragment key={item.id}>
                {item.dividerBefore && !collapsed && (
                  <div className="pt-3 pb-1 px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    {item.dividerBefore}
                  </div>
                )}
                {item.dividerBefore && collapsed && (
                  <div className="my-1.5 border-t border-slate-200" />
                )}
                <button
                  onClick={() => setActiveTab(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/80 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`transition-colors ${
                      isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'
                    }`}
                  >
                    {item.icon}
                  </div>

                  {!collapsed && <span className="truncate">{item.label}</span>}

                  {/* Badge if any */}
                  {item.badge && !collapsed && (
                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      {item.badge}
                    </span>
                  )}
                  {item.badge && collapsed && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Footer & Collapse Toggle */}
      <div className="p-3 border-t border-slate-200">
        {!collapsed ? (
          <div className="flex items-center justify-between text-xs text-slate-500 px-2 py-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span className="font-medium">GENERATOR TOOLS v1.0</span>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              title="Kecilkan Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center py-2">
            <button
              onClick={() => setCollapsed(false)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
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
