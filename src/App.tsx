import React, { useState } from 'react';
import { useAppStore } from './lib/store';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { OSListScreen } from './components/screens/OSListScreen';
import { ClientPortalScreen } from './components/screens/ClientPortalScreen';
import { POSScreen } from './components/screens/POSScreen';
import { ClientsScreen } from './components/screens/ClientsScreen';
import { ProductsScreen } from './components/screens/ProductsScreen';
import { LicensesScreen } from './components/screens/LicensesScreen';
import { ServicesScreen } from './components/screens/ServicesScreen';
import { FinancialScreen } from './components/screens/FinancialScreen';
import { ReportsScreen } from './components/screens/ReportsScreen';
import { WarrantyScreen } from './components/screens/WarrantyScreen';
import { IssuerScreen } from './components/screens/IssuerScreen';
import { MercadoPagoScreen } from './components/screens/MercadoPagoScreen';
import { DatabaseScreen } from './components/screens/DatabaseScreen';
import { UsersScreen } from './components/screens/UsersScreen';
import { AuditScreen } from './components/screens/AuditScreen';
import { SetupScreen } from './components/screens/SetupScreen';
import { LoginScreen } from './components/screens/LoginScreen';
import { OSFormModal } from './components/os/OSFormModal';
import { ServiceOrder } from './lib/types';
import { LayoutDashboard, Wrench, ShoppingCart, CreditCard, Menu } from 'lucide-react';

