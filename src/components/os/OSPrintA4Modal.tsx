import React, { useState, useEffect } from 'react';
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
  generatePixPayload, 
  generateQRCodeDataUrl,
  OS_STATUS_DETAILS 
} from '../../lib/utils';
import { Printer, X, Copy, Check, FileText } from 'lucide-react';

interface OSPrintA4ModalProps {
  os: ServiceOrder;
  onClose: () => void;
}

export const OSPrintA4Modal: React.FC<OSPrintA4ModalProps> = ({ os, onClose }) => {
  const { issuer, clients, warrantyTerms } = useAppStore();
  const [twoCopies, setTwoCopies] = useState<boolean>(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [pixPayloadStr, setPixPayloadStr] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const client = clients.find(c => c.id === os.client_id) || os.client;
  const warranty = warrantyTerms.find(w => w.id === os.warranty_term_id) || os.warranty_term;

  useEffect(() => {
    async function makePix() {
      if (!issuer.pix_key) return;
      const payload = generatePixPayload({
        pixKey: issuer.pix_key,
        merchantName: issuer.trade_name || issuer.full_name,
        merchantCity: issuer.city || 'SAO PAULO',
        amount: os.total_amount,
        txId: `OS${os.os_number}`,
        description: `OS #${os.os_number} ${os.equipment_type}`,
      });
      setPixPayloadStr(payload);
      const url = await generateQRCodeDataUrl(payload);
      setQrCodeUrl(url);
    }
    makePix();
  }, [os, issuer]);

  const handlePrint = () => {
    window.print();
  };

  const copyPix = () => {
    if (!pixPayloadStr) return;
    navigator.clipboard.writeText(pixPayloadStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderSingleVia = (viaLabel: string) => {
    return (
      <div className="bg-white text-black p-6 border border-slate-300 rounded shadow-sm text-xs leading-relaxed space-y-4 print:border-none print:shadow-none print:p-0 print:m-0">
        {/* Cabeçalho do Emitente (Pessoa Física - CPF) */}
        <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3">
          <div className="space-y-0.5">
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
            <div className="bg-slate-900 text-white px-3 py-1 text-center rounded">
              <span className="block text-[10px] uppercase font-bold tracking-wider">Ordem de Serviço</span>
              <span className="text-lg font-black font-mono">#{os.os_number.toString().padStart(4, '0')}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase mt-1">
              {viaLabel}
            </span>
            <span className="text-[10px] mt-0.5 font-bold px-2 py-0.5 rounded border border-slate-300 bg-slate-50">
              Status: {OS_STATUS_DETAILS[os.status]?.label || os.status}
            </span>
          </div>
        </div>

        {/* Datas e Identificação do Cliente */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-2.5 rounded border border-slate-200">
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

          <div>
            <div className="font-bold text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-1">
              Controle e Prazos
            </div>
            <p><strong>Data de Entrada:</strong> {formatDateTime(os.entry_date)}</p>
            <p><strong>Previsão de Entrega:</strong> {formatDate(os.estimated_delivery_date)}</p>
            {os.completion_date && (
              <p><strong>Data de Conclusão:</strong> {formatDate(os.completion_date)}</p>
            )}
            <p className="font-mono text-[10px] text-slate-600 truncate">
              <strong>Token Rastreio:</strong> {os.public_tracking_token}
            </p>
          </div>
        </div>

        {/* Dados do Equipamento */}
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
        </div>

        {/* Totais e Pagamento PIX com QR Code */}
        <div className="flex items-start justify-between border border-slate-300 rounded p-3 bg-slate-50/70">
          <div className="flex items-center gap-3">
            {qrCodeUrl ? (
              <div className="bg-white p-1 rounded border border-slate-300 shadow-sm flex flex-col items-center">
                <img src={qrCodeUrl} alt="QR Code PIX" className="w-24 h-24" />
                <span className="text-[9px] font-bold text-slate-600 mt-0.5">Pague via PIX</span>
              </div>
            ) : null}

            <div className="space-y-1 text-[11px]">
              <div className="font-bold text-slate-800 uppercase">Chave PIX do Prestador (PF)</div>
              <div className="font-mono text-xs bg-white px-2 py-1 rounded border border-slate-300 inline-block font-semibold">
                {issuer.pix_key_type}: {issuer.pix_key}
              </div>
              <p className="text-[10px] text-slate-500">
                Favorecido: {issuer.full_name} (CPF {issuer.cpf})
              </p>
              <p className="text-[10px] text-slate-500 max-w-xs">
                Aponte a câmera do aplicativo do seu banco para pagar com o valor exato já preenchido.
              </p>
            </div>
          </div>

          <div className="text-right space-y-1 min-w-[180px]">
            <div className="flex justify-between text-slate-600">
              <span>Total Serviços:</span>
              <span>{formatCurrency(os.services_total)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total Peças:</span>
              <span>{formatCurrency(os.products_total)}</span>
            </div>
            {os.discount_value > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Desconto ({os.discount_type}):</span>
                <span>- {os.discount_type === '%' ? `${os.discount_value}%` : formatCurrency(os.discount_value)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black border-t-2 border-slate-800 pt-1 text-slate-950">
              <span>VALOR TOTAL:</span>
              <span className="text-base text-blue-900">{formatCurrency(os.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Termo de Garantia e Rodapé */}
        <div className="text-[10px] text-slate-600 border border-slate-200 rounded p-2 bg-white space-y-1">
          <div className="font-bold uppercase text-slate-800">
            Termo de Garantia ({warranty?.days_duration || issuer.default_warranty_days} Dias):
          </div>
          <p className="leading-tight text-slate-600">
            {warranty?.content || issuer.os_footer_notes}
          </p>
        </div>

        {/* Assinaturas */}
        <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
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

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-100 dark:bg-slate-900 w-full max-w-4xl max-h-[92vh] flex flex-col rounded-xl shadow-2xl border border-slate-300 dark:border-slate-800">
        {/* Barra Superior com Controles */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-xl no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Visualização de Impressão A4 - OS #{os.os_number} (Emitente CPF)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTwoCopies(!twoCopies)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                twoCopies 
                  ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300' 
                  : 'bg-white text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {twoCopies ? 'Modo: 2 Vias (Cliente e Oficina)' : 'Modo: 1 Via Completa'}
            </button>

            {pixPayloadStr && (
              <button
                onClick={copyPix}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300"
                title="Copiar código PIX Copia e Cola"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar PIX'}</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Área de Impressão */}
        <div className="p-6 overflow-y-auto space-y-8 bg-slate-200 dark:bg-slate-950 flex-1">
          {twoCopies ? (
            <div className="space-y-8">
              {renderSingleVia('1ª Via - Via da Oficina / Técnico')}
              <div className="border-t-2 border-dashed border-slate-400 my-4 text-center text-[10px] font-mono text-slate-500 uppercase tracking-widest no-print">
                -- Destacar Aqui --
              </div>
              {renderSingleVia('2ª Via - Via do Cliente')}
            </div>
          ) : (
            renderSingleVia('Via Única / Completa')
          )}
        </div>
      </div>
    </div>
  );
};
