import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ServiceOrder } from '../../lib/types';
import { useAppStore } from '../../lib/store';
import { 
  formatCurrency, 
  formatDate, 
  formatDateTime, 
  formatCPF, 
  formatPhone, 
  formatCEP, 
  formatDocument,
  generateQRCodeDataUrl,
  OS_STATUS_DETAILS 
} from '../../lib/utils';
import { Printer, X, FileText, Download, Layers, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface OSPrintA4ModalProps {
  os: ServiceOrder;
  onClose: () => void;
}

export const OSPrintA4Modal: React.FC<OSPrintA4ModalProps> = ({ os, onClose }) => {
  const { issuer, clients, warrantyTerms, transactions } = useAppStore();
  const [twoCopies, setTwoCopies] = useState<boolean>(false);
  const [trackingQrUrl, setTrackingQrUrl] = useState<string>('');

  useEffect(() => {
    document.body.classList.add('has-print-modal');
    return () => {
      document.body.classList.remove('has-print-modal');
    };
  }, []);

  useEffect(() => {
    if (os.public_tracking_token) {
      const baseUrl = (window.location.origin + window.location.pathname).replace(/\/$/, '');
      const url = `${baseUrl}/#/os/${os.public_tracking_token}`;
      generateQRCodeDataUrl(url).then(setTrackingQrUrl);
    }
  }, [os.public_tracking_token]);

  const client = clients.find(c => c.id === os.client_id) || os.client;
  const warranty = warrantyTerms.find(w => w.id === os.warranty_term_id) || os.warranty_term;
  const osTransaction = transactions.find(t => t.service_order_id === os.id);

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `OS_${os.os_number}_FM_Tech`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 500);
  };

  const renderSingleVia = (viaLabel: string) => {
    return (
      <div className="bg-white text-slate-900 p-7 border border-slate-300 rounded-lg shadow-sm text-xs leading-relaxed space-y-4 print-a4-page print:border-none print:shadow-none print:rounded-none">
        {/* Cabeçalho do Emitente (Pessoa Física - CPF) */}
        <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3">
          <div className="space-y-0.5 max-w-[70%]">
            <h2 className="text-base font-extrabold tracking-tight uppercase text-slate-900">
              {issuer.trade_name || issuer.full_name}
            </h2>
            <div className="text-xs font-semibold text-slate-800">
              Prestador de Serviços: {issuer.full_name}
            </div>
            <div className="text-[11px] text-slate-700 font-mono font-bold">
              CPF DO EMITENTE: {formatCPF(issuer.cpf)} {issuer.rg ? `• RG: ${issuer.rg}` : ''}
            </div>
            <div className="text-[11px] text-slate-600">
              {issuer.street}, Nº {issuer.number} {issuer.complement ? `- ${issuer.complement}` : ''} - {issuer.neighborhood}, {issuer.city}/{issuer.state} - CEP: {formatCEP(issuer.zip_code)}
            </div>
            <div className="text-[11px] text-slate-600 font-medium">
              WhatsApp: {formatPhone(issuer.whatsapp)} {issuer.phone ? `• Tel: ${formatPhone(issuer.phone)}` : ''} • E-mail: {issuer.email}
            </div>
          </div>

          <div className="text-right flex flex-col items-end">
            <div className="bg-slate-900 text-white px-3.5 py-1.5 text-center rounded">
              <span className="block text-[9px] uppercase font-bold tracking-wider">Ordem de Serviço</span>
              <span className="text-xl font-black font-mono">#{os.os_number.toString().padStart(4, '0')}</span>
            </div>
            <span className="text-[10px] text-slate-600 font-bold uppercase mt-1">
              {viaLabel}
            </span>
            <span className="text-[10px] mt-0.5 font-bold px-2 py-0.5 rounded border border-slate-300 bg-slate-50 text-slate-800">
              Status: {OS_STATUS_DETAILS[os.status]?.label || os.status}
            </span>
          </div>
        </div>

        {/* Datas e Identificação do Cliente */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50/80 p-2.5 rounded border border-slate-200">
          <div>
            <div className="font-bold text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-1">
              Dados do Cliente
            </div>
            <p><strong>Nome:</strong> {client?.name || 'Consumidor / Não Informado'}</p>
            <p><strong>CPF/CNPJ:</strong> {formatDocument(client?.document)}</p>
            <p><strong>Telefone / Celular:</strong> {formatPhone(client?.whatsapp || client?.phone)}</p>
            {client?.street && (
              <p><strong>Endereço:</strong> {client.street}, {client.number} - {client.neighborhood}, {client.city}/{client.state}</p>
            )}
          </div>

          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <div className="font-bold text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-1">
                Controle e Prazos
              </div>
              <p><strong>Data de Entrada:</strong> {formatDateTime(os.entry_date)}</p>
              <p><strong>Previsão de Entrega:</strong> {formatDate(os.estimated_delivery_date)}</p>
              {os.completion_date && (
                <p><strong>Data de Conclusão:</strong> {formatDate(os.completion_date)}</p>
              )}
              <p className="font-mono text-[10px] text-slate-600">
                <strong>Token:</strong> {os.public_tracking_token}
              </p>
            </div>
            {trackingQrUrl && (
              <div className="flex flex-col items-center ml-2 shrink-0">
                <img src={trackingQrUrl} alt="QR Code Rastreio" className="w-14 h-14 border border-slate-200 p-0.5 rounded bg-white shadow-xs" />
                <span className="text-[8px] text-slate-500 font-semibold mt-0.5 uppercase tracking-tighter">Rastreio Celular</span>
              </div>
            )}
          </div>
        </div>

        {/* Dados do Equipamento ou Licença Digital */}
        {os.os_type === 'licenca_digital' ? (
          <div className="border border-emerald-300 rounded p-2.5 bg-emerald-50/40">
            <div className="font-bold text-[11px] uppercase tracking-wider text-emerald-800 border-b border-emerald-200 pb-1 mb-1.5 flex items-center justify-between">
              <span>Identificação da Licença & Produto Digital</span>
              <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-semibold">
                ENTREGA DIGITAL / SOFTWARE
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div><strong>Produto:</strong> {os.digital_service_details?.product_name || os.equipment_type}</div>
              <div><strong>Destino:</strong> {os.digital_service_details?.target_device || 'Computador do Cliente'}</div>
              <div><strong>Entrega:</strong> {os.digital_service_details?.delivery_method ? os.digital_service_details.delivery_method.toUpperCase() : 'WHATSAPP'}</div>
            </div>
            {os.digital_service_details?.customer_email && (
              <div className="mt-1 text-[11px]">
                <strong>Conta / E-mail de Ativação:</strong> {os.digital_service_details.customer_email}
              </div>
            )}
            {os.digital_service_details?.license_key && (
              <div className="mt-1.5 p-1.5 bg-white border border-emerald-300 rounded font-mono text-xs font-bold text-emerald-800">
                CHAVE SERIAL: {os.digital_service_details.license_key}
              </div>
            )}
            {os.digital_service_details?.activation_instructions && (
              <div className="mt-1 text-[10px] text-slate-700 bg-white/80 p-1.5 rounded border border-emerald-200">
                <strong>Instruções de Ativação:</strong> {os.digital_service_details.activation_instructions}
              </div>
            )}
          </div>
        ) : (
          <div className="border border-slate-200 rounded p-2.5">
            <div className="font-bold text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-1.5">
              Dados do Equipamento e Acessórios
            </div>
            <div className="grid grid-cols-4 gap-2 text-[11px]">
              <div><strong>Tipo:</strong> {os.equipment_type}</div>
              <div><strong>Marca:</strong> {os.brand || '-'}</div>
              <div><strong>Modelo:</strong> {os.model || '-'}</div>
              <div><strong>Nº Série/IMEI:</strong> {os.serial_imei || '-'}</div>
            </div>
            <div className="mt-1 text-[11px] grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
              <div><strong>Senha de Desbloqueio:</strong> {os.unlock_password || 'Não fornecida / Sem senha'}</div>
              <div><strong>Acessórios Deixados:</strong> {os.accessories_left || 'Somente o aparelho'}</div>
            </div>
            {os.physical_condition_checklist && (
              <div className="mt-1 text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded">
                <strong>Checklist de Entrada:</strong> Riscos: {os.physical_condition_checklist.riscos ? 'Sim' : 'Não'} | 
                Trincos: {os.physical_condition_checklist.trincos ? 'Sim' : 'Não'} | 
                Parafusos Faltando: {os.physical_condition_checklist.parafusos_faltando ? 'Sim' : 'Não'} | 
                Liga: {os.physical_condition_checklist.nao_liga ? 'Não Liga' : 'Sim'} 
                {os.physical_condition_checklist.outros_detalhes ? ` | Obs: ${os.physical_condition_checklist.outros_detalhes}` : ''}
              </div>
            )}
          </div>
        )}

        {/* Defeito Relatado e Laudo Técnico */}
        <div className="grid grid-cols-2 gap-3">
          <div className="border border-slate-200 rounded p-2.5 bg-slate-50/50">
            <span className="font-bold text-[11px] block uppercase text-slate-700 mb-0.5">Defeito Relatado:</span>
            <p className="text-[11px] text-slate-800">{os.reported_defect || 'Nenhum detalhe relatado'}</p>
          </div>
          <div className="border border-slate-200 rounded p-2.5 bg-slate-50/50">
            <span className="font-bold text-[11px] block uppercase text-slate-700 mb-0.5">Laudo Técnico / Diagnóstico:</span>
            <p className="text-[11px] text-slate-800">{os.technical_report || 'Em avaliação de bancada'}</p>
          </div>
        </div>

        {/* Serviços e Peças */}
        <div className="space-y-2">
          {os.services && os.services.length > 0 && (
            <div>
              <div className="font-bold text-[11px] uppercase text-slate-800 mb-1">Serviços / Mão de Obra</div>
              <table className="w-full text-left border-collapse border border-slate-200 text-[11px]">
                <thead className="bg-slate-100 font-semibold">
                  <tr>
                    <th className="p-1.5 border border-slate-200">Descrição do Serviço</th>
                    <th className="p-1.5 border border-slate-200 text-center w-16">Qtd</th>
                    <th className="p-1.5 border border-slate-200 text-right w-24">Vlr Unitário</th>
                    <th className="p-1.5 border border-slate-200 text-right w-24">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {os.services.map((s, idx) => (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="p-1.5 border border-slate-200">{s.name}</td>
                      <td className="p-1.5 border border-slate-200 text-center">{s.quantity}</td>
                      <td className="p-1.5 border border-slate-200 text-right">{formatCurrency(s.unit_price)}</td>
                      <td className="p-1.5 border border-slate-200 text-right font-medium">{formatCurrency(s.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {os.products && os.products.length > 0 && (
            <div>
              <div className="font-bold text-[11px] uppercase text-slate-800 mb-1">Peças e Componentes Aplicados</div>
              <table className="w-full text-left border-collapse border border-slate-200 text-[11px]">
                <thead className="bg-slate-100 font-semibold">
                  <tr>
                    <th className="p-1.5 border border-slate-200">Descrição da Peça</th>
                    <th className="p-1.5 border border-slate-200 text-center w-16">Qtd</th>
                    <th className="p-1.5 border border-slate-200 text-right w-24">Vlr Unitário</th>
                    <th className="p-1.5 border border-slate-200 text-right w-24">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {os.products.map((p, idx) => (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="p-1.5 border border-slate-200">{p.name}</td>
                      <td className="p-1.5 border border-slate-200 text-center">{p.quantity}</td>
                      <td className="p-1.5 border border-slate-200 text-right">{formatCurrency(p.unit_price)}</td>
                      <td className="p-1.5 border border-slate-200 text-right font-medium">{formatCurrency(p.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {os.licenses && os.licenses.length > 0 && (
            <div>
              <div className="font-bold text-[11px] uppercase text-emerald-800 mb-1">Licenças e Produtos Digitais</div>
              <table className="w-full text-left border-collapse border border-slate-200 text-[11px]">
                <thead className="bg-slate-100 font-semibold">
                  <tr>
                    <th className="p-1.5 border border-slate-200">Produto Digital</th>
                    <th className="p-1.5 border border-slate-200 font-mono">Chave de Ativação (Serial Key)</th>
                    <th className="p-1.5 border border-slate-200 text-right w-24">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {os.licenses.map((lic, idx) => (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="p-1.5 border border-slate-200 font-medium">{lic.name}</td>
                      <td className="p-1.5 border border-slate-200 font-mono font-bold text-slate-800">{lic.license_key}</td>
                      <td className="p-1.5 border border-slate-200 text-right font-medium">{formatCurrency(lic.unit_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Totais e Resumo Financeiro (Sem QR Code PIX conforme solicitado) */}
        <div className="flex items-start justify-between border border-slate-300 rounded p-3 bg-slate-50/80 break-inside-avoid">
          <div className="space-y-1 text-[11px] max-w-sm">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1">
              Resumo e Condições de Atendimento
            </div>
            <p className="text-slate-600">
              <strong>Situação Financeira:</strong> {os.invoiced ? 'Faturada / Liquidada' : 'Aguardando Pagamento / Retirada'}
            </p>
            <p className="text-slate-600">
              <strong>Forma de Cobrança:</strong> {osTransaction?.payment_method ? osTransaction.payment_method.toUpperCase() : 'À vista (PIX / Dinheiro / Cartão)'}
            </p>
            <p className="text-[10px] text-slate-500 italic mt-1">
              Documento oficial de ordem de serviço para fins de garantia e controle técnico.
            </p>
          </div>

          <div className="text-right space-y-1 min-w-[200px] border-l border-slate-200 pl-4">
            <div className="flex justify-between text-slate-600">
              <span>Total Serviços:</span>
              <span className="font-semibold">{formatCurrency(os.services_total)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total Peças:</span>
              <span className="font-semibold">{formatCurrency(os.products_total)}</span>
            </div>
            {((os.licenses_total && os.licenses_total > 0) || (os.licenses && os.licenses.length > 0)) && (
              <div className="flex justify-between text-slate-600">
                <span>Total Licenças:</span>
                <span className="font-semibold">{formatCurrency(os.licenses_total || os.licenses?.reduce((s, l) => s + l.unit_price, 0) || 0)}</span>
              </div>
            )}
            {os.discount_value > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Desconto ({os.discount_type}):</span>
                <span>- {os.discount_type === '%' ? `${os.discount_value}%` : formatCurrency(os.discount_value)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black border-t-2 border-slate-900 pt-1.5 mt-1 text-slate-950">
              <span>VALOR TOTAL:</span>
              <span className="text-base text-blue-900 font-mono">{formatCurrency(os.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Termo de Garantia e Rodapé */}
        <div className="text-[10px] text-slate-600 border border-slate-200 rounded p-2 bg-white space-y-1 break-inside-avoid">
          <div className="font-bold uppercase text-slate-800">
            Termo de Garantia ({warranty?.days_duration || issuer.default_warranty_days} Dias):
          </div>
          <p className="leading-tight text-slate-600">
            {warranty?.content || issuer.os_footer_notes}
          </p>
        </div>

        {/* Assinaturas */}
        <div className="pt-5 grid grid-cols-2 gap-8 text-center text-xs break-inside-avoid">
          <div>
            <div className="border-t border-slate-700 pt-1">
              <strong className="block text-slate-900 font-semibold">{issuer.full_name}</strong>
              <span className="text-[10px] text-slate-600 font-mono">Técnico Responsável • CPF: {issuer.cpf}</span>
            </div>
          </div>
          <div>
            <div className="border-t border-slate-700 pt-1">
              <strong className="block text-slate-900 font-semibold">{client?.name || 'Assinatura do Cliente'}</strong>
              <span className="text-[10px] text-slate-600">Aceite do Orçamento / Retirada do Equipamento</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print-modal-container">
      <div className="bg-slate-100 dark:bg-slate-900 w-full max-w-4xl max-h-[92vh] flex flex-col rounded-xl shadow-2xl border border-slate-300 dark:border-slate-800 print-modal-box">
        {/* Barra Superior com Controles */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-xl gap-3 no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Impressão e Exportação PDF - OS #{os.os_number}
              </h2>
              <p className="text-[11px] text-slate-500">
                Formato A4 limpo • Sem URLs de rodapé • Pronto para impressão ou PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setTwoCopies(!twoCopies)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                twoCopies 
                  ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300' 
                  : 'bg-white text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{twoCopies ? 'Modo: 2 Vias' : 'Modo: 1 Via'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all"
              title="Abre a caixa de diálogo para salvar em PDF ou imprimir na impressora"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Salvar em PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Banner com Dica para Salvar PDF */}
        <div className="px-6 py-2 bg-blue-50 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-700 dark:text-blue-300 flex items-center justify-between no-print">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              <strong>Dica para PDF:</strong> Clique em <strong>Salvar em PDF</strong> e selecione o destino <em>"Salvar como PDF"</em>. As margens foram configuradas para remover links de rodapé.
            </span>
          </div>
        </div>

        {/* Área de Impressão */}
        <div className="p-6 overflow-y-auto space-y-8 bg-slate-200 dark:bg-slate-950 flex-1 print-modal-body print:p-0 print:bg-white print:overflow-visible">
          {twoCopies ? (
            <div className="space-y-8 print:space-y-0">
              <div className="print-page-break">
                {renderSingleVia('1ª Via - Via da Oficina / Técnico')}
              </div>
              <div className="border-t-2 border-dashed border-slate-400 my-4 text-center text-[10px] font-mono text-slate-500 uppercase tracking-widest no-print">
                -- Destacar Aqui --
              </div>
              <div>
                {renderSingleVia('2ª Via - Via do Cliente')}
              </div>
            </div>
          ) : (
            renderSingleVia('Via Única / Completa')
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};