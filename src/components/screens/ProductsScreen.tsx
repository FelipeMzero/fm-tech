import React, { useState } from 'react';
import { useAppStore } from '../../lib/store';
import { Product } from '../../lib/types';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  ArrowUpDown,
  Edit3,
  Trash2,
  Barcode,
  History,
  X,
  Save,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Layers
} from 'lucide-react';

export const ProductsScreen: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, adjustStock, stockMovements } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'movements'>('products');

  // Modal Produto
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Produto
  const [internalCode, setInternalCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('UN');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [profitMargin, setProfitMargin] = useState<number>(50);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(3);
  const [active, setActive] = useState(true);

  // Modal Ajuste de Estoque
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'entrada' | 'saida' | 'ajuste'>('entrada');
  const [adjustQuantity, setAdjustQuantity] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState('');

  // Handlers
  const handleOpenNewModal = () => {
    setEditingProduct(null);
    setInternalCode(`P${String(products.length + 1).padStart(4, '0')}`);
    setBarcode('');
    setDescription('');
    setUnit('UN');
    setCostPrice(0);
    setProfitMargin(50);
    setSalePrice(0);
    setCurrentStock(0);
    setMinStock(3);
    setActive(true);
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setInternalCode(p.internal_code || '');
    setBarcode(p.barcode || '');
    setDescription(p.description);
    setUnit(p.unit || 'UN');
    setCostPrice(p.cost_price);
    setProfitMargin(p.profit_margin);
    setSalePrice(p.sale_price);
    setCurrentStock(p.current_stock);
    setMinStock(p.min_stock);
    setActive(p.active);
    setIsProductModalOpen(true);
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

  const handleSalePriceChange = (val: number) => {
    setSalePrice(val);
    if (costPrice > 0) {
      const margin = ((val - costPrice) / costPrice) * 100;
      setProfitMargin(Math.round(margin * 10) / 10);
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Descrição do produto é obrigatória.');
      return;
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        internal_code: internalCode,
        barcode,
        description,
        unit,
        cost_price: Number(costPrice) || 0,
        profit_margin: Number(profitMargin) || 0,
        sale_price: Number(salePrice) || 0,
        current_stock: Number(currentStock) || 0,
        min_stock: Number(minStock) || 0,
        active
      });
    } else {
      addProduct({
        internal_code: internalCode,
        barcode,
        description,
        unit,
        cost_price: Number(costPrice) || 0,
        profit_margin: Number(profitMargin) || 0,
        sale_price: Number(salePrice) || 0,
        current_stock: Number(currentStock) || 0,
        min_stock: Number(minStock) || 0,
        active
      });
    }
    setIsProductModalOpen(false);
  };

  const handleOpenAdjustModal = (p: Product) => {
    setSelectedProductForAdjust(p);
    setAdjustType('entrada');
    setAdjustQuantity(1);
    setAdjustReason('Entrada de mercadoria / compra');
    setIsAdjustModalOpen(true);
  };

  const handleConfirmAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForAdjust) return;

    if (adjustQuantity <= 0) {
      alert('Quantidade deve ser maior que zero.');
      return;
    }

    adjustStock(selectedProductForAdjust.id, adjustQuantity, adjustType, adjustReason);
    setIsAdjustModalOpen(false);
  };

  // Filtragem
  const filteredProducts = products.filter(p => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      p.description.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      (p.internal_code && p.internal_code.toLowerCase().includes(q));

    if (!matchSearch) return false;
    if (filterLowStock && p.current_stock > p.min_stock) return false;
    return true;
  });

  const lowStockCount = products.filter(p => p.current_stock <= p.min_stock).length;
  const totalCostValue = products.reduce((acc, p) => acc + p.cost_price * p.current_stock, 0);
  const totalSaleValue = products.reduce((acc, p) => acc + p.sale_price * p.current_stock, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            Peças e Estoque
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Gerencie o estoque de componentes, peças de reposição e acessórios para Ordens de Serviço e Venda Balcão.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab(activeTab === 'products' ? 'movements' : 'products')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            {activeTab === 'products' ? (
              <>
                <History className="w-4 h-4 text-slate-500" />
                Ver Histórico de Movimentos
              </>
            ) : (
              <>
                <Package className="w-4 h-4 text-blue-600" />
                Ver Lista de Peças
              </>
            )}
          </button>

          <button
            onClick={handleOpenNewModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nova Peça / Produto
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total de Itens Cadastrados</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{products.length}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setFilterLowStock(!filterLowStock)}
          className={`bg-white dark:bg-slate-900 p-4 rounded-xl border cursor-pointer transition-all ${
            filterLowStock
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md'
              : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Estoque Crítico / Baixo</p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{lowStockCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            {filterLowStock ? 'Clique para ver todos' : 'Clique para filtrar peças em falta'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Estoque a Preço de Custo</p>
            <p className="text-xl font-bold text-slate-700 dark:text-slate-300 mt-1">{formatCurrency(totalCostValue)}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Potencial de Venda</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(totalSaleValue)}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {activeTab === 'products' ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Barra de Filtros */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por descrição, código ou barras..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setFilterLowStock(!filterLowStock)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  filterLowStock
                    ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Estoque Crítico ({lowStockCount})
              </button>
            </div>
          </div>

          {/* Tabela de Produtos */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px]">
                  <th className="py-3 px-4">Código / Barras</th>
                  <th className="py-3 px-4">Descrição da Peça</th>
                  <th className="py-3 px-4 text-center">Un.</th>
                  <th className="py-3 px-4 text-right">Preço Custo</th>
                  <th className="py-3 px-4 text-right">Margem</th>
                  <th className="py-3 px-4 text-right">Preço Venda</th>
                  <th className="py-3 px-4 text-center">Estoque Atual</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      Nenhuma peça encontrada com os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(p => {
                    const isLowStock = p.current_stock <= p.min_stock;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                            {p.internal_code || '---'}
                          </div>
                          {p.barcode && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-0.5">
                              <Barcode className="w-3 h-3 text-slate-400" />
                              {p.barcode}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900 dark:text-white">{p.description}</div>
                          {!p.active && (
                            <span className="text-[9px] bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 px-1.5 py-0.2 rounded font-semibold">
                              Inativo
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-500">{p.unit}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-500">
                          {formatCurrency(p.cost_price)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-500">
                          {p.profit_margin}%
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(p.sale_price)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold font-mono text-xs ${
                                isLowStock
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}
                            >
                              {p.current_stock}
                            </span>
                            {isLowStock && (
                              <span title={`Mínimo: ${p.min_stock}`} className="text-amber-500">
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Mín: {p.min_stock}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenAdjustModal(p)}
                              title="Ajuste Rápido de Estoque"
                              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400"
                            >
                              <ArrowUpDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              title="Editar Produto"
                              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Deseja remover "${p.description}"?`)) {
                                  deleteProduct(p.id);
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
      ) : (
        /* Aba de Histórico de Movimentações */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              Histórico Geral de Movimentações de Estoque
            </h2>
            <span className="text-xs text-slate-400">Total: {stockMovements.length} registros</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px]">
                  <th className="py-3 px-4">Data/Hora</th>
                  <th className="py-3 px-4">Produto</th>
                  <th className="py-3 px-4 text-center">Tipo</th>
                  <th className="py-3 px-4 text-center">Qtd.</th>
                  <th className="py-3 px-4 text-center">Saldo Anterior</th>
                  <th className="py-3 px-4 text-center">Novo Saldo</th>
                  <th className="py-3 px-4">Motivo / Origem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {stockMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Nenhuma movimentação registrada até o momento.
                    </td>
                  </tr>
                ) : (
                  stockMovements.map(m => {
                    const isPositive = ['entrada', 'estorno_os'].includes(m.type);
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono text-slate-500">{formatDate(m.created_at)}</td>
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                          {m.product_name || 'Produto'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isPositive
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {m.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold">
                          <span className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                            {isPositive ? `+${m.quantity}` : `-${m.quantity}`}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-500">{m.previous_stock}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                          {m.new_stock}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-xs">
                          {m.reason || 'Movimentação manual'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Cadastro/Edição de Produto */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                {editingProduct ? 'Editar Peça / Produto' : 'Cadastrar Nova Peça'}
              </h2>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Código Interno
                  </label>
                  <input
                    type="text"
                    value={internalCode}
                    onChange={e => setInternalCode(e.target.value)}
                    placeholder="Ex: P0001"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Código de Barras (EAN)
                  </label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={e => setBarcode(e.target.value)}
                    placeholder="Ex: 7891234567890"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Descrição da Peça / Produto *
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ex: SSD Kingston 480GB SATA III 2.5"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Unidade</label>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="UN">UN (Unidade)</option>
                    <option value="CX">CX (Caixa)</option>
                    <option value="PC">PC (Pacote)</option>
                    <option value="MT">MT (Metro)</option>
                    <option value="KG">KG (Quilo)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Preço de Custo (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={costPrice}
                    onChange={e => handleCostChange(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Margem Lucro (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={profitMargin}
                    onChange={e => handleMarginChange(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                    Preço de Venda (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={salePrice}
                    onChange={e => handleSalePriceChange(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-lg border-2 border-blue-500 bg-blue-50/30 dark:bg-blue-950/30 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Estoque Atual
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={currentStock}
                    onChange={e => setCurrentStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Estoque Mínimo (Alerta)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minStock}
                    onChange={e => setMinStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activeProd"
                  checked={active}
                  onChange={e => setActive(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="activeProd" className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Produto Ativo (visível para inclusão em OS e Venda)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  Salvar Peça
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ajuste Rápido de Estoque */}
      {isAdjustModalOpen && selectedProductForAdjust && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5 text-blue-600" />
                Ajuste Manual de Estoque
              </h2>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjust} className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {selectedProductForAdjust.description}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Estoque Atual:{' '}
                  <strong className="text-blue-600 dark:text-blue-400">{selectedProductForAdjust.current_stock}</strong>{' '}
                  {selectedProductForAdjust.unit}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Tipo de Movimentação
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('entrada')}
                    className={`py-2 px-3 text-xs rounded-lg font-medium border text-center transition-colors ${
                      adjustType === 'entrada'
                        ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    + Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('saida')}
                    className={`py-2 px-3 text-xs rounded-lg font-medium border text-center transition-colors ${
                      adjustType === 'saida'
                        ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-500 text-rose-700 dark:text-rose-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    - Saída
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('ajuste')}
                    className={`py-2 px-3 text-xs rounded-lg font-medium border text-center transition-colors ${
                      adjustType === 'ajuste'
                        ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-500 text-blue-700 dark:text-blue-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    = Balanço
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {adjustType === 'ajuste' ? 'Nova Quantidade Absoluta' : 'Quantidade a Movimentar'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQuantity}
                  onChange={e => setAdjustQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Motivo / Justificativa *
                </label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder="Ex: Compra NF 1234, avaria física, recontagem"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  Confirmar Movimentação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
