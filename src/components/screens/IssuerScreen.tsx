import React, { useState } from 'react';
import { useAppStore } from '../../lib/store';
import { PixKeyType } from '../../lib/types';
import {
  formatCPF,
  isValidCPF,
  formatPhone,
  formatCEP,
  fetchAddressByCep
} from '../../lib/utils';
import {
  UserCheck,
  Building,
  Save,
  CheckCircle2,
  AlertCircle,
  MapPin,
  QrCode,
  Image,
  FileCheck,
  ShieldAlert,
  Loader2
} from 'lucide-react';

export const IssuerScreen: React.FC = () => {
  const { issuer, updateIssuer } = useAppStore();

  const [fullName, setFullName] = useState(issuer.full_name);
  const [tradeName, setTradeName] = useState(issuer.trade_name || '');
  const [cpf, setCpf] = useState(issuer.cpf);
  const [rg, setRg] = useState(issuer.rg || '');
  const [municipalReg, setMunicipalReg] = useState(issuer.municipal_registration || '');
  const [phone, setPhone] = useState(issuer.phone);
  const [whatsapp, setWhatsapp] = useState(issuer.whatsapp);
  const [email, setEmail] = useState(issuer.email);

  // Endereço
  const [zipCode, setZipCode] = useState(issuer.zip_code);
  const [street, setStreet] = useState(issuer.street);
  const [number, setNumber] = useState(issuer.number);
  const [complement, setComplement] = useState(issuer.complement || '');
  const [neighborhood, setNeighborhood] = useState(issuer.neighborhood);
  const [city, setCity] = useState(issuer.city);
  const [state, setState] = useState(issuer.state);

  // PIX e Garantia
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>(issuer.pix_key_type || 'CPF');
  const [pixKey, setPixKey] = useState(issuer.pix_key);
  const [defaultWarrantyDays, setDefaultWarrantyDays] = useState<number>(issuer.default_warranty_days || 90);
  const [osFooterNotes, setOsFooterNotes] = useState(issuer.os_footer_notes || '');

  // Logotipo e Assinatura
  const [logoUrl, setLogoUrl] = useState(issuer.logo_url || '');
  const [signatureUrl, setSignatureUrl] = useState(issuer.signature_url || '');

  // Estados de apoio
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Validação matemática do CPF
  const isCpfValid = isValidCPF(cpf);

  const handleCpfChange = (val: string) => {
    setCpf(formatCPF(val));
  };

  const handlePhoneChange = (val: string) => {
    setPhone(formatPhone(val));
  };

  const handleWhatsappChange = (val: string) => {
    setWhatsapp(formatPhone(val));
  };

  const handleCepChange = async (val: string) => {
    const formatted = formatCEP(val);
    setZipCode(formatted);

    const clean = formatted.replace(/\D/g, '');
    if (clean.length === 8) {
      setIsLoadingCep(true);
      const addr = await fetchAddressByCep(clean);
      setIsLoadingCep(false);
      if (addr) {
        setStreet(addr.street || '');
        setNeighborhood(addr.neighborhood || '');
        setCity(addr.city || '');
        setState(addr.state || '');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'signature') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'logo') {
          setLogoUrl(reader.result as string);
        } else {
          setSignatureUrl(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !cpf.trim()) {
      alert('Nome Completo e CPF são campos obrigatórios para o emitente.');
      return;
    }

    if (!isCpfValid) {
      if (!confirm('O CPF informado parece inválido segundo o algoritmo de dígitos verificadores. Deseja salvar mesmo assim?')) {
        return;
      }
    }

    updateIssuer({
      full_name: fullName,
      trade_name: tradeName,
      cpf,
      rg,
      municipal_registration: municipalReg,
      phone,
      whatsapp,
      email,
      zip_code: zipCode,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      pix_key_type: pixKeyType,
      pix_key: pixKey,
      default_warranty_days: Number(defaultWarrantyDays) || 90,
      os_footer_notes: osFooterNotes,
      logo_url: logoUrl,
      signature_url: signatureUrl
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-blue-600" />
              Configurações do Emitente (Pessoa Física / CPF)
            </h1>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Diferencial Central
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure os dados do prestador de serviço autônomo. O CPF é o documento fiscal oficial que aparecerá nos cabeçalhos de OS, recibos e QR Code PIX.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 text-xs font-semibold animate-pulse">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Dados do Emitente Salvos com Sucesso!
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Bloco 1: Identificação do Profissional Autônomo */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              1. Identificação Fiscal do Técnico (Pessoa Física)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Nome Completo do Técnico *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Ex: Carlos Silva Santos"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Nome Comercial / Fantasia (Opcional)
              </label>
              <input
                type="text"
                value={tradeName}
                onChange={e => setTradeName(e.target.value)}
                placeholder="Ex: Silva Tech Informática"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400">
                  CPF do Emitente *
                </label>
                {cpf && (
                  <span
                    className={`text-[10px] font-bold flex items-center gap-0.5 ${
                      isCpfValid ? 'text-emerald-600' : 'text-red-500'
                    }`}
                  >
                    {isCpfValid ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> CPF Válido
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3" /> CPF Inválido
                      </>
                    )}
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                maxLength={14}
                value={cpf}
                onChange={e => handleCpfChange(e.target.value)}
                placeholder="000.000.000-00"
                className={`w-full px-3 py-2 text-xs rounded-lg border font-mono font-bold text-slate-900 dark:text-white ${
                  cpf && !isCpfValid
                    ? 'border-red-400 bg-red-50/40 dark:bg-red-950/20'
                    : 'border-blue-300 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/30'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                RG (Opcional)
              </label>
              <input
                type="text"
                value={rg}
                onChange={e => setRg(e.target.value)}
                placeholder="Ex: 12.345.678-9"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Inscrição Municipal (CCM)
              </label>
              <input
                type="text"
                value={municipalReg}
                onChange={e => setMunicipalReg(e.target.value)}
                placeholder="Opcional para autônomos"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Telefone Principal
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => handlePhoneChange(e.target.value)}
                placeholder="(00) 0000-0000"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                WhatsApp Comercial (Atendimento OS)
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={e => handleWhatsappChange(e.target.value)}
                placeholder="(00) 90000-0000"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                E-mail de Contato
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tecnico@email.com"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Bloco 2: Endereço do Estabelecimento / Oficina */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <MapPin className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              2. Endereço da Assistência Técnica (ViaCEP Automático)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">CEP</label>
                {isLoadingCep && (
                  <span className="text-[10px] text-blue-600 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Buscando...
                  </span>
                )}
              </div>
              <input
                type="text"
                maxLength={9}
                value={zipCode}
                onChange={e => handleCepChange(e.target.value)}
                placeholder="00000-000"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Logradouro / Rua</label>
              <input
                type="text"
                value={street}
                onChange={e => setStreet(e.target.value)}
                placeholder="Avenida, Rua, Travessa..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Número</label>
              <input
                type="text"
                value={number}
                onChange={e => setNumber(e.target.value)}
                placeholder="123"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Complemento</label>
              <input
                type="text"
                value={complement}
                onChange={e => setComplement(e.target.value)}
                placeholder="Sala, Apto, Galpão..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Bairro</label>
              <input
                type="text"
                value={neighborhood}
                onChange={e => setNeighborhood(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Cidade</label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">UF</label>
                <input
                  type="text"
                  maxLength={2}
                  value={state}
                  onChange={e => setState(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-center font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bloco 3: Cobrança PIX e Garantias */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <QrCode className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              3. Chave PIX do Emitente (Para Geração Automática de QR Code nas OS)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Tipo da Chave PIX
              </label>
              <select
                value={pixKeyType}
                onChange={e => setPixKeyType(e.target.value as PixKeyType)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="CPF">CPF (Recomendado)</option>
                <option value="Email">E-mail</option>
                <option value="Telefone">Telefone Celular</option>
                <option value="Aleatória">Chave Aleatória (EVP)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Chave PIX Cadastrada *
              </label>
              <input
                type="text"
                required
                value={pixKey}
                onChange={e => setPixKey(e.target.value)}
                placeholder="Digite a chave cadastrada no seu banco..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Garantia Padrão (dias)
              </label>
              <input
                type="number"
                min="0"
                value={defaultWarrantyDays}
                onChange={e => setDefaultWarrantyDays(parseInt(e.target.value) || 90)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Observações de Rodapé Impressas na OS
              </label>
              <textarea
                rows={2}
                value={osFooterNotes}
                onChange={e => setOsFooterNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Bloco 4: Logotipo e Assinatura Digital */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Image className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              4. Logotipo e Assinatura Digital (Supabase Storage)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Logotipo da Assistência
              </label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Image className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleFileUpload(e, 'logo')}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-950 dark:file:text-blue-300 hover:file:bg-blue-100"
                  />
                  <p className="text-[10px] text-slate-400">Recomendado: PNG transparente 400x400</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Assinatura Digital do Técnico
              </label>
              <div className="flex items-center gap-4">
                <div className="w-36 h-24 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                  {signatureUrl ? (
                    <img src={signatureUrl} alt="Assinatura" className="w-full h-full object-contain" />
                  ) : (
                    <FileCheck className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleFileUpload(e, 'signature')}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-950 dark:file:text-blue-300 hover:file:bg-blue-100"
                  />
                  <p className="text-[10px] text-slate-400">Assinatura digitalizada em fundo branco ou PNG</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botão de Gravação */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02]"
          >
            <Save className="w-4 h-4" />
            Salvar Dados do Emitente PF
          </button>
        </div>
      </form>
    </div>
  );
};
