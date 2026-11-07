import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../lib/store';
import { 
  formatCurrency, 
  formatDate, 
  formatDateTime, 
  formatCPF, 
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
  Search, 
  Check, 
  Copy, 
  ExternalLink, 
  KeyRound, 
  CreditCard, 
  Lock, 
  AlertTriangle, 
  Sparkles, 
  ShieldAlert, 
  ArrowRight,
  Download,
  Printer
} from 'lucide-react';

interface ClientPortalScreenProps {
  initialToken?: string;
  isPublicAccess?: boolean;
}

export const ClientPortalScreen: React.FC<ClientPortalScreenProps> = ({ 
  initialToken = '', 
  isPublicAccess = false 
}) => {
  const {
    serviceOrders,
    clients,
    issuer,
    updateServiceOrder,
    mercadoPago,
    generateOSMercadoPagoLink,
    confirmMercadoPagoPayment
  } = useAppStore();

  const [tokenInput, setTokenInput] = useState<string>(initialToken);
  const [manualToken, setManualToken] = useState<string>('');
  const [pixQrUrl, setPixQrUrl] = useState<string>('');
  const [pixPayloadStr, setPixPayloadStr] = useState<string>('');
  const [copiedPix, setCopiedPix] = useState<boolean>(false);
  const [copiedPayLink, setCopiedPayLink] = useState<boolean>(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [approvedSuccess, setApprovedSuccess] = useState<boolean>(false);
  const [loadingMP, setLoadingMP] = useState<boolean>(false);
  const [mpSuccessNotice, setMpSuccessNotice] = useState<boolean>(false);
  const [showDirectPix, setShowDirectPix] = useState<boolean>(false);

  // Busca a OS estritamente pelo hash aleatório informado
  const currentOS = tokenInput.trim()
    ? serviceOrders.find(
        o => o.public_tracking_token.toLowerCase() === tokenInput.trim().toLowerCase()
      )
    : (!isPublicAccess ? serviceOrders[0] : null);

  const client = currentOS ? clients.find(c => c.id === currentOS.client_id) : null;

  // Atualiza input se prop mudar
  useEffect(() => {
    if (initialToken) {
      setTokenInput(initialToken);
    }
  }, [initialToken]);

  // Gera payload do PIX Estático como alternativa
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

  // Trata retorno do Mercado Pago via URL Callback
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = window.location.hash.includes('?')
      ? new URLSearchParams(window.location.hash.split('?')[1])
      : new URLSearchParams();
    
    const mpStatus = searchParams.get('mp_status') || hashParams.get('mp_status') || searchParams.get('collection_status') || hashParams.get('collection_status');
    const paymentId = searchParams.get('payment_id') || hashParams.get('payment_id') || searchParams.get('collection_id') || hashParams.get('collection_id');

    if (mpStatus === 'approved' && currentOS) {
      setMpSuccessNotice(true);
      if (currentOS.status !== 'finalizado' || !currentOS.invoiced) {
        confirmMercadoPagoPayment(currentOS.id, paymentId || undefined, 'pix');
      }
    }
  }, [currentOS]);

  // Ação de Pagamento via Checkout Pro
  const handlePayMercadoPago = async () => {
    if (!currentOS) return;
    setLoadingMP(true);

    try {
      if (currentOS.mp_payment_url) {
        window.open(currentOS.mp_payment_url, '_blank');
        setLoadingMP(false);
        return;
      }

      const res = await generateOSMercadoPagoLink(currentOS.id);
      setLoadingMP(false);
      if (res.success && res.paymentUrl) {
        window.open(res.paymentUrl, '_blank');
      } else {
        alert(res.error || 'Não foi possível iniciar o Checkout Pro do Mercado Pago.');
      }
    } catch (err: any) {
      setLoadingMP(false);
      alert('Erro ao conectar com Mercado Pago: ' + (err.message || 'Falha de rede'));
    }
  };

  // Copiar link de pagamento do Mercado Pago
  const handleCopyPaymentLink = async () => {
    if (!currentOS) return;
    let url = currentOS.mp_payment_url;
    if (!url) {
      setLoadingMP(true);
      const res = await generateOSMercadoPagoLink(currentOS.id);
      setLoadingMP(false);
      if (res.success && res.paymentUrl) {
        url = res.paymentUrl;
      }
    }
    if (url) {
      navigator.clipboard.writeText(url);
      setCopiedPayLink(true);
      setTimeout(() => setCopiedPayLink(false), 2500);
    }
  };

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
    const cleanPhone = (issuer.whatsapp || issuer.phone || '').replace(/\D/g, '');
    const osRef = currentOS ? `Ordem de Serviço #${currentOS.os_number}` : 'uma Ordem de Serviço';
    const text = encodeURIComponent(
      `Olá ${issuer.full_name}, sou o(a) cliente ${client?.name || ''} da ${osRef}. Gostaria de tirar uma dúvida sobre o serviço.`
    );
    window.open(`https://wa.me/55${cleanPhone}?text=${text}`, '_blank');
  };

  const copyPix = () => {
    if (!pixPayloadStr) return;
    navigator.clipboard.writeText(pixPayloadStr);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  // Verificação de Pagamento Pendente
  const isPaymentPending = currentOS ? (!currentOS.invoiced && currentOS.status !== 'cancelado') : false;
  const isPaid = currentOS ? (currentOS.invoiced || currentOS.status === 'finalizado') : false;

  // Etapas de Progresso da OS
  const steps = [
    { key: 'entrada', label: '1. Recebido', done: true },
    { 
      key: 'analise', 
      label: '2. Avaliação / Orçamento', 
      done: ['aguardando_aprovacao', 'aprovado', 'em_andamento', 'aguardando_pagamento', 'finalizado', 'entregue'].includes(currentOS?.status || '') 
    },
    { 
      key: 'reparo', 
      label: currentOS?.os_type === 'licenca_digital' ? '3. Ativação da Licença' : '3. Execução / Reparo', 
      done: ['aprovado', 'em_andamento', 'aguardando_pagamento', 'finalizado', 'entregue'].includes(currentOS?.status || '') 
    },
    { 
      key: 'concluido', 
      label: isPaid ? '4. Concluído & Pago' : '4. Pronto / Pagamento', 
      done: isPaid || ['finalizado', 'entregue'].includes(currentOS?.status || '') 
    },
  ];

  // Caso não encontre a OS pelo hash fornecido
  if (!currentOS) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Ordem de Serviço Não Encontrada
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Por razões de privacidade e segurança, cada cliente possui um <strong>link exclusivo com hash criptográfico</strong>. O código informado não corresponde a nenhuma Ordem de Serviço ativa.
          </p>
        </div>

        {/* Campo para digitar o código caso o cliente tenha recebido */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block text-left">
            Possui o código hash da sua OS?
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="Ex: fmt_8f7b2c01e4a5d893..."
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <button
              onClick={() => {
                if (manualToken.trim()) {
                  setTokenInput(manualToken.trim());
                  window.location.hash = `#/os/${manualToken.trim()}`;
                }
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Buscar</span>
            </button>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleWhatsAppContact}
            className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Falar com o técnico no WhatsApp para solicitar seu link</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      {/* Barra de Simulação Exclusiva para Modo Oficina/Admin (Oculta na visão pública do cliente) */}
      {!isPublicAccess && (
        <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-blue-900 dark:text-blue-200">
              Modo Oficina (Simulador Técnico do Portal)
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-slate-500 whitespace-nowrap">Trocar OS:</label>
            <select
              value={currentOS.public_tracking_token}
              onChange={(e) => setTokenInput(e.target.value)}
              className="p-1.5 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-xs font-mono font-medium"
            >
              {serviceOrders.map(o => (
                <option key={o.id} value={o.public_tracking_token}>
                  OS #{o.os_number} - {o.equipment_type} ({OS_STATUS_DETAILS[o.status]?.label})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Cartão Principal da OS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Topo com Identificação da Assistência Técnica e Prestador */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] uppercase tracking-widest font-extrabold text-blue-200 bg-white/10 px-2.5 py-0.5 rounded-full inline-block">
                Portal Oficial de Acompanhamento
              </span>
              <h1 className="text-2xl sm:text-3xl font-black mt-2">
                Ordem de Serviço #{currentOS.os_number.toString().padStart(4, '0')}
              </h1>
              <p className="text-xs text-blue-100 mt-1">
                Oficina: <strong>{issuer.trade_name || issuer.full_name}</strong> • Prestador: <strong>{issuer.full_name} (CPF {formatCPF(issuer.cpf)})</strong>
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3.5 rounded-2xl text-left sm:text-right shrink-0">
              <span className="text-[10px] text-blue-200 block uppercase font-bold tracking-wider">Status Atual</span>
              <span className="text-base font-extrabold text-white flex items-center sm:justify-end gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {OS_STATUS_DETAILS[currentOS.status]?.label}
              </span>
            </div>
          </div>

          {/* Stepper de Progresso */}
          <div className="pt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {steps.map((st, i) => (
              <div
                key={st.key}
                className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 transition ${
                  st.done
                    ? 'bg-white/20 border-white/40 text-white font-semibold'
                    : 'bg-black/15 border-white/10 text-blue-200/60'
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

        {/* Feedback de Pagamento Confirmado via Mercado Pago */}
        {mpSuccessNotice && (
          <div className="bg-emerald-500 text-white p-4 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-inner">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Pagamento Aprovado com Sucesso via Mercado Pago! Sua OS foi concluída e os itens foram liberados.</span>
          </div>
        )}

        {/* Feedback de Aprovação de Orçamento */}
        {approvedSuccess && (
          <div className="bg-blue-600 text-white p-3.5 text-center text-xs font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Orçamento Aprovado com Sucesso! O técnico responsável foi notificado.</span>
          </div>
        )}

        {/* Conteúdo do Portal */}
        <div className="p-4 sm:p-8 space-y-6">

          {/* SEÇÃO DE COBRANÇA E BOTÃO MERCADO PAGO SE ESTIVER PENDENTE */}
          {isPaymentPending && (
            <div className="bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-indigo-500/10 border-2 border-[#009ee3] dark:border-[#0081bb] rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#009ee3] text-white">
                      Cobrança Online Disponível
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Checkout Pro</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Pague sua Ordem de Serviço Online com o Mercado Pago
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl">
                    Pague agora com <strong>PIX instantâneo</strong>, <strong>Cartão de Crédito em até {mercadoPago.max_installments || 12}x</strong>, Boleto Bancário ou saldo com aprovação imediata e total proteção ao consumidor.
                  </p>
                </div>

                <div className="text-left md:text-right shrink-0">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">Total a Pagar:</span>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-[#009ee3] dark:text-sky-400">
                    {formatCurrency(currentOS.total_amount)}
                  </div>
                </div>
              </div>

              {/* Botões de Ação do Pagamento */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePayMercadoPago}
                  disabled={loadingMP}
                  className="flex-1 px-6 py-3.5 bg-[#009ee3] hover:bg-[#0081bb] active:scale-95 text-white rounded-xl text-sm font-extrabold shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2.5 transition-all"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>{loadingMP ? 'Preparando Checkout Pro...' : 'Pagar Agora com Mercado Pago'}</span>
                  <ExternalLink className="w-4 h-4 opacity-80" />
                </button>

                <button
                  type="button"
                  onClick={handleCopyPaymentLink}
                  className="px-4 py-3.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                  title="Copiar link direto do Mercado Pago para pagar em outro aparelho"
                >
                  {copiedPayLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedPayLink ? 'Link Copiado!' : 'Copiar Link de Cobrança'}</span>
                </button>

                {issuer.pix_key && (
                  <button
                    type="button"
                    onClick={() => setShowDirectPix(prev => !prev)}
                    className="px-4 py-3.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <span>{showDirectPix ? 'Ocultar PIX' : 'PIX Direto'}</span>
                  </button>
                )}
              </div>

              {/* QR Code PIX Direto como alternativa */}
              {showDirectPix && pixQrUrl && (
                <div className="pt-4 border-t border-sky-200 dark:border-sky-900/50 flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-slate-900/70 p-4 rounded-xl">
                  <img src={pixQrUrl} alt="QR Code PIX" className="w-28 h-28 border rounded-lg p-1 bg-white" />
                  <div className="space-y-1.5 flex-1 text-xs">
                    <span className="font-bold text-slate-900 dark:text-white block">PIX Direto Prestador (PF)</span>
                    <p className="text-slate-500">Chave {issuer.pix_key_type}: <strong>{issuer.pix_key}</strong></p>
                    <p className="text-slate-500">Favorecido: <strong>{issuer.full_name}</strong> (CPF {formatCPF(issuer.cpf)})</p>
                    <button
                      onClick={copyPix}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold mt-1"
                    >
                      {copiedPix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPix ? 'Copia e Cola Copiado!' : 'Copiar Chave / Código PIX'}</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Ambiente Seguro Mercado Pago com criptografia SSL 256 bits e garantia de entrega de serviço.</span>
              </div>
            </div>
          )}

          {/* Box Equipamento ou Licença Digital e Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <div className="space-y-1">
              {currentOS.os_type === 'licenca_digital' ? (
                <>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase text-[10px] flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5" /> Licença Digital & Software
                  </span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {currentOS.digital_service_details?.product_name || currentOS.equipment_type}
                  </div>
                  {currentOS.digital_service_details?.target_device && (
                    <p className="text-slate-600 dark:text-slate-400">
                      Dispositivo Alvo: <strong>{currentOS.digital_service_details.target_device}</strong>
                    </p>
                  )}
                  {currentOS.digital_service_details?.customer_email && (
                    <p className="text-slate-500">
                      Email de Envio: {currentOS.digital_service_details.customer_email}
                    </p>
                  )}
                </>
              ) : (
                <>
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
                </>
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
                Defeito Relatado / Solicitação do Cliente:
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

          {/* Tabela de Itens, Serviços e Licenças */}
          <div className="space-y-3">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
              Discriminação dos Serviços, Peças e Licenças:
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

                        {/* Se pago, exibe a chave. Se pendente, avisa que será liberada no pagamento */}
                        <div className="mt-1.5">
                          {isPaid ? (
                            <div className="flex items-center gap-2">
                              <code className="text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded text-emerald-800 dark:text-emerald-300 select-all">
                                {lic.license_key}
                              </code>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(lic.license_key);
                                  setCopiedKeyId(lic.id);
                                  setTimeout(() => setCopiedKeyId(null), 2000);
                                }}
                                className="text-[10px] font-bold text-slate-600 hover:text-emerald-600 flex items-center gap-1 bg-white dark:bg-slate-800 border px-2 py-1 rounded shadow-sm"
                              >
                                {copiedKeyId === lic.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-600 font-bold">Copiada!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copiar Chave</span>
                                  </>
                                )}
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded border border-amber-200 dark:border-amber-800">
                              <Lock className="w-3.5 h-3.5 shrink-0" />
                              <span>Chave digital bloqueada. Liberada automaticamente após confirmação do pagamento.</span>
                            </div>
                          )}
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

          {/* Botões de Ação do Cliente */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400">
              Link de visualização único gerado para esta OS.
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleWhatsAppContact}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold text-xs hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Dúvidas no WhatsApp</span>
              </button>

              {['orcamento', 'aguardando_aprovacao'].includes(currentOS.status) && (
                <button
                  onClick={handleApproveBudget}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Aprovar Orçamento Online</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
