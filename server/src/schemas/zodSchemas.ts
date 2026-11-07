import { z } from 'zod';
import { isValidCPF, isValidCNPJ } from '../utils/cpfCnpjValidator.js';

// Validador customizado Zod para CPF ou CNPJ
export const documentValidator = z.string().refine((val) => {
  const clean = val.replace(/\D/g, '');
  if (clean.length === 11) return isValidCPF(clean);
  if (clean.length === 14) return isValidCNPJ(clean);
  return false;
}, {
  message: 'Documento CPF ou CNPJ inválido perante algoritmo de validação',
});

// Schema de Configuração do Emitente (Pessoa Física / CPF)
export const issuerSettingsSchema = z.object({
  full_name: z.string().min(3, 'Nome completo deve ter no mínimo 3 caracteres'),
  trade_name: z.string().optional().nullable(),
  cpf: z.string().refine(isValidCPF, { message: 'CPF do emitente inválido' }),
  rg: z.string().optional().nullable(),
  municipal_registration: z.string().optional().nullable(),
  phone: z.string().min(8, 'Telefone inválido'),
  whatsapp: z.string().min(8, 'WhatsApp inválido'),
  email: z.string().email('E-mail inválido'),
  zip_code: z.string().min(8, 'CEP inválido'),
  street: z.string().min(2, 'Logradouro obrigatório'),
  number: z.string().min(1, 'Número obrigatório'),
  complement: z.string().optional().nullable(),
  neighborhood: z.string().min(1, 'Bairro obrigatório'),
  city: z.string().min(2, 'Cidade obrigatória'),
  state: z.string().length(2, 'UF deve ter 2 letras'),
  logo_url: z.string().url().optional().nullable(),
  signature_url: z.string().url().optional().nullable(),
  pix_key_type: z.enum(['CPF', 'Email', 'Telefone', 'Aleatória']),
  pix_key: z.string().min(3, 'Chave PIX obrigatória'),
  default_warranty_days: z.number().int().min(0).default(90),
  os_footer_notes: z.string().optional().nullable(),
});

// Schema de Cliente
export const clientSchema = z.object({
  person_type: z.enum(['PF', 'PJ']),
  name: z.string().min(3, 'Nome obrigatório'),
  document: documentValidator,
  rg_ie: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  zip_code: z.string().optional().nullable(),
  street: z.string().optional().nullable(),
  number: z.string().optional().nullable(),
  complement: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().length(2).optional().nullable(),
  is_supplier: z.boolean().default(false),
  notes: z.string().optional().nullable(),
});

// Schema de Ordem de Serviço
export const serviceOrderSchema = z.object({
  client_id: z.string().uuid('Cliente obrigatório'),
  technician_id: z.string().uuid().optional().nullable(),
  warranty_term_id: z.string().uuid().optional().nullable(),
  status: z.enum([
    'orcamento',
    'aberto',
    'em_andamento',
    'aguardando_pecas',
    'aguardando_aprovacao',
    'aprovado',
    'finalizado',
    'entregue',
    'cancelado'
  ]).default('orcamento'),
  estimated_delivery_date: z.string().optional().nullable(),
  equipment_type: z.string().min(2, 'Tipo de equipamento obrigatório'),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  serial_imei: z.string().optional().nullable(),
  unlock_password: z.string().optional().nullable(),
  accessories_left: z.string().optional().nullable(),
  physical_condition_checklist: z.record(z.any()).optional().default({}),
  reported_defect: z.string().min(2, 'Defeito relatado obrigatório'),
  technical_report: z.string().optional().nullable(),
  solution_applied: z.string().optional().nullable(),
  internal_observations: z.string().optional().nullable(),
  discount_type: z.enum(['R$', '%']).default('R$'),
  discount_value: z.number().min(0).default(0),
});
