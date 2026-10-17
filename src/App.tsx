import { useState, useEffect } from 'react';
import type { ActiveTab, RFODocument, RFOTemplate } from './types/rfo';
import { DEFAULT_RFO_TEMPLATE } from './templates/rfoTemplate';
import { storageService } from './services/storageService';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ToastContainer } from './components/Toast';
import type { ToastMessage } from './components/Toast';

import { DashboardPage } from './pages/DashboardPage';
import { CreateRFOPage } from './pages/CreateRFOPage';
import { HistoryPage } from './pages/HistoryPage';
import { TemplatePage } from './pages/TemplatePage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [template, setTemplate] = useState<RFOTemplate>(DEFAULT_RFO_TEMPLATE);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [editingRFO, setEditingRFO] = useState<RFODocument | null>(null);
  const [hasDraft, setHasDraft] = useState<boolean>(false);

  // Initialize template and check draft on startup
  useEffect(() => {
    loadTemplate();
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

  // Edit RFO Handler
  const handleEditRFO = (rfo: RFODocument) => {
    setEditingRFO(rfo);
    setActiveTab('create');
    addToast('info', 'Mode Edit Dibuka', `Memuat dokumen RFO #${rfo.id} ke form.`);
  };

  // Duplicate RFO Handler
  const handleDuplicateRFO = (rfo: RFODocument) => {
    // Clone without the original ID so it saves as a new entry
    const clone: RFODocument = {
      ...rfo,
      id: '',
      ticketNo: rfo.ticketNo ? `${rfo.ticketNo}-COPY` : '',
      rfoDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingRFO(clone);
    setActiveTab('create');
    addToast('info', 'Duplikasi RFO', 'Data disalin ke formulir baru.');
  };

  // View RFO Handler
  const handleViewRFO = (rfo: RFODocument) => {
    handleEditRFO(rfo);
  };

  // When saved successfully from create page
  const handleRFOSaved = () => {
    setEditingRFO(null);
    checkDraft();
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Toast Notification Layer */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden no-print"
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
            if (tab === 'create' && activeTab !== 'create') {
              // If intentionally clicking Create RFO from another tab, reset edit state if desired
            }
            setActiveTab(tab);
            setMobileMenuOpen(false);
          }}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          hasDraft={hasDraft}
        />
      </div>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          toggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        {/* Dynamic Pages */}
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-slate-950">
          {activeTab === 'dashboard' && (
            <DashboardPage
              template={template}
              setActiveTab={setActiveTab}
              onEditRFO={handleEditRFO}
              onViewRFO={handleViewRFO}
              addToast={addToast}
            />
          )}

          {activeTab === 'create' && (
            <CreateRFOPage
              template={template}
              addToast={addToast}
              initialEditData={editingRFO}
              onSaved={handleRFOSaved}
            />
          )}

          {activeTab === 'history' && (
            <HistoryPage
              template={template}
              setActiveTab={setActiveTab}
              onEditRFO={handleEditRFO}
              onDuplicateRFO={handleDuplicateRFO}
              addToast={addToast}
            />
          )}

          {activeTab === 'templates' && (
            <TemplatePage
              template={template}
              onUpdateTemplate={(newTmpl) => setTemplate(newTmpl)}
              addToast={addToast}
            />
          )}

          {activeTab === 'settings' && (
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
