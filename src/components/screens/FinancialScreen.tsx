import React, { useState } from 'react';
import { useAppStore } from '../../lib/store';
import { FinancialTransaction, TransactionType, TransactionStatus, PaymentMethod } from '../../lib/types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { PFReceiptModal } from '../finance/PFReceiptModal';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  Trash2,
  X,
  Save,
  CreditCard,
  QrCode,
  Banknote,
  FileText,
  AlertCircle
} from 'lucide-react';

export const FinancialScreen: React.FC = () => {
  const { transactions, clients, addTransaction, markTransactionAsPaid, deleteTransaction } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'receita' | 'despesa'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pendente' | 'pago' | 'vencido'>('all');
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');

  // Modal Nova Transação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txType, setTxType] = useState<TransactionType>('receita');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Serviços de Manutenção');
  const [amount, setAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [clientId, setClientId] = useState('');
  const [notes, setNotes] = useState('');

  // Modal Baixar Transação
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedTxToPay, setSelectedTxToPay] = useState<FinancialTransaction | null>(null);
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('pix');

  // Recibo PF
  const [receiptTx, setReceiptTx] = useState<FinancialTransaction | null>(null);

  const handleOpenNewModal = (type: TransactionType = 'receita') => {
    setTxType(type);
    setDescription('');
    setCategory(type === 'receita' ? 'Serviços de Manutenção' : 'Compra de Peças / Fornecedor');
    setAmount(0);
    setDueDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('pix');
    setClientId('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) {
      alert('Descrição e valor maior que zero são obrigatórios.');
      return;
    }

    const client = clients.find(c => c.id === clientId);

    addTransaction({
      description,
      type: txType,
      category,
      client_id: clientId || undefined,
      client_name: client ? client.name : undefined,
      amount: Number(amount),
      discount: 0,
      paid_amount: 0,
      due_date: dueDate,
      status: 'pendente',
      payment_method: paymentMethod,
      notes
    });

    setIsModalOpen(false);
  };

  const handleOpenPayModal = (tx: FinancialTransaction) => {
    setSelectedTxToPay(tx);
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayMethod(tx.payment_method || 'pix');
    setIsPayModalOpen(true);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxToPay) return;

    markTransactionAsPaid(selectedTxToPay.id, payDate, payMethod);
    setIsPayModalOpen(false);
  };

  // Cálculos de Filtros e Totais
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const filteredTransactions = transactions.filter(t => {
    // Tipo
    if (filterType !== 'all' && t.type !== filterType) return false;

    // Status
    if (filterStatus !== 'all') {
      if (filterStatus === 'vencido') {
        if (t.status !== 'pendente' || t.due_date >= todayStr) return false;
      } else if (t.status !== filterStatus) {
        return false;
      }
    }

    // Período
    if (filterPeriod === 'today') {
      if (t.due_date !== todayStr) return false;
    } else if (filterPeriod === 'week') {
      const d = new Date(t.due_date);
      const diffTime = Math.abs(now.getTime() - d.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 7) return false;
    } else if (filterPeriod === 'month') {
      const d = new Date(t.due_date);
      if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
    }

    // Busca textual
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.client_name && t.client_name.toLowerCase().includes(q)) ||
        (t.os_number && String(t.os_number).includes(q));
      if (!match) return false;
    }

    return true;
  });

  // Métricas Totais Gerais
  const totalPaidIncome = transactions
    .filter(t => t.type === 'receita' && t.status === 'pago')
    .reduce((acc, t) => acc + (t.paid_amount || t.amount), 0);

  const totalPaidExpense = transactions
    .filter(t => t.type === 'despesa' && t.status === 'pago')
    .reduce((acc, t) => acc + (t.paid_amount || t.amount), 0);

  const netRealized = totalPaidIncome - totalPaidExpense;

  const totalPendingIncome = transactions
    .filter(t => t.type === 'receita' && t.status === 'pendente')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalPendingExpense = transactions
    .filter(t => t.type === 'despesa' && t.status === 'pendente')
    .reduce((acc, t) => acc + t.amount, 0);

  const netProjected = (totalPaidIncome + totalPendingIncome) - (totalPaidExpense + totalPendingExpense);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            Gestão Financeira & Recibos PF
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Controle de contas a pagar, contas a receber, faturamento de OS e emissão de recibos avulsos com CPF.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenNewModal('despesa')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-colors"
          >
            <TrendingDown className="w-4 h-4 text-rose-600" />
            Nova Despesa
          </button>
          <button
            onClick={() => handleOpenNewModal('receita')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nova Receita
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Recebido (Quitado)</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(totalPaidIncome)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              + {formatCurrency(totalPendingIncome)} a receber
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Pago (Despesas)</p>
            <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
              {formatCurrency(totalPaidExpense)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              + {formatCurrency(totalPendingExpense)} a pagar
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Saldo Líquido Realizado</p>
            <p className={`text-xl font-bold mt-1 ${netRealized >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600'}`}>
              {formatCurrency(netRealized)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Em caixa no momento</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Saldo Previsto (Final)</p>
            <p className={`text-xl font-bold mt-1 ${netProjected >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'}`}>
              {formatCurrency(netProjected)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Incluindo todos os pendentes</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabela e Filtros */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Barra de Filtros */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por descrição, cliente, OS..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            {/* Filtro Período */}
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5 text-xs">
              <button
                onClick={() => setFilterPeriod('today')}
                className={`px-2.5 py-1 rounded ${filterPeriod === 'today' ? 'bg-white dark:bg-slate-700 font-semibold shadow-xs text-slate-900 dark:text-white' : 'text-slate-500'}`}
              >
                Hoje
              </button>
              <button
                onClick={() => setFilterPeriod('week')}
                className={`px-2.5 py-1 rounded ${filterPeriod === 'week' ? 'bg-white dark:bg-slate-700 font-semibold shadow-xs text-slate-900 dark:text-white' : 'text-slate-500'}`}
              >
                7 Dias
              </button>
              <button
                onClick={() => setFilterPeriod('month')}
                className={`px-2.5 py-1 rounded ${filterPeriod === 'month' ? 'bg-white dark:bg-slate-700 font-semibold shadow-xs text-slate-900 dark:text-white' : 'text-slate-500'}`}
              >
                Este Mês
              </button>
              <button
                onClick={() => setFilterPeriod('all')}
                className={`px-2.5 py-1 rounded ${filterPeriod === 'all' ? 'bg-white dark:bg-slate-700 font-semibold shadow-xs text-slate-900 dark:text-white' : 'text-slate-500'}`}
              >
                Todos
              </button>
            </div>

            {/* Filtro Tipo */}
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">Todas Operações</option>
              <option value="receita">Apenas Receitas</option>
              <option value="despesa">Apenas Despesas</option>
            </select>

            {/* Filtro Status */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">Todos Status</option>
              <option value="pago">Quitados / Pagos</option>
              <option value="pendente">Pendentes</option>
              <option value="vencido">Atrasados / Vencidos</option>
            </select>
          </div>
        </div>

        {/* Tabela de Lançamentos */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px]">
                <th className="py-3 px-4">Vencimento</th>
                <th className="py-3 px-4">Descrição / Origem</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Cliente / Fornecedor</th>
                <th className="py-3 px-4 text-center">Forma Pagto</th>
                <th className="py-3 px-4 text-right">Valor (R$)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Nenhum lançamento financeiro encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(t => {
                  const isRevenue = t.type === 'receita';
                  const isPaid = t.status === 'pago';
                  const isOverdue = !isPaid && t.due_date < todayStr;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {formatDate(t.due_date)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {isRevenue ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          )}
                          {t.description}
                        </div>
                        {t.os_number && (
                          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                            Ref: OS #{String(t.os_number).padStart(4, '0')}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{t.category}</td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {t.client_name || '---'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono uppercase text-[11px] text-slate-600 dark:text-slate-400">
                        {t.payment_method || '---'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-sm">
                        <span className={isRevenue ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {isRevenue ? '+' : '-'} {formatCurrency(t.paid_amount || t.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : isOverdue
                              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {isPaid ? 'Pago' : isOverdue ? 'Vencido' : 'Pendente'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {!isPaid && (
                            <button
                              onClick={() => handleOpenPayModal(t)}
                              title="Dar Baixa / Receber"
                              className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 text-[10px] font-semibold hover:bg-emerald-100"
                            >
                              Baixar
                            </button>
                          )}

                          {isPaid && isRevenue && (
                            <button
                              onClick={() => setReceiptTx(t)}
                              title="Emitir Recibo PF (CPF)"
                              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (confirm(`Deseja excluir o lançamento "${t.description}"?`)) {
                                deleteTransaction(t.id);
                              }
                            }}
                            title="Excluir"
                            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova Transação */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                {txType === 'receita' ? 'Nova Receita / Entrada' : 'Nova Despesa / Saída'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTxType('receita')}
                  className={`py-2 text-xs rounded-lg font-bold border ${
                    txType === 'receita'
                      ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  + Receita (Entrada)
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('despesa')}
                  className={`py-2 text-xs rounded-lg font-bold border ${
                    txType === 'despesa'
                      ? 'bg-rose-50 dark:bg-rose-950 border-rose-500 text-rose-700 dark:text-rose-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  - Despesa (Saída)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Descrição do Lançamento *
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ex: Venda de carregador, Aluguel do ponto, Compra de pasta térmica"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Data de Vencimento
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Serviços de Manutenção">Serviços de Manutenção</option>
                    <option value="Venda de Peças / Balcão">Venda de Peças / Balcão</option>
                    <option value="Compra de Peças / Fornecedor">Compra de Peças / Fornecedor</option>
                    <option value="Ferramentas e Equipamentos">Ferramentas e Equipamentos</option>
                    <option value="Aluguel e Ponto Comercial">Aluguel e Ponto Comercial</option>
                    <option value="Energia / Internet / Telefonia">Energia / Internet / Telefonia</option>
                    <option value="Impostos / DAS MEI / Carnê Leão">Impostos / DAS MEI / Carnê Leão</option>
                    <option value="Outras Receitas">Outras Receitas</option>
                    <option value="Outras Despesas">Outras Despesas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="pix">PIX</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartao_credito">Cartão de Crédito</option>
                    <option value="cartao_debito">Cartão de Débito</option>
                    <option value="boleto">Boleto Bancário</option>
                    <option value="transferencia">Transferência</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Vincular Cliente / Fornecedor (Opcional)
                </label>
                <select
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">Nenhum (Consumidor ou Despesa Geral)</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.document || 'Sem doc'}) {c.is_supplier ? '- Fornecedor' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Baixar Transação */}
      {isPayModalOpen && selectedTxToPay && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Confirmar Quitação de Lançamento
              </h2>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{selectedTxToPay.description}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Valor a Baixar:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatCurrency(selectedTxToPay.amount)}
                  </strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Data Efetiva do Pagamento
                </label>
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={e => setPayDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Forma de Pagamento Utilizada
                </label>
                <select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="pix">PIX</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="boleto">Boleto Bancário</option>
                  <option value="transferencia">Transferência</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  Confirmar Baixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Recibo PF */}
      {receiptTx && (
        <PFReceiptModal
          transaction={receiptTx}
          onClose={() => setReceiptTx(null)}
        />
      )}
    </div>
  );
};
