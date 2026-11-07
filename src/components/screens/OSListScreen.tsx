import React, { useState } from 'react';
import { ServiceOrder, OSStatus, PaymentMethod } from '../../lib/types';
import { useAppStore } from '../../lib/store';
import { 
  formatCurrency, 
  formatDate, 
  formatDateTime, 
  formatPhone, 
  OS_STATUS_DETAILS 
} from '../../lib/utils';
import { OSFormModal } from '../os/OSFormModal';
import { OSPrintA4Modal } from '../os/OSPrintA4Modal';
import { OSPrintThermalModal } from '../os/OSPrintThermalModal';
import { 
  Wrench, 
  PlusCircle, 
  Printer, 
  Receipt, 
  Share2, 
  DollarSign, 
  ExternalLink, 
  Search, 
  Trash2, 
  Edit3, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface OSListScreenProps {
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  onOpenPortal: (token: string) => void;
}

export const OSListScreen: React.FC<OSListScreenProps> = ({ 
  searchTerm, 
  setSearchTerm,
  onOpenPortal 
}) => {
  const { serviceOrders, clients, deleteServiceOrder, invoiceServiceOrder, issuer } = useAppStore();

  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [editingOS, setEditingOS] = useState<ServiceOrder | null>(null);
  const [isNewOSOpen, setIsNewOSOpen] = useState<boolean>(false);
  const [printA4OS, setPrintA4OS] = useState<ServiceOrder | null>(null);
  const [printThermalOS, setPrintThermalOS] = useState<ServiceOrder | null>(null);

  // Modal de Faturamento em 1 Clique
  const [invoicingOS, setInvoicingOS] = useState<ServiceOrder | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('pix');

  // Filtragem
  const filteredOrders = serviceOrders.filter((os) => {
    const client = clients.find(c => c.id === os.client_id);
    const matchesStatus = statusFilter === 'todos' || os.status === statusFilter;
    
    const query = searchTerm.toLowerCase();
    const matchesSearch = 
      !searchTerm ||
      os.os_number.toString().includes(query) ||
      (client?.name && client.name.toLowerCase().includes(query)) ||
      os.equipment_type.toLowerCase().includes(query) ||
      (os.brand && os.brand.toLowerCase().includes(query)) ||
      (os.model && os.model.toLowerCase().includes(query)) ||
      (os.serial_imei && os.serial_imei.toLowerCase().includes(query));

    return matchesStatus && matchesSearch;
  });

  // Geração de mensagem formatada para WhatsApp
  const handleShareWhatsApp = (os: ServiceOrder) => {
    const client = clients.find(c => c.id === os.client_id);
    const cleanPhone = (client?.whatsapp || client?.phone || '').replace(/\D/g, '');
    const trackingUrl = `${window.location.origin}/#/acompanhar/${os.public_tracking_token}`;

    const text = encodeURIComponent(
      `Olá ${client?.name || 'Cliente'}!\n` +
      `Aqui é da assistência técnica *${issuer.trade_name || issuer.full_name}* (Técnico: ${issuer.full_name} - CPF: ${issuer.cpf}).\n\n` +
      `Sua Ordem de Serviço *#${os.os_number.toString().padStart(4, '0')}* do equipamento *${os.equipment_type} ${os.brand} ${os.model}* está com o status: *${OS_STATUS_DETAILS[os.status]?.label.toUpperCase()}*.\n` +
      `Valor Total: *${formatCurrency(os.total_amount)}*\n\n` +
      `Você pode acompanhar as fotos, laudo e aprovar o orçamento pelo link público:\n` +
      `${trackingUrl}\n\n` +
      `Chave PIX (${issuer.pix_key_type}): *${issuer.pix_key}*\n` +
      `Qualquer dúvida estamos à disposição!`
    );

    const waUrl = cleanPhone 
      ? `https://wa.me/55${cleanPhone}?text=${text}`
      : `https://wa.me/?text=${text}`;

    window.open(waUrl, '_blank');
  };

  const handleConfirmInvoice = () => {
    if (!invoicingOS) return;
    invoiceServiceOrder(invoicingOS.id, selectedPaymentMethod);
    setInvoicingOS(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Topo com Título e Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Ordens de Serviço (OS)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gestão completa de entradas de bancada, laudos, faturamento e impressão.
          </p>
        </div>

        <button
          onClick={() => setIsNewOSOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-semibold shadow-md transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Abrir Nova OS</span>
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Busca */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por Nº OS, cliente, equipamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Abas Rápidas de Status */}
          <div className="flex gap-1 overflow-x-auto w-full md:w-auto pb-1 text-xs">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'orcamento', label: 'Orçamentos' },
              { id: 'em_andamento', label: 'Em Bancada' },
              { id: 'aguardando_aprovacao', label: 'Aguardando' },
              { id: 'finalizado', label: 'Prontos' },
              { id: 'entregue', label: 'Entregues' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Ordens de Serviço */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-12 text-center space-y-3">
          <Wrench className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhuma Ordem de Serviço encontrada</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Abra uma nova Ordem de Serviço ou ajuste os termos de busca e filtros.
          </p>
          <button
            onClick={() => setIsNewOSOpen(true)}
            className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700"
          >
            Abrir Primeira OS
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredOrders.map((os) => {
            const client = clients.find(c => c.id === os.client_id) || os.client;
            const statusInfo = OS_STATUS_DETAILS[os.status] || { label: os.status, bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200' };

            return (
              <div
                key={os.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-extrabold px-2.5 py-1 bg-slate-900 text-white rounded-lg">
                      #{os.os_number.toString().padStart(4, '0')}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                        {os.equipment_type} - {os.brand} {os.model}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Cliente: <strong className="text-slate-800 dark:text-slate-200">{client?.name || 'Cliente'}</strong> 
                        {client?.whatsapp ? ` • WhatsApp: ${formatPhone(client.whatsapp)}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                      {statusInfo.label}
                    </span>

                    {os.invoiced ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle className="w-3.5 h-3.5" /> Faturada
                      </span>
                    ) : (
                      <button
                        onClick={() => setInvoicingOS(os)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800 hover:bg-blue-100"
                        title="Faturar OS e gerar lançamento no financeiro"
                      >
                        <DollarSign className="w-3.5 h-3.5" /> Faturar OS
                      </button>
                    )}
                  </div>
                </div>

                {/* Detalhes do Defeito e Itens */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-500 uppercase text-[10px]">Defeito Relatado:</span>
                    <p className="text-slate-800 dark:text-slate-200 line-clamp-2">
                      {os.reported_defect || 'Nenhum detalhe informado'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="font-semibold text-slate-500 uppercase text-[10px]">Prazos & Datas:</span>
                    <p className="text-slate-700 dark:text-slate-300">
                      Entrada: {formatDate(os.entry_date)}
                    </p>
                    {os.estimated_delivery_date && (
                      <p className="text-blue-600 dark:text-blue-400 font-medium">
                        Previsão: {formatDate(os.estimated_delivery_date)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 text-right md:border-l border-slate-100 dark:border-slate-800 md:pl-4">
                    <span className="font-semibold text-slate-500 uppercase text-[10px]">Valor Total:</span>
                    <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
                      {formatCurrency(os.total_amount)}
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      {os.services.length} serviço(s) • {os.products.length} peça(s)
                    </span>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenPortal(os.public_tracking_token)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Abrir página de rastreamento do cliente"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                      <span>Portal Cliente</span>
                    </button>

                    <button
                      onClick={() => handleShareWhatsApp(os)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                      title="Enviar status da OS formatado para o WhatsApp do cliente"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      onClick={() => setPrintA4OS(os)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Printer className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Imprimir A4</span>
                    </button>

                    <button
                      onClick={() => setPrintThermalOS(os)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Receipt className="w-3.5 h-3.5 text-amber-500" />
                      <span>Cupom Térmico</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingOS(os)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-100"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Deseja realmente excluir a OS #${os.os_number}? As peças serão estornadas se houver.`)) {
                          deleteServiceOrder(os.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                      title="Excluir OS"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL EDITAR / NOVA OS */}
      {(isNewOSOpen || editingOS) && (
        <OSFormModal
          osToEdit={editingOS}
          onClose={() => {
            setIsNewOSOpen(false);
            setEditingOS(null);
          }}
          onSaved={() => {
            setIsNewOSOpen(false);
            setEditingOS(null);
          }}
        />
      )}

      {/* MODAL IMPRESSÃO A4 */}
      {printA4OS && (
        <OSPrintA4Modal
          os={printA4OS}
          onClose={() => setPrintA4OS(null)}
        />
      )}

      {/* MODAL IMPRESSÃO TÉRMICA */}
      {printThermalOS && (
        <OSPrintThermalModal
          os={printThermalOS}
          onClose={() => setPrintThermalOS(null)}
        />
      )}

      {/* MODAL FATURAR EM 1 CLIQUE */}
      {invoicingOS && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Faturar Ordem de Serviço #{invoicingOS.os_number}
                </h3>
              </div>
              <button onClick={() => setInvoicingOS(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                  <span>Valor a Receber:</span>
                  <span className="text-sm font-mono text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(invoicingOS.total_amount)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Emitente Pessoa Física: <strong>{issuer.full_name} (CPF {issuer.cpf})</strong>
                </p>
              </div>

              <div>
                <label className="font-semibold block mb-1">Forma de Pagamento *</label>
                <select
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-800 font-semibold"
                >
                  <option value="pix">PIX (Chave ou QR Code)</option>
                  <option value="dinheiro">Dinheiro em Espécie</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="transferencia">Transferência Bancária</option>
                  <option value="boleto">Boleto Bancário</option>
                </select>
              </div>

              <p className="text-[11px] text-slate-500">
                Ao confirmar, um lançamento de receita quitada será criado automaticamente no Módulo Financeiro e a OS será marcada como faturada.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setInvoicingOS(null)}
                className="px-4 py-2 border rounded-lg text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmInvoice}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-md"
              >
                Confirmar Faturamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
