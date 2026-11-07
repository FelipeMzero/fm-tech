import React, { useState } from 'react';
import { useAppStore } from '../../lib/store';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  Database, 
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';

interface LoginScreenProps {
  onSuccess: () => void;
  onOpenSetup: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess, onOpenSetup }) => {
  const { login, issuer, supabaseConfig } = useAppStore();

  const [email, setEmail] = useState<string>(() => {
    const savedCreds = localStorage.getItem('fmtech_admin_credentials');
    if (savedCreds) {
      try {
        const parsed = JSON.parse(savedCreds);
        return parsed.email || 'admin@fmtech.com.br';
      } catch {}
    }
    return 'admin@fmtech.com.br';
  });

  const [password, setPassword] = useState<string>('admin123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Informe seu e-mail e senha.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const result = await login(email, password);
      if (result.success) {
        onSuccess();
      } else {
        setErrorMsg(result.error || 'Credenciais inválidas. Tente novamente.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 md:p-8 font-sans antialiased selection:bg-orange-500 selection:text-white">
      {/* Top Header */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pt-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/25 font-black text-sm tracking-tight">
            FM
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-none">
              {issuer.trade_name || 'FM Tech'}
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Gestão de Assistência Técnica & OS</p>
          </div>
        </div>

        <button
          onClick={onOpenSetup}
          className="text-xs text-slate-400 hover:text-orange-400 flex items-center gap-1.5 transition-colors p-1.5 rounded-lg hover:bg-slate-900 border border-slate-800"
          title="Configurações do Supabase & Setup"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Setup</span>
        </button>
      </div>

      {/* Login Box */}
      <div className="max-w-md w-full mx-auto my-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6 md:p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-orange-950/80 border border-orange-700/50 flex items-center justify-center text-orange-400 mx-auto mb-3 shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Acesse o Sistema</h2>
          <p className="text-xs text-slate-400 mt-1">
            Entre com suas credenciais de administrador ou técnico
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-orange-400" />
              <span>E-mail *</span>
            </label>
            <input
              type="email"
              required
              autoFocus
              placeholder="seu-email@fmtech.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-orange-400" />
              <span>Senha *</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Sua senha de acesso"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 active:scale-[0.98] text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-orange-600/25 transition-all mt-2"
          >
            {loading ? (
              <span>Autenticando...</span>
            ) : (
              <>
                <span>Entrar no FM Tech</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Database Status indicator */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="truncate max-w-[200px]">
              {supabaseConfig.url ? 'Supabase Conectado' : 'Modo Offline'}
            </span>
          </div>

          <button
            onClick={onOpenSetup}
            className="text-orange-400 hover:underline flex items-center gap-1"
          >
            <Database className="w-3 h-3" />
            <span>Configurar Banco</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-md w-full mx-auto text-center text-[11px] text-slate-500 pt-4">
        FM Tech • Autenticação Segura • Baseado em Supabase PostgreSQL
      </div>
    </div>
  );
};
