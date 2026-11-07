import React from 'react';
import { useAppStore } from '../../lib/store';
import { 
  formatCurrency, 
  formatDate, 
  OS_STATUS_DETAILS 
} from '../../lib/utils';
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PlusCircle, 
  ShoppingCart, 
  Package, 
  Calendar,
  ExternalLink
} from 'lucide-react';

interface DashboardScreenProps {
  setActiveTab: (tab: string) => void;
  onNewOS: () => void;
  onOpenOS: (osId: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ 
  setActiveTab, 
  onNewOS,
  onOpenOS 
}) => {
  const { serviceOrders, transactions, products, clients } = useAppStore();

  // Métricas de OS
  const openOS = serviceOrders.filter(o => ['aberto', 'em_andamento', 'aguardando_pecas'].includes(o.status));
  const waitingApprovalOS = serviceOrders.filter(o => o.status === 'aguardando_aprovacao' || o.status === 'orcamento');
  const completedOS = serviceOrders.filter(o => o.status === 'finalizado' || o.status === 'entregue');

  // Métricas Financeiras
  const paidIncome = transactions
    .filter(t => t.type === 'receita' && t.status === 'pago')
    .reduce((acc, cur) => acc + (cur.paid_amount || cur.amount), 0);

  const paidExpenses = transactions
    .filter(t => t.type === 'despesa' && t.status === 'pago')
    .reduce((acc, cur) => acc + (cur.paid_amount || cur.amount), 0);

  const pendingIncome = transactions
    .filter(t => t.type === 'receita' && t.status === 'pendente')
    .reduce((acc, cur) => acc + cur.amount, 0);

  const netBalance = paidIncome - paidExpenses;

  // Alertas de estoque
  const lowStockProducts = products.filter(p => p.current_stock <= p.min_stock);

  // Status breakdown
  const statusCounts = serviceOrders.reduce((acc, os) => {
    acc[os.status] = (acc[os.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Entregas previstas nos próximos dias
  const upcomingDeliveries = serviceOrders
    .filter(o => o.estimated_delivery_date && !['entregue', 'cancelado'].includes(o.status))
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Cabeçalho do Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Painel de Controle
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Visão consolidada de serviços técnicos, faturamento e estoque.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('pos')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Venda Balcão (PDV)</span>
          </button>

          <button
            onClick={onNewOS}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Abrir Nova OS</span>
          </button>
        </div>
      </div>

      {/* Alerta de Estoque Baixo se houver */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Atenção: {lowStockProducts.length} produto(s) com estoque no limite ou abaixo do mínimo!
              </h2>
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                Peças em falta podem atrasar o fechamento de Ordens de Serviço em andamento.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('products')}
            className="px-3 py-1 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white"
          >
            Ver Peças
          </button>
        </div>
      )}

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* OS em Aberto / Em Andamento */}
        <div 
          onClick={() => setActiveTab('os')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm hover:border-blue-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">OS em Andamento</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{openOS.length}</span>
            <span className="text-[10px] text-slate-500">em bancada</span>
          </div>
          <div className="mt-2 text-[11px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
            Ver todas as ordens &rarr;
          </div>
        </div>

        {/* Aguardando Aprovação */}
        <div 
          onClick={() => setActiveTab('os')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm hover:border-purple-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Aguardando Aprovação</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{waitingApprovalOS.length}</span>
            <span className="text-[10px] text-slate-500">orçamentos</span>
          </div>
          <div className="mt-2 text-[11px] text-purple-600 dark:text-purple-400 font-medium">
            Envie orçamento via WhatsApp
          </div>
        </div>

        {/* Faturamento Realizado (Entradas) */}
        <div 
          onClick={() => setActiveTab('financial')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm hover:border-emerald-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Receitas Recebidas</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {formatCurrency(paidIncome)}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
            <span>A receber (pendente):</span>
            <span className="font-mono font-semibold">{formatCurrency(pendingIncome)}</span>
          </div>
        </div>

        {/* Saldo Líquido do Prestador */}
        <div 
          onClick={() => setActiveTab('financial')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm hover:border-indigo-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Saldo Líquido Realizado</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className={`text-xl font-bold font-mono ${netBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600'}`}>
              {formatCurrency(netBalance)}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Despesas pagas:</span>
            <span className="font-mono text-rose-500 font-semibold">{formatCurrency(paidExpenses)}</span>
          </div>
        </div>
      </div>

      {/* Seção Gráfica e Listagem de Entregas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribuição de OS por Status */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Distribuição de Ordens de Serviço
            </h2>
            <span className="text-xs font-bold text-slate-500">Total: {serviceOrders.length}</span>
          </div>

          <div className="space-y-2.5">
            {Object.entries(OS_STATUS_DETAILS).map(([statusKey, info]) => {
              const count = statusCounts[statusKey] || 0;
              const percentage = serviceOrders.length > 0 ? (count / serviceOrders.length) * 100 : 0;

              return (
                <div key={statusKey} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600 dark:text-slate-300">{info.label}</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{count}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${info.bg.replace('/10', '').replace('/20', '')}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Previsão de Entregas e Equipamentos Prontos */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Prazos & Previsões de Conclusão de OS
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('os')}
              className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              Ver Todas
            </button>
          </div>

          {upcomingDeliveries.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Nenhuma entrega agendada no momento.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {upcomingDeliveries.map((os) => {
                const client = clients.find(c => c.id === os.client_id);
                return (
                  <div 
                    key={os.id} 
                    onClick={() => onOpenOS(os.id)}
                    className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                          #{os.os_number}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {os.equipment_type} - {os.brand} {os.model}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${OS_STATUS_DETAILS[os.status]?.bg} ${OS_STATUS_DETAILS[os.status]?.text} ${OS_STATUS_DETAILS[os.status]?.border}`}>
                          {OS_STATUS_DETAILS[os.status]?.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Cliente: <strong>{client?.name || 'Cliente'}</strong> • Previsão: <strong>{formatDate(os.estimated_delivery_date)}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                        {formatCurrency(os.total_amount)}
                      </span>
                      <span className="block text-[10px] text-blue-500 font-medium">Abrir &rarr;</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
