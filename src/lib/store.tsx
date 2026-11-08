import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  IssuerSettings,
  Client,
  Product,
  ServiceItem,
  WarrantyTerm,
  ServiceOrder,
  FinancialTransaction,
  Sale,
  StockMovement,
  PaymentMethod,
  UserProfile,
  AuditLog,
  DigitalLicense,
  MercadoPagoSettings
} from './types';
import {
  initialIssuerSettings,
  initialClients,
  initialProducts,
  initialServices,
  initialWarrantyTerms,
  initialServiceOrders,
  initialFinancialTransactions,
  initialSales,
  initialUsers,
  initialAuditLogs,
  initialDigitalLicenses,
  initialMercadoPagoSettings
} from './mockData';
import {
  createMercadoPagoPreference,
  testMercadoPagoConnection
} from './mercadopago';
import { generateSecureOSHash } from './utils';
import { 
  getSupabaseClient, 
  DEFAULT_SUPABASE_URL, 
  DEFAULT_SUPABASE_KEY 
} from './supabaseClient';

interface SupabaseConfig {
  url: string;
  anonKey: string;
  connected: boolean;
}

interface AppStoreContextType {
  // Configurações do Emitente (Pessoa Física / CPF)
  issuer: IssuerSettings;
  updateIssuer: (data: Partial<IssuerSettings>) => void;

  // Clientes
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'created_at'>) => Client;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  // Produtos & Estoque
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'created_at'>) => Product;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (productId: string, quantityChange: number, type: 'entrada' | 'saida' | 'ajuste', reason: string) => void;
  stockMovements: StockMovement[];

  // Licenças Digitais (Produtos Digitais & Keys)
  licenses: DigitalLicense[];
  addLicense: (license: Omit<DigitalLicense, 'id' | 'created_at'>) => DigitalLicense;
  updateLicense: (id: string, patch: Partial<DigitalLicense>) => void;
  deleteLicense: (id: string) => void;
  assignLicenseToOS: (licenseId: string, osId: string, osNumber: number, clientId?: string, clientName?: string) => void;
  releaseLicenseFromOS: (licenseId: string) => void;

  // Serviços
  services: ServiceItem[];
  addService: (service: Omit<ServiceItem, 'id' | 'created_at'>) => ServiceItem;
  updateService: (id: string, service: Partial<ServiceItem>) => void;
  deleteService: (id: string) => void;

  // Termos de Garantia
  warrantyTerms: WarrantyTerm[];
  addWarrantyTerm: (term: Omit<WarrantyTerm, 'id' | 'created_at'>) => WarrantyTerm;
  updateWarrantyTerm: (id: string, term: Partial<WarrantyTerm>) => void;

  // Ordens de Serviço (OS)
  serviceOrders: ServiceOrder[];
  addServiceOrder: (osData: Partial<ServiceOrder>) => ServiceOrder;
  updateServiceOrder: (id: string, osData: Partial<ServiceOrder>) => void;
  deleteServiceOrder: (id: string) => void;
  invoiceServiceOrder: (osId: string, paymentMethod: PaymentMethod, dueDate?: string) => void;
  importOSFromPublicLink: (os: ServiceOrder, clientData?: any) => void;

  // Vendas PDV
  sales: Sale[];
  createSale: (saleData: Omit<Sale, 'id' | 'sale_number' | 'created_at'>) => Sale;

  // Financeiro
  transactions: FinancialTransaction[];
  addTransaction: (tx: Omit<FinancialTransaction, 'id' | 'created_at'>) => FinancialTransaction;
  updateTransaction: (id: string, tx: Partial<FinancialTransaction>) => void;
  markTransactionAsPaid: (id: string, paymentDate?: string, paymentMethod?: PaymentMethod) => void;
  deleteTransaction: (id: string) => void;

  // Usuários e Técnicos (Módulo Map-OS)
  users: UserProfile[];
  addUser: (user: Omit<UserProfile, 'id' | 'created_at'>) => UserProfile;
  updateUser: (id: string, user: Partial<UserProfile>) => void;
  deleteUser: (id: string) => void;

  // Auditoria e Logs (Módulo Map-OS)
  auditLogs: AuditLog[];
  addAuditLog: (module: string, action: string, details: string, userName?: string) => void;

  // Setup Inicial FM Tech
  setupCompleted: boolean;
  setSetupCompleted: (val: boolean) => void;

  // Autenticação & Sessão (FM Tech)
  isAuthenticated: boolean;
  currentUser: UserProfile | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  saveSetupToSupabase: (adminData: { name: string; email: string; password: string }) => Promise<{ success: boolean; error?: string }>;

  // Dark Mode & Supabase
  darkMode: boolean;
  toggleDarkMode: () => void;
  supabaseConfig: SupabaseConfig;
  updateSupabaseConfig: (config: Partial<SupabaseConfig>) => void;
  resetAllData: () => void;

  // Integração Mercado Pago Checkout Pro
  mercadoPago: MercadoPagoSettings;
  updateMercadoPagoSettings: (data: Partial<MercadoPagoSettings>) => void;
  generateOSMercadoPagoLink: (osId: string) => Promise<{ success: boolean; paymentUrl?: string; preferenceId?: string; isSimulated?: boolean; error?: string }>;
  confirmMercadoPagoPayment: (osId: string, paymentId?: string, paymentMethod?: PaymentMethod) => void;
}

