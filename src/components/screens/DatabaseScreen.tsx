import React, { useState } from 'react';
import { useAppStore } from '../../lib/store';
import {
  Database,
  Copy,
  Check,
  Server,
  Key,
  Shield,
  Layers,
  FileCode,
  RotateCcw,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

export const DatabaseScreen: React.FC = () => {
  const { supabaseConfig, updateSupabaseConfig, resetAllData } = useAppStore();

  const [url, setUrl] = useState(supabaseConfig.url || '');
  const [anonKey, setAnonKey] = useState(supabaseConfig.anonKey || '');
  const [copiedSql, setCopiedSql] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const sqlMigrationSnippet = `-- ============================================================================
-- MAPOS-PF: BANCO DE DADOS POSTGRESQL / SUPABASE
-- Modelagem para Prestador de Serviço Autônomo / Pessoa Física (Emitente CPF)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Dados do Emitente (Pessoa Física / CPF)
CREATE TABLE IF NOT EXISTS public.issuer_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    trade_name TEXT,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    rg TEXT,
    municipal_registration TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    zip_code VARCHAR(9),
    street TEXT,
    number TEXT,
    complement TEXT,
    neighborhood TEXT,
    city TEXT,
    state VARCHAR(2),
    logo_url TEXT,
    signature_url TEXT,
    pix_key_type TEXT CHECK (pix_key_type IN ('CPF', 'Email', 'Telefone', 'Aleatória')),
    pix_key TEXT,
    default_warranty_days INTEGER DEFAULT 90,
    os_footer_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Clientes e Fornecedores
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_type TEXT NOT NULL CHECK (person_type IN ('PF', 'PJ')),
    name TEXT NOT NULL,
    document TEXT NOT NULL, -- CPF ou CNPJ
    rg_ie TEXT,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    email TEXT,
    zip_code VARCHAR(9),
    street TEXT,
    number TEXT,
    complement TEXT,
    neighborhood TEXT,
    city TEXT,
    state VARCHAR(2),
    is_supplier BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Catálogo de Peças / Produtos e Movimentações
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internal_code TEXT,
    barcode TEXT,
    description TEXT NOT NULL,
    unit TEXT DEFAULT 'UN',
    cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    profit_margin NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    sale_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    current_stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 3,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Ordens de Serviço (Tabela Central)
CREATE TABLE IF NOT EXISTS public.service_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    os_number BIGSERIAL UNIQUE,
    public_tracking_token UUID DEFAULT gen_random_uuid() UNIQUE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    technician_name TEXT,
    warranty_term_id UUID,
    status TEXT NOT NULL DEFAULT 'orcamento' CHECK (
        status IN ('orcamento', 'aberto', 'em_andamento', 'aguardando_pecas', 
                   'aguardando_aprovacao', 'aprovado', 'finalizado', 'entregue', 'cancelado')
    ),
    entry_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    estimated_delivery_date TIMESTAMPTZ,
    completion_date TIMESTAMPTZ,
    warranty_until_date DATE,
    equipment_type TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    serial_imei TEXT,
    unlock_password TEXT,
    accessories_left TEXT,
    physical_condition_checklist JSONB DEFAULT '{}'::jsonb,
    reported_defect TEXT NOT NULL,
    technical_report TEXT,
    solution_applied TEXT,
    internal_observations TEXT,
    services_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    products_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_type TEXT DEFAULT 'R$' CHECK (discount_type IN ('R$', '%')),
    discount_value NUMERIC(12, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    invoiced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) e Políticas Públicas para Consulta de OS
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Consulta publica por token em service_orders" 
ON public.service_orders FOR SELECT TO anon USING (public_tracking_token IS NOT NULL);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlMigrationSnippet);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateSupabaseConfig({
      url,
      anonKey,
      connected: Boolean(url && anonKey)
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-600" />
            Etapa 1 & 2: Supabase (PostgreSQL) & Backend Node.js
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Arquitetura do banco de dados, RLS, triggers de estoque, schemas Zod e parâmetros de conexão.
          </p>
        </div>

        <button
          onClick={handleCopySql}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
        >
          {copiedSql ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          {copiedSql ? 'Copiado para Área de Transferência!' : 'Copiar Script SQL Completo'}
        </button>
      </div>

      {/* Cards de Arquitetura */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">12 Tabelas Relacionais</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Emitente CPF, Usuários, Permissões, Clientes, Produtos, Movimentos, Serviços, Termos, Ordens de Serviço,
            Itens, Vendas Balcão, Financeiro e Auditoria.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Row Level Security (RLS)</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Permite consulta pública segura da OS pelo cliente final usando apenas o token UUID sem necessidade de login ou
            exposição dos demais dados.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
            <Server className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Backend Node.js & Zod</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Express/Fastify com TypeScript, validação matemática estrita de CPF/CNPJ, gerador de payload PIX EMV e
            middleware de permissões.
          </p>
        </div>
      </div>

      {/* Formulário de Configuração Supabase */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              Credenciais do Supabase (Opcional - Modo Híbrido com Fallback em Memória)
            </h2>
          </div>

          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              supabaseConfig.connected
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {supabaseConfig.connected ? 'Configurado' : 'Modo Demonstração Local Ativo'}
          </span>
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Supabase Anon / Public Key
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={e => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                if (confirm('Deseja resetar todos os dados para o padrão de demonstração do sistema?')) {
                  resetAllData();
                  alert('Dados restaurados com sucesso.');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Restaurar Dados Padrão (Seed)
            </button>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              Salvar Conexão
            </button>
          </div>
        </form>
      </div>

      {/* Script SQL Pré-visualizado */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-mono font-bold text-slate-200">
              app/supabase/schema.sql (Etapa 1 - Pronto para Execução)
            </span>
          </div>

          <button
            onClick={handleCopySql}
            className="flex items-center gap-1 text-[11px] font-mono text-slate-300 hover:text-white bg-slate-700 px-2 py-1 rounded"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedSql ? 'Copiado!' : 'Copiar'}
          </button>
        </div>

        <div className="p-4 max-h-96 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed">
          <pre>{sqlMigrationSnippet}</pre>
        </div>
      </div>
    </div>
  );
};
