# FM Tech - Sistema de Gestão de Assistência Técnica & Ordens de Serviço

> Sistema moderno de gestão de assistência técnica, ordens de serviço (OS), frente de caixa (PDV), estoque e fluxo financeiro, integrado nativamente ao **PostgreSQL / Supabase** e projetado tanto para prestadores autônomos (Pessoa Física - CPF) quanto empresas de assistência e manutenção.

---

## 🚀 Principais Funcionalidades

### ⚙️ 1. Assistente de Setup e Instalação Inicial
* **Setup Automático na Primeira Inicialização:**
  * Vinculação direta com o banco de dados **Supabase** (URL e Chave Anon pública).
  * Cadastro dos dados da assistência técnica **FM Tech** e configuração de chave PIX.
  * Criação do usuário **Administrador Geral** com credenciais de login e acesso irrestrito.

### 📋 2. Ordens de Serviço (OS) Completas
* Ciclo de vida completo (*Orçamento*, *Aberto*, *Em Andamento*, *Aguardando Peças*, *Aguardando Aprovação*, *Finalizado*, *Entregue*, *Cancelado*).
* Checklist físico completo na entrada do equipamento (riscos, trincos, parafusos, marcas de queda, senha e acessórios).
* Atribuição de **Técnico Responsável** por ordem de serviço.
* Adição dinâmica de peças e serviços com **baixa e estorno automático no estoque**.
* Faturamento rápido com geração de contas a receber e recibos.
* Envio direto de status e link de acompanhamento para o **WhatsApp** do cliente em 1 clique.

### 🌐 3. Portal Público do Cliente (Sem necessidade de login)
* Consulta e acompanhamento da OS em tempo real via **Token Seguro de 128 bits (UUID v4)** em `/acompanhar/:token`.
* Visualização de laudos técnicos, fotos do reparo, valores e botão para aprovação direta do orçamento.

### 🛒 4. Frente de Caixa (PDV) & Controle de Estoque
* Venda rápida de balcão de acessórios e peças avulsas sem necessidade de abrir OS.
* Alerta visual de estoque mínimo e cálculo de margem de lucro sugerida (padrão 40%).

### 👥 5. Gestão de Equipe & Usuários (Map-OS Core)
* Cadastro de colaboradores com perfis dedicados (*Técnico Responsável*, *Atendente / Caixa* e *Administrador*).
* Controle de status de técnicos ativos para vinculação nas ordens de serviço.

### 🛡️ 6. Auditoria & Logs de Operações
* Trilha de auditoria completa registrando todas as operações críticas: criação de OS, faturamento, baixas de estoque, exclusões e cadastros com usuário, IP e timestamp.

### 🖨️ 7. Impressões e Documentos
* **Bobina Térmica:** Formatação otimizada para impressoras térmicas ESC/POS padrão de **80mm** e compactas de **58mm**.
* **Folha A4:** Ordem de serviço detalhada com checklist, termo de garantia legal (**90 dias CDC Art. 26**), via do cliente/oficina e QR Code PIX dinâmico.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologias |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Tailwind CSS, Lucide React, Vite |
| **Backend / API** | Node.js, Express, TypeScript, Zod, BRCode EMV Generator |
| **Banco de Dados** | PostgreSQL via **Supabase** (com RLS, Triggers e Views) |
| **Empacotamento** | Python (Pillow) & PyInstaller para automações e executável |

---

## 💻 Como Rodar o Projeto Localmente

### 1. Pré-requisitos
* **Node.js** >= 18
* **npm** ou **yarn**

### 2. Instalação e Execução

```bash
# Clone o repositório
git clone https://github.com/FelipeMzero/fm-tech.git

# Acesse o diretório
cd fm-tech

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

Abra o navegador no endereço indicado (normalmente `http://localhost:5173`). O **Assistente de Setup Inicial** será exibido para você conectar o Supabase e cadastrar o administrador.

### 3. Configuração do Supabase (PostgreSQL)

Execute o script SQL disponível em [`supabase/schema.sql`](supabase/schema.sql) dentro do **SQL Editor** do seu painel Supabase. Ele criará automaticamente:
* As 12 tabelas relacionais do sistema.
* Triggers de baixa e estorno automático de estoque.
* Políticas de segurança RLS (Row Level Security).
* Tabela de logs de auditoria e configurações de emitente.

---

## 📄 Licença

Distribuído sob a licença MIT. Consulte `LICENSE` para mais informações.
