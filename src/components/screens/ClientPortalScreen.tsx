import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../lib/store';
import { 
  formatCurrency, 
  formatDate, 
  formatDateTime, 
  formatCPF, 
  formatPhone, 
  generatePixPayload, 
  generateQRCodeDataUrl,
  OS_STATUS_DETAILS 
} from '../../lib/utils';
import { 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  MessageSquare, 
  ThumbsUp, 
  Camera, 
  DollarSign, 
  Search, 
  Check, 
  Copy,
  ExternalLink,
  KeyRound
} from 'lucide-react';

interface ClientPortalScreenProps {
  initialToken?: string;
}

export const ClientPortalScreen: React.FC<ClientPortalScreenProps> = ({ initialToken }) => {
  const { serviceOrders, clients, issuer, updateServiceOrder } = useAppStore();
  const [tokenInput, setTokenInput] = useState<string>(initialToken || (serviceOrders[0]?.public_tracking_token || ''));
  const [pixQrUrl, setPixQrUrl] = useState<string>('');
  const [pixPayloadStr, setPixPayloadStr] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [approvedSuccess, setApprovedSuccess] = useState<boolean>(false);

  // Busca a OS pelo token
  const currentOS = serviceOrders.find(
    o => o.public_tracking_token.toLowerCase() === tokenInput.trim().toLowerCase()
  ) || serviceOrders[0];

  const client = currentOS ? clients.find(c => c.id === currentOS.client_id) : null;

  useEffect(() => {
    async function makePix() {
      if (!currentOS || !issuer.pix_key) return;
      const payload = generatePixPayload({
        pixKey: issuer.pix_key,
        merchantName: issuer.trade_name || issuer.full_name,
        merchantCity: issuer.city || 'SAO PAULO',
        amount: currentOS.total_amount,
        txId: `OS${currentOS.os_number}`,
        description: `OS #${currentOS.os_number} ${currentOS.equipment_type}`,
      });
      setPixPayloadStr(payload);
      const url = await generateQRCodeDataUrl(payload);
      setPixQrUrl(url);
    }
    makePix();
  }, [currentOS, issuer]);

  // Aprovar Orçamento Online
  const handleApproveBudget = () => {
    if (!currentOS) return;
    updateServiceOrder(currentOS.id, {
      status: 'aprovado',
    });
    setApprovedSuccess(true);
    setTimeout(() => setApprovedSuccess(false), 4000);
  };

  // Falar no WhatsApp
  const handleWhatsAppContact = () => {
    if (!currentOS) return;
    const cleanPhone = (issuer.whatsapp || issuer.phone || '').replace(/\D/g, '');
    const text = encodeURIComponent(
      `Olá ${issuer.full_name}, sou o(a) cliente ${client?.name || ''} da Ordem de Serviço #${currentOS.os_number} (${currentOS.equipment_type} ${currentOS.brand}). Gostaria de tirar uma dúvida sobre o reparo.`
    );
    window.open(`https://wa.me/55${cleanPhone}?text=${text}`, '_blank');
  };

  const copyPix = () => {
    if (!pixPayloadStr) return;
    navigator.clipboard.writeText(pixPayloadStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Etapas de Progresso da OS
  const steps = [
    { key: 'entrada', label: '1. Recebido na Oficina', done: true },
    { 
      key: 'analise', 
      label: '2. Avaliação & Orçamento', 
      done: ['aguardando_aprovacao', 'aprovado', 'em_andamento', 'finalizado', 'entregue'].includes(currentOS?.status || '') 
    },
    { 
      key: 'reparo', 
      label: '3. Reparo em Execução', 
      done: ['aprovado', 'em_andamento', 'finalizado', 'entregue'].includes(currentOS?.status || '') 
    },
    { 
      key: 'concluido', 
      label: '4. Pronto para Retirada', 
      done: ['finalizado', 'entregue'].includes(currentOS?.status || '') 
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Barra de Simulação / Troca de Token */}
      <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-blue-900 dark:text-blue-200">
            Simulador do Portal Público do Cliente (Sem necessidade de login)
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-slate-500 whitespace-nowrap">Trocar OS:</label>
          <select
            value={currentOS?.public_tracking_token || ''}
            onChange={(e) => setTokenInput(e.target.value)}
            className="p-1.5 rounded border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-xs font-mono font-medium"
          >
            {serviceOrders.map(o => (
              <option key={o.id} value={o.public_tracking_token}>
                OS #{o.os_number} - {o.equipment_type} ({OS_STATUS_DETAILS[o.status]?.label})
              </option>
            ))}
          </select>
        </div>
      </div>

      {!currentOS ? (
        <div className="p-12 text-center text-slate-400">
          Ordem de Serviço não localizada pelo token informado.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Topo do Portal com Marca do Emitente PF */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 sm:p-8 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-widest font-bold text-blue-200">
                  Acompanhamento de Reparo
                </span>
                <h1 className="text-2xl font-black mt-1">
                  Ordem de Serviço #{currentOS.os_number.toString().padStart(4, '0')}
                </h1>
                <p className="text-xs text-blue-100 mt-1">
                  Assistência Técnica: <strong>{issuer.trade_name || issuer.full_name}</strong> • Prestador: <strong>{issuer.full_name} (CPF {formatCPF(issuer.cpf)})</strong>
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur border border-white/20 p-3 rounded-xl text-right">
                <span className="text-[10px] text-blue-200 block uppercase font-bold">Status Atual</span>
                <span className="text-base font-extrabold text-white">
                  {OS_STATUS_DETAILS[currentOS.status]?.label}
                </span>
              </div>
            </div>

            {/* Stepper de Progresso */}
            <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {steps.map((st, i) => (
                <div
                  key={st.key}
                  className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                    st.done
                      ? 'bg-white/20 border-white/40 text-white font-semibold'
                      : 'bg-black/10 border-white/10 text-blue-200/60'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    st.done ? 'bg-emerald-400 text-slate-900' : 'bg-white/20 text-white'
                  }`}>
                    {st.done ? '✓' : i + 1}
                  </div>
                  <span className="truncate">{st.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback de Aprovação */}
          {approvedSuccess && (
            <div className="bg-emerald-500 text-white p-3 text-center text-xs font-bold flex items-center justify-center gap-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4" />
              <span>Orçamento Aprovado com Sucesso! O técnico foi notificado e iniciará o reparo.</span>
            </div>
          )}

          {/* Conteúdo Principal */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Box Equipamento e Cliente */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Equipamento em Manutenção</span>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {currentOS.equipment_type} - {currentOS.brand} {currentOS.model}
                </div>
                {currentOS.serial_imei && (
                  <p className="text-slate-600 dark:text-slate-400 font-mono">
                    Nº de Série/IMEI: {currentOS.serial_imei}
                  </p>
                )}
                {currentOS.accessories_left && (
                  <p className="text-slate-500">
                    Acessórios deixados: {currentOS.accessories_left}
                  </p>
                )}
              </div>

              <div className="space-y-1 sm:border-l border-slate-200 dark:border-slate-700 sm:pl-4">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Datas & Prazos</span>
                <p>Data de Entrada: <strong>{formatDateTime(currentOS.entry_date)}</strong></p>
                {currentOS.estimated_delivery_date && (
                  <p className="text-blue-600 dark:text-blue-400 font-semibold">
                    Previsão de Conclusão: <strong>{formatDate(currentOS.estimated_delivery_date)}</strong>
                  </p>
                )}
                <p className="text-slate-500">
                  Cliente: <strong>{client?.name || 'Cliente'}</strong>
                </p>
              </div>
            </div>

            {/* Laudo e Diagnóstico Técnico */}
            <div className="space-y-3">
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1.5">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                  Defeito Relatado:
                </span>
                <p className="text-xs text-slate-800 dark:text-slate-200">
                  {currentOS.reported_defect || 'Nenhum detalhe informado'}
                </p>
              </div>

              {currentOS.technical_report && (
                <div className="border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl p-4 space-y-1.5">
                  <span className="font-bold text-xs uppercase tracking-wider text-blue-800 dark:text-blue-300 block">
                    Diagnóstico Técnico / Laudo:
                  </span>
                  <p className="text-xs text-slate-800 dark:text-slate-200">
                    {currentOS.technical_report}
                  </p>
                </div>
              )}
            </div>

            {/* Fotos e Evidências se houver */}
            {currentOS.attachments && currentOS.attachments.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>Fotos e Evidências do Equipamento:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {currentOS.attachments.map((att) => (
                    <div key={att.id} className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
                      <img src={att.file_url} alt={att.caption} className="w-full h-32 object-cover hover:scale-105 transition-transform" />
                      {att.caption && (
                        <p className="p-1.5 text-[10px] text-slate-600 dark:text-slate-400 font-medium truncate">
                          {att.caption}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabela de Itens e Valores */}
            <div className="space-y-3">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                Discriminação dos Serviços e Peças:
              </span>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">Descrição</th>
                      <th className="p-3 w-16 text-center">Qtd</th>
                      <th className="p-3 w-28 text-right">Unitário</th>
                      <th className="p-3 w-28 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {currentOS.services.map((s, idx) => (
                      <tr key={`s-${idx}`}>
                        <td className="p-3 font-medium">{s.name} <span className="text-[10px] text-blue-600 font-semibold">(Mão de Obra)</span></td>
                        <td className="p-3 text-center">{s.quantity}</td>
                        <td className="p-3 text-right">{formatCurrency(s.unit_price)}</td>
                        <td className="p-3 text-right font-semibold">{formatCurrency(s.subtotal)}</td>
                      </tr>
                    ))}
                    {currentOS.products.map((p, idx) => (
                      <tr key={`p-${idx}`}>
                        <td className="p-3 font-medium">{p.name} <span className="text-[10px] text-emerald-600 font-semibold">(Peça/Componente)</span></td>
                        <td className="p-3 text-center">{p.quantity}</td>
                        <td className="p-3 text-right">{formatCurrency(p.unit_price)}</td>
                        <td className="p-3 text-right font-semibold">{formatCurrency(p.subtotal)}</td>
                      </tr>
                    ))}
                    {currentOS.licenses && currentOS.licenses.map((lic, idx) => (
                      <tr key={`lic-${idx}`} className="bg-emerald-50/30 dark:bg-emerald-950/20">
                        <td className="p-3">
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{lic.name}</span>
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.2 rounded">
                              Licença Digital
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <code className="text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded text-emerald-800 dark:text-emerald-300">
                              {lic.license_key}
                            </code>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(lic.license_key);
                                setCopiedKeyId(lic.id);
                                setTimeout(() => setCopiedKeyId(null), 2000);
                              }}
                              className="text-[10px] font-bold text-slate-500 hover:text-emerald-600 flex items-center gap-1 bg-white dark:bg-slate-800 border px-1.5 py-0.5 rounded"
                            >
                              {copiedKeyId === lic.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-600">Copiada!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copiar Chave</span>
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="p-3 text-center font-medium">1</td>
                        <td className="p-3 text-right">{formatCurrency(lic.unit_price)}</td>
                        <td className="p-3 text-right font-semibold">{formatCurrency(lic.unit_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Resumo de Totais */}
                <div className="bg-slate-50 dark:bg-slate-800/80 p-4 border-t border-slate-200 dark:border-slate-700 space-y-1">
                  {currentOS.discount_value > 0 && (
                    <div className="flex justify-between text-emerald-700 text-xs">
                      <span>Desconto Aplicado:</span>
                      <span>- {formatCurrency(currentOS.discount_value)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm font-extrabold text-slate-900 dark:text-white pt-1">
                    <span>VALOR TOTAL DO SERVIÇO:</span>
                    <span className="text-lg font-mono text-blue-600 dark:text-blue-400">
                      {formatCurrency(currentOS.total_amount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pagamento PIX Estático com QR Code */}
            {pixQrUrl && (
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="bg-white p-2 rounded-lg border border-slate-300 shadow-sm flex-shrink-0">
                    <img src={pixQrUrl} alt="QR Code PIX" className="w-28 h-28" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[11px] block">
                      Pagamento Fácil via PIX (Emitente CPF)
                    </span>
                    <p className="text-slate-500">
                      Favorecido: <strong>{issuer.full_name}</strong> (CPF {formatCPF(issuer.cpf)})
                    </p>
                    <div className="font-mono text-[11px] bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 inline-block font-semibold">
                      Chave {issuer.pix_key_type}: {issuer.pix_key}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={copyPix}
                  className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 transition-all"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Código Copiado!' : 'Copiar Código PIX'}</span>
                </button>
              </div>
            )}

            {/* Botões de Ação do Cliente */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                onClick={handleWhatsAppContact}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold text-xs hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Tirar Dúvida no WhatsApp</span>
              </button>

              {['orcamento', 'aguardando_aprovacao'].includes(currentOS.status) && (
                <button
                  onClick={handleApproveBudget}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Aprovar Orçamento e Autorizar Reparo</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
