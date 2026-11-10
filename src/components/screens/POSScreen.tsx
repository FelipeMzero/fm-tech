import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../../lib/store';
import { Product, PaymentMethod } from '../../lib/types';
import { formatCurrency, formatCPF, formatDateTime, formatPhone } from '../../lib/utils';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  Barcode, 
  Printer, 
  DollarSign 
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export const POSScreen: React.FC = () => {
  const { products, clients, createSale, issuer } = useAppStore();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Venda recém-finalizada para exibir recibo
  const [lastSaleReceipt, setLastSaleReceipt] = useState<any | null>(null);

  useEffect(() => {
    if (lastSaleReceipt) {
      document.body.classList.add('has-print-modal');
    } else {
      document.body.classList.remove('has-print-modal');
    }
    return () => {
      document.body.classList.remove('has-print-modal');
    };
  }, [lastSaleReceipt]);

  // Produtos filtrados
  const filteredProducts = products.filter(p => {
    const q = searchTerm.toLowerCase();
    return (
      p.description.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      (p.internal_code && p.internal_code.toLowerCase().includes(q))
    );
  });

  const addToCart = (product: Product) => {
    if (product.current_stock <= 0) {
      alert(`O produto "${product.description}" está com estoque esgotado!`);
      return;
    }

    const existingIdx = cart.findIndex(c => c.product.id === product.id);
    if (existingIdx >= 0) {
      if (cart[existingIdx].quantity + 1 > product.current_stock) {
        alert(`Quantidade máxima em estoque atingida (${product.current_stock} un).`);
        return;
      }
      const updated = [...cart];
      updated[existingIdx].quantity += 1;
      updated[existingIdx].subtotal = updated[existingIdx].quantity * updated[existingIdx].unitPrice;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          unitPrice: product.sale_price,
          subtotal: product.sale_price,
        }
      ]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    const existingIdx = cart.findIndex(c => c.product.id === productId);
    if (existingIdx < 0) return;

    const item = cart[existingIdx];
    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      setCart(cart.filter(c => c.product.id !== productId));
    } else {
      if (newQty > item.product.current_stock) {
        alert(`Estoque máximo disponível: ${item.product.current_stock}`);
        return;
      }
      const updated = [...cart];
      updated[existingIdx].quantity = newQty;
      updated[existingIdx].subtotal = newQty * updated[existingIdx].unitPrice;
      setCart(updated);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(c => c.product.id !== productId));
  };

  // Cálculos
  const grossTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const netTotal = Math.max(0, grossTotal - discountValue);

  // Finalizar Venda
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Adicione ao menos um item ao carrinho.');
      return;
    }

    const client = clients.find(c => c.id === selectedClientId);

    const created = createSale({
      client_id: selectedClientId || undefined,
      client_name: client?.name || 'Consumidor Balcão',
      gross_total: grossTotal,
      discount: discountValue,
      total_amount: netTotal,
      payment_method: paymentMethod,
      invoiced: true,
      items: cart.map(item => ({
        id: 'si-' + Date.now(),
        product_id: item.product.id,
        product_name: item.product.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.subtotal,
      })),
    });

    setLastSaleReceipt({
      sale: created,
      cart: [...cart],
      clientName: client?.name || 'Consumidor Balcão',
      date: new Date().toISOString(),
    });

    // Limpa carrinho
    setCart([]);
    setDiscountValue(0);
    setSelectedClientId('');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Venda Rápida de Balcão (PDV)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Venda direta de peças, cabos e acessórios com baixa imediata de estoque.
          </p>
        </div>

        <div className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
          Emitente PF: <strong>{issuer.full_name} (CPF {formatCPF(issuer.cpf)})</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Catálogo de Produtos para Venda */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por descrição, código de barras (EAN) ou código interno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[620px] overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const inCart = cart.find(c => c.product.id === p.id);
              const isOutOfStock = p.current_stock <= 0;

              return (
                <div
                  key={p.id}
                  onClick={() => !isOutOfStock && addToCart(p)}
                  className={`bg-white dark:bg-slate-900 p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isOutOfStock
                      ? 'opacity-50 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                      : 'hover:border-blue-500 shadow-sm hover:shadow'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                        {p.description}
                      </h3>
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(p.sale_price)}
                      </span>
                    </div>

                    {p.barcode && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                        <Barcode className="w-3 h-3" />
                        <span>{p.barcode}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className={`font-semibold ${p.current_stock <= p.min_stock ? 'text-amber-500' : 'text-slate-500'}`}>
                      Estoque: {p.current_stock} {p.unit}
                    </span>

                    {inCart ? (
                      <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                        {inCart.quantity} no carrinho
                      </span>
                    ) : (
                      <span className="text-blue-600 hover:underline font-semibold flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Adicionar
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Carrinho e Finalização */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-[680px]">
          <div className="space-y-4 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Carrinho de Venda
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-500">{cart.length} item(ns)</span>
            </div>

            {/* Seleção de Cliente */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Cliente (Opcional):
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="">Consumidor Final / Balcão</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Itens do Carrinho */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Nenhum produto adicionado ao carrinho.
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-1.5">
                    <div className="flex justify-between font-semibold">
                      <span className="truncate pr-2 text-slate-800 dark:text-slate-200">{item.product.description}</span>
                      <span className="font-mono">{formatCurrency(item.subtotal)}</span>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-500">
                      <span>{formatCurrency(item.unitPrice)} un.</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-5 h-5 rounded border bg-white dark:bg-slate-700 flex items-center justify-center hover:bg-slate-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono font-bold w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-5 h-5 rounded border bg-white dark:bg-slate-700 flex items-center justify-center hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-rose-500 hover:text-rose-700 ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Totais e Pagamento */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="font-semibold block mb-1">Forma de Pagto:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full p-1.5 border rounded-lg bg-white dark:bg-slate-800 font-semibold"
                >
                  <option value="pix">PIX</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao_debito">Cartão Débito</option>
                  <option value="cartao_credito">Cartão Crédito</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Desconto (R$):</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  className="w-full p-1.5 border rounded-lg bg-white dark:bg-slate-800 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span>{formatCurrency(grossTotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-extrabold border-t border-slate-200 dark:border-slate-800 pt-1 text-slate-900 dark:text-white">
                <span>TOTAL A PAGAR:</span>
                <span className="text-lg font-mono text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(netTotal)}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Finalizar Venda e Emitir Recibo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recibo da Venda em Modal */}
      {lastSaleReceipt && createPortal(
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 print-modal-container">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border max-w-sm w-full space-y-4 print-modal-box">
            <div className="text-center border-b pb-3 space-y-1">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Venda Concluída com Sucesso!
              </h3>
              <p className="text-xs text-slate-500">
                Venda Balcão #{lastSaleReceipt.sale.sale_number}
              </p>
            </div>

            <div className="text-xs font-mono bg-slate-50 dark:bg-slate-800 p-3 rounded space-y-2 border">
              <div><strong>Emitente:</strong> {issuer.full_name}</div>
              <div><strong>CPF:</strong> {formatCPF(issuer.cpf)}</div>
              <div><strong>Cliente:</strong> {lastSaleReceipt.clientName}</div>
              <div><strong>Forma Pagto:</strong> {lastSaleReceipt.sale.payment_method?.toUpperCase()}</div>
              <div className="border-t pt-1">
                <strong>Total Pago:</strong> {formatCurrency(lastSaleReceipt.sale.total_amount)}
              </div>
            </div>

            <div className="flex gap-2 no-print">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-blue-600 text-white font-semibold rounded text-xs flex items-center justify-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir
              </button>
              <button
                onClick={() => setLastSaleReceipt(null)}
                className="px-4 py-2 border rounded text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
