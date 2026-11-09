import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FinancialTransaction } from '../../lib/types';
import { useAppStore } from '../../lib/store';
import { 
  formatCurrency, 
  formatDate, 
  formatCPF, 
  formatPhone, 
  formatDocument 
} from '../../lib/utils';
import { Printer, X, FileCheck } from 'lucide-react';

interface PFReceiptModalProps {
  transaction: FinancialTransaction;
  onClose: () => void;
}

export const PFReceiptModal: React.FC<PFReceiptModalProps> = ({ transaction, onClose }) => {
  const { issuer, clients } = useAppStore();
  const client = clients.find(c => c.id === transaction.client_id);

  useEffect(() => {
    document.body.classList.add('has-print-modal');
    return () => {
      document.body.classList.remove('has-print-modal');
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const today = new Date();
  const months = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  const dateFormattedFull = `${issuer.city || 'São Paulo'}, ${today.getDate()} de ${months[today.getMonth()]} de ${today.getFullYear()}`;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print-modal-container">
      <div className="bg-slate-100 dark:bg-slate-900 w-full max-w-3xl rounded-xl shadow-2xl border border-slate-300 dark:border-slate-800 flex flex-col max-h-[92vh] print-modal-box">
        {/* Barra Superior */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-xl no-print">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Recibo de Pagamento Pessoa Física (CPF Emitente)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Recibo</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Folha do Recibo */}
        <div className="p-8 overflow-y-auto bg-slate-200 dark:bg-slate-950 flex-1 flex justify-center print-modal-body print:p-0 print:bg-white print:overflow-visible">
          <div className="bg-white text-black p-8 rounded shadow border border-slate-300 max-w-2xl w-full text-xs leading-relaxed space-y-6 print-a4-page print:border-none print:shadow-none print:p-0">
            {/* Topo do Recibo */}
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  {issuer.trade_name || issuer.full_name}
                </h3>
                <p className="text-[11px] text-slate-700 font-medium">
                  {issuer.full_name} • CPF: <strong>{formatCPF(issuer.cpf)}</strong>
                </p>
                <p className="text-[10px] text-slate-500">
                  {issuer.street}, Nº {issuer.number} - {issuer.neighborhood}, {issuer.city}/{issuer.state} • Tel: {formatPhone(issuer.whatsapp)}
                </p>
              </div>

              <div className="text-right">
                <span className="block text-[10px] uppercase font-bold text-slate-500">VALOR</span>
                <span className="text-lg font-black font-mono text-emerald-800 bg-emerald-50 px-3 py-1 rounded border border-emerald-200 inline-block">
                  {formatCurrency(transaction.paid_amount || transaction.amount)}
                </span>
              </div>
            </div>

            <div className="text-center py-2">
              <h2 className="text-base font-extrabold tracking-tight uppercase text-slate-900 underline underline-offset-4">
                RECIBO DE PAGAMENTO - PRESTAÇÃO DE SERVIÇOS
              </h2>
            </div>

            {/* Texto Declaratório Oficial */}
            <div className="text-sm space-y-4 text-justify leading-relaxed text-slate-800">
              <p>
                Recebi(emos) de <strong>{client?.name || transaction.client_name || 'Consumidor / Tomador'}</strong>, 
                {client?.document ? ` inscrito(a) sob o CPF/CNPJ nº ${formatDocument(client.document)}, ` : ' '}
                a quantia líquida de <strong>{formatCurrency(transaction.paid_amount || transaction.amount)}</strong>, 
                referente a:
              </p>

              <div className="bg-slate-50 p-4 rounded border border-slate-200 text-xs font-medium space-y-1">
                <div>• <strong>Discriminação:</strong> {transaction.description}</div>
                <div>• <strong>Forma de Pagamento:</strong> {transaction.payment_method?.toUpperCase() || 'À VISTA'}</div>
                {transaction.os_number && (
                  <div>• <strong>Ordem de Serviço Vinculada:</strong> OS #{transaction.os_number}</div>
                )}
                {transaction.payment_date && (
                  <div>• <strong>Data de Quitação:</strong> {formatDate(transaction.payment_date)}</div>
                )}
              </div>

              <p>
                Para maior clareza e cumprimento das obrigações fiscais e civis entre as partes, firmo(amos) o presente recibo dando plena, geral e irrevogável quitação do valor acima especificado.
              </p>
            </div>

            {/* Data e Localidade */}
            <div className="text-right pt-4 text-xs font-medium text-slate-700">
              {dateFormattedFull}.
            </div>

            {/* Assinatura do Emitente com CPF */}
            <div className="pt-8 max-w-sm mx-auto text-center space-y-1">
              <div className="border-t border-slate-800 pt-2 font-bold text-slate-900">
                {issuer.full_name}
              </div>
              <div className="text-xs text-slate-700 font-mono">
                CPF: {formatCPF(issuer.cpf)}
              </div>
              <div className="text-[10px] text-slate-500 uppercase">
                Emitente / Prestador de Serviço Autônomo
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
