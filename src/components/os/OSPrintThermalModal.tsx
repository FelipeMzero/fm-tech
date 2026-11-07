import React, { useState, useEffect } from 'react';
import { ServiceOrder } from '../../lib/types';
import { useAppStore } from '../../lib/store';
import { 
  formatCurrency, 
  formatDateTime, 
  formatCPF, 
  formatPhone, 
  generatePixPayload, 
  generateQRCodeDataUrl,
  OS_STATUS_DETAILS 
} from '../../lib/utils';
import { Printer, X, Receipt } from 'lucide-react';

interface OSPrintThermalModalProps {
  os: ServiceOrder;
  onClose: () => void;
}

export const OSPrintThermalModal: React.FC<OSPrintThermalModalProps> = ({ os, onClose }) => {
  const { issuer, clients } = useAppStore();
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');
  const [pixQrUrl, setPixQrUrl] = useState<string>('');
  const [trackingQrUrl, setTrackingQrUrl] = useState<string>('');

  const client = clients.find(c => c.id === os.client_id) || os.client;

  useEffect(() => {
    async function loadQRs() {
      if (issuer.pix_key) {
        const payload = generatePixPayload({
          pixKey: issuer.pix_key,
          merchantName: issuer.trade_name || issuer.full_name,
          merchantCity: issuer.city || 'SAO PAULO',
          amount: os.total_amount,
          txId: `OS${os.os_number}`,
        });
        const pixUrl = await generateQRCodeDataUrl(payload);
        setPixQrUrl(pixUrl);
      }

      // QR Code do Portal do Cliente
      const trackingUrl = `${window.location.origin}/#/acompanhar/${os.public_tracking_token}`;
      const trackUrl = await generateQRCodeDataUrl(trackingUrl);
      setTrackingQrUrl(trackUrl);
    }
    loadQRs();
  }, [os, issuer]);

  const handlePrint = () => {
    window.print();
  };

  const is58mm = paperWidth === '58mm';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-100 dark:bg-slate-900 w-full max-w-lg rounded-xl shadow-2xl border border-slate-300 dark:border-slate-800 flex flex-col max-h-[92vh]">
        {/* Header de Ações */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-xl no-print">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Cupom Térmico OS #{os.os_number}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs">
              <button
                onClick={() => setPaperWidth('80mm')}
                className={`px-2.5 py-1 rounded font-medium ${paperWidth === '80mm' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
              >
                80mm
              </button>
              <button
                onClick={() => setPaperWidth('58mm')}
                className={`px-2.5 py-1 rounded font-medium ${paperWidth === '58mm' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
              >
                58mm
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Visualizador do Cupom Térmico */}
        <div className="p-6 overflow-y-auto flex justify-center bg-slate-200 dark:bg-slate-950 flex-1">
          <div
            className={`bg-white text-black p-4 shadow-md font-mono text-xs leading-tight space-y-3 ${
              is58mm ? 'w-[58mm] text-[10px]' : 'w-[80mm] text-[11px]'
            }`}
          >
            {/* Cabeçalho */}
            <div className="text-center border-b border-dashed border-black pb-2 space-y-0.5">
              <div className="font-extrabold uppercase text-sm">
                {issuer.trade_name || issuer.full_name}
              </div>
              <div>Técnico: {issuer.full_name}</div>
              <div className="font-bold">CPF EMITENTE: {formatCPF(issuer.cpf)}</div>
              <div>{issuer.city}/{issuer.state} • Tel: {formatPhone(issuer.whatsapp)}</div>
              <div className="pt-1 text-xs font-bold uppercase tracking-wider">
                === ORDEM DE SERVIÇO #{os.os_number.toString().padStart(4, '0')} ===
              </div>
              <div className="text-[10px] text-slate-600">
                {formatDateTime(os.entry_date)}
              </div>
            </div>

            {/* Cliente */}
            <div className="border-b border-dashed border-black pb-2 space-y-0.5">
              <div className="font-bold uppercase">CLIENTE:</div>
              <div>{client?.name || 'Consumidor'}</div>
              <div>Tel: {formatPhone(client?.whatsapp || client?.phone)}</div>
            </div>

            {/* Equipamento */}
            <div className="border-b border-dashed border-black pb-2 space-y-0.5">
              <div className="font-bold uppercase">EQUIPAMENTO:</div>
              <div>{os.equipment_type} - {os.brand} {os.model}</div>
              {os.serial_imei && <div>SN/IMEI: {os.serial_imei}</div>}
              {os.unlock_password && <div>Senha: {os.unlock_password}</div>}
              <div className="pt-0.5">
                <strong>Defeito:</strong> {os.reported_defect || '-'}
              </div>
            </div>

            {/* Itens */}
            <div className="border-b border-dashed border-black pb-2">
              <div className="font-bold uppercase mb-1">SERVIÇOS & PEÇAS:</div>
              {os.services.map((s, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="truncate pr-1">{s.quantity}x {s.name}</span>
                  <span className="font-semibold whitespace-nowrap">{formatCurrency(s.subtotal)}</span>
                </div>
              ))}
              {os.products.map((p, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="truncate pr-1">{p.quantity}x {p.name}</span>
                  <span className="font-semibold whitespace-nowrap">{formatCurrency(p.subtotal)}</span>
                </div>
              ))}
            </div>

            {/* Totais */}
            <div className="space-y-0.5 font-bold">
              {os.discount_value > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>DESCONTO:</span>
                  <span>- {formatCurrency(os.discount_value)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm border-t border-b border-black py-1">
                <span>TOTAL A PAGAR:</span>
                <span>{formatCurrency(os.total_amount)}</span>
              </div>
              <div className="text-center pt-0.5 font-normal text-[10px]">
                Status: {OS_STATUS_DETAILS[os.status]?.label || os.status}
              </div>
            </div>

            {/* QR Code PIX */}
            {pixQrUrl && (
              <div className="text-center border-t border-dashed border-black pt-2 flex flex-col items-center">
                <div className="font-bold text-[10px] uppercase mb-1">PIX PARA PAGAMENTO:</div>
                <img src={pixQrUrl} alt="PIX" className="w-28 h-28 mx-auto" />
                <div className="text-[9px] mt-0.5">Chave {issuer.pix_key_type}: {issuer.pix_key}</div>
              </div>
            )}

            {/* QR Code Rastreamento */}
            {trackingQrUrl && (
              <div className="text-center border-t border-dashed border-black pt-2 flex flex-col items-center">
                <div className="font-bold text-[10px] uppercase mb-1">ACOMPANHE ONLINE:</div>
                <img src={trackingQrUrl} alt="Rastreio" className="w-20 h-20 mx-auto" />
                <div className="text-[8px] text-slate-600 break-all px-2 mt-0.5">
                  Token: {os.public_tracking_token.substring(0, 18)}...
                </div>
              </div>
            )}

            {/* Termo e Assinatura */}
            <div className="text-center text-[9px] text-slate-700 border-t border-dashed border-black pt-2 space-y-3">
              <div>
                Garantia legal de {issuer.default_warranty_days} dias para peças e serviços. Equipamentos não retirados em até 90 dias poderão ter cobrança de taxa de guarda.
              </div>
              <div className="pt-4 border-t border-black text-[10px]">
                Assinatura do Cliente
              </div>
              <div className="text-[8px] text-slate-500">
                Obrigado pela preferência!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
