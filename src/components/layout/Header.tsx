import React from 'react';
import { useAppStore } from '../../lib/store';
import { 
  Sun, 
  Moon, 
  PlusCircle, 
  Database, 
  UserCheck, 
  CheckCircle2, 
  ShieldAlert,
  Search,
  LogOut,
  Menu
} from 'lucide-react';

interface HeaderProps {
  onNewOS: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNewOS,
  setActiveTab,
  searchTerm,
  setSearchTerm,
  onToggleMobileMenu
}) => {
  const { darkMode, toggleDarkMode, issuer, supabaseConfig, logout } = useAppStore();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-3 sm:px-4 py-2.5 transition-colors no-print">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Botão Menu Hamburger Mobile */}
        <button
          onClick={onToggleMobileMenu}
          className="p-1.5 -ml-1 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
          title="Abrir Menu"
          aria-label="Abrir Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 font-bold text-xs tracking-tight shrink-0">
            FM
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="font-bold text-slate-900 dark:text-white leading-none text-sm sm:text-base truncate max-w-[140px] sm:max-w-none">
                {issuer.trade_name || 'FM Tech'}
              </h1>
              <span className="text-[9px] sm:text-[10px] uppercase font-semibold px-1.5 py-0.2 sm:py-0.5 rounded bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border border-orange-200 dark:border-orange-800 shrink-0">
                CPF
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:flex items-center gap-1.5">
              <span>Técnico: <strong className="font-medium text-slate-700 dark:text-slate-300">{issuer.full_name}</strong></span>
              <span>•</span>
              <span>CPF: <strong className="font-mono text-slate-700 dark:text-slate-300">{issuer.cpf}</strong></span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Barra de Pesquisa Rápida */}
        <div className="relative hidden md:block w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar OS, cliente, serial..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Botão Nova OS */}
        <button
          onClick={onNewOS}
          className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nova OS</span>
        </button>

        {/* Status Supabase Indicator */}
        <button
          onClick={() => setActiveTab('database')}
          title="Ver integração Supabase e Script SQL"
          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
        >
          <Database className="w-3.5 h-3.5 text-blue-500" />
          <span className="hidden lg:inline">Supabase:</span>
          {supabaseConfig.connected ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3 h-3" /> Conectado
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Modo Local / Ready
            </span>
          )}
        </button>

        {/* Botão Emitente */}
        <button
          onClick={() => setActiveTab('issuer')}
          title="Configuração do Emitente PF (CPF)"
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
        >
          <UserCheck className="w-4 h-4 text-indigo-500" />
        </button>

        {/* Toggle Dark Mode */}
        <button
          onClick={toggleDarkMode}
          title={darkMode ? "Mudar para modo claro" : "Mudar para modo escuro"}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Botão Logout */}
        <button
          onClick={logout}
          title="Encerrar Sessão / Sair do FM Tech"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 transition-colors active:scale-95"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
};
