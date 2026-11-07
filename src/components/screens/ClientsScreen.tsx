import React, { useState } from 'react';
import { useAppStore } from '../../lib/store';
import { Client, PersonType } from '../../lib/types';
import { 
  formatDocument, 
  formatPhone, 
  formatCEP, 
  isValidCPF, 
  isValidCNPJ, 
  fetchAddressByCep 
} from '../../lib/utils';
import { 
  Users, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  X, 
  Save, 
  Building2, 
  User 
} from 'lucide-react';

export const ClientsScreen: React.FC = () => {
  const { clients, addClient, updateClient, deleteClient } = useAppStore();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'clients' | 'suppliers'>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form states
  const [personType, setPersonType] = useState<PersonType>('PF');
  const [name, setName] = useState<string>('');
  const [document, setDocument] = useState<string>('');
  const [rgIe, setRgIe] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [whatsapp, setWhatsapp] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [zipCode, setZipCode] = useState<string>('');
  const [street, setStreet] = useState<string>('');
  const [number, setNumber] = useState<string>('');
  const [complement, setComplement] = useState<string>('');
  const [neighborhood, setNeighborhood] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [isSupplier, setIsSupplier] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  const openNewModal = () => {
    setEditingClient(null);
    setPersonType('PF');
    setName('');
    setDocument('');
    setRgIe('');
    setPhone('');
    setWhatsapp('');
    setEmail('');
    setZipCode('');
    setStreet('');
    setNumber('');
    setComplement('');
    setNeighborhood('');
    setCity('');
    setState('');
    setIsSupplier(false);
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Client) => {
    setEditingClient(c);
    setPersonType(c.person_type);
    setName(c.name);
    setDocument(c.document);
    setRgIe(c.rg_ie || '');
    setPhone(c.phone || '');
    setWhatsapp(c.whatsapp || '');
    setEmail(c.email || '');
    setZipCode(c.zip_code || '');
    setStreet(c.street || '');
    setNumber(c.number || '');
    setComplement(c.complement || '');
    setNeighborhood(c.neighborhood || '');
    setCity(c.city || '');
    setState(c.state || '');
    setIsSupplier(!!c.is_supplier);
    setNotes(c.notes || '');
    setIsModalOpen(true);
  };

  const handleCepLookup = async (cep: string) => {
    setZipCode(cep);
    if (cep.replace(/\D/g, '').length === 8) {
      const res = await fetchAddressByCep(cep);
      if (res && !res.error) {
        setStreet(res.street);
        setNeighborhood(res.neighborhood);
        setCity(res.city);
        setState(res.state);
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !document) {
      alert('Nome e Documento (CPF/CNPJ) são obrigatórios.');
      return;
    }

    // Validação matemática
    const cleanDoc = document.replace(/\D/g, '');
    if (personType === 'PF' && cleanDoc.length === 11 && !isValidCPF(cleanDoc)) {
      if (!confirm('O CPF informado parece inválido perante o algoritmo oficial. Deseja prosseguir mesmo assim?')) return;
    } else if (personType === 'PJ' && cleanDoc.length === 14 && !isValidCNPJ(cleanDoc)) {
      if (!confirm('O CNPJ informado parece inválido perante o algoritmo oficial. Deseja prosseguir mesmo assim?')) return;
    }

    const payload = {
      person_type: personType,
      name,
      document,
      rg_ie: rgIe,
      phone,
      whatsapp: whatsapp || phone,
      email,
      zip_code: zipCode,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      is_supplier: isSupplier,
      notes,
    };

    if (editingClient) {
      updateClient(editingClient.id, payload);
    } else {
      addClient(payload);
    }

    setIsModalOpen(false);
  };

  const filteredClients = clients.filter(c => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      c.name.toLowerCase().includes(q) ||
      c.document.includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q));

    if (filterType === 'suppliers') return matchesSearch && c.is_supplier;
    if (filterType === 'clients') return matchesSearch && !c.is_supplier;
    return matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Clientes & Fornecedores
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cadastro unificado de Pessoa Física e Jurídica com validação e busca ViaCEP.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-semibold shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Cliente / Fornecedor</span>
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF/CNPJ, telefone ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-1 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
          >
            Todos ({clients.length})
          </button>
          <button
            onClick={() => setFilterType('clients')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${filterType === 'clients' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
          >
            Apenas Clientes ({clients.filter(c => !c.is_supplier).length})
          </button>
          <button
            onClick={() => setFilterType('suppliers')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${filterType === 'suppliers' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
          >
            Fornecedores ({clients.filter(c => c.is_supplier).length})
          </button>
        </div>
      </div>

      {/* Grid de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => (
          <div
            key={client.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    client.person_type === 'PJ' 
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' 
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  }`}>
                    {client.person_type === 'PJ' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                      {client.name}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatDocument(client.document)}
                    </span>
                  </div>
                </div>

                {client.is_supplier && (
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200">
                    Fornecedor
                  </span>
                )}
              </div>

              <div className="text-[11px] space-y-1 text-slate-600 dark:text-slate-400">
                {(client.phone || client.whatsapp) && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatPhone(client.whatsapp || client.phone)}</span>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.street && (
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{client.street}, {client.number} - {client.city}/{client.state}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-1">
              <button
                onClick={() => openEditModal(client)}
                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
              <button
                onClick={() => {
                  if (confirm(`Excluir o cliente "${client.name}"?`)) {
                    deleteClient(client.id);
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Criar / Editar Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingClient ? 'Editar Cadastro' : 'Novo Cliente / Fornecedor'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="ptype"
                    checked={personType === 'PF'}
                    onChange={() => setPersonType('PF')}
                    className="text-blue-600"
                  />
                  <span className="font-semibold">Pessoa Física (CPF)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="ptype"
                    checked={personType === 'PJ'}
                    onChange={() => setPersonType('PJ')}
                    className="text-blue-600"
                  />
                  <span className="font-semibold">Pessoa Jurídica (CNPJ)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer ml-auto">
                  <input
                    type="checkbox"
                    checked={isSupplier}
                    onChange={(e) => setIsSupplier(e.target.checked)}
                    className="text-amber-600 rounded"
                  />
                  <span className="font-semibold text-amber-600">É Fornecedor?</span>
                </label>
              </div>

              <div>
                <label className="font-semibold block mb-1">
                  {personType === 'PF' ? 'Nome Completo *' : 'Razão Social / Nome Fantasia *'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">
                    {personType === 'PF' ? 'CPF *' : 'CNPJ *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={personType === 'PF' ? '000.000.000-00' : '00.000.000/0001-00'}
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">
                    {personType === 'PF' ? 'RG (Opcional)' : 'Inscrição Estadual'}
                  </label>
                  <input
                    type="text"
                    value={rgIe}
                    onChange={(e) => setRgIe(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">WhatsApp</label>
                  <input
                    type="text"
                    placeholder="(11) 98888-7777"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="cliente@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Endereço com ViaCEP */}
              <div className="border-t pt-3 space-y-2">
                <span className="font-bold text-[11px] text-slate-500 uppercase block">Endereço (Auto-busca por CEP)</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-semibold block mb-0.5">CEP</label>
                    <input
                      type="text"
                      placeholder="00000-000"
                      value={zipCode}
                      onChange={(e) => handleCepLookup(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="font-semibold block mb-0.5">Logradouro</label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="font-semibold block mb-0.5">Número</label>
                    <input
                      type="text"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-0.5">Complemento</label>
                    <input
                      type="text"
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-0.5">Cidade</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-0.5">UF</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={state}
                      onChange={(e) => setState(e.target.value.toUpperCase())}
                      className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800 text-center"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Anotações / Observações</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg text-xs hover:bg-blue-700 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Dados</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
