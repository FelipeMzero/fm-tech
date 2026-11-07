import React, { useState } from 'react';
import { 
  ServiceOrder, 
  OSStatus, 
  OSType,
  DigitalServiceDetails,
  DiscountType, 
  OSServiceItem, 
  OSProductItem, 
  OSLicenseItem,
  DigitalLicense,
  OSAttachment 
} from '../../lib/types';
import { useAppStore } from '../../lib/store';
import { 
  formatCurrency, 
  fetchAddressByCep, 
  fetchCnpjData,
  isValidCPF, 
  isValidCNPJ, 
  formatCPF, 
  formatCNPJ,
  formatPhone,
  formatCEP
} from '../../lib/utils';
import { 
  X, 
  Save, 
  Plus, 
  Trash2, 
  Wrench, 
  Package, 
  Camera, 
  Clock, 
  UserPlus, 
  CheckSquare, 
  ShieldCheck, 
  FileText,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Copy,
  Check,
  Layers,
  Laptop
} from 'lucide-react';

interface OSFormModalProps {
  osToEdit?: ServiceOrder | null;
  onClose: () => void;
  onSaved: (savedOS: ServiceOrder) => void;
}

export const OSFormModal: React.FC<OSFormModalProps> = ({ osToEdit, onClose, onSaved }) => {
  const { 
    clients, 
    addClient, 
    products, 
    licenses,
    services, 
    warrantyTerms, 
    addServiceOrder, 
    updateServiceOrder, 
    issuer,
    users 
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'geral' | 'laudos' | 'servicos' | 'produtos' | 'licencas' | 'anexos' | 'totais'>('geral');

  // Tipo de Atendimento / OS
  const [osType, setOsType] = useState<OSType>(osToEdit?.os_type || 'manutencao');

  // Dados específicos de Licença Digital
  const [digitalDetails, setDigitalDetails] = useState<DigitalServiceDetails>({
    product_name: osToEdit?.digital_service_details?.product_name || '',
    license_id: osToEdit?.digital_service_details?.license_id || '',
    license_key: osToEdit?.digital_service_details?.license_key || '',
    customer_email: osToEdit?.digital_service_details?.customer_email || '',
    target_device: osToEdit?.digital_service_details?.target_device || '',
    delivery_method: osToEdit?.digital_service_details?.delivery_method || 'whatsapp',
    activation_instructions: osToEdit?.digital_service_details?.activation_instructions || '',
  });

  // Dados do formulário da OS
  const [clientId, setClientId] = useState<string>(osToEdit?.client_id || (clients[0]?.id || ''));
  const [status, setStatus] = useState<OSStatus>(osToEdit?.status || 'orcamento');
  const [technicianName, setTechnicianName] = useState<string>(
    osToEdit?.technician_name || (users.find(u => u.role === 'tecnico')?.name || issuer.full_name)
  );
  const [warrantyTermId, setWarrantyTermId] = useState<string>(osToEdit?.warranty_term_id || warrantyTerms[0]?.id || '');
  const [equipmentType, setEquipmentType] = useState<string>(osToEdit?.equipment_type || 'Notebook');
  const [brand, setBrand] = useState<string>(osToEdit?.brand || '');
  const [model, setModel] = useState<string>(osToEdit?.model || '');
  const [serialImei, setSerialImei] = useState<string>(osToEdit?.serial_imei || '');
  const [unlockPassword, setUnlockPassword] = useState<string>(osToEdit?.unlock_password || '');
  const [accessoriesLeft, setAccessoriesLeft] = useState<string>(osToEdit?.accessories_left || '');
  
  // Checklist de Condições Físicas
  const [checklist, setChecklist] = useState({
    riscos: osToEdit?.physical_condition_checklist?.riscos || false,
    trincos: osToEdit?.physical_condition_checklist?.trincos || false,
    parafusos_faltando: osToEdit?.physical_condition_checklist?.parafusos_faltando || false,
    molhado: osToEdit?.physical_condition_checklist?.molhado || false,
    nao_liga: osToEdit?.physical_condition_checklist?.nao_liga || false,
    marcas_queda: osToEdit?.physical_condition_checklist?.marcas_queda || false,
    outros_detalhes: osToEdit?.physical_condition_checklist?.outros_detalhes || '',
  });

  // Laudos
  const [reportedDefect, setReportedDefect] = useState<string>(osToEdit?.reported_defect || '');
  const [technicalReport, setTechnicalReport] = useState<string>(osToEdit?.technical_report || '');
  const [solutionApplied, setSolutionApplied] = useState<string>(osToEdit?.solution_applied || '');
  const [internalObservations, setInternalObservations] = useState<string>(osToEdit?.internal_observations || '');

  // Prazos
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState<string>(
    osToEdit?.estimated_delivery_date ? osToEdit.estimated_delivery_date.split('T')[0] : ''
  );

  // Serviços, Peças e Licenças Digitais
  const [osServices, setOsServices] = useState<OSServiceItem[]>(osToEdit?.services || []);
  const [osProducts, setOsProducts] = useState<OSProductItem[]>(osToEdit?.products || []);
  const [osLicenses, setOsLicenses] = useState<OSLicenseItem[]>(osToEdit?.licenses || []);

  // Seleção e adição de Licenças
  const [selectedLicenseId, setSelectedLicenseId] = useState<string>('');
  const [isCustomLicenseOpen, setIsCustomLicenseOpen] = useState<boolean>(false);
  const [customLicenseName, setCustomLicenseName] = useState<string>('');
  const [customLicenseKey, setCustomLicenseKey] = useState<string>('');
  const [customLicensePrice, setCustomLicensePrice] = useState<number>(0);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Descontos
  const [discountType, setDiscountType] = useState<DiscountType>(osToEdit?.discount_type || 'R$');
  const [discountValue, setDiscountValue] = useState<number>(osToEdit?.discount_value || 0);

  // Anexos de fotos
  const [attachments, setAttachments] = useState<OSAttachment[]>(osToEdit?.attachments || []);
  const [newPhotoUrl, setNewPhotoUrl] = useState<string>('');
  const [newPhotoCaption, setNewPhotoCaption] = useState<string>('');

  // Modal para cadastrar cliente na hora (Rápido)
  const [showNewClientModal, setShowNewClientModal] = useState<boolean>(false);
  const [newClientName, setNewClientName] = useState<string>('');
  const [newClientDoc, setNewClientDoc] = useState<string>('');
  const [newClientPhone, setNewClientPhone] = useState<string>('');
  const [newClientCep, setNewClientCep] = useState<string>('');
  const [newClientStreet, setNewClientStreet] = useState<string>('');
  const [newClientNumber, setNewClientNumber] = useState<string>('');
  const [newClientCity, setNewClientCity] = useState<string>('');
  const [newClientState, setNewClientState] = useState<string>('');
  const [isSearchingCnpj, setIsSearchingCnpj] = useState<boolean>(false);
  const [cnpjMsg, setCnpjMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Itens para adicionar
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Cálculo de Subtotais
  const servicesTotal = osServices.reduce((sum, s) => sum + s.subtotal, 0);
  const productsTotal = osProducts.reduce((sum, p) => sum + p.subtotal, 0);
  const licensesTotal = osLicenses.reduce((sum, l) => sum + (Number(l.unit_price) || 0), 0);
  const grossTotal = servicesTotal + productsTotal + licensesTotal;

  const discountAmount = discountType === '%' 
    ? (grossTotal * discountValue) / 100 
    : discountValue;

  const totalAmount = Math.max(0, grossTotal - discountAmount);

  // Adicionar Serviço
  const handleAddService = () => {
    const serv = services.find(s => s.id === selectedServiceId);
    if (!serv) return;

    const newItem: OSServiceItem = {
      id: 'oss-' + Date.now(),
      service_order_id: osToEdit?.id || '',
      service_id: serv.id,
      name: serv.name,
      quantity: 1,
      unit_price: serv.base_price,
      subtotal: serv.base_price,
    };
    setOsServices([...osServices, newItem]);
    setSelectedServiceId('');
  };

  const handleRemoveService = (id: string) => {
    setOsServices(osServices.filter(s => s.id !== id));
  };

  // Adicionar Produto
  const handleAddProduct = () => {
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const newItem: OSProductItem = {
      id: 'osp-' + Date.now(),
      service_order_id: osToEdit?.id || '',
      product_id: prod.id,
      name: prod.description,
      quantity: 1,
      unit_price: prod.sale_price,
      subtotal: prod.sale_price,
      stock_deducted: false,
    };
    setOsProducts([...osProducts, newItem]);
    setSelectedProductId('');
  };

  const handleRemoveProduct = (id: string) => {
    setOsProducts(osProducts.filter(p => p.id !== id));
  };

  // Adicionar Licença do Estoque
  const handleAddLicenseFromStock = () => {
    const found = licenses.find(l => l.id === selectedLicenseId);
    if (!found) return;

    if (osLicenses.some(item => item.license_id === found.id)) {
      alert('Esta licença já foi adicionada a esta Ordem de Serviço.');
      return;
    }

    const newItem: OSLicenseItem = {
      id: 'oslic-' + Date.now(),
      service_order_id: osToEdit?.id || '',
      license_id: found.id,
      name: found.name,
      category: found.category,
      license_key: found.license_key,
      unit_price: found.sale_price,
    };
    setOsLicenses([...osLicenses, newItem]);
    setSelectedLicenseId('');
  };

  // Adicionar Licença Avulsa / Customizada
  const handleAddCustomLicense = () => {
    if (!customLicenseName || !customLicenseKey) {
      alert('Preencha o nome do produto digital e a chave serial.');
      return;
    }
    const newItem: OSLicenseItem = {
      id: 'oslic-' + Date.now(),
      service_order_id: osToEdit?.id || '',
      name: customLicenseName,
      license_key: customLicenseKey.trim().toUpperCase(),
      unit_price: Number(customLicensePrice) || 0,
    };
    setOsLicenses([...osLicenses, newItem]);
    setCustomLicenseName('');
    setCustomLicenseKey('');
    setCustomLicensePrice(0);
    setIsCustomLicenseOpen(false);
  };

  const handleRemoveLicense = (id: string) => {
    setOsLicenses(osLicenses.filter(l => l.id !== id));
  };

  const handleCopyKey = (id: string, key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  // Adicionar Foto
  const handleAddAttachment = () => {
    if (!newPhotoUrl) return;
    const newAtt: OSAttachment = {
      id: 'att-' + Date.now(),
      service_order_id: osToEdit?.id || '',
      file_url: newPhotoUrl,
      file_name: 'foto_' + Date.now() + '.jpg',
      caption: newPhotoCaption || 'Evidência fotográfica',
      created_at: new Date().toISOString(),
    };
    setAttachments([...attachments, newAtt]);
    setNewPhotoUrl('');
    setNewPhotoCaption('');
  };

  // Busca rápida de CEP no modal de cliente
  const handleCepSearch = async (cep: string) => {
    setNewClientCep(cep);
    if (cep.replace(/\D/g, '').length === 8) {
      const res = await fetchAddressByCep(cep);
      if (res && !res.error) {
        setNewClientStreet(res.street);
        setNewClientCity(res.city);
        setNewClientState(res.state);
      }
    }
  };

  // Consulta automática de CNPJ no modal rápido
  const handleQuickCnpjLookup = async () => {
    const clean = newClientDoc.replace(/\D/g, '');
    if (clean.length !== 14) {
      setCnpjMsg({ type: 'error', text: 'Informe os 14 dígitos do CNPJ para buscar.' });
      return;
    }

    setIsSearchingCnpj(true);
    setCnpjMsg(null);

    try {
      const res = await fetchCnpjData(clean);
      if (!res || res.error) {
        setCnpjMsg({ type: 'error', text: res?.message || 'CNPJ não encontrado na Receita Federal.' });
      } else {
        const companyName = res.razao_social + (res.nome_fantasia ? ` (${res.nome_fantasia})` : '');
        setNewClientName(companyName);
        if (res.phone) setNewClientPhone(res.phone);
        if (res.cep) setNewClientCep(formatCEP(res.cep));
        if (res.street) setNewClientStreet(res.street);
        if (res.number) setNewClientNumber(res.number);
        if (res.city) setNewClientCity(res.city);
        if (res.state) setNewClientState(res.state);
        setNewClientDoc(formatCNPJ(clean));
        setCnpjMsg({ type: 'success', text: `Dados de "${res.razao_social}" carregados com sucesso!` });
      }
    } catch {
      setCnpjMsg({ type: 'error', text: 'Falha de comunicação ao buscar CNPJ.' });
    } finally {
      setIsSearchingCnpj(false);
    }
  };

  // Salvar Novo Cliente Rápido
  const handleSaveQuickClient = () => {
    if (!newClientName || !newClientDoc) {
      alert('Preencha ao menos o Nome e CPF/CNPJ do cliente.');
      return;
    }
    const cleanDoc = newClientDoc.replace(/\D/g, '');
    const isPF = cleanDoc.length <= 11;

    const created = addClient({
      name: newClientName,
      document: newClientDoc,
      person_type: isPF ? 'PF' : 'PJ',
      phone: newClientPhone,
      whatsapp: newClientPhone,
      zip_code: newClientCep,
      street: newClientStreet,
      number: newClientNumber,
      city: newClientCity,
      state: newClientState,
      is_supplier: false,
    });

    setClientId(created.id);
    setShowNewClientModal(false);
  };

  // Salvar OS
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      alert('Por favor selecione ou cadastre um cliente.');
      return;
    }
    const isDigitalOnly = osType === 'licenca_digital';
    const finalEquipment = isDigitalOnly 
      ? (digitalDetails.target_device || digitalDetails.product_name || 'Licença Digital')
      : equipmentType;
    const finalDefect = isDigitalOnly
      ? (reportedDefect || `Ativação e Entrega: ${digitalDetails.product_name || 'Produto Digital'}`)
      : reportedDefect;

    if (!isDigitalOnly && !reportedDefect) {
      alert('Por favor informe o defeito relatado pelo cliente.');
      return;
    }

    const payload: Partial<ServiceOrder> = {
      client_id: clientId,
      status,
      os_type: osType,
      digital_service_details: digitalDetails,
      technician_name: technicianName,
      warranty_term_id: warrantyTermId,
      equipment_type: finalEquipment,
      brand: isDigitalOnly ? (digitalDetails.product_name || 'Digital') : brand,
      model: isDigitalOnly ? 'Digital Key' : model,
      serial_imei: isDigitalOnly ? (digitalDetails.license_key || '') : serialImei,
      unlock_password: unlockPassword,
      accessories_left: accessoriesLeft,
      physical_condition_checklist: isDigitalOnly ? {} : checklist,
      reported_defect: finalDefect,
      technical_report: technicalReport,
      solution_applied: solutionApplied,
      internal_observations: internalObservations,
      estimated_delivery_date: estimatedDeliveryDate || undefined,
      services: osServices,
      products: osProducts,
      licenses: osLicenses,
      attachments,
      services_total: servicesTotal,
      products_total: productsTotal,
      licenses_total: licensesTotal,
      discount_type: discountType,
      discount_value: discountValue,
      total_amount: totalAmount,
    };

    let result: ServiceOrder;
    if (osToEdit) {
      updateServiceOrder(osToEdit.id, payload);
      result = { ...osToEdit, ...payload } as ServiceOrder;
    } else {
      result = addServiceOrder(payload);
    }

    onSaved(result);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {osToEdit ? `Editar Ordem de Serviço #${osToEdit.os_number}` : 'Nova Ordem de Serviço'}
              </h2>
              <span className="text-[11px] text-slate-500">
                Emitente: {issuer.full_name} • CPF: {issuer.cpf}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 gap-2 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold overflow-x-auto">
          {(osType === 'licenca_digital'
            ? [
                { id: 'geral', label: '1. Cliente & Licença Digital' },
                { id: 'laudos', label: '2. Requisitos & Procedimento' },
                { id: 'licencas', label: `3. Chaves & Licenças (${osLicenses.length})` },
                { id: 'servicos', label: `4. Serviços de Instalação (${osServices.length})` },
                { id: 'totais', label: `5. Valores & Pagamento (${formatCurrency(totalAmount)})` },
              ]
            : [
                { id: 'geral', label: osType === 'hibrido' ? '1. Equipamento & Licença' : '1. Cliente & Equipamento' },
                { id: 'laudos', label: '2. Defeito & Diagnóstico' },
                { id: 'servicos', label: `3. Serviços (${osServices.length})` },
                { id: 'produtos', label: `4. Peças (${osProducts.length})` },
                { id: 'licencas', label: `5. Licenças Digitais (${osLicenses.length})` },
                { id: 'anexos', label: `6. Fotos (${attachments.length})` },
                { id: 'totais', label: `7. Valores (${formatCurrency(totalAmount)})` },
              ]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Corpo do Formulário */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* ABA 1: CLIENTE E EQUIPAMENTO / LICENÇA */}
          {activeTab === 'geral' && (
            <div className="space-y-4">
              {/* SELETOR DE TIPO DE ORDEM DE SERVIÇO */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Tipo de Atendimento / Serviço *
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOsType('manutencao');
                      if (equipmentType === 'Licença Digital') setEquipmentType('Notebook');
                    }}
                    className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      osType === 'manutencao'
                        ? 'bg-blue-50/80 border-blue-500 text-blue-950 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-500 shadow-sm ring-1 ring-blue-500'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Wrench className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-xs block">Manutenção Física</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight block">
                        Notebook, PC, Celular, peças e bancada
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOsType('licenca_digital');
                      setEquipmentType(digitalDetails.target_device || digitalDetails.product_name || 'Licença Digital');
                    }}
                    className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      osType === 'licenca_digital'
                        ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <KeyRound className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-xs block">Licença Digital & Software</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight block">
                        Windows, Office, Antivírus e ativações
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOsType('hibrido')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      osType === 'hibrido'
                        ? 'bg-purple-50/80 border-purple-500 text-purple-950 dark:bg-purple-950/60 dark:text-purple-200 dark:border-purple-500 shadow-sm ring-1 ring-purple-500'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-xs block">Híbrido (Reparo + Licença)</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight block">
                        Manutenção física com licença inclusa
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Seleção de Cliente */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Cliente Selecionado *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewClientModal(true)}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Cadastrar Novo Cliente</span>
                  </button>
                </div>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um cliente...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {formatCPF(c.document)} ({c.phone || c.whatsapp})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status, Técnico e Termo de Garantia */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Status da Ordem de Serviço
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as OSStatus)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-orange-700 dark:text-orange-300"
                  >
                    <option value="orcamento">Orçamento Inicial</option>
                    <option value="aberto">Aberto / Na Fila</option>
                    <option value="em_andamento">Em Andamento / Bancada</option>
                    <option value="aguardando_pecas">Aguardando Peças</option>
                    <option value="aguardando_aprovacao">Aguardando Aprovação do Cliente</option>
                    <option value="aprovado">Aprovado pelo Cliente</option>
                    <option value="finalizado">Finalizado / Pronto para Retirada</option>
                    <option value="entregue">Entregue ao Cliente</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Técnico Responsável (Map-OS)
                  </label>
                  <select
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-800 dark:text-slate-200"
                  >
                    <option value={issuer.full_name}>{issuer.full_name} (Titular PF)</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name} ({u.role.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Termo de Garantia Aplicado
                  </label>
                  <select
                    value={warrantyTermId}
                    onChange={(e) => setWarrantyTermId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    {warrantyTerms.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.title} ({w.days_duration} dias)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* PAINEL DE LICENÇA DIGITAL (Exibido para Licença Digital e Híbrido) */}
              {(osType === 'licenca_digital' || osType === 'hibrido') && (
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase">
                        Dados do Produto Digital & Licença
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-600 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded font-semibold">
                      Chave de Ativação / Software
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Puxar do Estoque Digital (Auto-preenche Chave e Valor)
                      </label>
                      <select
                        value={digitalDetails.license_id || ''}
                        onChange={(e) => {
                          const licId = e.target.value;
                          const found = licenses.find(l => l.id === licId);
                          if (found) {
                            setDigitalDetails(prev => ({
                              ...prev,
                              license_id: found.id,
                              product_name: found.name,
                              license_key: found.license_key,
                              activation_instructions: found.notes || '',
                            }));
                            if (!osLicenses.some(item => item.license_id === found.id)) {
                              setOsLicenses([
                                ...osLicenses,
                                {
                                  id: 'oslic-' + Date.now(),
                                  service_order_id: osToEdit?.id || '',
                                  license_id: found.id,
                                  name: found.name,
                                  category: found.category,
                                  license_key: found.license_key,
                                  unit_price: found.sale_price,
                                }
                              ]);
                            }
                          } else {
                            setDigitalDetails(prev => ({ ...prev, license_id: '' }));
                          }
                        }}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        <option value="">Selecione uma licença do estoque ou preencha manual...</option>
                        {licenses
                          .filter(l => l.status === 'disponivel' || osLicenses.some(item => item.license_id === l.id))
                          .map(l => (
                            <option key={l.id} value={l.id}>
                              {l.name} — {formatCurrency(l.sale_price)} [Chave: {l.license_key.slice(0, 5)}•••••{l.license_key.slice(-5)}]
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Nome do Produto Digital *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Windows 11 Pro OEM, Office 2021, Kaspersky..."
                        value={digitalDetails.product_name || ''}
                        onChange={(e) => setDigitalDetails(prev => ({ ...prev, product_name: e.target.value }))}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 block mb-1">
                        Chave de Ativação / Serial Key *
                      </label>
                      <input
                        type="text"
                        placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                        value={digitalDetails.license_key || ''}
                        onChange={(e) => setDigitalDetails(prev => ({ ...prev, license_key: e.target.value.toUpperCase() }))}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-emerald-800 dark:text-emerald-300 uppercase"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Dispositivo de Destino / Identificação
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: PC Escritório, Notebook Dell do Cliente..."
                        value={digitalDetails.target_device || ''}
                        onChange={(e) => {
                          setDigitalDetails(prev => ({ ...prev, target_device: e.target.value }));
                          if (osType === 'licenca_digital') setEquipmentType(e.target.value);
                        }}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        E-mail ou Conta de Ativação do Cliente
                      </label>
                      <input
                        type="email"
                        placeholder="cliente.conta@email.com"
                        value={digitalDetails.customer_email || ''}
                        onChange={(e) => setDigitalDetails(prev => ({ ...prev, customer_email: e.target.value }))}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Forma de Entrega / Ativação
                      </label>
                      <select
                        value={digitalDetails.delivery_method || 'whatsapp'}
                        onChange={(e) => setDigitalDetails(prev => ({ ...prev, delivery_method: e.target.value as any }))}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        <option value="whatsapp">Envio pelo WhatsApp do Cliente</option>
                        <option value="email">Envio por E-mail</option>
                        <option value="remoto">Ativação Remota (AnyDesk / TeamViewer)</option>
                        <option value="balcao">Entrega Presencial no Balcão</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Instruções de Ativação & Link de Download (Impresso na OS)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ex: Baixe o instalador oficial em microsoft.com e insira a chave durante a instalação..."
                      value={digitalDetails.activation_instructions || ''}
                      onChange={(e) => setDigitalDetails(prev => ({ ...prev, activation_instructions: e.target.value }))}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* PAINEL DE EQUIPAMENTO FÍSICO (Exibido para Manutenção e Híbrido) */}
              {(osType === 'manutencao' || osType === 'hibrido') && (
                <div className="border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                    Identificação do Equipamento Físico
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Tipo *</label>
                      <input
                        type="text"
                        placeholder="Ex: Notebook, Celular"
                        value={equipmentType}
                        onChange={(e) => setEquipmentType(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Marca</label>
                      <input
                        type="text"
                        placeholder="Ex: Dell, Apple, Samsung"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Modelo</label>
                      <input
                        type="text"
                        placeholder="Ex: Inspiron 15, iPhone 11"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Nº Série / IMEI</label>
                      <input
                        type="text"
                        placeholder="Nº de Série ou IMEI"
                        value={serialImei}
                        onChange={(e) => setSerialImei(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Senha de Desbloqueio (PIN / Padrão / Letras)
                      </label>
                      <input
                        type="text"
                        placeholder="Senha informada pelo cliente"
                        value={unlockPassword}
                        onChange={(e) => setUnlockPassword(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Acessórios Deixados
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Carregador, capa, cabos"
                        value={accessoriesLeft}
                        onChange={(e) => setAccessoriesLeft(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  {/* Checklist Físico */}
                  <div className="pt-2">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
                      Checklist de Condição Física no Recebimento
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {[
                        { key: 'riscos', label: 'Possui Riscos' },
                        { key: 'trincos', label: 'Tela/Vidro Trincado' },
                        { key: 'parafusos_faltando', label: 'Parafusos Faltando' },
                        { key: 'molhado', label: 'Contato com Líquido' },
                        { key: 'nao_liga', label: 'Não Liga' },
                        { key: 'marcas_queda', label: 'Marcas de Queda / Batida' },
                      ].map((item) => (
                        <label key={item.key} className="flex items-center gap-2 p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(checklist as any)[item.key]}
                            onChange={(e) => setChecklist({ ...checklist, [item.key]: e.target.checked })}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                        </label>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Outras observações do estado físico..."
                      value={checklist.outros_detalhes}
                      onChange={(e) => setChecklist({ ...checklist, outros_detalhes: e.target.value })}
                      className="w-full text-xs p-2 mt-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ABA 2: DEFEITO E LAUDOS / PROCEDIMENTO */}
          {activeTab === 'laudos' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {osType === 'licenca_digital'
                    ? 'Finalidade / Solicitação do Cliente *'
                    : 'Defeito Relatado pelo Cliente *'}
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    osType === 'licenca_digital'
                      ? 'Descreva a necessidade da licença (ex: Upgrade para Windows 11 Pro, renovação de antivírus corporativo, licença para novo PC)...'
                      : 'Descreva exatamente o problema que o cliente descreveu...'
                  }
                  value={reportedDefect}
                  onChange={(e) => setReportedDefect(e.target.value)}
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {osType === 'licenca_digital'
                    ? 'Procedimento de Ativação / Suporte Técnico'
                    : 'Laudo Técnico / Diagnóstico de Bancada'}
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    osType === 'licenca_digital'
                      ? 'Descreva como foi realizado o suporte (ex: Ativação remota via AnyDesk, envio da chave com passo a passo por WhatsApp, teste de ativação online)...'
                      : 'Diagnóstico técnico identificado pelos testes de bancada...'
                  }
                  value={technicalReport}
                  onChange={(e) => setTechnicalReport(e.target.value)}
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {osType === 'licenca_digital'
                    ? 'Status da Licença / Solução Final'
                    : 'Solução Aplicada / Serviço Executado'}
                </label>
                <textarea
                  rows={2}
                  placeholder={
                    osType === 'licenca_digital'
                      ? 'Ex: Chave ativada com sucesso, licença digital permanente confirmada nas configurações...'
                      : 'Resumo dos procedimentos e reparos executados no equipamento...'
                  }
                  value={solutionApplied}
                  onChange={(e) => setSolutionApplied(e.target.value)}
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                <label className="text-xs font-bold text-amber-800 dark:text-amber-300 block mb-1">
                  Observações Internas (Invisível para o Cliente e na Impressão)
                </label>
                <textarea
                  rows={2}
                  placeholder="Anotações confidenciais da oficina (ex: custo real, histórico de comportamento do cliente)..."
                  value={internalObservations}
                  onChange={(e) => setInternalObservations(e.target.value)}
                  className="w-full text-xs p-2.5 rounded border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          )}

          {/* ABA 3: SERVIÇOS */}
          {activeTab === 'servicos' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="flex-1 text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="">Selecione um serviço do catálogo...</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {formatCurrency(s.base_price)}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAddService}
                  disabled={!selectedServiceId}
                  className="px-4 py-2 bg-blue-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar</span>
                </button>
              </div>

              {osServices.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-lg">
                  Nenhum serviço adicionado a esta OS ainda.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-2.5">Serviço</th>
                        <th className="p-2.5 w-20 text-center">Qtd</th>
                        <th className="p-2.5 w-28 text-right">Unitário</th>
                        <th className="p-2.5 w-28 text-right">Subtotal</th>
                        <th className="p-2.5 w-12 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {osServices.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-medium">{item.name}</td>
                          <td className="p-2.5 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const q = parseFloat(e.target.value) || 1;
                                const updated = [...osServices];
                                updated[idx].quantity = q;
                                updated[idx].subtotal = q * updated[idx].unit_price;
                                setOsServices(updated);
                              }}
                              className="w-14 p-1 text-center rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                          </td>
                          <td className="p-2.5 text-right font-mono">
                            <input
                              type="number"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => {
                                const p = parseFloat(e.target.value) || 0;
                                const updated = [...osServices];
                                updated[idx].unit_price = p;
                                updated[idx].subtotal = updated[idx].quantity * p;
                                setOsServices(updated);
                              }}
                              className="w-20 p-1 text-right rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                            {formatCurrency(item.subtotal)}
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveService(item.id)}
                              className="p-1 text-rose-500 hover:text-rose-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ABA 5: LICENÇAS DIGITAIS */}
          {activeTab === 'licencas' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Vincular Chave / Produto Digital do Estoque
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCustomLicenseOpen(!isCustomLicenseOpen)}
                    className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    {isCustomLicenseOpen ? 'Fechar Chave Avulsa' : '+ Inserir Chave Avulsa'}
                  </button>
                </div>

                {!isCustomLicenseOpen ? (
                  <div className="flex gap-2">
                    <select
                      value={selectedLicenseId}
                      onChange={(e) => setSelectedLicenseId(e.target.value)}
                      className="flex-1 text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="">Selecione uma licença disponível no acervo...</option>
                      {licenses
                        .filter(l => l.status === 'disponivel' || osLicenses.some(item => item.license_id === l.id))
                        .map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name} — {formatCurrency(l.sale_price)} [Chave: {l.license_key.slice(0, 5)}•••••{l.license_key.slice(-5)}]
                          </option>
                        ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleAddLicenseFromStock}
                      disabled={!selectedLicenseId}
                      className="px-4 py-2 bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1 shrink-0 shadow-sm transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Adicionar Licença</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Nome (ex: Windows 11 Pro)"
                        value={customLicenseName}
                        onChange={(e) => setCustomLicenseName(e.target.value)}
                        className="text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                      <input
                        type="text"
                        placeholder="Chave Serial (XXXXX-XXXXX...)"
                        value={customLicenseKey}
                        onChange={(e) => setCustomLicenseKey(e.target.value.toUpperCase())}
                        className="text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono uppercase"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Valor (R$)"
                        value={customLicensePrice || ''}
                        onChange={(e) => setCustomLicensePrice(parseFloat(e.target.value) || 0)}
                        className="text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsCustomLicenseOpen(false)}
                        className="px-3 py-1.5 text-[11px] border rounded"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCustomLicense}
                        className="px-3 py-1.5 text-[11px] bg-emerald-600 text-white font-semibold rounded hover:bg-emerald-700"
                      >
                        Inserir na OS
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {osLicenses.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-lg space-y-1">
                  <KeyRound className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p>Nenhuma licença digital vinculada a esta Ordem de Serviço.</p>
                  <p className="text-[10px] text-slate-400">
                    Selecione uma licença do acervo acima para adicionar à OS e emitir na nota/termo do cliente.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-2.5">Produto Digital</th>
                        <th className="p-2.5">Chave de Ativação (Serial Key)</th>
                        <th className="p-2.5 w-28 text-right">Valor Venda</th>
                        <th className="p-2.5 w-16 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {osLicenses.map((item, idx) => {
                        const isCopied = copiedKeyId === item.id;
                        return (
                          <tr key={idx}>
                            <td className="p-2.5 font-medium">
                              <div className="flex items-center gap-1.5">
                                <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{item.name}</span>
                              </div>
                            </td>
                            <td className="p-2.5 font-mono text-slate-800 dark:text-slate-200">
                              <div className="flex items-center gap-1.5">
                                <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] font-bold">
                                  {item.license_key}
                                </code>
                                <button
                                  type="button"
                                  onClick={() => handleCopyKey(item.id, item.license_key)}
                                  className="p-1 text-slate-400 hover:text-emerald-600"
                                  title="Copiar chave"
                                >
                                  {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              <input
                                type="number"
                                step="0.01"
                                value={item.unit_price}
                                onChange={(e) => {
                                  const p = parseFloat(e.target.value) || 0;
                                  const updated = [...osLicenses];
                                  updated[idx].unit_price = p;
                                  setOsLicenses(updated);
                                }}
                                className="w-20 p-1 text-right rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                              />
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveLicense(item.id)}
                                className="p-1 text-rose-500 hover:text-rose-700"
                                title="Remover da OS"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ABA 4: PEÇAS E PRODUTOS */}
          {activeTab === 'produtos' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="flex-1 text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="">Selecione uma peça do estoque...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.description} — {formatCurrency(p.sale_price)} (Estoque: {p.current_stock})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAddProduct}
                  disabled={!selectedProductId}
                  className="px-4 py-2 bg-blue-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Peça</span>
                </button>
              </div>

              {osProducts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-lg">
                  Nenhuma peça vinculada a esta OS.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-2.5">Peça / Produto</th>
                        <th className="p-2.5 w-20 text-center">Qtd</th>
                        <th className="p-2.5 w-28 text-right">Unitário</th>
                        <th className="p-2.5 w-28 text-right">Subtotal</th>
                        <th className="p-2.5 w-24 text-center">Estoque</th>
                        <th className="p-2.5 w-12 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {osProducts.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-medium">{item.name}</td>
                          <td className="p-2.5 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const q = parseFloat(e.target.value) || 1;
                                const updated = [...osProducts];
                                updated[idx].quantity = q;
                                updated[idx].subtotal = q * updated[idx].unit_price;
                                setOsProducts(updated);
                              }}
                              className="w-14 p-1 text-center rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                          </td>
                          <td className="p-2.5 text-right font-mono">
                            <input
                              type="number"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => {
                                const p = parseFloat(e.target.value) || 0;
                                const updated = [...osProducts];
                                updated[idx].unit_price = p;
                                updated[idx].subtotal = updated[idx].quantity * p;
                                setOsProducts(updated);
                              }}
                              className="w-20 p-1 text-right rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(item.subtotal)}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                              Auto-Baixa
                            </span>
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(item.id)}
                              className="p-1 text-rose-500 hover:text-rose-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ABA 5: LICENÇAS DIGITAIS */}
          {activeTab === 'licencas' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Vincular Chave / Produto Digital do Estoque
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCustomLicenseOpen(!isCustomLicenseOpen)}
                    className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    {isCustomLicenseOpen ? 'Fechar Chave Avulsa' : '+ Inserir Chave Avulsa'}
                  </button>
                </div>

                {!isCustomLicenseOpen ? (
                  <div className="flex gap-2">
                    <select
                      value={selectedLicenseId}
                      onChange={(e) => setSelectedLicenseId(e.target.value)}
                      className="flex-1 text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="">Selecione uma licença disponível no acervo...</option>
                      {licenses
                        .filter(l => l.status === 'disponivel' || osLicenses.some(item => item.license_id === l.id))
                        .map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name} — {formatCurrency(l.sale_price)} [Chave: {l.license_key.slice(0, 5)}•••••{l.license_key.slice(-5)}]
                          </option>
                        ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleAddLicenseFromStock}
                      disabled={!selectedLicenseId}
                      className="px-4 py-2 bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1 shrink-0 shadow-sm transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Adicionar Licença</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Nome (ex: Windows 11 Pro)"
                        value={customLicenseName}
                        onChange={(e) => setCustomLicenseName(e.target.value)}
                        className="text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                      <input
                        type="text"
                        placeholder="Chave Serial (XXXXX-XXXXX...)"
                        value={customLicenseKey}
                        onChange={(e) => setCustomLicenseKey(e.target.value.toUpperCase())}
                        className="text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono uppercase"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Valor (R$)"
                        value={customLicensePrice || ''}
                        onChange={(e) => setCustomLicensePrice(parseFloat(e.target.value) || 0)}
                        className="text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsCustomLicenseOpen(false)}
                        className="px-3 py-1.5 text-[11px] border rounded"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCustomLicense}
                        className="px-3 py-1.5 text-[11px] bg-emerald-600 text-white font-semibold rounded hover:bg-emerald-700"
                      >
                        Inserir na OS
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {osLicenses.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-lg space-y-1">
                  <KeyRound className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p>Nenhuma licença digital vinculada a esta Ordem de Serviço.</p>
                  <p className="text-[10px] text-slate-400">
                    Selecione uma licença do acervo acima para adicionar à OS e emitir na nota/termo do cliente.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-2.5">Produto Digital</th>
                        <th className="p-2.5">Chave de Ativação (Serial Key)</th>
                        <th className="p-2.5 w-28 text-right">Valor Venda</th>
                        <th className="p-2.5 w-16 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {osLicenses.map((item, idx) => {
                        const isCopied = copiedKeyId === item.id;
                        return (
                          <tr key={idx}>
                            <td className="p-2.5 font-medium">
                              <div className="flex items-center gap-1.5">
                                <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{item.name}</span>
                              </div>
                            </td>
                            <td className="p-2.5 font-mono text-slate-800 dark:text-slate-200">
                              <div className="flex items-center gap-1.5">
                                <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] font-bold">
                                  {item.license_key}
                                </code>
                                <button
                                  type="button"
                                  onClick={() => handleCopyKey(item.id, item.license_key)}
                                  className="p-1 text-slate-400 hover:text-emerald-600"
                                  title="Copiar chave"
                                >
                                  {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              <input
                                type="number"
                                step="0.01"
                                value={item.unit_price}
                                onChange={(e) => {
                                  const p = parseFloat(e.target.value) || 0;
                                  const updated = [...osLicenses];
                                  updated[idx].unit_price = p;
                                  setOsLicenses(updated);
                                }}
                                className="w-20 p-1 text-right rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                              />
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveLicense(item.id)}
                                className="p-1 text-rose-500 hover:text-rose-700"
                                title="Remover da OS"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ABA 5: ANEXOS E FOTOS */}
          {activeTab === 'anexos' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Adicionar Evidência Fotográfica (Supabase Storage / Web URL)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="url"
                    placeholder="URL da imagem (ex: https://...)"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    className="text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                  <input
                    type="text"
                    placeholder="Legenda (ex: Estado da carcaça na entrada)"
                    value={newPhotoCaption}
                    onChange={(e) => setNewPhotoCaption(e.target.value)}
                    className="text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => {
                      // Atalho para adicionar imagem simulada de teste
                      setNewPhotoUrl('https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=60');
                      setNewPhotoCaption('Placa-mãe analisada sob microscópio');
                    }}
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    Usar foto de amostra técnica
                  </button>
                  <button
                    type="button"
                    onClick={handleAddAttachment}
                    disabled={!newPhotoUrl}
                    className="px-3 py-1.5 bg-blue-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                  >
                    Anexar Foto
                  </button>
                </div>
              </div>

              {attachments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-lg">
                  Nenhuma foto anexada a esta Ordem de Serviço ainda.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-800 relative group">
                      <img src={att.file_url} alt={att.caption} className="w-full h-32 object-cover" />
                      <div className="p-2 text-[11px]">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{att.caption || 'Foto'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ABA 5: LICENÇAS DIGITAIS */}
          {activeTab === 'licencas' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Vincular Chave / Produto Digital do Estoque
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCustomLicenseOpen(!isCustomLicenseOpen)}
                    className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    {isCustomLicenseOpen ? 'Fechar Chave Avulsa' : '+ Inserir Chave Avulsa'}
                  </button>
                </div>

                {!isCustomLicenseOpen ? (
                  <div className="flex gap-2">
                    <select
                      value={selectedLicenseId}
                      onChange={(e) => setSelectedLicenseId(e.target.value)}
                      className="flex-1 text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="">Selecione uma licença disponível no acervo...</option>
                      {licenses
                        .filter(l => l.status === 'disponivel' || osLicenses.some(item => item.license_id === l.id))
                        .map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name} — {formatCurrency(l.sale_price)} [Chave: {l.license_key.slice(0, 5)}•••••{l.license_key.slice(-5)}]
                          </option>
                        ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleAddLicenseFromStock}
                      disabled={!selectedLicenseId}
                      className="px-4 py-2 bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1 shrink-0 shadow-sm transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Adicionar Licença</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Nome (ex: Windows 11 Pro)"
                        value={customLicenseName}
                        onChange={(e) => setCustomLicenseName(e.target.value)}
                        className="text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                      <input
                        type="text"
                        placeholder="Chave Serial (XXXXX-XXXXX...)"
                        value={customLicenseKey}
                        onChange={(e) => setCustomLicenseKey(e.target.value.toUpperCase())}
                        className="text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono uppercase"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Valor (R$)"
                        value={customLicensePrice || ''}
                        onChange={(e) => setCustomLicensePrice(parseFloat(e.target.value) || 0)}
                        className="text-xs p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsCustomLicenseOpen(false)}
                        className="px-3 py-1.5 text-[11px] border rounded"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCustomLicense}
                        className="px-3 py-1.5 text-[11px] bg-emerald-600 text-white font-semibold rounded hover:bg-emerald-700"
                      >
                        Inserir na OS
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {osLicenses.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-lg space-y-1">
                  <KeyRound className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p>Nenhuma licença digital vinculada a esta Ordem de Serviço.</p>
                  <p className="text-[10px] text-slate-400">
                    Selecione uma licença do acervo acima para adicionar à OS e emitir na nota/termo do cliente.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-2.5">Produto Digital</th>
                        <th className="p-2.5">Chave de Ativação (Serial Key)</th>
                        <th className="p-2.5 w-28 text-right">Valor Venda</th>
                        <th className="p-2.5 w-16 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {osLicenses.map((item, idx) => {
                        const isCopied = copiedKeyId === item.id;
                        return (
                          <tr key={idx}>
                            <td className="p-2.5 font-medium">
                              <div className="flex items-center gap-1.5">
                                <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{item.name}</span>
                              </div>
                            </td>
                            <td className="p-2.5 font-mono text-slate-800 dark:text-slate-200">
                              <div className="flex items-center gap-1.5">
                                <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] font-bold">
                                  {item.license_key}
                                </code>
                                <button
                                  type="button"
                                  onClick={() => handleCopyKey(item.id, item.license_key)}
                                  className="p-1 text-slate-400 hover:text-emerald-600"
                                  title="Copiar chave"
                                >
                                  {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              <input
                                type="number"
                                step="0.01"
                                value={item.unit_price}
                                onChange={(e) => {
                                  const p = parseFloat(e.target.value) || 0;
                                  const updated = [...osLicenses];
                                  updated[idx].unit_price = p;
                                  setOsLicenses(updated);
                                }}
                                className="w-20 p-1 text-right rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                              />
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveLicense(item.id)}
                                className="p-1 text-rose-500 hover:text-rose-700"
                                title="Remover da OS"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ABA 6: TOTAIS E PRAZOS */}
          {activeTab === 'totais' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Previsão de Conclusão / Entrega
                  </label>
                  <input
                    type="date"
                    value={estimatedDeliveryDate}
                    onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Desconto
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Tipo Desconto
                    </label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    >
                      <option value="R$">R$ (Fixo)</option>
                      <option value="%">% (Percentual)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Box de Resumo de Valores */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal Serviços ({osServices.length} itens):</span>
                  <span className="font-mono font-semibold">{formatCurrency(servicesTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal Peças ({osProducts.length} itens):</span>
                  <span className="font-mono font-semibold">{formatCurrency(productsTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal Licenças Digitais ({osLicenses.length} itens):</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(licensesTotal)}</span>
                </div>
                {discountValue > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Desconto ({discountType === '%' ? `${discountValue}%` : 'R$'}):</span>
                    <span className="font-mono">- {formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold border-t border-slate-300 dark:border-slate-700 pt-2 text-slate-900 dark:text-white">
                  <span>VALOR TOTAL DA ORDEM:</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 text-lg">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Rodapé com Botão Salvar */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Ordem de Serviço</span>
            </button>
          </div>
        </form>
      </div>

      {/* MODAL RAPIDO: NOVO CLIENTE */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cadastro Rápido de Cliente</h3>
              <button onClick={() => setShowNewClientModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Feedback CNPJ */}
            {cnpjMsg && (
              <div
                className={`p-2 rounded-lg text-xs flex items-center gap-2 ${
                  cnpjMsg.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200'
                }`}
              >
                {cnpjMsg.type === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                )}
                <span className="flex-1 font-medium">{cnpjMsg.text}</span>
                <button type="button" onClick={() => setCnpjMsg(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div>
                <label className="font-semibold block mb-0.5">Nome / Razão Social *</label>
                <input
                  type="text"
                  placeholder="Nome do cliente ou Razão Social"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full p-2 border rounded bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="font-semibold block">CPF ou CNPJ *</label>
                  <button
                    type="button"
                    onClick={handleQuickCnpjLookup}
                    disabled={isSearchingCnpj || newClientDoc.replace(/\D/g, '').length !== 14}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 disabled:opacity-40"
                  >
                    {isSearchingCnpj ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Buscando CNPJ...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3 h-3" />
                        <span>Buscar CNPJ (Receita)</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="000.000.000-00 ou 00.000.000/0001-00"
                    value={newClientDoc}
                    onChange={(e) => {
                      const val = e.target.value;
                      const clean = val.replace(/\D/g, '');
                      if (clean.length > 11) {
                        setNewClientDoc(formatCNPJ(val));
                      } else {
                        setNewClientDoc(formatCPF(val));
                      }
                    }}
                    className="w-full p-2 border rounded bg-white dark:bg-slate-800 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleQuickCnpjLookup}
                    disabled={isSearchingCnpj || newClientDoc.replace(/\D/g, '').length !== 14}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:pointer-events-none text-white rounded text-xs font-semibold whitespace-nowrap flex items-center gap-1 shadow-sm transition-all"
                    title="Buscar CNPJ na Receita Federal"
                  >
                    {isSearchingCnpj ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    <span>Buscar</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-0.5">Telefone / WhatsApp</label>
                <input
                  type="text"
                  placeholder="(11) 98888-7777"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(formatPhone(e.target.value))}
                  className="w-full p-2 border rounded bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold block mb-0.5">CEP (ViaCEP)</label>
                  <input
                    type="text"
                    placeholder="00000-000"
                    value={newClientCep}
                    onChange={(e) => handleCepSearch(e.target.value)}
                    className="w-full p-2 border rounded bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="font-semibold block mb-0.5">Logradouro</label>
                  <input
                    type="text"
                    placeholder="Rua..."
                    value={newClientStreet}
                    onChange={(e) => setNewClientStreet(e.target.value)}
                    className="w-full p-2 border rounded bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold block mb-0.5">Número</label>
                  <input
                    type="text"
                    placeholder="123"
                    value={newClientNumber}
                    onChange={(e) => setNewClientNumber(e.target.value)}
                    className="w-full p-2 border rounded bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-0.5">Cidade</label>
                  <input
                    type="text"
                    placeholder="Cidade"
                    value={newClientCity}
                    onChange={(e) => setNewClientCity(e.target.value)}
                    className="w-full p-2 border rounded bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-0.5">UF</label>
                  <input
                    type="text"
                    placeholder="SP"
                    maxLength={2}
                    value={newClientState}
                    onChange={(e) => setNewClientState(e.target.value.toUpperCase())}
                    className="w-full p-2 border rounded bg-white dark:bg-slate-800 text-center"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewClientModal(false)}
                className="px-3 py-1.5 text-xs border rounded"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveQuickClient}
                className="px-4 py-1.5 text-xs bg-blue-600 text-white font-semibold rounded hover:bg-blue-700"
              >
                Cadastrar e Selecionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