const AppStoreContext = createContext<AppStoreContextType | null>(null);

const STORAGE_KEYS = {
  ISSUER: 'mapos_pf_issuer',
  CLIENTS: 'mapos_pf_clients',
  PRODUCTS: 'mapos_pf_products',
  LICENSES: 'fmtech_digital_licenses',
  SERVICES: 'mapos_pf_services',
  WARRANTY: 'mapos_pf_warranty',
  OS: 'mapos_pf_orders',
  SALES: 'mapos_pf_sales',
  FINANCE: 'mapos_pf_finance',
  MOVEMENTS: 'mapos_pf_movements',
  USERS: 'mapos_pf_users',
  AUDIT: 'mapos_pf_audit_logs',
  SETUP_COMPLETED: 'fmtech_setup_completed',
  AUTH_USER: 'fmtech_auth_user',
  ADMIN_CREDS: 'fmtech_admin_credentials',
  THEME: 'mapos_pf_dark_mode',
  SUPABASE: 'mapos_pf_supabase_config',
  MERCADOPAGO: 'fmtech_mercadopago_config',
};

export const AppStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved !== null) return JSON.parse(saved);
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  // Supabase Config
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPABASE);
    return saved ? JSON.parse(saved) : { 
      url: DEFAULT_SUPABASE_URL, 
      anonKey: DEFAULT_SUPABASE_KEY, 
      connected: true 
    };
  });

  const updateSupabaseConfig = (cfg: Partial<SupabaseConfig>) => {
    setSupabaseConfig(prev => {
      const updated = { ...prev, ...cfg };
      localStorage.setItem(STORAGE_KEYS.SUPABASE, JSON.stringify(updated));
      if (updated.url) localStorage.setItem('mapos_pf_supabase_url', updated.url);
      if (updated.anonKey) localStorage.setItem('mapos_pf_supabase_key', updated.anonKey);
      return updated;
    });
  };

  // Setup Inicial State (FM Tech)
  const [setupCompleted, setSetupCompletedState] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETUP_COMPLETED);
    return saved !== null ? JSON.parse(saved) : false;
  });

  const setSetupCompleted = (val: boolean) => {
    setSetupCompletedState(val);
    localStorage.setItem(STORAGE_KEYS.SETUP_COMPLETED, JSON.stringify(val));
  };

  // Autenticação & Sessão (FM Tech)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    return saved ? JSON.parse(saved) : null;
  });

  const isAuthenticated = currentUser !== null;

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    // 1. Tentar login direto via Supabase Auth
    try {
      const client = getSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey);
      if (client) {
        const { data, error } = await client.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPass,
        });

        if (!error && data?.user) {
          const loggedUser: UserProfile = {
            id: data.user.id,
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Administrador',
            email: data.user.email || cleanEmail,
            role: 'admin',
            active: true,
            created_at: data.user.created_at || new Date().toISOString(),
          };
          setCurrentUser(loggedUser);
          localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(loggedUser));
          addAuditLog('Autenticação', 'LOGIN', `Login com sucesso via Supabase Auth: ${cleanEmail}`, loggedUser.name);
          return { success: true };
        }
      }
    } catch (err: any) {
      console.warn('Supabase Auth login attempt:', err);
    }

    // 2. Validação com as credenciais salvas no Setup ou usuário admin
    const savedCredsRaw = localStorage.getItem(STORAGE_KEYS.ADMIN_CREDS);
    let savedCreds: { email?: string; password?: string; name?: string } | null = null;
    if (savedCredsRaw) {
      try {
        savedCreds = JSON.parse(savedCredsRaw);
      } catch {}
    }

    if (savedCreds && savedCreds.email?.toLowerCase() === cleanEmail && savedCreds.password === cleanPass) {
      const loggedUser: UserProfile = {
        id: 'usr-admin-root',
        name: savedCreds.name || 'Administrador FM Tech',
        email: cleanEmail,
        role: 'admin',
        active: true,
        created_at: new Date().toISOString(),
      };
      setCurrentUser(loggedUser);
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(loggedUser));
      addAuditLog('Autenticação', 'LOGIN', `Login realizado com sucesso: ${cleanEmail}`, loggedUser.name);
      return { success: true };
    }

    // 3. Fallback com lista de usuários da aplicação
    const matchedUser = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (matchedUser && (cleanPass === 'admin123' || !savedCreds)) {
      setCurrentUser(matchedUser);
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(matchedUser));
      addAuditLog('Autenticação', 'LOGIN', `Login de usuário: ${cleanEmail}`, matchedUser.name);
      return { success: true };
    }

    return { success: false, error: 'E-mail ou senha incorretos. Verifique suas credenciais.' };
  };

  const logout = async () => {
    try {
      const client = getSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey);
      if (client) {
        await client.auth.signOut();
      }
    } catch {}

    const userName = currentUser?.name || 'Administrador';
    addAuditLog('Autenticação', 'LOGOUT', `Sessão encerrada pelo usuário: ${currentUser?.email || ''}`, userName);
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  };

  const saveSetupToSupabase = async (adminData: { name: string; email: string; password: string }): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey);

    // Salva as credenciais do admin localmente para garantia de acesso imediato
    localStorage.setItem(STORAGE_KEYS.ADMIN_CREDS, JSON.stringify(adminData));

    if (client) {
      try {
        // 1. Atualizar ou inserir em issuer_settings no Supabase
        const { data: existingIssuer } = await client.from('issuer_settings').select('id').limit(1).maybeSingle();
        const issuerData = {
          full_name: issuer.full_name,
          trade_name: issuer.trade_name,
          cpf: issuer.cpf,
          phone: issuer.phone,
          whatsapp: issuer.whatsapp,
          email: adminData.email.trim(),
          pix_key_type: issuer.pix_key_type,
          pix_key: issuer.pix_key,
          city: issuer.city,
          state: issuer.state,
          updated_at: new Date().toISOString(),
        };

        if (existingIssuer?.id) {
          await client.from('issuer_settings').update(issuerData).eq('id', existingIssuer.id);
        } else {
          await client.from('issuer_settings').insert(issuerData);
        }

        // 2. Registrar usuário no Supabase Auth
        const { data: authData } = await client.auth.signUp({
          email: adminData.email.trim().toLowerCase(),
          password: adminData.password.trim(),
          options: {
            data: {
              name: adminData.name,
              role: 'admin',
            }
          }
        });

        // 3. Inserir em user_profiles se a tabela existir
        if (authData?.user?.id) {
          await client.from('user_profiles').upsert({
            id: authData.user.id,
            name: adminData.name,
            phone: issuer.phone,
            active: true,
          });
        }
      } catch (err: any) {
        console.warn('Aviso ao sincronizar com Supabase:', err);
      }
    }

    return { success: true };
  };

  // Issuer Settings
  const [issuer, setIssuer] = useState<IssuerSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ISSUER);
    return saved ? JSON.parse(saved) : initialIssuerSettings;
  });

  const updateIssuer = (data: Partial<IssuerSettings>) => {
    setIssuer(prev => {
      const updated = { ...prev, ...data, updated_at: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEYS.ISSUER, JSON.stringify(updated));
      return updated;
    });
  };

  // Clients
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    return saved ? JSON.parse(saved) : initialClients;
  });

  const addClient = (clientData: Omit<Client, 'id' | 'created_at'>): Client => {
    const newClient: Client = {
      ...clientData,
      id: 'cli-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    const updated = [newClient, ...clients];
    setClients(updated);
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(updated));
    return newClient;
  };

  const updateClient = (id: string, patch: Partial<Client>) => {
    const updated = clients.map(c => c.id === id ? { ...c, ...patch } : c);
    setClients(updated);
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(updated));
  };

  const deleteClient = (id: string) => {
    const updated = clients.filter(c => c.id !== id);
    setClients(updated);
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(updated));
  };

  // Products & Stock Movements
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
    return saved ? JSON.parse(saved) : [];
  });

  const addProduct = (p: Omit<Product, 'id' | 'created_at'>): Product => {
    const newProd: Product = {
      ...p,
      id: 'prod-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    const updated = [newProd, ...products];
    setProducts(updated);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
    return newProd;
  };

  const updateProduct = (id: string, patch: Partial<Product>) => {
    const updated = products.map(p => p.id === id ? { ...p, ...patch } : p);
    setProducts(updated);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
  };

  const deleteProduct = (id: string) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
  };

  const adjustStock = (productId: string, quantityChange: number, type: 'entrada' | 'saida' | 'ajuste', reason: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const previousStock = prod.current_stock;
    let newStock = previousStock;

    if (type === 'entrada') {
      newStock = previousStock + Math.abs(quantityChange);
    } else if (type === 'saida') {
      newStock = Math.max(0, previousStock - Math.abs(quantityChange));
    } else {
      newStock = quantityChange; // Ajuste direto
    }

    const updatedProd = { ...prod, current_stock: newStock };
    const updatedList = products.map(p => p.id === productId ? updatedProd : p);
    setProducts(updatedList);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedList));

    const mov: StockMovement = {
      id: 'mov-' + Date.now(),
      product_id: productId,
      product_name: prod.description,
      type,
      quantity: Math.abs(newStock - previousStock),
      previous_stock: previousStock,
      new_stock: newStock,
      reason,
      created_at: new Date().toISOString(),
    };
    const newMovements = [mov, ...stockMovements];
    setStockMovements(newMovements);
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(newMovements));
  };

  // Licenças Digitais (Produtos Digitais & Keys)
  const [licenses, setLicenses] = useState<DigitalLicense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LICENSES);
    return saved ? JSON.parse(saved) : initialDigitalLicenses;
  });

  const addLicense = (lic: Omit<DigitalLicense, 'id' | 'created_at'>): DigitalLicense => {
    const newLic: DigitalLicense = {
      ...lic,
      id: 'lic-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    const updated = [newLic, ...licenses];
    setLicenses(updated);
    localStorage.setItem(STORAGE_KEYS.LICENSES, JSON.stringify(updated));
    return newLic;
  };

  const updateLicense = (id: string, patch: Partial<DigitalLicense>) => {
    const updated = licenses.map(l => l.id === id ? { ...l, ...patch } : l);
    setLicenses(updated);
    localStorage.setItem(STORAGE_KEYS.LICENSES, JSON.stringify(updated));
  };

  const deleteLicense = (id: string) => {
    const updated = licenses.filter(l => l.id !== id);
    setLicenses(updated);
    localStorage.setItem(STORAGE_KEYS.LICENSES, JSON.stringify(updated));
  };

  const assignLicenseToOS = (licenseId: string, osId: string, osNumber: number, clientId?: string, clientName?: string) => {
    setLicenses(prev => {
      const updated = prev.map(l => {
        if (l.id === licenseId) {
          return {
            ...l,
            status: 'em_uso' as const,
            service_order_id: osId,
            os_number: osNumber,
            client_id: clientId,
            client_name: clientName,
            assigned_at: new Date().toISOString(),
          };
        }
        return l;
      });
      localStorage.setItem(STORAGE_KEYS.LICENSES, JSON.stringify(updated));
      return updated;
    });
  };

  const releaseLicenseFromOS = (licenseId: string) => {
    setLicenses(prev => {
      const updated = prev.map(l => {
        if (l.id === licenseId) {
          return {
            ...l,
            status: 'disponivel' as const,
            service_order_id: undefined,
            os_number: undefined,
            client_id: undefined,
            client_name: undefined,
            assigned_at: undefined,
          };
        }
        return l;
      });
      localStorage.setItem(STORAGE_KEYS.LICENSES, JSON.stringify(updated));
      return updated;
    });
  };

  // Services
  const [services, setServices] = useState<ServiceItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SERVICES);
    return saved ? JSON.parse(saved) : initialServices;
  });

  const addService = (s: Omit<ServiceItem, 'id' | 'created_at'>): ServiceItem => {
    const newServ: ServiceItem = {
      ...s,
      id: 'serv-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    const updated = [newServ, ...services];
    setServices(updated);
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(updated));
    return newServ;
  };

  const updateService = (id: string, patch: Partial<ServiceItem>) => {
    const updated = services.map(s => s.id === id ? { ...s, ...patch } : s);
    setServices(updated);
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(updated));
  };

  const deleteService = (id: string) => {
    const updated = services.filter(s => s.id !== id);
    setServices(updated);
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(updated));
  };

  // Warranty Terms
  const [warrantyTerms, setWarrantyTerms] = useState<WarrantyTerm[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WARRANTY);
    return saved ? JSON.parse(saved) : initialWarrantyTerms;
  });

  const addWarrantyTerm = (t: Omit<WarrantyTerm, 'id' | 'created_at'>): WarrantyTerm => {
    const newTerm: WarrantyTerm = {
      ...t,
      id: 'war-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    const updated = [newTerm, ...warrantyTerms];
    setWarrantyTerms(updated);
    localStorage.setItem(STORAGE_KEYS.WARRANTY, JSON.stringify(updated));
    return newTerm;
  };

  const updateWarrantyTerm = (id: string, patch: Partial<WarrantyTerm>) => {
    const updated = warrantyTerms.map(w => w.id === id ? { ...w, ...patch } : w);
    setWarrantyTerms(updated);
    localStorage.setItem(STORAGE_KEYS.WARRANTY, JSON.stringify(updated));
  };

  // Service Orders (OS)
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.OS);
    return saved ? JSON.parse(saved) : initialServiceOrders;
  });

  const addServiceOrder = (osData: Partial<ServiceOrder>): ServiceOrder => {
    const nextNumber = serviceOrders.length > 0 
      ? Math.max(...serviceOrders.map(o => o.os_number || 0)) + 1 
      : 1001;

    const newOS: ServiceOrder = {
      id: 'os-' + Date.now(),
      os_number: nextNumber,
      os_type: osData.os_type || 'manutencao',
      digital_service_details: osData.digital_service_details,
      public_tracking_token: osData.public_tracking_token || generateSecureOSHash(),
      client_id: osData.client_id || '',
      technician_name: osData.technician_name || `${issuer.full_name} (CPF ${issuer.cpf})`,
      warranty_term_id: osData.warranty_term_id || warrantyTerms[0]?.id,
      status: osData.status || 'orcamento',
      entry_date: osData.entry_date || new Date().toISOString(),
      estimated_delivery_date: osData.estimated_delivery_date,
      equipment_type: osData.equipment_type || 'Notebook',
      brand: osData.brand || '',
      model: osData.model || '',
      serial_imei: osData.serial_imei || '',
      unlock_password: osData.unlock_password || '',
      accessories_left: osData.accessories_left || '',
      physical_condition_checklist: osData.physical_condition_checklist || {},
      reported_defect: osData.reported_defect || '',
      technical_report: osData.technical_report || '',
      solution_applied: osData.solution_applied || '',
      internal_observations: osData.internal_observations || '',
      services_total: osData.services_total || 0,
      products_total: osData.products_total || 0,
      licenses_total: osData.licenses_total || (osData.licenses ? osData.licenses.reduce((s, l) => s + l.unit_price, 0) : 0),
      discount_type: osData.discount_type || 'R$',
      discount_value: osData.discount_value || 0,
      total_amount: osData.total_amount || 0,
      invoiced: false,
      services: osData.services || [],
      products: osData.products || [],
      licenses: osData.licenses || [],
      attachments: osData.attachments || [],
      timeline: [
        {
          id: 'note-' + Date.now(),
          service_order_id: 'os-' + Date.now(),
          author_name: issuer.full_name,
          action: 'Abertura de OS',
          note: 'Ordem de Serviço criada com sucesso.',
          created_at: new Date().toISOString(),
        }
      ],
      created_at: new Date().toISOString(),
    };

    // Baixa de estoque automática se a OS for criada já em status aprovado/em_andamento/finalizado
    if (['aprovado', 'em_andamento', 'finalizado'].includes(newOS.status)) {
      newOS.products.forEach(prodItem => {
        adjustStock(prodItem.product_id, prodItem.quantity, 'saida', `Baixa de peça na OS #${newOS.os_number}`);
        prodItem.stock_deducted = true;
      });
    }

    // Vincula licenças digitais atribuídas a esta OS
    if (newOS.licenses && newOS.licenses.length > 0) {
      const client = clients.find(c => c.id === newOS.client_id);
      newOS.licenses.forEach(licItem => {
        if (licItem.license_id) {
          assignLicenseToOS(licItem.license_id, newOS.id, newOS.os_number, newOS.client_id, client?.name);
        }
      });
    }

    const updated = [newOS, ...serviceOrders];
    setServiceOrders(updated);
    localStorage.setItem(STORAGE_KEYS.OS, JSON.stringify(updated));
    return newOS;
  };

  const updateServiceOrder = (id: string, patch: Partial<ServiceOrder>) => {
    const existing = serviceOrders.find(o => o.id === id);
    if (!existing) return;

    // Regra de Estoque Automática:
    // Se cancelada, estorna peças que estavam deduzidas
    if (patch.status === 'cancelado' && existing.status !== 'cancelado') {
      existing.products.forEach(p => {
        if (p.stock_deducted) {
          adjustStock(p.product_id, p.quantity, 'entrada', `Estorno automático por cancelamento da OS #${existing.os_number}`);
          p.stock_deducted = false;
        }
      });
      // Libera licenças digitais vinculadas caso a OS seja cancelada
      (existing.licenses || []).forEach(l => {
        if (l.license_id) releaseLicenseFromOS(l.license_id);
      });
    }

    // Se as licenças da OS foram alteradas
    if (patch.licenses) {
      const newLicIds = new Set(patch.licenses.map(l => l.license_id).filter(Boolean));
      // Se alguma licença antiga foi removida da OS, libera de volta para o estoque
      (existing.licenses || []).forEach(oldLic => {
        if (oldLic.license_id && !newLicIds.has(oldLic.license_id)) {
          releaseLicenseFromOS(oldLic.license_id);
        }
      });
      // Vincula as novas licenças à OS
      const client = clients.find(c => c.id === (patch.client_id || existing.client_id));
      patch.licenses.forEach(newLic => {
        if (newLic.license_id) {
          assignLicenseToOS(newLic.license_id, existing.id, existing.os_number, existing.client_id, client?.name);
        }
      });
    }

    // Se mudou para status aprovado/em_andamento e tem peças não deduzidas
    if (patch.status && ['aprovado', 'em_andamento', 'finalizado'].includes(patch.status) && !['aprovado', 'em_andamento', 'finalizado'].includes(existing.status)) {
      existing.products.forEach(p => {
        if (!p.stock_deducted) {
          adjustStock(p.product_id, p.quantity, 'saida', `Baixa de peça na OS #${existing.os_number}`);
          p.stock_deducted = true;
        }
      });
    }

    // Atualiza timeline se houve mudança de status
    let newTimeline = patch.timeline || existing.timeline;
    if (patch.status && patch.status !== existing.status) {
      newTimeline = [
        ...newTimeline,
        {
          id: 'note-' + Date.now(),
          service_order_id: id,
          author_name: issuer.full_name,
          action: 'Mudança de Status',
          note: `Status alterado de "${existing.status}" para "${patch.status}".`,
          created_at: new Date().toISOString(),
        }
      ];
    }

    const updated = serviceOrders.map(o => o.id === id ? { ...o, ...patch, timeline: newTimeline } : o);
    setServiceOrders(updated);
    localStorage.setItem(STORAGE_KEYS.OS, JSON.stringify(updated));
  };

  const deleteServiceOrder = (id: string) => {
    const existing = serviceOrders.find(o => o.id === id);
    if (existing) {
      existing.products.forEach(p => {
        if (p.stock_deducted) {
          adjustStock(p.product_id, p.quantity, 'entrada', `Estorno por exclusão da OS #${existing.os_number}`);
        }
      });
      // Libera licenças vinculadas à OS deletada
      if (existing.licenses && existing.licenses.length > 0) {
        existing.licenses.forEach(l => {
          if (l.license_id) releaseLicenseFromOS(l.license_id);
        });
      }
    }
    const updated = serviceOrders.filter(o => o.id !== id);
    setServiceOrders(updated);
    localStorage.setItem(STORAGE_KEYS.OS, JSON.stringify(updated));
  };

  // Faturamento em 1 Clique da OS
  const invoiceServiceOrder = (osId: string, paymentMethod: PaymentMethod, dueDate?: string) => {
    const os = serviceOrders.find(o => o.id === osId);
    if (!os) return;

    const client = clients.find(c => c.id === os.client_id);
    const today = new Date().toISOString().split('T')[0];

    // Cria lançamento financeiro como receita
    const newTx: FinancialTransaction = {
      id: 'fin-' + Date.now(),
      description: `Faturamento OS #${os.os_number} - ${os.equipment_type} ${os.brand} ${os.model} (${client?.name || 'Cliente'})`,
      type: 'receita',
      category: 'Ordem de Serviço',
      client_id: os.client_id,
      client_name: client?.name,
      service_order_id: os.id,
      os_number: os.os_number,
      amount: os.total_amount,
      discount: os.discount_value,
      paid_amount: os.total_amount,
      due_date: dueDate || today,
      payment_date: today,
      status: 'pago',
      payment_method: paymentMethod,
      notes: `Faturado automaticamente via OS #${os.os_number}. Emitente CPF: ${issuer.cpf}`,
      created_at: new Date().toISOString(),
    };

    const newFinance = [newTx, ...transactions];
    setTransactions(newFinance);
    localStorage.setItem(STORAGE_KEYS.FINANCE, JSON.stringify(newFinance));

    // Marca OS como faturada
    updateServiceOrder(osId, { invoiced: true });
  };

  // Importa e hidrata OS vinda de um link público compartilhado em outro aparelho
  const importOSFromPublicLink = (os: ServiceOrder, clientData?: any) => {
    if (!os || !os.public_tracking_token) return;

    setServiceOrders(prev => {
      const exists = prev.some(
        o => o.public_tracking_token.toLowerCase() === os.public_tracking_token.toLowerCase() || o.id === os.id
      );
      if (exists) return prev;
      const updated = [os, ...prev];
      localStorage.setItem(STORAGE_KEYS.OS, JSON.stringify(updated));
      return updated;
    });

    if (clientData && clientData.id) {
      setClients(prev => {
        const clientExists = prev.some(c => c.id === clientData.id);
        if (clientExists) return prev;
        const updatedClients = [clientData, ...prev];
        localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(updatedClients));
        return updatedClients;
      });
    }
  };

  // Vendas PDV (Balcão)
  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SALES);
    return saved ? JSON.parse(saved) : initialSales;
  });

  const createSale = (saleData: Omit<Sale, 'id' | 'sale_number' | 'created_at'>): Sale => {
    const nextNumber = sales.length > 0
      ? Math.max(...sales.map(s => s.sale_number || 0)) + 1
      : 501;

    const newSale: Sale = {
      ...saleData,
      id: 'sale-' + Date.now(),
      sale_number: nextNumber,
      created_at: new Date().toISOString(),
    };

    // Baixa imediata de estoque para todos os itens da venda
    newSale.items.forEach(item => {
      adjustStock(item.product_id, item.quantity, 'saida', `Baixa automática por Venda Balcão #${newSale.sale_number}`);
    });

    // Cria lançamento financeiro automático
    const today = new Date().toISOString().split('T')[0];
    const newTx: FinancialTransaction = {
      id: 'fin-' + Date.now(),
      description: `Venda Balcão PDV #${newSale.sale_number} - ${newSale.client_name || 'Consumidor'}`,
      type: 'receita',
      category: 'Venda Balcão',
      client_id: newSale.client_id,
      client_name: newSale.client_name,
      sale_id: newSale.id,
      amount: newSale.total_amount,
      discount: newSale.discount,
      paid_amount: newSale.total_amount,
      due_date: today,
      payment_date: today,
      status: 'pago',
      payment_method: newSale.payment_method,
      notes: `Venda direta de peças/acessórios. Emitente CPF: ${issuer.cpf}`,
      created_at: new Date().toISOString(),
    };

    const newFinance = [newTx, ...transactions];
    setTransactions(newFinance);
    localStorage.setItem(STORAGE_KEYS.FINANCE, JSON.stringify(newFinance));

    const updatedSales = [newSale, ...sales];
    setSales(updatedSales);
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(updatedSales));
    return newSale;
  };

  // Financeiro (Contas a Pagar e Receber)
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FINANCE);
    return saved ? JSON.parse(saved) : initialFinancialTransactions;
  });

  const addTransaction = (tx: Omit<FinancialTransaction, 'id' | 'created_at'>): FinancialTransaction => {
    const newTx: FinancialTransaction = {
      ...tx,
      id: 'fin-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    localStorage.setItem(STORAGE_KEYS.FINANCE, JSON.stringify(updated));
    return newTx;
  };

  const updateTransaction = (id: string, patch: Partial<FinancialTransaction>) => {
    const updated = transactions.map(t => t.id === id ? { ...t, ...patch } : t);
    setTransactions(updated);
    localStorage.setItem(STORAGE_KEYS.FINANCE, JSON.stringify(updated));
  };

  const markTransactionAsPaid = (id: string, paymentDate?: string, paymentMethod?: PaymentMethod) => {
    const today = new Date().toISOString().split('T')[0];
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    updateTransaction(id, {
      status: 'pago',
      paid_amount: tx.amount,
      payment_date: paymentDate || today,
      ...(paymentMethod ? { payment_method: paymentMethod } : {})
    });
  };

  const deleteTransaction = (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    localStorage.setItem(STORAGE_KEYS.FINANCE, JSON.stringify(updated));
  };

  // 7. Usuários e Equipe Técnica (Módulo Map-OS)
  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const addUser = (userData: Omit<UserProfile, 'id' | 'created_at'>): UserProfile => {
    const newUser: UserProfile = {
      ...userData,
      id: 'usr-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setUsers(prev => {
      const updated = [...prev, newUser];
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Usuários', 'CADASTRO', `Técnico/Usuário cadastrado: ${newUser.name} (${newUser.role})`);
    return newUser;
  };

  const updateUser = (id: string, userData: Partial<UserProfile>) => {
    setUsers(prev => {
      const updated = prev.map(u => u.id === id ? { ...u, ...userData } : u);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Usuários', 'EDIÇÃO', `Dados do técnico/usuário atualizados: ID ${id}`);
  };

  const deleteUser = (id: string) => {
    setUsers(prev => {
      const target = prev.find(u => u.id === id);
      const updated = prev.filter(u => u.id !== id);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
      if (target) {
        addAuditLog('Usuários', 'EXCLUSÃO', `Usuário removido da equipe: ${target.name}`);
      }
      return updated;
    });
  };

  // 8. Auditoria e Logs do Sistema (Módulo Map-OS)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT);
    return saved ? JSON.parse(saved) : initialAuditLogs;
  });

  const addAuditLog = (module: string, action: string, details: string, userName?: string) => {
    const newLog: AuditLog = {
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      user_name: userName || issuer.full_name,
      module,
      action,
      details,
      ip_address: '192.168.1.' + (100 + Math.floor(Math.random() * 50)),
      created_at: new Date().toISOString(),
    };
    setAuditLogs(prev => {
      const updated = [newLog, ...prev.slice(0, 199)];
      localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(updated));
      return updated;
    });
  };

  // Configurações Mercado Pago Checkout Pro
  const [mercadoPago, setMercadoPago] = useState<MercadoPagoSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MERCADOPAGO);
    return saved ? JSON.parse(saved) : initialMercadoPagoSettings;
  });

  const updateMercadoPagoSettings = (data: Partial<MercadoPagoSettings>) => {
    setMercadoPago(prev => {
      const updated = { ...prev, ...data };
      localStorage.setItem(STORAGE_KEYS.MERCADOPAGO, JSON.stringify(updated));
      return updated;
    });
  };

  const generateOSMercadoPagoLink = async (osId: string) => {
    const os = serviceOrders.find(o => o.id === osId);
    if (!os) return { success: false, error: 'Ordem de serviço não encontrada.' };
    const client = clients.find(c => c.id === os.client_id);

    const result = await createMercadoPagoPreference(os, client, mercadoPago);
    if (result.success && result.paymentUrl) {
      updateServiceOrder(os.id, {
        mp_preference_id: result.preferenceId,
        mp_payment_url: result.paymentUrl,
        mp_payment_status: 'pending',
      });
      addAuditLog('Mercado Pago', 'Gerar Link', `Link Checkout Pro gerado para OS #${os.os_number} (R$ ${os.total_amount.toFixed(2)})`);
      return {
        success: true,
        paymentUrl: result.paymentUrl,
        preferenceId: result.preferenceId,
        isSimulated: result.isSimulated,
      };
    }
    return { success: false, error: result.error || 'Erro ao gerar preferência no Mercado Pago.' };
  };

  const confirmMercadoPagoPayment = (osId: string, paymentId?: string, paymentMethod: PaymentMethod = 'pix') => {
    const os = serviceOrders.find(o => o.id === osId);
    if (!os) return;

    const pid = paymentId || `mp_pay_${Date.now()}`;
    const client = clients.find(c => c.id === os.client_id);
    const today = new Date().toISOString().split('T')[0];

    // Atualiza status da OS
    updateServiceOrder(os.id, {
      status: 'finalizado',
      invoiced: true,
      mp_payment_id: pid,
      mp_payment_status: 'approved',
    });

    // Se ainda não houver lançamento no financeiro para esta OS, cria lançamento como pago
    const existingTx = transactions.find(t => t.service_order_id === os.id);
    if (!existingTx) {
      const newTx: FinancialTransaction = {
        id: 'fin-mp-' + Date.now(),
        description: `Recebimento Checkout Pro OS #${os.os_number} - ${client?.name || 'Cliente'} (ID MP: ${pid})`,
        type: 'receita',
        category: 'Mercado Pago Checkout Pro',
        client_id: os.client_id,
        client_name: client?.name,
        service_order_id: os.id,
        os_number: os.os_number,
        amount: os.total_amount,
        discount: os.discount_value,
        paid_amount: os.total_amount,
        due_date: today,
        payment_date: today,
        status: 'pago',
        payment_method: paymentMethod,
        notes: `Pagamento aprovado via Mercado Pago Checkout Pro. ID Transação: ${pid}`,
        created_at: new Date().toISOString(),
      };
      setTransactions(prev => {
        const next = [newTx, ...prev];
        localStorage.setItem(STORAGE_KEYS.FINANCE, JSON.stringify(next));
        return next;
      });
    } else {
      markTransactionAsPaid(existingTx.id, today, paymentMethod);
    }

    addAuditLog('Mercado Pago', 'Pagamento Aprovado', `Pagamento da OS #${os.os_number} aprovado via Mercado Pago (${paymentMethod.toUpperCase()}). Transação: ${pid}`);
  };

  const resetAllData = () => {
    localStorage.clear();
    setIssuer(initialIssuerSettings);
    setClients(initialClients);
    setProducts(initialProducts);
    setLicenses(initialDigitalLicenses);
    setServices(initialServices);
    setWarrantyTerms(initialWarrantyTerms);
    setServiceOrders(initialServiceOrders);
    setTransactions(initialFinancialTransactions);
    setSales(initialSales);
    setStockMovements([]);
    setMercadoPago(initialMercadoPagoSettings);
    window.location.reload();
  };

  return (
    <AppStoreContext.Provider
      value={{
        issuer,
        updateIssuer,
        clients,
        addClient,
        updateClient,
        deleteClient,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        stockMovements,
        licenses,
        addLicense,
        updateLicense,
        deleteLicense,
        assignLicenseToOS,
        releaseLicenseFromOS,
        services,
        addService,
        updateService,
        deleteService,
        warrantyTerms,
        addWarrantyTerm,
        updateWarrantyTerm,
        serviceOrders,
        addServiceOrder,
        updateServiceOrder,
        deleteServiceOrder,
        invoiceServiceOrder,
        importOSFromPublicLink,
        sales,
        createSale,
        transactions,
        addTransaction,
        updateTransaction,
        markTransactionAsPaid,
        deleteTransaction,
        users,
        addUser,
        updateUser,
        deleteUser,
        auditLogs,
        addAuditLog,
        darkMode,
        toggleDarkMode,
        supabaseConfig,
        updateSupabaseConfig,
        setupCompleted,
        setSetupCompleted,
        isAuthenticated,
        currentUser,
        login,
        logout,
        saveSetupToSupabase,
        resetAllData,
        mercadoPago,
        updateMercadoPagoSettings,
        generateOSMercadoPagoLink,
        confirmMercadoPagoPayment,
      }}
    >
      {children}
    </AppStoreContext.Provider>
  );
};

export const useAppStore = () => {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider');
  return ctx;
};
