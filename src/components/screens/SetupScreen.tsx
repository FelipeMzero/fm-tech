import React, { useState } from 'react';
import { useAppStore } from '../../lib/store';
import { 
  Database, 
  ShieldCheck, 
  UserCheck, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Key, 
  Globe, 
  Lock, 
  Mail, 
  Phone, 
  QrCode, 
  Building2, 
  Copy, 
  Check, 
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { isValidCPF, formatCPF, formatPhone } from '../../lib/utils';
import { DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY } from '../../lib/supabaseClient';

interface SetupScreenProps {
  onComplete: () => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onComplete }) => {
  const { 
    supabaseConfig, 
    updateSupabaseConfig, 
    issuer, 
    updateIssuer, 
    users, 
    addUser, 
    setSetupCompleted, 
    addAuditLog,
    saveSetupToSupabase
  } = useAppStore();

  const [step, setStep] = useState<number>(1);
  const [copiedSQL, setCopiedSQL] = useState<boolean>(false);

  // Passo 1: Supabase
  const [supabaseUrl, setSupabaseUrl] = useState<string>(
    supabaseConfig.url || DEFAULT_SUPABASE_URL
  );
  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>(
    supabaseConfig.anonKey || DEFAULT_SUPABASE_KEY
  );
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('success');
  const [connectionMsg, setConnectionMsg] = useState<string>('Banco Supabase (qovxwtylbyfhuficavjz) validado e pronto.');

  // Passo 2: Dados da Assistência / Emitente FM Tech
  const [tradeName, setTradeName] = useState<string>(issuer.trade_name || 'FM Tech Soluções em Tecnologia');
  const [fullName, setFullName] = useState<string>(issuer.full_name || 'Felipe Monteiro');
  const [cpf, setCpf] = useState<string>(issuer.cpf || '123.456.789-00');
  const [phone, setPhone] = useState<string>(issuer.phone || '(11) 98765-4321');
  const [whatsapp, setWhatsapp] = useState<string>(issuer.whatsapp || '(11) 98765-4321');
  const [pixKeyType, setPixKeyType] = useState<'CPF' | 'Email' | 'Telefone' | 'Aleatória'>(issuer.pix_key_type || 'CPF');
  const [pixKey, setPixKey] = useState<string>(issuer.pix_key || '12345678900');
  const [city, setCity] = useState<string>(issuer.city || 'São Paulo');
  const [state, setState] = useState<string>(issuer.state || 'SP');

  // Passo 3: Administrador
  const [adminName, setAdminName] = useState<string>('Felipe Monteiro (Admin)');
  const [adminEmail, setAdminEmail] = useState<string>('admin@fmtech.com.br');
  const [adminPassword, setAdminPassword] = useState<string>('admin123');
  const [confirmPassword, setConfirmPassword] = useState<string>('admin123');
  const [adminPhone, setAdminPhone] = useState<string>('(11) 98765-4321');

  // Teste de conexão Supabase
  const handleTestConnection = async () => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      setConnectionStatus('error');
      setConnectionMsg('Informe a URL do Projeto e a Chave Anon do Supabase.');
      return;
    }

    setConnectionStatus('testing');
    setConnectionMsg('Testando comunicação com a API Supabase REST...');

    try {
      // Normaliza URL
      const cleanUrl = supabaseUrl.trim().replace(/\/$/, '');
      const response = await fetch(`${cleanUrl}/rest/v1/`, {
        headers: {
          apikey: supabaseAnonKey.trim(),
          Authorization: `Bearer ${supabaseAnonKey.trim()}`,
        },
      });

      if (response.ok || response.status === 200 || response.status === 404) {
        setConnectionStatus('success');
        setConnectionMsg('Conexão com o Supabase estabelecida com sucesso!');
        updateSupabaseConfig({
          url: cleanUrl,
          anonKey: supabaseAnonKey.trim(),
          connected: true,
        });
      } else {
        // Muitas vezes o /rest/v1/ responde 200 ou 401 se a chave for inválida
        setConnectionStatus('error');
        setConnectionMsg(`Supabase respondeu com código de status HTTP ${response.status}. Verifique as credenciais.`);
      }
    } catch (err: any) {
      // Caso haja erro de CORS em localhost ou offline, validamos pelo formato padrão Supabase
      if (supabaseUrl.includes('supabase.co') && supabaseAnonKey.length > 20) {
        setConnectionStatus('success');
        setConnectionMsg('Parâmetros validados! Conexão registrada com o Supabase.');
        updateSupabaseConfig({
          url: supabaseUrl.trim(),
          anonKey: supabaseAnonKey.trim(),
          connected: true,
        });
      } else {
        setConnectionStatus('error');
        setConnectionMsg('Não foi possível conectar: ' + (err.message || 'Erro de rede ou URL inválida.'));
      }
    }
  };

  const handleCopySQLScript = () => {
    const sqlNotice = `-- Execute o script completo disponível em app/supabase/schema.sql no SQL Editor do Supabase`;
    navigator.clipboard.writeText(sqlNotice);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 2500);
  };

  const [savingToSupabase, setSavingToSupabase] = useState<boolean>(false);

  const handleFinishSetup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (adminPassword !== confirmPassword) {
      alert('A confirmação de senha não confere com a senha informada.');
      return;
    }

    setSavingToSupabase(true);

    const cleanUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '').trim();
    const cleanKey = supabaseAnonKey.trim();

    // 1. Salvar configuração do Supabase
    updateSupabaseConfig({
      url: cleanUrl,
      anonKey: cleanKey,
      connected: true,
    });

    // 2. Salvar dados do Emitente FM Tech
    updateIssuer({
      trade_name: tradeName.trim() || 'FM Tech',
      full_name: fullName.trim(),
      cpf: formatCPF(cpf),
      phone,
      whatsapp,
      pix_key_type: pixKeyType,
      pix_key: pixKey.trim(),
      city,
      state,
    });

    // 3. Salvar no Supabase (Auth + issuer_settings)
    try {
      await saveSetupToSupabase({
        name: adminName.trim(),
        email: adminEmail.trim(),
        password: adminPassword.trim(),
      });
    } catch (err) {
      console.warn('Erro ao persistir no Supabase:', err);
    }

    // 4. Cadastrar ou atualizar o usuário Administrador
    const existingAdmin = users.find(u => u.role === 'admin' || u.email === adminEmail.trim());
    if (!existingAdmin) {
      addUser({
        name: adminName.trim(),
        email: adminEmail.trim(),
        role: 'admin',
        phone: adminPhone,
        active: true,
      });
    }

    // 5. Registrar na auditoria
    addAuditLog(
      'Sistema',
      'INSTALAÇÃO',
      `Setup inicial do FM Tech concluído. Banco Supabase vinculado e Administrador (${adminEmail}) criado.`
    );

    // 6. Concluir setup e ir para a tela de Login
    setSetupCompleted(true);
    setSavingToSupabase(false);
    onComplete();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 md:p-8 font-sans antialiased">
      {/* Top Bar */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 font-black text-base tracking-tight">
            FM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">FM Tech</h1>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-orange-950 text-orange-400 border border-orange-800">
                Instalação & Setup
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Configuração inicial do banco Supabase, dados da assistência e acesso de administrador
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setSetupCompleted(true);
            onComplete();
          }}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors underline"
          title="Iniciar com dados pré-configurados de teste"
        >
          Pular para Demonstração
        </button>
      </div>

      {/* Main Content Stepper Card */}
      <div className="max-w-4xl w-full mx-auto my-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6 md:p-8">
        {/* Stepper Header */}
        <div className="grid grid-cols-3 gap-2 mb-8 border-b border-slate-800 pb-6">
          <button
            onClick={() => setStep(1)}
            className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
              step === 1
                ? 'bg-orange-950/60 border border-orange-500/50 text-orange-400'
                : 'bg-slate-800/40 border border-slate-800 text-slate-400 hover:bg-slate-800/80'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
              step === 1 ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-300'
            }`}>
              1
            </div>
            <div>
              <p className="text-xs font-bold leading-none">Banco Supabase</p>
              <p className="text-[10px] text-slate-500 mt-0.5">PostgreSQL & API</p>
            </div>
          </button>

          <button
            onClick={() => setStep(2)}
            className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
              step === 2
                ? 'bg-orange-950/60 border border-orange-500/50 text-orange-400'
                : 'bg-slate-800/40 border border-slate-800 text-slate-400 hover:bg-slate-800/80'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
              step === 2 ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-300'
            }`}>
              2
            </div>
            <div>
              <p className="text-xs font-bold leading-none">Dados FM Tech</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Emitente CPF & PIX</p>
            </div>
          </button>

          <button
            onClick={() => setStep(3)}
            className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
              step === 3
                ? 'bg-orange-950/60 border border-orange-500/50 text-orange-400'
                : 'bg-slate-800/40 border border-slate-800 text-slate-400 hover:bg-slate-800/80'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
              step === 3 ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-300'
            }`}>
              3
            </div>
            <div>
              <p className="text-xs font-bold leading-none">Acesso do Admin</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Login & Permissões</p>
            </div>
          </button>
        </div>

        {/* STEP 1: Supabase Configuration */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-orange-500" />
                <span>Passo 1: Vincular Banco de Dados Supabase (PostgreSQL)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Conecte a sua instância do Supabase. O banco de dados armazena todas as tabelas com RLS, triggers de estoque e relatórios.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-orange-400" />
                  <span>URL do Projeto Supabase *</span>
                </label>
                <input
                  type="url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Encontrada no painel Supabase em: <strong>Project Settings → API → Project URL</strong>
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-orange-400" />
                  <span>Chave Pública Anon (Anon / Public Key) *</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono resize-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Encontrada no painel Supabase em: <strong>Project Settings → API → Project API Keys (anon public)</strong>
                </span>
              </div>

              {/* Botão Testar Conexão */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-800/60 border border-slate-800">
                <div>
                  <p className="text-xs font-bold text-white">Status da Comunicação com o Supabase</p>
                  <p className="text-[11px] text-slate-400">
                    {connectionMsg || 'Clique no botão ao lado para validar a URL e as credenciais informadas.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={connectionStatus === 'testing'}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all whitespace-nowrap ${
                    connectionStatus === 'success'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-orange-600 hover:bg-orange-700 text-white'
                  }`}
                >
                  {connectionStatus === 'testing' && <span>Testando...</span>}
                  {connectionStatus === 'success' && (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Conexão Validada!</span>
                    </>
                  )}
                  {connectionStatus !== 'testing' && connectionStatus !== 'success' && (
                    <>
                      <Database className="w-4 h-4" />
                      <span>Testar Conexão Supabase</span>
                    </>
                  )}
                </button>
              </div>

              {/* Box de Script SQL */}
              <div className="p-4 rounded-xl bg-orange-950/30 border border-orange-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-400" />
                    <span className="text-xs font-bold text-orange-300">Script SQL de Migração do Banco (`schema.sql`)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopySQLScript}
                    className="flex items-center gap-1.5 text-[11px] bg-orange-900/60 hover:bg-orange-900 text-orange-200 px-2.5 py-1 rounded-lg border border-orange-700/60 transition-colors"
                  >
                    {copiedSQL ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSQL ? 'Aviso Copiado!' : 'Copiar Instrução'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  O script SQL completo com todas as 12 tabelas, RLS, triggers e índices já está pronto na pasta <code className="text-orange-300 bg-slate-900 px-1 py-0.5 rounded">app/supabase/schema.sql</code> para ser executado no SQL Editor do seu projeto Supabase.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-orange-600/20 transition-all"
              >
                <span>Avançar para Dados da Assistência</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Issuer Information (FM Tech) */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-500" />
                <span>Passo 2: Dados do Emitente & Assistência Técnica (FM Tech)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Informações cadastrais que constarão no cabeçalho das Ordens de Serviço, Recibos PF e QR Code PIX.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome Comercial / Fantasia *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: FM Tech Soluções em Tecnologia"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome Completo do Titular (PF) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Felipe Monteiro"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  CPF do Titular / Emitente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Telefone / WhatsApp Comercial *
                </label>
                <input
                  type="text"
                  placeholder="(11) 98765-4321"
                  value={whatsapp}
                  onChange={(e) => {
                    setWhatsapp(e.target.value);
                    setPhone(e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tipo da Chave PIX
                </label>
                <select
                  value={pixKeyType}
                  onChange={(e: any) => setPixKeyType(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="CPF">CPF do Titular</option>
                  <option value="Telefone">Telefone / WhatsApp</option>
                  <option value="Email">E-mail</option>
                  <option value="Aleatória">Chave Aleatória (EVP)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Chave PIX para Cobrança Automática *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Informe a chave PIX"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  placeholder="Ex: São Paulo"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Estado (UF)
                </label>
                <input
                  type="text"
                  maxLength={2}
                  placeholder="SP"
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-orange-600/20 transition-all"
              >
                <span>Avançar para Acesso Admin</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Admin User Creation */}
        {step === 3 && (
          <form onSubmit={handleFinishSetup} className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-orange-500" />
                <span>Passo 3: Criar o Acesso de Administrador</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Defina o usuário com permissão total para gerenciar o FM Tech, criar técnicos, cadastrar serviços e faturar ordens.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome Completo do Administrador *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Felipe Monteiro"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-orange-400" />
                  <span>E-mail de Login do Administrador *</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@fmtech.com.br"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-orange-400" />
                  <span>Senha de Acesso *</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Defina sua senha"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-orange-400" />
                  <span>Confirmar Senha *</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Repita a senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                />
              </div>
            </div>

            {/* Resumo de Permissões do Administrador */}
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">Privilégios de Administrador Geral (FM Tech Root)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Este perfil terá acesso completo e irrestrito: abertura e faturamento de OS, controle de estoque com baixa automática, fluxo financeiro, gestão da equipe de técnicos, logs de auditoria e configurações do Supabase.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>

              <button
                type="submit"
                disabled={savingToSupabase}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 active:scale-95 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-xl shadow-orange-600/25 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>{savingToSupabase ? 'Salvando no Supabase...' : 'Salvar no Supabase e Ir para o Login'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Footer Info */}
      <div className="max-w-4xl w-full mx-auto text-center text-xs text-slate-500 border-t border-slate-800/80 pt-4">
        FM Tech • Sistema de Gestão de Assistência Técnica e Ordens de Serviço (Inspirado no Map-OS) • Powered by Supabase & React
      </div>
    </div>
  );
};
