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
import { ServicesScreen } from './components/screens/ServicesScreen';
import { FinancialScreen } from './components/screens/FinancialScreen';
import { ReportsScreen } from './components/screens/ReportsScreen';
import { WarrantyScreen } from './components/screens/WarrantyScreen';
import { IssuerScreen } from './components/screens/IssuerScreen';
import { DatabaseScreen } from './components/screens/DatabaseScreen';
import { UsersScreen } from './components/screens/UsersScreen';
import { AuditScreen } from './components/screens/AuditScreen';
import { SetupScreen } from './components/screens/SetupScreen';
import { LoginScreen } from './components/screens/LoginScreen';
import { OSFormModal } from './components/os/OSFormModal';
import { ServiceOrder } from './lib/types';

export const App: React.FC = () => {
  const { serviceOrders, setupCompleted, setSetupCompleted, isAuthenticated } = useAppStore();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isOpeningSetup, setIsOpeningSetup] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isNewOSModalOpen, setIsNewOSModalOpen] = useState<boolean>(false);
  const [editingOS, setEditingOS] = useState<ServiceOrder | null>(null);
  const [portalToken, setPortalToken] = useState<string>('');

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
      {/* Barra Lateral / Navegação */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Área Central / Conteúdo */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        <Header
          onNewOS={handleOpenNewOS}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20">
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

          {activeTab === 'services' && <ServicesScreen />}

          {activeTab === 'financial' && <FinancialScreen />}

          {activeTab === 'reports' && <ReportsScreen />}

          {activeTab === 'warranty' && <WarrantyScreen />}

          {activeTab === 'users' && <UsersScreen />}

          {activeTab === 'audit' && <AuditScreen />}

          {activeTab === 'issuer' && <IssuerScreen />}

          {activeTab === 'database' && <DatabaseScreen />}
        </main>
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
