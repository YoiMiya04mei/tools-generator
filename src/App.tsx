import { useState, useEffect } from 'react';
import type { ActiveTab, RFODocument, RFOTemplate } from './types/rfo';
import type { UserAccount } from './types/auth';
import { DEFAULT_RFO_TEMPLATE } from './templates/rfoTemplate';
import { storageService } from './services/storageService';
import { authService } from './services/authService';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginPage } from './components/LoginPage';
import { ToastContainer } from './components/Toast';
import type { ToastMessage } from './components/Toast';

import { DashboardPage } from './pages/DashboardPage';
import { CreateUnifiedDocumentPage } from './pages/CreateUnifiedDocumentPage';
import { HistoryPage } from './pages/HistoryPage';
import { TemplatePage } from './pages/TemplatePage';
import { SettingsPage } from './pages/SettingsPage';
import { UsersPage } from './pages/UsersPage';
import type { SuratTugasDocument, SuratTugasTemplate } from './types/suratTugas';
import { DEFAULT_SURAT_TUGAS_TEMPLATE } from './types/suratTugas';
import { suratTugasStorage } from './services/suratTugasStorage';
import type { BeritaAcaraDocument, BeritaAcaraTemplate } from './types/beritaAcara';
import { DEFAULT_BERITA_ACARA_TEMPLATE } from './types/beritaAcara';
import { beritaAcaraStorage } from './services/beritaAcaraStorage';

