import React, { useState } from 'react';
import { useAppStore } from '../../lib/store';
import { DigitalLicense, LicenseCategory, LicenseStatus } from '../../lib/types';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  KeyRound,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Edit3,
  Trash2,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Laptop,
  FileCode,
  Layers,
  X,
  Save,
  Link2Off,
  Eye,
  EyeOff
} from 'lucide-react';

const CATEGORY_DETAILS: Record<LicenseCategory, { label: string; bg: string; text: string; icon: any }> = {
  sistema_operacional: { label: 'Sistema Operacional', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300', text: 'text-blue-600', icon: Laptop },
  office: { label: 'Office & Produtividade', bg: 'bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300', text: 'text-orange-600', icon: FileCode },
  antivirus: { label: 'Antivírus & Segurança', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300', text: 'text-emerald-600', icon: ShieldCheck },
  servidor: { label: 'Servidores & Cloud', bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300', text: 'text-purple-600', icon: Layers },
  utilitario: { label: 'Utilitários & Drivers', bg: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300', text: 'text-cyan-600', icon: KeyRound },
  outro: { label: 'Outros Softwares', bg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300', text: 'text-slate-600', icon: KeyRound },
};

export const LicensesScreen: React.FC = () => {
  const { licenses, addLicense, updateLicense, deleteLicense, releaseLicenseFromOS } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<DigitalLicense | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<LicenseCategory>('sistema_operacional');
  const [licenseKey, setLicenseKey] = useState('');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [profitMargin, setProfitMargin] = useState<number>(60);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [duration, setDuration] = useState('Vitalícia');
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');

  // Handlers
  const openNewModal = () => {
    setEditingLicense(null);
    setName('');
    setCategory('sistema_operacional');
    setLicenseKey('');
    setCostPrice(0);
    setProfitMargin(60);
    setSalePrice(0);
    setDuration('Vitalícia');
    setSupplier('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (lic: DigitalLicense) => {
    setEditingLicense(lic);
    setName(lic.name);
    setCategory(lic.category);
    setLicenseKey(lic.license_key);
    setCostPrice(lic.cost_price);
    const margin = lic.cost_price > 0 ? ((lic.sale_price - lic.cost_price) / lic.cost_price) * 100 : 0;
    setProfitMargin(Math.round(margin * 10) / 10);
    setSalePrice(lic.sale_price);
    setDuration(lic.duration || 'Vitalícia');
    setSupplier(lic.supplier || '');
    setNotes(lic.notes || '');
    setIsModalOpen(true);
  };

  const handleCostChange = (val: number) => {
    setCostPrice(val);
    const calculated = val * (1 + profitMargin / 100);
    setSalePrice(Math.round(calculated * 100) / 100);
  };

  const handleMarginChange = (val: number) => {
    setProfitMargin(val);
    const calculated = costPrice * (1 + val / 100);
    setSalePrice(Math.round(calculated * 100) / 100);
  };

  const handleSaleChange = (val: number) => {
    setSalePrice(val);
    if (costPrice > 0) {
      const margin = ((val - costPrice) / costPrice) * 100;
      setProfitMargin(Math.round(margin * 10) / 10);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !licenseKey) {
      alert('Preencha o nome do produto digital e a chave de ativação.');
      return;
    }

    const payload = {
      name,
      category,
      license_key: licenseKey.trim().toUpperCase(),
      status: editingLicense ? editingLicense.status : ('disponivel' as LicenseStatus),
      cost_price: Number(costPrice) || 0,
      sale_price: Number(salePrice) || 0,
      duration,
      supplier,
      notes,
    };

    if (editingLicense) {
      updateLicense(editingLicense.id, payload);
    } else {
      addLicense(payload);
    }

    setIsModalOpen(false);
  };

  const handleCopyKey = (id: string, key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const toggleRevealKey = (id: string) => {
    setRevealedKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRelease = (lic: DigitalLicense) => {
    if (confirm(`Deseja desvincular a chave "${lic.name}" da OS #${lic.os_number}? Ela voltará a ficar disponível para venda.`)) {
      releaseLicenseFromOS(lic.id);
    }
  };

  const handleDelete = (lic: DigitalLicense) => {
    if (confirm(`Tem certeza que deseja excluir a licença "${lic.name}"?`)) {
      deleteLicense(lic.id);
    }
  };

  // KPIs
  const totalLicenses = licenses.length;
  const availableLicenses = licenses.filter(l => l.status === 'disponivel').length;
  const usedLicenses = licenses.filter(l => l.status === 'em_uso').length;
  const totalStockCost = licenses.filter(l => l.status === 'disponivel').reduce((acc, l) => acc + l.cost_price, 0);
  const totalStockSale = licenses.filter(l => l.status === 'disponivel').reduce((acc, l) => acc + l.sale_price, 0);

  // Filtered List
  const filteredLicenses = licenses.filter(l => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      l.name.toLowerCase().includes(q) ||
      l.license_key.toLowerCase().includes(q) ||
      (l.client_name && l.client_name.toLowerCase().includes(q)) ||
      (l.os_number && l.os_number.toString().includes(q)) ||
      (l.supplier && l.supplier.toLowerCase().includes(q));

    const matchesCategory = filterCategory === 'all' || l.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || l.status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Licenças & Produtos Digitais
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Estoque de chaves seriais (Windows, Office, Antivírus) e vinculação automática às Ordens de Serviço.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openNewModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-semibold shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Licença Digital</span>
        </button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total de Chaves</span>
            <KeyRound className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{totalLicenses}</div>
          <p className="text-[11px] text-slate-400">Total cadastradas no acervo digital</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Disponíveis em Estoque</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{availableLicenses}</div>
          <p className="text-[11px] text-slate-400">Prontas para adicionar em novas OS</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Vinculadas a OS (Em Uso)</span>
            <ExternalLink className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{usedLicenses}</div>
          <p className="text-[11px] text-slate-400">Entregues / ativadas em clientes</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Valor em Estoque</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Venda: {formatCurrency(totalStockSale)}
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(totalStockCost)}</div>
          <p className="text-[11px] text-slate-400">Custo total em estoque digital livre</p>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, chave serial, cliente ou OS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="all">Todas as Categorias</option>
            <option value="sistema_operacional">Sistemas Operacionais</option>
            <option value="office">Office & Produtividade</option>
            <option value="antivirus">Antivírus & Segurança</option>
            <option value="servidor">Servidores & Cloud</option>
            <option value="utilitario">Utilitários & Drivers</option>
            <option value="outro">Outros</option>
          </select>

          <div className="flex gap-1 text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterStatus('disponivel')}
              className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'disponivel'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Disponíveis ({availableLicenses})
            </button>
            <button
              onClick={() => setFilterStatus('em_uso')}
              className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'em_uso'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Em Uso ({usedLicenses})
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Licenças */}
      {filteredLicenses.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center space-y-3">
          <KeyRound className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhuma licença digital encontrada</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchTerm || filterCategory !== 'all' || filterStatus !== 'all'
              ? 'Tente ajustar os filtros ou o termo de busca.'
              : 'Cadastre suas licenças do Windows, Office ou Antivírus para vincular direto às Ordens de Serviço!'}
          </p>
          <button
            onClick={openNewModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeira Licença</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLicenses.map((lic) => {
            const catInfo = CATEGORY_DETAILS[lic.category] || CATEGORY_DETAILS.outro;
            const CatIcon = catInfo.icon;
            const isRevealed = revealedKeys[lic.id];
            const isCopied = copiedKeyId === lic.id;

            return (
              <div
                key={lic.id}
                className={`bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm transition-all flex flex-col justify-between space-y-4 ${
                  lic.status === 'em_uso'
                    ? 'border-blue-200 dark:border-blue-900/60 bg-blue-50/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700'
                }`}
              >
                <div className="space-y-3">
                  {/* Topo do Card: Categoria & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${catInfo.bg}`}>
                      <CatIcon className="w-3 h-3" />
                      <span>{catInfo.label}</span>
                    </span>

                    {lic.status === 'disponivel' ? (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Disponível</span>
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3 text-blue-600" />
                        <span>Em Uso</span>
                      </span>
                    )}
                  </div>

                  {/* Nome da Licença */}
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                      {lic.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span>Validade: <strong>{lic.duration || 'Vitalícia'}</strong></span>
                      {lic.supplier && <span>• Fornec: {lic.supplier}</span>}
                    </div>
                  </div>

                  {/* Chave de Ativação / Serial */}
                  <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold uppercase">
                      <span>Chave de Ativação (Serial Key)</span>
                      <button
                        type="button"
                        onClick={() => toggleRevealKey(lic.id)}
                        className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-[10px]"
                      >
                        {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{isRevealed ? 'Ocultar' : 'Revelar'}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <code className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100 select-all tracking-wide break-all">
                        {isRevealed
                          ? lic.license_key
                          : `${lic.license_key.slice(0, 5)}-•••••-•••••-•••••-${lic.license_key.slice(-5)}`}
                      </code>

                      <button
                        type="button"
                        onClick={() => handleCopyKey(lic.id, lic.license_key)}
                        className={`p-1.5 rounded transition-all flex items-center gap-1 shrink-0 ${
                          isCopied
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300'
                        }`}
                        title="Copiar chave de ativação"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {isCopied && <span className="text-[10px] pr-1">Copiado</span>}
                      </button>
                    </div>
                  </div>

                  {/* Detalhes de Vínculo com OS (Se estiver em uso) */}
                  {lic.status === 'em_uso' && (
                    <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1">
                          <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                          <span>Vinculada à OS #{lic.os_number}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRelease(lic)}
                          className="text-[10px] font-bold text-rose-600 hover:underline flex items-center gap-0.5"
                          title="Desvincular da OS e devolver ao estoque"
                        >
                          <Link2Off className="w-3 h-3" />
                          <span>Desvincular</span>
                        </button>
                      </div>
                      {lic.client_name && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          Cliente: <strong>{lic.client_name}</strong>
                        </p>
                      )}
                      {lic.assigned_at && (
                        <p className="text-[10px] text-slate-400">
                          Atribuída em: {formatDate(lic.assigned_at)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Notas / Instruções */}
                  {lic.notes && (
                    <p className="text-[11px] text-slate-500 italic bg-slate-50 dark:bg-slate-800/40 p-2 rounded border border-slate-100 dark:border-slate-800">
                      "{lic.notes}"
                    </p>
                  )}
                </div>

                {/* Rodapé: Preços e Ações */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400">Preço de Venda</div>
                    <div className="text-base font-black text-slate-900 dark:text-white">
                      {formatCurrency(lic.sale_price)}
                    </div>
                    {lic.cost_price > 0 && (
                      <div className="text-[10px] text-slate-500">
                        Custo: {formatCurrency(lic.cost_price)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(lic)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Editar licença"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(lic)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Excluir licença"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Cadastro / Edição de Licença */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {editingLicense ? 'Editar Licença Digital' : 'Cadastrar Nova Licença Digital'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold block mb-1">
                  Nome do Produto Digital *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Windows 11 Pro OEM 64-bit, Office 2021, Kaspersky Plus..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Categoria *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as LicenseCategory)}
                    className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-800"
                  >
                    <option value="sistema_operacional">Sistema Operacional</option>
                    <option value="office">Office & Produtividade</option>
                    <option value="antivirus">Antivírus & Segurança</option>
                    <option value="servidor">Servidores & Cloud</option>
                    <option value="utilitario">Utilitários & Drivers</option>
                    <option value="outro">Outros Softwares</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Duração / Validade</label>
                  <input
                    type="text"
                    placeholder="Vitalícia, 1 Ano, 2 Anos, Mensal..."
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-emerald-700 dark:text-emerald-400">
                  Chave de Ativação / Serial Key *
                </label>
                <input
                  type="text"
                  required
                  placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                  className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-800 font-mono font-bold tracking-wider uppercase text-emerald-800 dark:text-emerald-300"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Esta chave poderá ser inserida com 1 clique na OS e será impressa para o cliente.
                </p>
              </div>

              {/* Preço de Custo, Margem e Preço de Venda */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="font-semibold block mb-1 text-slate-600 dark:text-slate-400">
                    Preço Custo (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={costPrice}
                    onChange={(e) => handleCostChange(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-600 dark:text-slate-400">
                    Margem (%)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={profitMargin}
                    onChange={(e) => handleMarginChange(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-emerald-700 dark:text-emerald-400 font-bold">
                    Preço Venda (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={salePrice}
                    onChange={(e) => handleSaleChange(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800 font-mono font-bold text-emerald-700 dark:text-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Fornecedor / Origem da Chave (Opcional)</label>
                <input
                  type="text"
                  placeholder="Distribuidora, Microsoft Partner, etc."
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Instruções de Ativação / Notas Técnicas</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Link para download do instalador oficial ou instruções de ativação..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingLicense ? 'Salvar Alterações' : 'Salvar no Estoque Digital'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