export const App: React.FC = () => {
  const { serviceOrders, setupCompleted, setSetupCompleted, isAuthenticated } = useAppStore();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isOpeningSetup, setIsOpeningSetup] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isNewOSModalOpen, setIsNewOSModalOpen] = useState<boolean>(false);
  const [editingOS, setEditingOS] = useState<ServiceOrder | null>(null);
  const [portalToken, setPortalToken] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const [isPublicAccess, setIsPublicAccess] = useState<boolean>(() => {
    const hash = window.location.hash;
    const search = window.location.search;
    return hash.includes('/acompanhar/') || search.includes('token=') || search.includes('mp_status=');
  });

  // Listener para URLs públicas (acompanhar OS e retornos do Mercado Pago)
  React.useEffect(() => {
    const parseUrl = () => {
      const hash = window.location.hash;
      const search = window.location.search;
      const params = new URLSearchParams(search);

      let token = params.get('token') || '';
      if (!token && hash.includes('/acompanhar/')) {
        const afterAcompanhar = hash.split('/acompanhar/')[1];
        token = afterAcompanhar ? afterAcompanhar.split('?')[0].split('/')[0] : '';
      }

      if (token) {
        setPortalToken(token);
        setIsPublicAccess(true);
      }
    };

    parseUrl();
    window.addEventListener('hashchange', parseUrl);
    return () => window.removeEventListener('hashchange', parseUrl);
  }, []);

  // Endpoint visual para teste e confirmação de Webhook do Mercado Pago
  if (window.location.search.includes('webhook=mercadopago')) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-xl font-bold">
            ✓
          </div>
          <h2 className="text-lg font-bold text-emerald-400">Webhook Mercado Pago Ativo</h2>
          <p className="text-xs text-slate-300">
            Endpoint oficial de notificações instantâneas do Mercado Pago configurado com sucesso para a aplicação FM Tech em:
          </p>
          <div className="p-2.5 bg-slate-950 rounded-lg font-mono text-[11px] text-sky-400 break-all select-all">
            https://felipemzero.github.io/fm-tech/?webhook=mercadopago
          </div>
          <p className="text-[11px] text-slate-400">
            Pronto para receber notificações automáticas IPN de pagamentos de OS.
          </p>
          <a
            href="https://felipemzero.github.io/fm-tech/"
            className="inline-block px-4 py-2 bg-[#009ee3] text-white rounded-xl text-xs font-semibold shadow hover:bg-sky-600 transition"
          >
            Abrir Painel FM Tech
          </a>
        </div>
      </div>
    );
  }

  // Se for acesso público direto pelo cliente através do link de acompanhamento
  if (isPublicAccess && portalToken) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between no-print shadow-sm">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#009ee3] text-lg tracking-tight">FM Tech</span>
            <span className="text-xs text-slate-500 font-medium">| Portal do Cliente & Acompanhamento</span>
          </div>
          <button
            onClick={() => {
              setIsPublicAccess(false);
              window.location.hash = '';
            }}
            className="text-xs text-slate-600 dark:text-slate-300 hover:text-blue-600 font-semibold px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 transition"
          >
            Acesso Administrativo →
          </button>
        </header>
        <main className="flex-1 p-4 md:p-6 max-w-4xl w-full mx-auto pb-20">
          <ClientPortalScreen initialToken={portalToken} />
        </main>
      </div>
    );
  }

  const handleOpenNewOS = () => {
    setEditingOS(null);
    setIsNewOSModalOpen(true);
  };

  const handleOpenEditOS = (osId: string) => {
    const found = serviceOrders.find(o => o.id === osId);
    if (found) {
      setEditingOS(found);
      setIsNewOSModalOpen(true);
    }
  };

  const handleOpenPortalWithToken = (token: string) => {
    setPortalToken(token);
    setActiveTab('portal');
  };

  // 1. Tela de Setup Inicial do FM Tech (Supabase + Dados + Admin)
  if (!setupCompleted || isOpeningSetup || activeTab === 'setup') {
    return (
      <SetupScreen
        onComplete={() => {
          setSetupCompleted(true);
          setIsOpeningSetup(false);
          // Redireciona diretamente para a tela de Login conforme solicitado
          setActiveTab('dashboard');
        }}
      />
    );
  }

  // 2. Tela de Login obrigatória após configurar
  if (!isAuthenticated) {
    return (
      <LoginScreen
        onSuccess={() => {
          setActiveTab('dashboard');
        }}
        onOpenSetup={() => {
          setIsOpeningSetup(true);
        }}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
      {/* Barra Lateral / Navegação (Desktop + Drawer Mobile) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Área Central / Conteúdo */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        <Header
          onNewOS={handleOpenNewOS}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)}
        />

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pb-24 md:pb-20">
          {activeTab === 'dashboard' && (
            <DashboardScreen
              setActiveTab={setActiveTab}
              onNewOS={handleOpenNewOS}
              onOpenOS={handleOpenEditOS}
            />
          )}

          {activeTab === 'os' && (
            <OSListScreen
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onOpenPortal={handleOpenPortalWithToken}
            />
          )}

          {activeTab === 'portal' && (
            <ClientPortalScreen initialToken={portalToken} />
          )}

          {activeTab === 'pos' && <POSScreen />}

          {activeTab === 'clients' && <ClientsScreen />}

          {activeTab === 'products' && <ProductsScreen />}

          {activeTab === 'licenses' && <LicensesScreen />}

          {activeTab === 'services' && <ServicesScreen />}

          {activeTab === 'financial' && <FinancialScreen />}

          {activeTab === 'reports' && <ReportsScreen />}

          {activeTab === 'warranty' && <WarrantyScreen />}

          {activeTab === 'users' && <UsersScreen />}

          {activeTab === 'audit' && <AuditScreen />}

          {activeTab === 'issuer' && <IssuerScreen />}

          {activeTab === 'mercadopago' && <MercadoPagoScreen />}

          {activeTab === 'database' && <DatabaseScreen />}
        </main>

        {/* Barra de Navegação Inferior Mobile (Otimizada para Celulares) */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 flex items-center justify-around py-1.5 px-2 md:hidden no-print shadow-lg">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-semibold transition ${
              activeTab === 'dashboard' ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span>Início</span>
          </button>

          <button
            onClick={() => setActiveTab('os')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-semibold transition ${
              activeTab === 'os' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Wrench className="w-5 h-5 mb-0.5" />
            <span>Ordens OS</span>
          </button>

          <button
            onClick={() => setActiveTab('pos')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-semibold transition ${
              activeTab === 'pos' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <ShoppingCart className="w-5 h-5 mb-0.5" />
            <span>PDV</span>
          </button>

          <button
            onClick={() => setActiveTab('mercadopago')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-semibold transition ${
              activeTab === 'mercadopago' ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <CreditCard className="w-5 h-5 mb-0.5" />
            <span>Mercado Pago</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span>Mais</span>
          </button>
        </nav>
      </div>

      {/* Modal Abertura / Edição de Ordem de Serviço */}
      {isNewOSModalOpen && (
        <OSFormModal
          osToEdit={editingOS}
          onClose={() => setIsNewOSModalOpen(false)}
          onSaved={() => {
            setIsNewOSModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default App;
