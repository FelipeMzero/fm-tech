import React, { useState } from 'react';
import { useAppStore } from '../../lib/store';
import { formatDateTime } from '../../lib/utils';
import { 
  FileClock, 
  Search, 
  Filter, 
  ShieldCheck, 
  Activity, 
  AlertCircle, 
  RefreshCw,
  Clock,
  User,
  Layers
} from 'lucide-react';

export const AuditScreen: React.FC = () => {
  const { auditLogs } = useAppStore();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [moduleFilter, setModuleFilter] = useState<string>('todos');
  const [actionFilter, setActionFilter] = useState<string>('todos');

  // Extrair módulos únicos para o filtro
  const uniqueModules = Array.from(new Set(auditLogs.map(l => l.module)));
  const uniqueActions = Array.from(new Set(auditLogs.map(l => l.action)));

  const filteredLogs = auditLogs.filter((log) => {
    const matchModule = moduleFilter === 'todos' || log.module === moduleFilter;
    const matchAction = actionFilter === 'todos' || log.action === actionFilter;
    const matchSearch =
      !searchTerm ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    return matchModule && matchAction && matchSearch;
  });

  const getActionBadgeColor = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CRIAÇÃO':
      case 'CADASTRO':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'EDIÇÃO':
      case 'ATUALIZAÇÃO':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'FATURAMENTO':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'EXCLUSÃO':
      case 'CANCELAMENTO':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'BAIXA':
      case 'ESTORNO':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileClock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              <span>Auditoria & Histórico de Operações</span>
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 uppercase">
              Map-OS Security
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Trilha de auditoria das operações executadas no sistema (abertura de OS, faturamento, estoque e clientes)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>Auditoria Ativa</span>
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total de Registros</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{auditLogs.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Eventos auditados</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">OS e Serviços</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
            {auditLogs.filter(l => l.module.includes('OS') || l.module.includes('Serviço')).length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Aberturas e alterações de status</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Operações Financeiras</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {auditLogs.filter(l => l.module.includes('Financeiro')).length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Faturamentos e baixas de receitas</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Movimentações de Estoque</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {auditLogs.filter(l => l.module.includes('Estoque')).length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Baixas e reposições de peças</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar nos logs por usuário, detalhe ou ação..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="todos">Todos os Módulos</option>
            {uniqueModules.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="todos">Todas as Ações</option>
            {uniqueActions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                <th className="py-3 px-4">Data e Hora</th>
                <th className="py-3 px-4">Usuário Responsável</th>
                <th className="py-3 px-4">Módulo</th>
                <th className="py-3 px-4">Ação</th>
                <th className="py-3 px-4">Detalhes da Operação</th>
                <th className="py-3 px-4 text-right">Endereço IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Nenhum registro de auditoria encontrado para os critérios pesquisados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-slate-100">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.user_name}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                        <Layers className="w-3 h-3 text-slate-400" />
                        <span>{log.module}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-md">
                      <p className="line-clamp-2">{log.details}</p>
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-400">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
