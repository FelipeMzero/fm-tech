import React, { useState } from 'react';
import { useAppStore } from '../../lib/store';
import { formatCurrency, formatDate, OS_STATUS_DETAILS } from '../../lib/utils';
import {
  BarChart3,
  Printer,
  Download,
  Calendar,
  Wrench,
  DollarSign,
  Package,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';

export const ReportsScreen: React.FC = () => {
  const { serviceOrders, transactions, products, clients, issuer } = useAppStore();

  const [reportType, setReportType] = useState<'os' | 'financial' | 'inventory'>('os');
  const [dateStart, setDateStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [dateEnd, setDateEnd] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Filtragem de OS
  const filteredOS = serviceOrders.filter(os => {
    const entryDate = os.entry_date.split('T')[0];
    if (entryDate < dateStart || entryDate > dateEnd) return false;
    if (filterStatus !== 'all' && os.status !== filterStatus) return false;
    return true;
  });

  const osTotalServices = filteredOS.reduce((acc, os) => acc + os.services_total, 0);
  const osTotalProducts = filteredOS.reduce((acc, os) => acc + os.products_total, 0);
  const osTotalDiscounts = filteredOS.reduce((acc, os) => {
    if (os.discount_type === '%') {
      return acc + ((os.services_total + os.products_total) * (os.discount_value / 100));
    }
    return acc + (os.discount_value || 0);
  }, 0);
  const osTotalFinal = filteredOS.reduce((acc, os) => acc + os.total_amount, 0);

  // Filtragem Financeira
  const filteredTransactions = transactions.filter(t => {
    const d = t.due_date.split('T')[0];
    return d >= dateStart && d <= dateEnd;
  });

  const reportIncome = filteredTransactions
    .filter(t => t.type === 'receita')
    .reduce((acc, t) => acc + (t.status === 'pago' ? (t.paid_amount || t.amount) : t.amount), 0);

  const reportExpense = filteredTransactions
    .filter(t => t.type === 'despesa')
    .reduce((acc, t) => acc + (t.status === 'pago' ? (t.paid_amount || t.amount) : t.amount), 0);

  const reportProfit = reportIncome - reportExpense;

  // Métricas de Estoque
  const totalStockUnits = products.reduce((acc, p) => acc + p.current_stock, 0);
  const totalCostInventory = products.reduce((acc, p) => acc + p.cost_price * p.current_stock, 0);
  const totalSaleInventory = products.reduce((acc, p) => acc + p.sale_price * p.current_stock, 0);
  const estimatedGrossProfit = totalSaleInventory - totalCostInventory;

  // Exportação CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (reportType === 'os') {
      csvContent += 'Numero;Data;Cliente;Equipamento;Status;Total Servicos;Total Pecas;Total OS;Faturado\n';
      filteredOS.forEach(os => {
        const client = clients.find(c => c.id === os.client_id);
        const equip = `${os.equipment_type} ${os.brand || ''} ${os.model || ''}`.trim();
        csvContent += `${os.os_number};${os.entry_date};"${client?.name || 'Cliente'}";"${equip}";${os.status};${os.services_total};${os.products_total};${os.total_amount};${os.invoiced ? 'SIM' : 'NAO'}\n`;
      });
    } else if (reportType === 'financial') {
      csvContent += 'Data;Tipo;Descricao;Categoria;Cliente_Fornecedor;Valor;Status;Forma_Pagamento\n';
      filteredTransactions.forEach(t => {
        csvContent += `${t.due_date};${t.type};"${t.description}";"${t.category}";"${t.client_name || ''}";${t.paid_amount || t.amount};${t.status};${t.payment_method || ''}\n`;
      });
    } else {
      csvContent += 'Codigo;Descricao;Unidade;Estoque;Preco Custo;Preco Venda;Total Custo;Total Venda;Lucro Estimado\n';
      products.forEach(p => {
        csvContent += `"${p.internal_code || ''}";"${p.description}";${p.unit};${p.current_stock};${p.cost_price};${p.sale_price};${p.cost_price * p.current_stock};${p.sale_price * p.current_stock};${(p.sale_price - p.cost_price) * p.current_stock}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_${reportType}_${dateStart}_${dateEnd}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Relatórios e Demonstração de Resultados
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Exporte dados analíticos de Ordens de Serviço, faturamento líquido e posição imobilizada do estoque.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Exportar CSV / Excel
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition-all"
          >
            <Printer className="w-4 h-4" />
            Imprimir Relatório A4
          </button>
        </div>
      </div>

      {/* Cabeçalho de Impressão Exclusivo */}
      <div className="hidden print:block border-b border-slate-300 pb-4 mb-4">
        <h1 className="text-lg font-bold text-slate-900">{issuer.trade_name || issuer.full_name}</h1>
        <p className="text-xs text-slate-600">
          Emitente: {issuer.full_name} | CPF: {issuer.cpf} | Tel: {issuer.phone}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Relatório: {reportType === 'os' ? 'Ordens de Serviço' : reportType === 'financial' ? 'Fluxo Financeiro' : 'Posição de Estoque'} | Período: {formatDate(dateStart)} até {formatDate(dateEnd)}
        </p>
      </div>

      {/* Seleção do Tipo de Relatório e Filtros */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setReportType('os')}
            className={`p-3 rounded-lg border text-left transition-all ${
              reportType === 'os'
                ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-500 ring-2 ring-blue-500/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <Wrench className={`w-4 h-4 ${reportType === 'os' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
              <span className="text-xs font-bold text-slate-900 dark:text-white">Ordens de Serviço</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Mão de obra, peças, status e ticket médio</p>
          </button>

          <button
            onClick={() => setReportType('financial')}
            className={`p-3 rounded-lg border text-left transition-all ${
              reportType === 'financial'
                ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <DollarSign className={`w-4 h-4 ${reportType === 'financial' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
              <span className="text-xs font-bold text-slate-900 dark:text-white">Fluxo Financeiro & DRE</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Receitas, despesas quitadas e lucro real</p>
          </button>

          <button
            onClick={() => setReportType('inventory')}
            className={`p-3 rounded-lg border text-left transition-all ${
              reportType === 'inventory'
                ? 'bg-purple-50 dark:bg-purple-950/80 border-purple-500 ring-2 ring-purple-500/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <Package className={`w-4 h-4 ${reportType === 'inventory' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
              <span className="text-xs font-bold text-slate-900 dark:text-white">Posição de Estoque</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Capital imobilizado, margens e estoque crítico</p>
          </button>
        </div>

        {reportType !== 'inventory' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">De:</span>
              <input
                type="date"
                value={dateStart}
                onChange={e => setDateStart(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Até:</span>
              <input
                type="date"
                value={dateEnd}
                onChange={e => setDateEnd(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {reportType === 'os' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Status:</span>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="all">Todos os Status</option>
                  <option value="orcamento">Orçamento</option>
                  <option value="aberto">Aberto</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="aguardando_aprovacao">Aguardando Aprovação</option>
                  <option value="aprovado">Aprovado</option>
                  <option value="finalizado">Finalizado</option>
                  <option value="entregue">Entregue</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 1. RELATÓRIO DE ORDENS DE SERVIÇO */}
      {reportType === 'os' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">Quantidade de OS</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{filteredOS.length}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">Total Mão de Obra</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">{formatCurrency(osTotalServices)}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">Total Peças / Componentes</p>
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{formatCurrency(osTotalProducts)}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">Faturamento Total das OS</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(osTotalFinal)}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px]">
                    <th className="py-3 px-4">OS #</th>
                    <th className="py-3 px-4">Entrada</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Equipamento</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Serviços</th>
                    <th className="py-3 px-4 text-right">Peças</th>
                    <th className="py-3 px-4 text-right">Total Final</th>
                    <th className="py-3 px-4 text-center">Faturado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredOS.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Nenhuma Ordem de Serviço encontrada no período.
                      </td>
                    </tr>
                  ) : (
                    filteredOS.map(os => {
                      const client = clients.find(c => c.id === os.client_id) || os.client;
                      return (
                        <tr key={os.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                            #{String(os.os_number).padStart(4, '0')}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500">{formatDate(os.entry_date)}</td>
                          <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                            {client ? client.name : 'Cliente Avulso'}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            {os.equipment_type} {os.brand || ''} {os.model || ''}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {OS_STATUS_DETAILS[os.status]?.label || os.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-500">
                            {formatCurrency(os.services_total)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-500">
                            {formatCurrency(os.products_total)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatCurrency(os.total_amount)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {os.invoiced ? (
                              <span className="text-emerald-600 font-bold text-[11px]">SIM</span>
                            ) : (
                              <span className="text-amber-600 text-[11px]">NÃO</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. RELATÓRIO FINANCEIRO & FLUXO DE CAIXA */}
      {reportType === 'financial' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">Receitas Totais</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(reportIncome)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">Despesas Operacionais</p>
              <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                {formatCurrency(reportExpense)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">Resultado Líquido do Período</p>
              <p className={`text-xl font-bold mt-1 ${reportProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600'}`}>
                {formatCurrency(reportProfit)}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px]">
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Descrição</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4">Pessoa / Origem</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredTransactions.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono text-slate-500">{formatDate(t.due_date)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            t.type === 'receita'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{t.description}</td>
                      <td className="py-3 px-4 text-slate-500">{t.category}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{t.client_name || '---'}</td>
                      <td className="py-3 px-4 text-center uppercase font-mono text-[10px] font-semibold">
                        {t.status}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span className={t.type === 'receita' ? 'text-emerald-600' : 'text-rose-600'}>
                          {t.type === 'receita' ? '+' : '-'} {formatCurrency(t.paid_amount || t.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. RELATÓRIO DE ESTOQUE & CAPITAL IMOBILIZADO */}
      {reportType === 'inventory' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">Unidades em Estoque</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{totalStockUnits} itens</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">Total a Preço de Custo</p>
              <p className="text-xl font-bold text-slate-700 dark:text-slate-300 mt-1">
                {formatCurrency(totalCostInventory)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">Total a Preço de Venda</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(totalSaleInventory)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">Lucro Bruto Projetado</p>
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                {formatCurrency(estimatedGrossProfit)}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px]">
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Descrição da Peça</th>
                    <th className="py-3 px-4 text-center">Un.</th>
                    <th className="py-3 px-4 text-center">Qtd. Estoque</th>
                    <th className="py-3 px-4 text-right">Custo Unit.</th>
                    <th className="py-3 px-4 text-right">Venda Unit.</th>
                    <th className="py-3 px-4 text-right">Subtotal Custo</th>
                    <th className="py-3 px-4 text-right">Subtotal Venda</th>
                    <th className="py-3 px-4 text-right">Margem R$</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {products.map(p => {
                    const subCost = p.cost_price * p.current_stock;
                    const subSale = p.sale_price * p.current_stock;
                    const marginValue = subSale - subCost;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {p.internal_code || '---'}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{p.description}</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-500">{p.unit}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 dark:text-white">
                          {p.current_stock}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-500">
                          {formatCurrency(p.cost_price)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                          {formatCurrency(p.sale_price)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-500">{formatCurrency(subCost)}</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          {formatCurrency(subSale)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {formatCurrency(marginValue)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
