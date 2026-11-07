import React, { useState } from 'react';
import { useAppStore } from '../../lib/store';
import { testMercadoPagoConnection, verifyMercadoPagoPayment, PaymentVerificationResult } from '../../lib/mercadopago';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  Send,
  Zap,
  HelpCircle,
  Smartphone,
  ArrowRight,
  Receipt,
  FileCheck2,
  Clock,
  Sparkles
} from 'lucide-react';

export const MercadoPagoScreen: React.FC = () => {
  const {
    mercadoPago,
    updateMercadoPagoSettings,
    serviceOrders,
    clients,
    generateOSMercadoPagoLink,
    confirmMercadoPagoPayment,
    addAuditLog
  } = useAppStore();

  const DEFAULT_FMTECH_WEBHOOK = 'https://felipemzero.github.io/fm-tech/?webhook=mercadopago';

  const [form, setForm] = useState(() => ({
    ...mercadoPago,
    notification_url: mercadoPago.notification_url || DEFAULT_FMTECH_WEBHOOK,
  }));
  const [showToken, setShowToken] = useState(false);
  const [showPublicKey, setShowPublicKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    userName?: string;
    userEmail?: string;
    isLive?: boolean;
  } | null>(null);

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Webhook Test & Simulation
  const [webhookTesting, setWebhookTesting] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{
    success: boolean;
    message: string;
    paymentId?: string;
    payload?: any;
  } | null>(null);

  // Consulta e Verificação Real na API do Mercado Pago (GET /v1/payments/{id})
  const [verificationId, setVerificationId] = useState('');
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [verificationResult, setVerificationResult] = useState<PaymentVerificationResult | null>(null);

  // Simulador de Checkout Pro
  const [selectedOSId, setSelectedOSId] = useState<string>(() => {
    const openOS = serviceOrders.find(o => o.status !== 'finalizado' && o.status !== 'cancelado');
    return openOS ? openOS.id : (serviceOrders[0]?.id || '');
  });
  const [simulatingLink, setSimulatingLink] = useState(false);
  const [generatedLinkData, setGeneratedLinkData] = useState<{
    url: string;
    preferenceId: string;
    isSimulated?: boolean;
  } | null>(null);
  const [copiedPayLink, setCopiedPayLink] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    updateMercadoPagoSettings(form);
    addAuditLog('Mercado Pago', 'Atualização', 'Configurações de integração com Mercado Pago atualizadas.');
    setTimeout(() => {
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 400);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testMercadoPagoConnection(form.access_token);
      setTestResult(res);
      if (res.success) {
        addAuditLog('Mercado Pago', 'Teste de Conexão', `Conexão validada com sucesso: ${res.userName || 'OK'}`);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Erro inesperado ao conectar: ' + (err.message || 'Falha de rede')
      });
    } finally {
      setTesting(false);
    }
  };

  const handleCopyWebhookUrl = () => {
    const url = form.notification_url || DEFAULT_FMTECH_WEBHOOK;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleResetWebhookUrl = () => {
    setForm(prev => ({ ...prev, notification_url: DEFAULT_FMTECH_WEBHOOK }));
  };

  const selectedOS = serviceOrders.find(o => o.id === selectedOSId);
  const selectedClient = clients.find(c => c.id === selectedOS?.client_id);

  const handleGenerateLink = async () => {
    if (!selectedOSId) return;
    setSimulatingLink(true);
    const res = await generateOSMercadoPagoLink(selectedOSId);
    setSimulatingLink(false);
    if (res.success && res.paymentUrl) {
      setGeneratedLinkData({
        url: res.paymentUrl,
        preferenceId: res.preferenceId || '',
        isSimulated: res.isSimulated,
      });
    } else {
      alert(res.error || 'Não foi possível gerar a preferência de pagamento.');
    }
  };

  const handleSimulateWebhook = () => {
    if (!selectedOSId || !selectedOS) return;
    setWebhookTesting(true);
    const paymentId = 'mp_webhook_' + Math.floor(1000000000 + Math.random() * 9000000000);
    const mockPayload = {
      id: paymentId,
      live_mode: !form.sandbox,
      type: 'payment',
      date_created: new Date().toISOString(),
      user_id: 123456789,
      action: 'payment.created',
      data: { id: paymentId },
      external_reference: `os_${selectedOS.id}_num_${selectedOS.os_number}`,
      amount: selectedOS.total_amount,
      status: 'approved',
    };

    setTimeout(() => {
      confirmMercadoPagoPayment(selectedOSId, paymentId, 'pix');
      setWebhookTestResult({
        success: true,
        message: `Webhook processado com sucesso! Pagamento ${paymentId} confirmado e OS #${selectedOS.os_number} faturada automaticamente.`,
        paymentId,
        payload: mockPayload,
      });
      setWebhookTesting(false);
    }, 500);
  };

  const handleVerifyPaymentAPI = async () => {
    if (!verificationId.trim()) return;
    setVerifyingPayment(true);
    setVerificationResult(null);
    try {
      const res = await verifyMercadoPagoPayment(verificationId.trim(), form.access_token);
      setVerificationResult(res);
      if (res.success) {
        addAuditLog('Mercado Pago', 'Consulta API', `Pagamento #${res.paymentId} consultado: ${res.status}`);
      }
    } catch (err: any) {
      setVerificationResult({
        success: false,
        message: 'Erro ao verificar pagamento: ' + (err.message || 'Falha de rede')
      });
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handleApplyVerificationToOS = () => {
    if (!verificationResult || !verificationResult.paymentId || !selectedOSId) return;
    const paymentMethod = verificationResult.paymentMethodId === 'pix' ? 'pix' : 'cartao_credito';
    confirmMercadoPagoPayment(selectedOSId, verificationResult.paymentId, paymentMethod);
    alert(`Pagamento #${verificationResult.paymentId} vinculado com sucesso à OS selecionada! Status atualizado para Finalizado.`);
  };

  const ordersWithMP = serviceOrders.filter(o => o.mp_payment_url || o.mp_payment_status || o.invoiced);

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Mercado Pago */}
      <div className="bg-gradient-to-r from-[#009ee3] via-[#0081bb] to-[#004e82] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 transform skew-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight">Mercado Pago Checkout Pro</h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    form.enabled ? 'bg-emerald-400 text-emerald-950' : 'bg-slate-300 text-slate-800'
                  }`}>
                    {form.enabled ? 'Ativo' : 'Desativado'}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    form.sandbox ? 'bg-amber-300 text-amber-950' : 'bg-green-400 text-green-950'
                  }`}>
                    {form.sandbox ? 'Sandbox (Testes)' : 'Produção'}
                  </span>
                </div>
                <p className="text-sky-100 text-sm mt-0.5">
                  Receba pagamentos com PIX Instantâneo, Cartão de Crédito em até 12x, Boleto e Saldo em Conta integrado ao MapOS e Ordens de Serviço.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://www.mercadopago.com.br/developers/panel/app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white rounded-xl text-sm font-semibold transition"
            >
              <span>Painel do Desenvolvedor</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Test Connection Banner (if tested) */}
      {testResult && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
          testResult.success 
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
            : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100'
        }`}>
          {testResult.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-sm">
            <p className="font-semibold">{testResult.message}</p>
            {testResult.userName && (
              <p className="text-xs opacity-90 mt-0.5">
                Nome da Conta: <span className="font-bold">{testResult.userName}</span> {testResult.userEmail && `(${testResult.userEmail})`}
              </p>
            )}
          </div>
          <button
            onClick={() => setTestResult(null)}
            className="text-xs opacity-60 hover:opacity-100 underline"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Main Grid: Form + Webhook Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Credenciais da API</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Insira as credenciais da sua aplicação do Mercado Pago para gerar links do Checkout Pro.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing || !form.access_token}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-xs font-semibold disabled:opacity-50 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                  {testing ? 'Testando...' : 'Testar Conexão'}
                </button>
              </div>
            </div>

            {/* Status & Ambiente Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 block">Status da Integração</span>
                  <span className="text-xs text-slate-500">Habilita botões de pagamento de OS e Vendas</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.enabled}
                    onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-[#009ee3]"></div>
                </label>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 block">Modo Sandbox (Testes)</span>
                  <span className="text-xs text-slate-500">Use credenciais de teste para simulações</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.sandbox}
                    onChange={(e) => setForm({ ...form, sandbox: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
                </label>
              </div>
            </div>

            {/* Access Token */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  Access Token {form.sandbox ? '(Teste ou Produção)' : '(Produção)'}
                </label>
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
                >
                  {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showToken ? 'Ocultar' : 'Exibir'}
                </button>
              </div>
              <input
                type={showToken ? 'text' : 'password'}
                value={form.access_token}
                onChange={(e) => setForm({ ...form, access_token: e.target.value })}
                placeholder="APP_USR-0000000000000000-000000-00000000000000000000000000000000-000000000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Token privado gerado no painel de desenvolvedores do Mercado Pago. Nunca compartilhe este token publicamente.
              </p>
            </div>

            {/* Public Key */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Public Key
                </label>
                <button
                  type="button"
                  onClick={() => setShowPublicKey(!showPublicKey)}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
                >
                  {showPublicKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showPublicKey ? 'Ocultar' : 'Exibir'}
                </button>
              </div>
              <input
                type={showPublicKey ? 'text' : 'password'}
                value={form.public_key}
                onChange={(e) => setForm({ ...form, public_key: e.target.value })}
                placeholder="APP_USR-00000000-0000-0000-0000-000000000000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
              />
            </div>

            {/* Statement Descriptor & Parcelas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Nome na Fatura (Cartão)
                </label>
                <input
                  type="text"
                  maxLength={22}
                  value={form.statement_descriptor}
                  onChange={(e) => setForm({ ...form, statement_descriptor: e.target.value.toUpperCase() })}
                  placeholder="FM TECH"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent uppercase transition"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Aparece na fatura do cliente (máx 22 caracteres).</span>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Máximo de Parcelas
                </label>
                <select
                  value={form.max_installments}
                  onChange={(e) => setForm({ ...form, max_installments: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                >
                  <option value={1}>1x (À vista apenas)</option>
                  <option value={3}>Até 3x</option>
                  <option value={6}>Até 6x</option>
                  <option value={10}>Até 10x</option>
                  <option value={12}>Até 12x (Padrão)</option>
                </select>
                <span className="text-[11px] text-slate-500 mt-1 block">Limite de parcelamento oferecido no checkout.</span>
              </div>
            </div>

            {/* URL de Notificação IPN / Webhook */}
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  URL de Notificação Instantânea (Webhook / IPN)
                </label>
                <button
                  type="button"
                  onClick={handleResetWebhookUrl}
                  className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-medium"
                >
                  Restaurar URL FM Tech
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={form.notification_url}
                  onChange={(e) => setForm({ ...form, notification_url: e.target.value })}
                  placeholder="https://felipemzero.github.io/fm-tech/?webhook=mercadopago"
                  className="w-full px-3.5 py-2.5 pr-24 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={handleCopyWebhookUrl}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1 transition"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedUrl ? 'Copiado!' : 'Copiar'}
                </button>
              </div>

              {/* Box explicativo sobre 405 Method Not Allowed e GitHub Pages */}
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs space-y-2 text-amber-950 dark:text-amber-200">
                <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-100">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Por que o teste do Mercado Pago retornou "405 Method Not Allowed"?</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-900/90 dark:text-amber-200/90">
                  O <strong>GitHub Pages é uma hospedagem puramente estática</strong> e, por padrão de infraestrutura, só aceita requisições <code className="font-mono font-bold">GET</code>. O Mercado Pago envia o teste de Webhook como <code className="font-mono font-bold">HTTP POST</code>, o que causa o código <code className="font-mono font-bold">405</code> no servidor do GitHub.
                </p>
                <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/60 text-[11px] space-y-1">
                  <span className="font-bold text-slate-900 dark:text-white block">Como funciona o pagamento na FM Tech:</span>
                  <p className="text-slate-700 dark:text-slate-300">
                    ✓ <strong>Baixa Automática Sem Necessidade de Servidor:</strong> Quando o cliente paga no Mercado Pago, ele é redirecionado de volta para a OS com <code className="font-mono text-sky-600">mp_status=approved</code> e a OS é <strong>faturada e finalizada imediatamente</strong>.
                  </p>
                  <p className="text-slate-700 dark:text-slate-300">
                    ✓ <strong>Para aprovar o teste do painel do Mercado Pago:</strong> O Mercado Pago exige um endpoint que aceite POST. Você pode deixar o campo de Webhook vazio no Mercado Pago (já que as <code className="font-mono">back_urls</code> cuidam de tudo) ou usar um backend Node/Serverless que adicionamos no projeto em <code className="font-mono">/server/src/server.ts</code>.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Suporta Checkout Pro oficial, PIX, Cartões e Boleto.
              </span>
              <div className="flex items-center gap-3">
                {saveSuccess && (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Salvo com sucesso!
                  </span>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#009ee3] hover:bg-[#0081bb] text-white font-semibold text-sm shadow-md shadow-sky-500/20 disabled:opacity-50 transition"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Col: Webhook Instructions & Info */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold">
              <HelpCircle className="w-5 h-5 text-sky-600" />
              <h3>Como Obter as Credenciais</h3>
            </div>
            <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-2.5 list-decimal pl-4">
              <li>Acesse o <a href="https://www.mercadopago.com.br/developers" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline font-semibold">Painel de Desenvolvedores do Mercado Pago</a>.</li>
              <li>Faça login com a sua conta do Mercado Pago / Mercado Livre.</li>
              <li>Clique em <strong>Suas integrações</strong> e selecione ou crie uma aplicação (Ex: <em>FM Tech</em>).</li>
              <li>No menu lateral, clique em <strong>Credenciais de teste</strong> (para homologação) ou <strong>Credenciais de produção</strong>.</li>
              <li>Copie o <strong>Access Token</strong> e a <strong>Public Key</strong> e cole nos campos ao lado.</li>
            </ol>
            <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800 text-[11px] text-sky-800 dark:text-sky-200 leading-relaxed">
              <strong>Dica de Segurança:</strong> O Checkout Pro redireciona o cliente para o ambiente seguro e blindado do Mercado Pago, com antifraude nativo e aprovação em segundos no PIX.
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold">
              <Zap className="w-5 h-5 text-amber-500" />
              <h3>Webhooks e IPN</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Configure Webhooks na sua aplicação do Mercado Pago para receber notificações instantâneas de pagamentos:
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 font-mono text-[11px] bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>payments (Pagamentos)</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>merchant_order (Pedidos)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testador e Simulador de Checkout Pro ao Vivo */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-600" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Simulador e Testador de Checkout Pro
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gere um link real de pagamento para uma Ordem de Serviço ou simule a aprovação instantânea com baixa automática no Financeiro.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Escolha da OS */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Selecione uma Ordem de Serviço para Teste
              </label>
              <select
                value={selectedOSId}
                onChange={(e) => {
                  setSelectedOSId(e.target.value);
                  setGeneratedLinkData(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
              >
                {serviceOrders.map(os => {
                  const client = clients.find(c => c.id === os.client_id);
                  return (
                    <option key={os.id} value={os.id}>
                      OS #{os.os_number} - {client?.name || 'Cliente'} - R$ {os.total_amount.toFixed(2)} ({os.status.toUpperCase()})
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedOS && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cliente:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedClient?.name || 'Não informado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Equipamento/Serviço:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedOS.equipment_type} {selectedOS.brand} {selectedOS.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status Atual:</span>
                  <span className="font-semibold uppercase text-sky-600 dark:text-sky-400">{selectedOS.status}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 text-sm font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Valor Total:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(selectedOS.total_amount)}</span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleGenerateLink}
                disabled={simulatingLink || !selectedOS}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#009ee3] hover:bg-[#0081bb] text-white font-semibold text-sm shadow-sm disabled:opacity-50 transition"
              >
                <CreditCard className="w-4 h-4" />
                {simulatingLink ? 'Gerando Link...' : 'Gerar Cobrança Checkout Pro'}
              </button>

              <button
                type="button"
                onClick={handleSimulateWebhook}
                disabled={webhookTesting || !selectedOS}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm disabled:opacity-50 transition"
              >
                <CheckCircle2 className={`w-4 h-4 ${webhookTesting ? 'animate-spin' : ''}`} />
                {webhookTesting ? 'Processando Webhook...' : 'Disparar Teste de Webhook (IPN)'}
              </button>
            </div>

            {/* Resultado do Teste de Webhook */}
            {webhookTestResult && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Status: 200 OK • Notificação Recebida
                  </span>
                  <span className="font-mono text-[10px] bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 px-2 py-0.5 rounded font-bold">
                    {webhookTestResult.paymentId}
                  </span>
                </div>
                <p className="text-emerald-800 dark:text-emerald-200">
                  {webhookTestResult.message}
                </p>
                <details className="mt-1">
                  <summary className="cursor-pointer text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:underline">
                    Ver payload JSON recebido do Mercado Pago
                  </summary>
                  <pre className="mt-2 p-2.5 bg-slate-900 text-emerald-400 rounded-lg text-[10px] font-mono overflow-x-auto max-h-36">
                    {JSON.stringify(webhookTestResult.payload, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>

          {/* Resultado do Link Gerado */}
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-sky-600" />
              Link de Pagamento da OS #{selectedOS?.os_number}
            </h4>

            {generatedLinkData ? (
              <div className="space-y-3">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 break-all text-xs font-mono text-sky-600 dark:text-sky-400">
                  {generatedLinkData.url}
                </div>

                {generatedLinkData.isSimulated && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400">
                    * Link de demonstração/simulação ativado. Para gerar links reais na API do Mercado Pago, insira um Access Token de produção ou de teste no painel acima.
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  <a
                    href={generatedLinkData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition"
                  >
                    <span>Abrir Checkout Pro</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedLinkData.url);
                      setCopiedPayLink(true);
                      setTimeout(() => setCopiedPayLink(false), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 text-xs font-semibold transition"
                  >
                    {copiedPayLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedPayLink ? 'Copiado!' : 'Copiar Link'}
                  </button>

                  {selectedClient?.whatsapp && (
                    <a
                      href={`https://api.whatsapp.com/send?phone=55${selectedClient.whatsapp.replace(/\D/g, '')}&text=${encodeURIComponent(
                        `Olá ${selectedClient.name}, aqui é da FM Tech! Segue o link seguro do Mercado Pago para pagamento da sua OS #${selectedOS?.os_number} no valor de ${formatCurrency(selectedOS?.total_amount || 0)}: ${generatedLinkData.url}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Enviar no WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                <CreditCard className="w-8 h-8 mx-auto opacity-40 text-slate-400 mb-2" />
                <p>Nenhum link gerado para esta sessão ainda.</p>
                <p>Clique em <strong>"Gerar Cobrança Checkout Pro"</strong> para criar a preferência.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Consulta Real de Pagamento na API do Mercado Pago (GET /v1/payments/{id}) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Verificação Oficial de Pagamento na API Mercado Pago
            </h3>
            <p className="text-xs text-slate-500">
              Consulte diretamente os servidores do Mercado Pago informando o ID da transação (<code className="font-mono">payment_id</code>).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              ID do Pagamento Mercado Pago (ex: 1234567890):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={verificationId}
                onChange={(e) => setVerificationId(e.target.value)}
                placeholder="Ex: 98765432101"
                className="flex-1 px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={handleVerifyPaymentAPI}
                disabled={verifyingPayment || !verificationId.trim()}
                className="px-4 py-2.5 bg-[#009ee3] hover:bg-[#0081bb] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${verifyingPayment ? 'animate-spin' : ''}`} />
                <span>{verifyingPayment ? 'Consultando...' : 'Consultar API'}</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Endpoint Oficial: <code className="text-sky-600 font-mono text-[11px]">GET /v1/payments/:id</code>
          </div>
        </div>

        {verificationResult && (
          <div className={`p-4 rounded-xl border text-xs space-y-3 ${
            verificationResult.success
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                {verificationResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                )}
                {verificationResult.message}
              </span>
              {verificationResult.status && (
                <span className={`px-2 py-0.5 rounded font-extrabold uppercase text-[10px] ${
                  verificationResult.status === 'approved'
                    ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100'
                    : 'bg-amber-200 text-amber-900'
                }`}>
                  Status: {verificationResult.status}
                </span>
              )}
            </div>

            {verificationResult.success && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200 dark:border-emerald-800/60 text-[11px]">
                <div>
                  <span className="opacity-75 block">Valor Transação:</span>
                  <strong>{verificationResult.transactionAmount ? formatCurrency(verificationResult.transactionAmount) : 'N/A'}</strong>
                </div>
                <div>
                  <span className="opacity-75 block">Método de Pagamento:</span>
                  <strong className="uppercase">{verificationResult.paymentMethodId || 'N/A'} ({verificationResult.paymentTypeId || ''})</strong>
                </div>
                <div>
                  <span className="opacity-75 block">Pagador:</span>
                  <strong className="truncate block">{verificationResult.payerEmail || verificationResult.payerName || 'N/A'}</strong>
                </div>
                <div>
                  <span className="opacity-75 block">Data Aprovação:</span>
                  <strong>{verificationResult.dateApproved ? formatDate(verificationResult.dateApproved) : 'Pendente'}</strong>
                </div>
              </div>
            )}

            {verificationResult.success && verificationResult.status === 'approved' && selectedOS && (
              <div className="pt-2 flex items-center justify-between border-t border-emerald-200 dark:border-emerald-800/60">
                <span className="text-[11px]">
                  Deseja dar baixa e faturar a <strong>OS #{selectedOS.os_number}</strong> com este pagamento aprovado?
                </span>
                <button
                  type="button"
                  onClick={handleApplyVerificationToOS}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm transition"
                >
                  Confirmar e Faturar OS #{selectedOS.os_number}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Guia Técnico e Arquitetura de Webhook / Backend */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Arquitetura de Notificações Webhook Mercado Pago (Produção)
            </h3>
            <p className="text-xs text-slate-500">
              Exemplo de implementação oficial com SDK Mercado Pago v2 para servidores de retaguarda (Node.js & Python).
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
          <p>
            No GitHub Pages, as notificações instantâneas operam via retorno seguro (<code className="font-mono text-sky-600">back_urls</code>) com confirmação imediata. Caso utilize um backend intermediário (ex: Express, Vercel Serverless, AWS Lambda ou FastAPI), configure o endpoint abaixo:
          </p>
          <pre className="p-3.5 bg-slate-950 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed">
{`// Exemplo Oficial Node.js / Express com SDK mercadopago
const { MercadoPagoConfig, Payment } = require('mercadopago');
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

app.post('/webhook/mercadopago', async (req, res) => {
  const { type, data } = req.body;
  if (type === 'payment' && data?.id) {
    const payment = new Payment(client);
    const paymentData = await payment.get({ id: data.id });
    if (paymentData.status === 'approved') {
      console.log('Pagamento aprovado para:', paymentData.external_reference);
      // Baixa automática da OS no banco de dados
    }
  }
  res.status(200).send('OK');
});`}
          </pre>
        </div>
      </div>

      {/* Histórico Recente de Cobranças vinculadas ao Mercado Pago */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Ordens de Serviço e Vendas Faturadas / Mercado Pago
            </h3>
            <p className="text-xs text-slate-500">
              Acompanhamento de status de cobranças, links e faturamentos
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">
            {ordersWithMP.length} registros
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">OS #</th>
                <th className="py-2.5 px-3">Cliente</th>
                <th className="py-2.5 px-3">Valor</th>
                <th className="py-2.5 px-3">Status OS</th>
                <th className="py-2.5 px-3">Status Pagamento</th>
                <th className="py-2.5 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {ordersWithMP.map(os => {
                const client = clients.find(c => c.id === os.client_id);
                const isPaid = os.mp_payment_status === 'approved' || os.invoiced;
                return (
                  <tr key={os.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-bold font-mono">#{os.os_number}</td>
                    <td className="py-3 px-3">{client?.name || 'Consumidor'}</td>
                    <td className="py-3 px-3 font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(os.total_amount)}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium uppercase ${
                        os.status === 'finalizado' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                      }`}>
                        {os.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Aprovado / Pago
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <Clock className="w-3.5 h-3.5" />
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {os.mp_payment_url ? (
                        <a
                          href={os.mp_payment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sky-600 hover:underline font-semibold"
                        >
                          <span>Checkout</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedOSId(os.id);
                            handleGenerateLink();
                          }}
                          className="text-xs text-sky-600 hover:underline"
                        >
                          Gerar Link
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};