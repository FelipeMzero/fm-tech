export type PersonType = 'PF' | 'PJ';
export type PixKeyType = 'CPF' | 'Email' | 'Telefone' | 'Aleatória';
export type OSStatus = 
  | 'orcamento'
  | 'aberto'
  | 'em_andamento'
  | 'aguardando_pecas'
  | 'aguardando_aprovacao'
  | 'aprovado'
  | 'aguardando_pagamento'
  | 'finalizado'
  | 'entregue'
  | 'cancelado';

export type DiscountType = 'R$' | '%';
export type TransactionType = 'receita' | 'despesa';
export type TransactionStatus = 'pendente' | 'pago' | 'vencido' | 'cancelado';
export type PaymentMethod = 'pix' | 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'boleto' | 'transferencia';
export type StockMovementType = 'entrada' | 'saida' | 'ajuste' | 'os' | 'venda' | 'estorno_os';

export interface IssuerSettings {
  id: string;
  full_name: string; // Nome Completo do Técnico / Emitente PF
  trade_name?: string; // Nome Comercial / Fantasia
  cpf: string; // CPF do Emitente (Identificador fiscal principal)
  rg?: string;
  municipal_registration?: string;
  phone: string;
  whatsapp: string;
  email: string;
  zip_code: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  logo_url?: string;
  signature_url?: string;
  pix_key_type: PixKeyType;
  pix_key: string;
  default_warranty_days: number;
  os_footer_notes?: string;
  updated_at: string;
}

export interface Client {
  id: string;
  person_type: PersonType;
  name: string;
  document: string; // CPF ou CNPJ
  rg_ie?: string;
  phone: string;
  whatsapp: string;
  email?: string;
  zip_code?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  is_supplier?: boolean;
  notes?: string;
  created_at: string;
}

export interface Product {
  id: string;
  internal_code?: string;
  barcode?: string;
  description: string;
  unit: string;
  cost_price: number;
  profit_margin: number;
  sale_price: number;
  current_stock: number;
  min_stock: number;
  active: boolean;
  created_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  product_name?: string;
  type: StockMovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reference_id?: string;
  reason?: string;
  created_at: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  estimated_time?: string;
  active: boolean;
  created_at: string;
}

export interface WarrantyTerm {
  id: string;
  title: string;
  content: string;
  days_duration: number;
  created_at: string;
}

export interface OSServiceItem {
  id: string;
  service_order_id: string;
  service_id?: string;
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface OSProductItem {
  id: string;
  service_order_id: string;
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  stock_deducted: boolean;
}

export type LicenseStatus = 'disponivel' | 'em_uso' | 'expirado' | 'cancelado';
export type LicenseCategory = 'sistema_operacional' | 'office' | 'antivirus' | 'utilitario' | 'servidor' | 'outro';

export interface DigitalLicense {
  id: string;
  name: string; // Ex: Windows 11 Pro, Office 2021, Kaspersky
  category: LicenseCategory;
  license_key: string; // Chave de Ativação / Serial
  status: LicenseStatus;
  cost_price: number;
  sale_price: number;
  supplier?: string;
  duration?: string; // Ex: 'Vitalícia', '1 Ano', 'Mensal'
  notes?: string; // Instruções de ativação / links
  service_order_id?: string;
  os_number?: number;
  client_id?: string;
  client_name?: string;
  assigned_at?: string;
  created_at: string;
}

export interface OSLicenseItem {
  id: string;
  service_order_id?: string;
  license_id?: string;
  name: string;
  category?: LicenseCategory;
  license_key: string;
  unit_price: number;
}

export interface OSAttachment {
  id: string;
  service_order_id: string;
  file_url: string;
  file_name: string;
  file_type?: string;
  file_size?: number;
  caption?: string;
  created_at: string;
}

export interface OSTimelineNote {
  id: string;
  service_order_id: string;
  author_name: string;
  action: string;
  note: string;
  created_at: string;
}

export interface PhysicalConditionChecklist {
  riscos?: boolean;
  trincos?: boolean;
  parafusos_faltando?: boolean;
  molhado?: boolean;
  nao_liga?: boolean;
  marcas_queda?: boolean;
  outros_detalhes?: string;
}

export type OSType = 'manutencao' | 'licenca_digital' | 'hibrido';

export interface DigitalServiceDetails {
  product_name?: string;
  license_id?: string;
  license_key?: string;
  customer_email?: string;
  target_device?: string; // ex: "PC Escritório", "Notebook Dell"
  delivery_method?: 'whatsapp' | 'email' | 'remoto' | 'balcao';
  activation_instructions?: string;
}

export interface ServiceOrder {
  id: string;
  os_number: number;
  os_type?: OSType;
  digital_service_details?: DigitalServiceDetails;
  public_tracking_token: string;
  client_id: string;
  client?: Client;
  technician_name?: string;
  warranty_term_id?: string;
  warranty_term?: WarrantyTerm;
  status: OSStatus;
  entry_date: string;
  estimated_delivery_date?: string;
  completion_date?: string;
  warranty_until_date?: string;
  
  // Equipamento
  equipment_type: string;
  brand?: string;
  model?: string;
  serial_imei?: string;
  unlock_password?: string;
  accessories_left?: string;
  physical_condition_checklist: PhysicalConditionChecklist;
  
  // Laudos
  reported_defect: string;
  technical_report?: string;
  solution_applied?: string;
  internal_observations?: string;
  
  // Valores
  services_total: number;
  products_total: number;
  licenses_total?: number;
  discount_type: DiscountType;
  discount_value: number;
  total_amount: number;
  invoiced: boolean;
  
  // Mercado Pago Checkout Pro
  mp_preference_id?: string;
  mp_payment_url?: string;
  mp_payment_id?: string;
  mp_payment_status?: 'pending' | 'approved' | 'rejected' | 'in_process';

  // Relações em memória / aninhadas
  services: OSServiceItem[];
  products: OSProductItem[];
  licenses?: OSLicenseItem[];
  attachments: OSAttachment[];
  timeline: OSTimelineNote[];
  created_at: string;
}

export interface SaleItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  sale_number: number;
  client_id?: string;
  client_name?: string;
  gross_total: number;
  discount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  invoiced: boolean;
  items: SaleItem[];
  created_at: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'tecnico' | 'atendente';
  phone?: string;
  active: boolean;
  avatar_url?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_name: string;
  action: string;
  module: string;
  details: string;
  ip_address?: string;
  created_at: string;
}

export interface FinancialTransaction {
  id: string;
  description: string;
  type: TransactionType;
  category: string;
  client_id?: string;
  client_name?: string;
  service_order_id?: string;
  os_number?: number;
  sale_id?: string;
  amount: number;
  discount: number;
  paid_amount: number;
  due_date: string;
  payment_date?: string;
  status: TransactionStatus;
  payment_method?: PaymentMethod;
  mp_preference_id?: string;
  mp_payment_id?: string;
  mp_payment_url?: string;
  notes?: string;
  created_at: string;
}

export interface MercadoPagoSettings {
  enabled: boolean;
  sandbox: boolean;
  access_token: string;
  public_key: string;
  client_id?: string;
  client_secret?: string;
  statement_descriptor?: string; // Nome na fatura do cartão (ex: FMTECH)
  max_installments: number; // Máximo de parcelas (ex: 12)
  auto_return: 'approved' | 'all';
  notification_url?: string;
  last_tested_at?: string;
}

export interface MercadoPagoPreference {
  id: string;
  init_point: string;
  sandbox_init_point: string;
  external_reference: string;
  created_at: string;
}
