import React from 'react';
import { useAppStore } from '../../lib/store';
import {
  LayoutDashboard,
  Wrench,
  ExternalLink,
  ShoppingCart,
  Users,
  Package,
  ClipboardList,
  DollarSign,
  BarChart3,
  ShieldCheck,
  UserCheck,
  Database,
  AlertTriangle,
  UserCog,
  FileClock,
  Settings
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { products, serviceOrders } = useAppStore();

  // Quantidade de produtos com estoque baixo
  const lowStockCount = products.filter(p => p.current_stock <= p.min_stock).length;
  // Quantidade de OS abertas/em andamento
  const openOSCount = serviceOrders.filter(o => !['finalizado', 'entregue', 'cancelado'].includes(o.status)).length;

  const menuItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'os', label: 'Ordens de Serviço', icon: Wrench, badge: openOSCount > 0 ? openOSCount : null, badgeColor: 'bg-blue-600 text-white' },
    { id: 'portal', label: 'Portal do Cliente', icon: ExternalLink, sub: 'Consulta Pública' },
    { id: 'pos', label: 'Venda Rápida (PDV)', icon: ShoppingCart },
    { id: 'clients', label: 'Clientes & Fornec.', icon: Users },
    { id: 'products', label: 'Peças & Estoque', icon: Package, badge: lowStockCount > 0 ? lowStockCount : null, badgeColor: 'bg-amber-500 text-white', alertIcon: lowStockCount > 0 },
    { id: 'services', label: 'Catálogo de Serviços', icon: ClipboardList },
    { id: 'financial', label: 'Financeiro & Recibos', icon: DollarSign },
    { id: 'reports', label: 'Relatórios & Lucro', icon: BarChart3 },
    { id: 'warranty', label: 'Termos de Garantia', icon: ShieldCheck },
    { id: 'users', label: 'Usuários & Técnicos', icon: UserCog, sub: 'Equipe Map-OS' },
    { id: 'audit', label: 'Auditoria & Logs', icon: FileClock, sub: 'Segurança' },
    { id: 'issuer', label: 'Emitente (CPF)', icon: UserCheck, highlight: true },
    { id: 'database', label: 'SQL Supabase & API', icon: Database, tech: true },
    { id: 'setup', label: 'Instalação / Setup', icon: Settings, sub: 'Supabase & Admin' },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between no-print select-none">
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Módulos do Sistema
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 font-semibold shadow-sm border border-orange-200/60 dark:border-orange-800/60'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <div className="text-left">
                  <span>{item.label}</span>
                  {item.sub && <p className="text-[10px] text-slate-400 font-normal leading-tight">{item.sub}</p>}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {item.alertIcon && (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                )}
                {item.badge !== null && item.badge !== undefined && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-200 text-slate-700'}`}>
                    {item.badge}
                  </span>
                )}
                {item.highlight && !isActive && (
                  <span className="text-[9px] bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-1.5 py-0.2 rounded font-semibold uppercase">
                    PF
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/60 space-y-1">
          <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Prestador PF</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">Ativo</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Documentos e recibos gerados exclusivamente com <strong>CPF</strong> do técnico.
          </p>
        </div>
      </div>
    </aside>
  );
};
