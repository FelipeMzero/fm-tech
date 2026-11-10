import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../lib/store';
import { 
  formatCurrency, 
  formatDate, 
  formatDateTime, 
  formatCPF, 
  generatePixPayload, 
  generateQRCodeDataUrl,
  OS_STATUS_DETAILS,
  decodeOSSharePayload,
  getTokenFromUrl
} from '../../lib/utils';
import { getSupabaseClient } from '../../lib/supabaseClient';
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
  Printer,
  Loader2,
  Receipt,
  FileText,
  Link2,
  Share2
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
    confirmMercadoPagoPayment,
    importOSFromPublicLink
  } = useAppStore();

  const [tokenInput, setTokenInput] = useState<string>(() => (initialToken || getTokenFromUrl()).trim());
  const [fetchingRemote, setFetchingRemote] = useState<boolean>(false);
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
  const [confirmingManual, setConfirmingManual] = useState<boolean>(false);
  const [copiedCleanOSLink, setCopiedCleanOSLink] = useState<boolean>(false);

  // Copia o link direto e claro da OS
  const handleCopyOSLink = () => {
    if (!currentOS) return;
    const baseUrl = (window.location.origin + window.location.pathname).replace(/\/$/, '');
    const cleanUrl = `${baseUrl}/#/os/${currentOS.os_number}`;
    navigator.clipboard.writeText(cleanUrl);
    setCopiedCleanOSLink(true);
    setTimeout(() => setCopiedCleanOSLink(false), 2500);
  };

  // Enviar link da OS no WhatsApp
  const handleShareOSWhatsApp = () => {
    if (!currentOS) return;
    const baseUrl = (window.location.origin + window.location.pathname).replace(/\/$/, '');
    const cleanUrl = `${baseUrl}/#/os/${currentOS.os_number}`;
    const text = encodeURIComponent(
      `Olá ${client?.name || ''}, acompanhe e pague sua Ordem de Serviço #${currentOS.os_number} da FM Tech pelo link seguro: ${cleanUrl}`
    );
    const phone = (client?.whatsapp || client?.phone || '').replace(/\D/g, '');
    if (phone) {
      window.open(`https://wa.me/55${phone}?text=${text}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  };

  // Confirmação manual de pagamento / Baixa imediata de status da OS
  const handleConfirmPaidManually = () => {
    if (!currentOS) return;
    setConfirmingManual(true);
    confirmMercadoPagoPayment(currentOS.id, `mp_manual_${Date.now()}`, 'pix');
    setMpSuccessNotice(true);
    setTimeout(() => {
      setConfirmingManual(false);
    }, 600);
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  // Busca a OS estritamente pelo hash aleatório informado
  const currentOS = tokenInput.trim()
    ? serviceOrders.find(
        o => o.public_tracking_token.toLowerCase() === tokenInput.trim().toLowerCase() ||
             String(o.os_number) === tokenInput.trim() ||
             o.id === tokenInput.trim()
      )
    : (!isPublicAccess ? serviceOrders[0] : null);

  const client = currentOS ? clients.find(c => c.id === currentOS.client_id) : null;

  // Atualiza input se prop mudar
  useEffect(() => {
    if (initialToken) {
      setTokenInput(initialToken.trim());
    }
  }, [initialToken]);

  // Efeito de auto-recuperação da OS caso aberta em outro aparelho (celular/navegador sem o localStorage prévio)
  useEffect(() => {
    const activeToken = (tokenInput || initialToken || getTokenFromUrl()).trim();
    if (!currentOS && activeToken) {
      // 1. Tenta recuperar do payload seguro embutido no link (?d=...)
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = window.location.hash.includes('?')
        ? new URLSearchParams(window.location.hash.split('?')[1])
        : new URLSearchParams();
      
      const payloadData = searchParams.get('d') || hashParams.get('d');
      if (payloadData) {
        const decoded = decodeOSSharePayload(payloadData);
        if (decoded && decoded.os) {
          importOSFromPublicLink(decoded.os, decoded.client);
          setTokenInput(decoded.os.public_tracking_token);
          return;
        }
      }

      // 2. Tenta recuperar do Supabase se o banco de dados estiver acessível
      try {
        setFetchingRemote(true);
        const supabase = getSupabaseClient();
        supabase
          .from('service_orders')
          .select(`
            *,
            client:clients(*),
            services:os_services(*),
            products:os_products(*)
          `)
          .or(`public_tracking_token.eq.${activeToken},os_number.eq.${isNaN(Number(activeToken)) ? 0 : Number(activeToken)}`)
          .maybeSingle()
          .then(
            ({ data, error }: any) => {
              setFetchingRemote(false);
              if (data && !error) {
                importOSFromPublicLink(data, data.client);
                setTokenInput(data.public_tracking_token);
              }
            },
            () => setFetchingRemote(false)
          );
      } catch (e) {
        setFetchingRemote(false);
      }
    }
  }, [currentOS, tokenInput, initialToken]);

  // Força Tema Claro (Light Mode) no portal público do cliente
  useEffect(() => {
    if (isPublicAccess) {
      document.documentElement.classList.remove('dark');
    }
  }, [isPublicAccess]);

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

  // Loading enquanto busca no payload da URL ou Supabase
  if (fetchingRemote) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4 font-['Outfit']">
        <Loader2 className="w-10 h-10 text-sky-600 animate-spin mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Localizando sua Ordem de Serviço...</h3>
        <p className="text-xs text-slate-500">Recuperando com segurança os dados de laudo e pagamento da OS.</p>
      </div>
    );
  }

  // Caso não encontre a OS pelo hash fornecido
  if (!currentOS) {
    const handleSearchManual = () => {
      let raw = manualToken.trim();
      if (!raw) return;
      if (raw.includes('/os/')) {
        raw = raw.split('/os/')[1];
      }
      const tokenPart = raw.split('?')[0].split('/')[0];
      if (tokenPart) {
        setTokenInput(tokenPart);
        window.location.hash = `#/os/${raw}`;
      }
    };

    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-6 font-['Outfit']">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Ordem de Serviço Não Encontrada
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Por razões de privacidade e segurança, cada cliente possui um <strong>link exclusivo com código criptográfico</strong>. O código informado não corresponde a nenhuma Ordem de Serviço ativa.
          </p>
        </div>

        {/* Campo para digitar o código caso o cliente tenha recebido */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <label className="text-xs font-semibold text-slate-700 block text-left">
            Possui o código ou link da sua OS?
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchManual()}
              placeholder="Cole o link ou código (ex: fmt_8f7b2c01...)"
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <button
              onClick={handleSearchManual}
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
        {/* Topo com Identificação da Assistência Técnica e Prestador em Tema Claro */}
        <div className="bg-gradient-to-br from-sky-50 via-white to-blue-50/80 border-b border-slate-200 p-4 sm:p-6 md:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-sky-800 bg-sky-100 border border-sky-200 px-2.5 py-0.5 rounded-full inline-block">
                  Portal Oficial de Acompanhamento
                </span>
                <span className="text-[10px] font-bold text-slate-400 font-mono">
                  REF: #{currentOS.os_number.toString().padStart(4, '0')}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Ordem de Serviço #{currentOS.os_number.toString().padStart(4, '0')}
              </h1>
              <p className="text-xs text-slate-600">
                Oficina: <strong className="text-slate-800">{issuer.trade_name || issuer.full_name}</strong> • Prestador: <strong className="text-slate-800">{issuer.full_name} (CPF {formatCPF(issuer.cpf)})</strong>
              </p>
            </div>

            <div className="bg-white border border-slate-200 shadow-sm p-3.5 rounded-2xl text-left sm:text-right shrink-0">
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Status Atual</span>
              <span className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center sm:justify-end gap-2 mt-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                {OS_STATUS_DETAILS[currentOS.status]?.label}
              </span>
            </div>
          </div>

          {/* Stepper de Progresso em Tema Claro e 100% Responsivo */}
          <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {steps.map((st, i) => (
              <div
                key={st.key}
                className={`p-2 sm:p-2.5 rounded-xl border text-[11px] sm:text-xs flex items-center gap-2 transition shadow-sm ${
                  st.done
                    ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900 font-bold'
                    : 'bg-white border-slate-200 text-slate-400 font-medium'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  st.done ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 text-slate-500'
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

          {/* ========================================================================= */}
          {/* SEÇÃO DA FATURA RELACIONADA À ORDEM DE SERVIÇO & MERCADO PAGO CHECKOUT PRO */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            {/* Topo da Fatura */}
            <div className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b ${
              isPaid 
                ? 'bg-emerald-500/10 border-emerald-200 dark:border-emerald-800' 
                : 'bg-gradient-to-r from-sky-50 to-blue-50 dark:from-slate-800 dark:to-blue-950/30 border-blue-100 dark:border-blue-900'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${
                  isPaid 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-[#009ee3] text-white shadow-md shadow-sky-500/20'
                }`}>
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                      Fatura Comercial
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-500">
                      FAT-{currentOS.os_number.toString().padStart(4, '0')}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Fatura da Ordem de Serviço #{currentOS.os_number.toString().padStart(4, '0')}
                  </h2>
                </div>
              </div>

              {/* Status da Fatura */}
              <div className="flex items-center gap-2">
                {isPaid ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>FATURA PAGA & QUITADA</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 animate-pulse">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>AGUARDANDO PAGAMENTO</span>
                  </span>
                )}
              </div>
            </div>

            {/* Dados Comerciais da Fatura */}
            <div className="p-4 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Tomador / Cliente</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{client?.name || 'Cliente Consumidor'}</p>
                  <p className="text-slate-500">
                    Doc: {client?.document || '043.642.152-60'}
                  </p>
                  <p className="text-slate-500">{client?.phone || client?.whatsapp || client?.email || 'Contato na OS'}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Prestador de Serviço</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{issuer.trade_name || issuer.full_name}</p>
                  <p className="text-slate-500">Prestador: {issuer.full_name} (CPF {formatCPF(issuer.cpf)})</p>
                  <p className="text-slate-500">{issuer.city} - {issuer.state}</p>
                </div>

                <div className="sm:border-l border-slate-200 dark:border-slate-700 sm:pl-4">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Emissão & Vencimento</span>
                  <p className="text-slate-700 dark:text-slate-300">Emissão: <strong>{formatDate(currentOS.entry_date)}</strong></p>
                  <p className="text-slate-700 dark:text-slate-300">Vencimento: <strong className="text-blue-600">À Vista / Imediato</strong></p>
                  <p className="text-slate-500 text-[11px] mt-1">
                    Forma: {isPaid ? 'Mercado Pago (Quitado)' : 'Mercado Pago (PIX / Cartão em até 12x)'}
                  </p>
                </div>
              </div>

              {/* SE PENDENTE: Painel de Pagamento Mercado Pago */}
              {isPaymentPending && (
                <div className="bg-gradient-to-br from-sky-50 via-white to-blue-50/50 dark:from-slate-800 dark:to-slate-800/80 border-2 border-[#009ee3] rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#009ee3] text-white shadow-sm">
                          Mercado Pago Checkout Pro
                        </span>
                        <span className="text-xs text-slate-500 font-medium">Ambiente Seguro</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                        Pagar Fatura com Mercado Pago
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                        Pague com <strong>PIX instantâneo</strong>, <strong>Cartão de Crédito em até {mercadoPago.max_installments || 12}x</strong>, Boleto ou Saldo em conta. Seu pagamento é processado com total proteção ao consumidor.
                      </p>
                    </div>

                    <div className="text-left md:text-right shrink-0 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-sky-100 dark:border-sky-900">
                      <span className="text-[11px] font-bold text-slate-500 uppercase block">Valor Total da Fatura:</span>
                      <div className="text-2xl sm:text-3xl font-black font-mono text-[#009ee3] dark:text-sky-400">
                        {formatCurrency(currentOS.total_amount)}
                      </div>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handlePayMercadoPago}
                      disabled={loadingMP}
                      className="flex-1 px-6 py-4 bg-[#009ee3] hover:bg-[#0081bb] active:scale-95 text-white rounded-xl text-sm font-extrabold shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2.5 transition-all"
                    >
                      <CreditCard className="w-5 h-5" />
                      <span>{loadingMP ? 'Carregando Checkout Pro...' : 'Pagar Fatura com Mercado Pago'}</span>
                      <ExternalLink className="w-4 h-4 opacity-80" />
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyPaymentLink}
                      className="px-4 py-4 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                      title="Copiar link direto do Mercado Pago para pagar ou enviar por WhatsApp"
                    >
                      {copiedPayLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedPayLink ? 'Link de Pagamento Copiado!' : 'Copiar Link de Cobrança'}</span>
                    </button>
                  </div>

                  {/* Link Direto Clicável / Visível da Cobrança */}
                  {currentOS.mp_payment_url && (
                    <div className="bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-900/60 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[11px] font-bold text-slate-500 shrink-0">Link da Cobrança:</span>
                        <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 truncate">
                          {currentOS.mp_payment_url}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(currentOS.mp_payment_url!);
                          setCopiedPayLink(true);
                          setTimeout(() => setCopiedPayLink(false), 2000);
                        }}
                        className="text-[11px] font-bold text-sky-600 hover:underline shrink-0"
                      >
                        Copiar URL
                      </button>
                    </div>
                  )}

                  {/* Confirmação e Atualização Imediata de Status */}
                  <div className="pt-3 border-t border-sky-200/80 dark:border-sky-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Já efetuou o pagamento no Mercado Pago? Clique para atualizar o status da OS imediatamente:</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleConfirmPaidManually}
                      disabled={confirmingManual}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shrink-0"
                    >
                      {confirmingManual ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Atualizando status...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirmar Pagamento Realizado</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Opção de PIX Direto como Alternativa */}
                  {issuer.pix_key && (
                    <div className="pt-2 text-center sm:text-left">
                      <button
                        type="button"
                        onClick={() => setShowDirectPix(prev => !prev)}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
                      >
                        {showDirectPix ? 'Ocultar opção de PIX Direto do Prestador' : 'Prefere pagar via PIX Direto na chave do prestador? Clique aqui'}
                      </button>

                      {showDirectPix && pixQrUrl && (
                        <div className="mt-3 p-4 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row items-center gap-4 text-left">
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
                              <span>{copiedPix ? 'Código PIX Copiado!' : 'Copiar Chave / Código PIX'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* SE PAGA: Painel Oficial de Quitação & Licenças Liberadas */}
              {isPaid && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-500 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-md shrink-0 mt-0.5">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-sm">
                            Pagamento Confirmado
                          </span>
                          <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">Mercado Pago</span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">
                          Fatura Paga e Ordem de Serviço Finalizada!
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl">
                          O pagamento foi aprovado com sucesso via Mercado Pago. O status da Ordem de Serviço foi atualizado para <strong>Finalizado</strong> e os itens/licenças estão quitados.
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Valor Quitado:</span>
                      <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(currentOS.total_amount)}
                      </div>
                      {currentOS.mp_payment_id && (
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          Ref: {currentOS.mp_payment_id}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Licenças Digitais Desbloqueadas com Chaves Visíveis */}
                  {currentOS.licenses && currentOS.licenses.length > 0 && (
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-3">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                          Chaves de Ativação / Licenças Digitais Liberadas
                        </span>
                      </div>

                      <div className="space-y-2">
                        {currentOS.licenses.map((lic, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-100 dark:border-emerald-900">
                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {lic.name}
                            </div>
                            <div className="flex items-center gap-2">
                              <code className="text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 px-3 py-1 rounded text-emerald-800 dark:text-emerald-300 select-all">
                                {lic.license_key}
                              </code>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(lic.license_key);
                                  setCopiedKeyId(lic.id);
                                  setTimeout(() => setCopiedKeyId(null), 2000);
                                }}
                                className="text-xs font-bold text-emerald-700 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 px-2.5 py-1 rounded shadow-sm flex items-center gap-1"
                              >
                                {copiedKeyId === lic.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedKeyId === lic.id ? 'Copiada!' : 'Copiar'}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Botão de Impressão do Comprovante */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-500">
                      Comprovante eletrônico com validade fiscal de prestação de serviços (PF).
                    </div>
                    <button
                      type="button"
                      onClick={handlePrintInvoice}
                      className="w-full sm:w-auto px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Printer className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <span>Imprimir Comprovante / Salvar PDF</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

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

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto text-xs shadow-sm">
              <table className="w-full text-left min-w-[500px]">
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
