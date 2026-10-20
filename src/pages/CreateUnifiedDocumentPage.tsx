import React from 'react';
import { AlertCircle, ClipboardList, FileText, UserCheck, Clock } from 'lucide-react';
import type { ActiveTab, RFODocument, RFOTemplate } from '../types/rfo';
import type { SuratTugasDocument, SuratTugasTemplate } from '../types/suratTugas';
import type { BeritaAcaraDocument, BeritaAcaraTemplate } from '../types/beritaAcara';
import type { UserAccount } from '../types/auth';
import type { ToastMessage } from '../components/Toast';
import { formatIndonesianDateOnly } from '../utils/dateFormatter';

import { CreateRFOPage } from './CreateRFOPage';
import { CreateSuratTugasPage } from './CreateSuratTugasPage';
import { CreateBeritaAcaraPage } from './CreateBeritaAcaraPage';

interface CreateUnifiedDocumentPageProps {
  activeTab: 'create' | 'create-st' | 'create-ba';
  setActiveTab: (tab: ActiveTab) => void;
  // RFO Props
  template: RFOTemplate;
  editingRFO: RFODocument | null;
  onRFOSaved: () => void;
  // Surat Tugas Props
  suratTugasTemplate: SuratTugasTemplate;
  editingSuratTugas: SuratTugasDocument | null;
  onSuratTugasSaved: () => void;
  // Berita Acara Props
  beritaAcaraTemplate: BeritaAcaraTemplate;
  editingBeritaAcara: BeritaAcaraDocument | null;
  onBeritaAcaraSaved: () => void;
  // Common
  addToast: (type: ToastMessage['type'], title: string, message?: string) => void;
  currentUser: UserAccount | null;
}

export const CreateUnifiedDocumentPage: React.FC<CreateUnifiedDocumentPageProps> = ({
  activeTab,
  setActiveTab,
  template,
  editingRFO,
  onRFOSaved,
  suratTugasTemplate,
  editingSuratTugas,
  onSuratTugasSaved,
  beritaAcaraTemplate,
  editingBeritaAcara,
  onBeritaAcaraSaved,
  addToast,
  currentUser,
}) => {
  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-slate-50">
      {/* Top Document Type Selector Header Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 z-10 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
            Pilih Jenis Dokumen:
          </span>
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl">
            {/* 1. RFO Switcher */}
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-white text-blue-700 border border-slate-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <AlertCircle className={`w-3.5 h-3.5 ${activeTab === 'create' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>RFO (Reason For Outage)</span>
            </button>

            {/* 2. Surat Tugas Switcher */}
            <button
              type="button"
              onClick={() => setActiveTab('create-st')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'create-st'
                  ? 'bg-white text-blue-700 border border-slate-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <ClipboardList className={`w-3.5 h-3.5 ${activeTab === 'create-st' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Surat Tugas Visit</span>
            </button>

            {/* 3. Berita Acara Switcher */}
            <button
              type="button"
              onClick={() => setActiveTab('create-ba')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'create-ba'
                  ? 'bg-white text-blue-700 border border-slate-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <FileText className={`w-3.5 h-3.5 ${activeTab === 'create-ba' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Berita Acara Visit</span>
            </button>
          </div>
        </div>

        {/* Author & Creation Date Indicator */}
        <div className="flex items-center gap-2 text-xs">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Dibuat Oleh: <strong className="text-slate-900 font-bold">{currentUser?.name || 'Staff NOC'}</strong></span>
            {currentUser?.role && (
              <span className="text-[10px] uppercase font-bold text-slate-700 bg-slate-200/70 px-1.5 py-0.5 rounded border border-slate-300">
                {currentUser.role}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
            <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="hidden md:inline text-slate-500">Tanggal:</span>
            <span className="font-mono font-bold text-slate-900">{formatIndonesianDateOnly(new Date())}</span>
          </div>
        </div>
      </div>

      {/* Main Generator Body (unmodified original pages) */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {activeTab === 'create' && (
          <CreateRFOPage
            template={template}
            addToast={addToast}
            initialEditData={editingRFO}
            onSaved={onRFOSaved}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'create-st' && (
          <CreateSuratTugasPage
            template={template}
            suratTugasTemplate={suratTugasTemplate}
            addToast={addToast}
            initialEditData={editingSuratTugas}
            onSaved={onSuratTugasSaved}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'create-ba' && (
          <CreateBeritaAcaraPage
            template={template}
            beritaAcaraTemplate={beritaAcaraTemplate}
            addToast={addToast}
            initialEditData={editingBeritaAcara}
            onSaved={onBeritaAcaraSaved}
            currentUser={currentUser}
          />
        )}
      </div>
    </div>
  );
};