export function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [template, setTemplate] = useState<RFOTemplate>(DEFAULT_RFO_TEMPLATE);
  const [suratTugasTemplate, setSuratTugasTemplate] = useState<SuratTugasTemplate>(
    DEFAULT_SURAT_TUGAS_TEMPLATE
  );
  const [beritaAcaraTemplate, setBeritaAcaraTemplate] = useState<BeritaAcaraTemplate>(
    DEFAULT_BERITA_ACARA_TEMPLATE
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [editingRFO, setEditingRFO] = useState<RFODocument | null>(null);
  const [editingSuratTugas, setEditingSuratTugas] = useState<SuratTugasDocument | null>(null);
  const [editingBeritaAcara, setEditingBeritaAcara] = useState<BeritaAcaraDocument | null>(null);
  const [hasDraft, setHasDraft] = useState<boolean>(false);

  // Initialize template and check draft on startup
  useEffect(() => {
    loadTemplate();
    loadSuratTugasTemplate();
    loadBeritaAcaraTemplate();
    checkDraft();
  }, []);

  const loadTemplate = async () => {
    try {
      const t = await storageService.getTemplate();
      setTemplate(t);
    } catch (e) {
      console.warn('Template load fallback:', e);
    }
  };

  const loadSuratTugasTemplate = async () => {
    try {
      const stTmpl = await suratTugasStorage.getTemplate();
      setSuratTugasTemplate(stTmpl);
    } catch (e) {
      console.warn('Surat Tugas template load fallback:', e);
    }
  };

  const loadBeritaAcaraTemplate = async () => {
    try {
      const baTmpl = await beritaAcaraStorage.getTemplate();
      setBeritaAcaraTemplate(baTmpl);
    } catch (e) {
      console.warn('Berita Acara template load fallback:', e);
    }
  };

  const checkDraft = async () => {
    try {
      const d = await storageService.getDraft();
      setHasDraft(!!(d && (d.rootCause || d.actionTaken)));
    } catch {
      setHasDraft(false);
    }
  };

  // Toast notification helper
  const addToast = (type: ToastMessage['type'], title: string, message?: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Auth Handlers
  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    addToast('success', `Selamat Datang, ${user.name}!`, `Masuk sebagai ${user.position}.`);
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    addToast('info', 'Berhasil Keluar', 'Sesi akun Anda telah diakhiri.');
  };

  const handleSwitchAccount = () => {
    authService.logout();
    setCurrentUser(null);
    addToast('info', 'Ganti Akun', 'Silakan pilih akun atau login dengan kredensial lain.');
  };

  // Guard access based on role permissions
  useEffect(() => {
    if (!currentUser) return;
    const isAdmin = currentUser.role === 'admin';
    const canCreate = authService.hasPermission(currentUser.role, 'canCreateRFO');

    if (
      (activeTab === 'templates' ||
        activeTab === 'templates-st' ||
        activeTab === 'templates-ba' ||
        activeTab === 'users' ||
        activeTab === 'settings') &&
      !isAdmin
    ) {
      setActiveTab('dashboard');
      addToast('error', 'Akses Ditolak', 'Halaman tersebut hanya dapat diakses dan dikelola oleh Super Admin.');
    } else if ((activeTab === 'create' || activeTab === 'create-st' || activeTab === 'create-ba') && !canCreate) {
      setActiveTab('history');
      addToast('info', 'Akses Terbatas', 'Akun Auditor/Viewer hanya memiliki wewenang membaca arsip.');
    }
  }, [activeTab, currentUser]);

  // Edit RFO Handler
  const handleEditRFO = (rfo: RFODocument) => {
    setEditingRFO(rfo);
    setActiveTab('create');
    addToast('info', 'Mode Edit Dibuka', `Memuat dokumen RFO #${rfo.id} ke form.`);
  };

  // Duplicate RFO Handler
  const handleDuplicateRFO = (rfo: RFODocument) => {
    // Clone without the original ID so it saves as a new entry with current user as creator
    const clone: RFODocument = {
      ...rfo,
      id: '',
      ticketNo: rfo.ticketNo ? `${rfo.ticketNo}-COPY` : '',
      rfoDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUser?.id,
      createdByName: currentUser?.name || 'Staff NOC',
      createdByRole: currentUser?.role || 'engineer',
    };
    setEditingRFO(clone);
    setActiveTab('create');
    addToast('info', 'Duplikasi RFO', 'Data disalin ke formulir baru dengan identitas pembuat Anda.');
  };

  // View RFO Handler
  const handleViewRFO = (rfo: RFODocument) => {
    handleEditRFO(rfo);
  };

  // When saved successfully from create page
  const handleRFOSaved = () => {
    setEditingRFO(null);
    checkDraft();
    setActiveTab('history');
  };

  // Surat Tugas Handlers
  const handleEditSuratTugas = (doc: SuratTugasDocument) => {
    setEditingSuratTugas(doc);
    setActiveTab('create-st');
    addToast('info', 'Mode Edit Surat Tugas', `Memuat surat ${doc.letterNumber} ke form.`);
  };

  const handleDuplicateSuratTugas = async (doc: SuratTugasDocument) => {
    const nextSeq = await suratTugasStorage.getNextSequenceNumber();
    const today = new Date().toISOString().slice(0, 10);
    const clone: SuratTugasDocument = {
      ...doc,
      id: '',
      sequenceNumber: nextSeq,
      createdDate: today,
      letterNumber: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUser?.id,
      createdByName: currentUser?.name || 'Staff NOC',
      createdByRole: currentUser?.role || 'engineer',
    };
    setEditingSuratTugas(clone);
    setActiveTab('create-st');
    addToast('info', 'Duplikasi Surat Tugas', `Surat disalin dengan nomor urut berikutnya (${nextSeq}).`);
  };

  const handleSuratTugasSaved = () => {
    setEditingSuratTugas(null);
    setActiveTab('history');
  };

  // Berita Acara Handlers
  const handleEditBeritaAcara = (doc: BeritaAcaraDocument) => {
    setEditingBeritaAcara(doc);
    setActiveTab('create-ba');
    addToast('info', 'Mode Edit Berita Acara', `Memuat dokumen ${doc.letterNumber} ke form.`);
  };

  const handleDuplicateBeritaAcara = async (doc: BeritaAcaraDocument) => {
    const nextSeq = await beritaAcaraStorage.getNextSequenceNumber();
    const today = new Date().toISOString().slice(0, 10);
    const clone: BeritaAcaraDocument = {
      ...doc,
      id: '',
      sequenceNumber: nextSeq,
      createdDate: today,
      letterNumber: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUser?.id,
      createdByName: currentUser?.name || 'Staff NOC',
      createdByRole: currentUser?.role || 'engineer',
    };
    setEditingBeritaAcara(clone);
    setActiveTab('create-ba');
    addToast('info', 'Duplikasi Berita Acara', `Berita Acara disalin dengan nomor urut berikutnya (${nextSeq}).`);
  };

  const handleBeritaAcaraSaved = () => {
    setEditingBeritaAcara(null);
    setActiveTab('history');
  };

  // If not logged in, render the Login Page
  if (!currentUser) {
    return (
      <>
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Toast Notification Layer */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden no-print"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-40 transition-transform duration-300 md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setMobileMenuOpen(false);
          }}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          hasDraft={hasDraft}
          currentUser={currentUser}
        />
      </div>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          toggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          currentUser={currentUser}
          onLogout={handleLogout}
          onSwitchAccount={handleSwitchAccount}
          onUserUpdated={(updated) => setCurrentUser(updated)}
        />

        {/* Dynamic Pages */}
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-slate-50">
          {activeTab === 'dashboard' && (
            <DashboardPage
              template={template}
              suratTugasTemplate={suratTugasTemplate}
              beritaAcaraTemplate={beritaAcaraTemplate}
              setActiveTab={setActiveTab}
              onEditRFO={handleEditRFO}
              onViewRFO={handleViewRFO}
              onEditSuratTugas={handleEditSuratTugas}
              onEditBeritaAcara={handleEditBeritaAcara}
              addToast={addToast}
              currentUser={currentUser}
            />
          )}

          {(activeTab === 'create' || activeTab === 'create-st' || activeTab === 'create-ba') && (
            <CreateUnifiedDocumentPage
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              template={template}
              editingRFO={editingRFO}
              onRFOSaved={handleRFOSaved}
              suratTugasTemplate={suratTugasTemplate}
              editingSuratTugas={editingSuratTugas}
              onSuratTugasSaved={handleSuratTugasSaved}
              beritaAcaraTemplate={beritaAcaraTemplate}
              editingBeritaAcara={editingBeritaAcara}
              onBeritaAcaraSaved={handleBeritaAcaraSaved}
              addToast={addToast}
              currentUser={currentUser}
            />
          )}

          {(activeTab === 'history' || activeTab === 'history-st' || activeTab === 'history-ba') && (
            <HistoryPage
              template={template}
              suratTugasTemplate={suratTugasTemplate}
              beritaAcaraTemplate={beritaAcaraTemplate}
              setActiveTab={setActiveTab}
              onEditRFO={handleEditRFO}
              onDuplicateRFO={handleDuplicateRFO}
              onEditSuratTugas={handleEditSuratTugas}
              onDuplicateSuratTugas={handleDuplicateSuratTugas}
              onEditBeritaAcara={handleEditBeritaAcara}
              onDuplicateBeritaAcara={handleDuplicateBeritaAcara}
              addToast={addToast}
              currentUser={currentUser}
              initialTypeFilter={
                activeTab === 'history-st'
                  ? 'surat-tugas'
                  : activeTab === 'history-ba'
                  ? 'berita-acara'
                  : 'all'
              }
            />
          )}

          {(activeTab === 'templates' || activeTab === 'templates-st' || activeTab === 'templates-ba') && isAdmin && (
            <TemplatePage
              template={template}
              onUpdateTemplate={(newTmpl) => setTemplate(newTmpl)}
              suratTugasTemplate={suratTugasTemplate}
              onUpdateSuratTugasTemplate={(newStTmpl) => setSuratTugasTemplate(newStTmpl)}
              beritaAcaraTemplate={beritaAcaraTemplate}
              onUpdateBeritaAcaraTemplate={(newBaTmpl) => setBeritaAcaraTemplate(newBaTmpl)}
              addToast={addToast}
              currentUser={currentUser}
              initialSubTab={
                activeTab === 'templates-ba'
                  ? 'berita-acara'
                  : activeTab === 'templates-st'
                  ? 'surat-tugas'
                  : 'rfo'
              }
            />
          )}

          {activeTab === 'users' && isAdmin && (
            <UsersPage
              currentUser={currentUser}
              addToast={addToast}
              onCurrentUserUpdated={(updated) => setCurrentUser(updated)}
            />
          )}

          {activeTab === 'settings' && isAdmin && (
            <SettingsPage
              addToast={addToast}
              onRefreshData={() => {
                loadTemplate();
                checkDraft();
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
