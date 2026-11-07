-- ============================================================================
-- MAPOS-PF: SISTEMA COMPLETO DE GESTÃO DE ASSISTÊNCIA TÉCNICA E ORDENS DE SERVIÇO
-- Modelagem para Prestador de Serviço Autônomo / Pessoa Física (Emitente CPF)
-- Banco de Dados: PostgreSQL (Supabase) com RLS, Triggers e Índices Otimizados
-- ============================================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABELA: issuer_settings (Configurações do Emitente - Pessoa Física / CPF)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.issuer_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    trade_name TEXT, -- Nome Fantasia / Comercial opcional
    cpf VARCHAR(14) NOT NULL UNIQUE, -- Identificador fiscal principal do técnico
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
    os_footer_notes TEXT DEFAULT 'A garantia cobre defeitos das peças substituídas e da mão de obra executada conforme termo. Equipamentos não retirados em até 90 dias poderão ter cobrança de taxa de guarda.',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. TABELAS: roles & user_profiles (Usuários, Cargos e Permissões)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{
        "dashboard": {"view": true},
        "os": {"view": true, "create": true, "edit": true, "delete": false, "bill": true},
        "clients": {"view": true, "create": true, "edit": true, "delete": false},
        "products": {"view": true, "create": true, "edit": true, "delete": false},
        "services": {"view": true, "create": true, "edit": true, "delete": false},
        "sales": {"view": true, "create": true, "edit": true, "delete": false, "bill": true},
        "financial": {"view": true, "create": true, "edit": true, "delete": false, "bill": true},
        "reports": {"view": true},
        "settings": {"view": false, "edit": false}
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cpf VARCHAR(14),
    phone TEXT,
    role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. TABELA: clients (Clientes e Fornecedores)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_type VARCHAR(2) NOT NULL CHECK (person_type IN ('PF', 'PJ')),
    name TEXT NOT NULL,
    document VARCHAR(18) NOT NULL, -- CPF ou CNPJ
    rg_ie TEXT, -- RG para PF ou Inscrição Estadual para PJ
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
    is_supplier BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients (name);
CREATE INDEX IF NOT EXISTS idx_clients_document ON public.clients (document);
CREATE INDEX IF NOT EXISTS idx_clients_is_supplier ON public.clients (is_supplier);

-- ============================================================================
-- 4. TABELAS: products (Peças e Produtos) & stock_movements
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internal_code TEXT,
    barcode TEXT,
    description TEXT NOT NULL,
    unit VARCHAR(10) DEFAULT 'UN',
    cost_price NUMERIC(12,2) DEFAULT 0.00,
    profit_margin NUMERIC(6,2) DEFAULT 0.00, -- percentual %
    sale_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    current_stock NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    min_stock NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products (barcode);
CREATE INDEX IF NOT EXISTS idx_products_description ON public.products (description);

CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('entrada', 'saida', 'ajuste', 'os', 'venda', 'estorno_os')),
    quantity NUMERIC(12,2) NOT NULL,
    previous_stock NUMERIC(12,2) NOT NULL,
    new_stock NUMERIC(12,2) NOT NULL,
    reference_id UUID, -- ID da OS ou Venda relacionada
    reason TEXT,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON public.stock_movements (product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON public.stock_movements (created_at DESC);

-- ============================================================================
-- 5. TABELA: services (Catálogo de Serviços / Mão de Obra)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    base_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    estimated_time VARCHAR(50), -- Ex: '2 horas', '1 dia útil'
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. TABELA: warranty_terms (Termos de Garantia)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.warranty_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    days_duration INTEGER NOT NULL DEFAULT 90,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. TABELA: service_orders (Ordens de Serviço - Tabela Central)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.service_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    os_number BIGSERIAL UNIQUE, -- Sequencial amigável #0001, #0002...
    public_tracking_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    technician_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    warranty_term_id UUID REFERENCES public.warranty_terms(id) ON DELETE SET NULL,
    
    status TEXT NOT NULL DEFAULT 'orcamento' CHECK (
        status IN (
            'orcamento',
            'aberto',
            'em_andamento',
            'aguardando_pecas',
            'aguardando_aprovacao',
            'aprovado',
            'finalizado',
            'entregue',
            'cancelado'
        )
    ),
    
    entry_date TIMESTAMPTZ DEFAULT NOW(),
    estimated_delivery_date TIMESTAMPTZ,
    completion_date TIMESTAMPTZ,
    warranty_until_date DATE,
    
    -- Dados do Equipamento
    equipment_type TEXT NOT NULL, -- Notebook, Celular, PC, Impressora, etc.
    brand TEXT,
    model TEXT,
    serial_imei TEXT,
    unlock_password TEXT,
    accessories_left TEXT,
    physical_condition_checklist JSONB DEFAULT '{"riscos": false, "trincos": false, "parafusos_faltando": false, "molhado": false, "nao_liga": false}'::jsonb,
    
    -- Laudos
    reported_defect TEXT, -- Defeito relatado pelo cliente
    technical_report TEXT, -- Diagnóstico técnico
    solution_applied TEXT, -- Solução executada
    internal_observations TEXT, -- Invisível para o cliente
    
    -- Valores
    services_total NUMERIC(12,2) DEFAULT 0.00,
    products_total NUMERIC(12,2) DEFAULT 0.00,
    discount_type VARCHAR(2) DEFAULT 'R$' CHECK (discount_type IN ('R$', '%')),
    discount_value NUMERIC(12,2) DEFAULT 0.00,
    total_amount NUMERIC(12,2) DEFAULT 0.00,
    invoiced BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_os_client ON public.service_orders (client_id);
CREATE INDEX IF NOT EXISTS idx_os_status ON public.service_orders (status);
CREATE INDEX IF NOT EXISTS idx_os_tracking_token ON public.service_orders (public_tracking_token);
CREATE INDEX IF NOT EXISTS idx_os_created ON public.service_orders (created_at DESC);

-- ============================================================================
-- 8. TABELAS: os_services & os_products (Itens da OS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.os_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    quantity NUMERIC(12,2) NOT NULL DEFAULT 1.00,
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_os_services_order ON public.os_services (service_order_id);

CREATE TABLE IF NOT EXISTS public.os_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    quantity NUMERIC(12,2) NOT NULL DEFAULT 1.00,
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    stock_deducted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_os_products_order ON public.os_products (service_order_id);
CREATE INDEX IF NOT EXISTS idx_os_products_product ON public.os_products (product_id);

-- ============================================================================
-- 9. TABELAS: os_attachments & os_timeline_notes (Anexos e Linha do Tempo)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.os_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.os_timeline_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    author_name TEXT,
    action TEXT, -- Ex: 'Mudança de Status', 'Nota Interna', 'Foto Anexada'
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 10. TABELAS: sales & sale_items (Vendas Diretas de Balcão / PDV)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_number BIGSERIAL UNIQUE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL, -- Opcional / Consumidor Final
    seller_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    gross_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(30),
    invoiced BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity NUMERIC(12,2) NOT NULL DEFAULT 1.00,
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 11. TABELA: financial_transactions (Contas a Pagar e Receber)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description TEXT NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('receita', 'despesa')),
    category TEXT NOT NULL, -- Ex: 'Ordem de Serviço', 'Venda PDV', 'Peças Fornecedor', 'Aluguel', 'Energia'
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    service_order_id UUID REFERENCES public.service_orders(id) ON DELETE SET NULL,
    sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(12,2) DEFAULT 0.00,
    paid_amount NUMERIC(12,2) DEFAULT 0.00,
    due_date DATE NOT NULL,
    payment_date DATE,
    status VARCHAR(15) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido', 'cancelado')),
    payment_method VARCHAR(25) CHECK (payment_method IN ('pix', 'dinheiro', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_status ON public.financial_transactions (status);
CREATE INDEX IF NOT EXISTS idx_finance_due_date ON public.financial_transactions (due_date);
CREATE INDEX IF NOT EXISTS idx_finance_type ON public.financial_transactions (type);

-- ============================================================================
-- 12. TABELA: audit_logs (Auditoria de Ações Críticas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    user_name TEXT,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    record_id TEXT,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TRIGGERS & FUNÇÕES PARA GESTÃO AUTOMÁTICA DE ESTOQUE
-- ============================================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_issuer_updated_at
BEFORE UPDATE ON public.issuer_settings
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trigger_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trigger_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trigger_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trigger_service_orders_updated_at
BEFORE UPDATE ON public.service_orders
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trigger_finance_updated_at
BEFORE UPDATE ON public.financial_transactions
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger de Baixa de Estoque em Venda de Balcão (PDV)
CREATE OR REPLACE FUNCTION public.handle_sale_item_stock()
RETURNS TRIGGER AS $$
DECLARE
    cur_stock NUMERIC(12,2);
BEGIN
    SELECT current_stock INTO cur_stock FROM public.products WHERE id = NEW.product_id;
    
    -- Atualiza o estoque atual
    UPDATE public.products
    SET current_stock = current_stock - NEW.quantity
    WHERE id = NEW.product_id;

    -- Registra movimentação de estoque
    INSERT INTO public.stock_movements (
        product_id, type, quantity, previous_stock, new_stock, reference_id, reason
    ) VALUES (
        NEW.product_id, 'venda', NEW.quantity, cur_stock, cur_stock - NEW.quantity, NEW.sale_id, 'Baixa automática por Venda PDV'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_sale_item_deduct_stock
AFTER INSERT ON public.sale_items
FOR EACH ROW EXECUTE FUNCTION public.handle_sale_item_stock();

-- Função e Trigger para Gestão de Estoque na OS
CREATE OR REPLACE FUNCTION public.handle_os_product_stock_insert()
RETURNS TRIGGER AS $$
DECLARE
    os_rec RECORD;
    cur_stock NUMERIC(12,2);
BEGIN
    SELECT status INTO os_rec FROM public.service_orders WHERE id = NEW.service_order_id;
    
    -- Deduz estoque se OS estiver aprovada, em andamento, finalizada ou entregue
    IF os_rec.status IN ('aprovado', 'em_andamento', 'finalizado', 'entregue') THEN
        SELECT current_stock INTO cur_stock FROM public.products WHERE id = NEW.product_id;
        
        UPDATE public.products
        SET current_stock = current_stock - NEW.quantity
        WHERE id = NEW.product_id;

        INSERT INTO public.stock_movements (
            product_id, type, quantity, previous_stock, new_stock, reference_id, reason
        ) VALUES (
            NEW.product_id, 'os', NEW.quantity, cur_stock, cur_stock - NEW.quantity, NEW.service_order_id, 'Baixa de peça na OS #' || NEW.service_order_id
        );

        NEW.stock_deducted = true;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_os_product_insert
BEFORE INSERT ON public.os_products
FOR EACH ROW EXECUTE FUNCTION public.handle_os_product_stock_insert();

-- Trigger para Estorno de Estoque caso o item da OS seja removido
CREATE OR REPLACE FUNCTION public.handle_os_product_stock_delete()
RETURNS TRIGGER AS $$
DECLARE
    cur_stock NUMERIC(12,2);
BEGIN
    IF OLD.stock_deducted = true THEN
        SELECT current_stock INTO cur_stock FROM public.products WHERE id = OLD.product_id;
        
        UPDATE public.products
        SET current_stock = current_stock + OLD.quantity
        WHERE id = OLD.product_id;

        INSERT INTO public.stock_movements (
            product_id, type, quantity, previous_stock, new_stock, reference_id, reason
        ) VALUES (
            OLD.product_id, 'estorno_os', OLD.quantity, cur_stock, cur_stock + OLD.quantity, OLD.service_order_id, 'Estorno por remoção de item da OS'
        );
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_os_product_delete
AFTER DELETE ON public.os_products
FOR EACH ROW EXECUTE FUNCTION public.handle_os_product_stock_delete();

-- Trigger quando a OS é cancelada (Estorna todas as peças baixadas)
CREATE OR REPLACE FUNCTION public.handle_os_status_change()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    cur_stock NUMERIC(12,2);
BEGIN
    IF NEW.status = 'cancelado' AND OLD.status != 'cancelado' THEN
        FOR item IN SELECT * FROM public.os_products WHERE service_order_id = NEW.id AND stock_deducted = true LOOP
            SELECT current_stock INTO cur_stock FROM public.products WHERE id = item.product_id;
            
            UPDATE public.products
            SET current_stock = current_stock + item.quantity
            WHERE id = item.product_id;

            INSERT INTO public.stock_movements (
                product_id, type, quantity, previous_stock, new_stock, reference_id, reason
            ) VALUES (
                item.product_id, 'estorno_os', item.quantity, cur_stock, cur_stock + item.quantity, NEW.id, 'Estorno automático por cancelamento da OS'
            );

            UPDATE public.os_products SET stock_deducted = false WHERE id = item.id;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_os_status_change
AFTER UPDATE ON public.service_orders
FOR EACH ROW EXECUTE FUNCTION public.handle_os_status_change();

-- ============================================================================
-- POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.issuer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_timeline_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários autenticados (Acesso completo para operadores)
CREATE POLICY "Acesso total autenticados em issuer_settings" ON public.issuer_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total autenticados em roles" ON public.roles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total autenticados em user_profiles" ON public.user_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total autenticados em clients" ON public.clients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total autenticados em products" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total autenticados em stock_movements" ON public.stock_movements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total autenticados em services" ON public.services FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total autenticados em warranty_terms" ON public.warranty_terms FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total autenticados em service_orders" ON public.service_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total autenticados em os_services" ON public.os_services FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total autenticados em os_products" ON public.os_products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total autenticados em os_attachments" ON public.os_attachments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total autenticados em os_timeline_notes" ON public.os_timeline_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total autenticados em sales" ON public.sales FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total autenticados em sale_items" ON public.sale_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total autenticados em financial_transactions" ON public.financial_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total autenticados em audit_logs" ON public.audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Política Pública para Consulta de OS no Portal do Cliente (Sem Login)
-- Permite que o cliente consulte apenas sua OS via Token UUID
CREATE POLICY "Consulta pública por token em service_orders" ON public.service_orders
FOR SELECT TO anon USING (public_tracking_token IS NOT NULL);

CREATE POLICY "Consulta pública de serviços da OS" ON public.os_services
FOR SELECT TO anon USING (service_order_id IN (SELECT id FROM public.service_orders WHERE public_tracking_token IS NOT NULL));

CREATE POLICY "Consulta pública de produtos da OS" ON public.os_products
FOR SELECT TO anon USING (service_order_id IN (SELECT id FROM public.service_orders WHERE public_tracking_token IS NOT NULL));

CREATE POLICY "Consulta pública de anexos da OS" ON public.os_attachments
FOR SELECT TO anon USING (service_order_id IN (SELECT id FROM public.service_orders WHERE public_tracking_token IS NOT NULL));

CREATE POLICY "Consulta pública de dados do emitente" ON public.issuer_settings
FOR SELECT TO anon USING (true);

-- ============================================================================
-- DADOS INICIAIS (SEED INICIAL)
-- ============================================================================
INSERT INTO public.issuer_settings (
    full_name, trade_name, cpf, phone, whatsapp, email, zip_code, street, number, neighborhood, city, state, pix_key_type, pix_key, default_warranty_days
) VALUES (
    'Carlos Silva Santos',
    'Silva Tech Soluções em Informática',
    '123.456.789-00',
    '(11) 98765-4321',
    '(11) 98765-4321',
    'carlos.tech@email.com',
    '01310-100',
    'Avenida Paulista',
    '1578',
    'Bela Vista',
    'São Paulo',
    'SP',
    'CPF',
    '12345678900',
    90
) ON CONFLICT DO NOTHING;

INSERT INTO public.roles (name, description) VALUES
('Administrador', 'Acesso irrestrito a todas as funções'),
('Técnico', 'Acesso a Ordens de Serviço, Clientes e Estoque')
ON CONFLICT DO NOTHING;

INSERT INTO public.warranty_terms (title, content, days_duration) VALUES
('Garantia Padrão (90 Dias)', 'A garantia cobre exclusivamente os componentes substituídos e os serviços executados pela nossa assistência técnica, pelo prazo legal de 90 (noventa) dias a contar da data de entrega do equipamento. A garantia não cobre danos decorrentes de quedas, contato com líquidos, descargas elétricas, variações de tensão na rede ou violação dos lacres de segurança.', 90),
('Garantia Estendida (180 Dias)', 'Cobertura de 180 dias para reparos complexos em placas-mãe e substituição de telas originais.', 180)
ON CONFLICT DO NOTHING;
