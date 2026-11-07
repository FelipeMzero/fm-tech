import express, { Request, Response } from 'express';
import cors from 'cors';
import { supabaseAdmin } from './supabase.js';
import { generatePixPayload } from './utils/pixPayload.js';
import { issuerSettingsSchema, serviceOrderSchema, clientSchema } from './schemas/zodSchemas.js';

const app = express();
app.use(cors());
app.use(express.json());

// Rota de Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', system: 'MapOS PF (Emitente CPF)', version: '1.0.0' });
});

// 1. Configurações do Emitente (Pessoa Física - CPF)
app.get('/api/issuer', async (req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin.from('issuer_settings').select('*').limit(1).single();
  if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
  res.json(data || {});
});

app.put('/api/issuer', async (req: Request, res: Response) => {
  const parsed = issuerSettingsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.format() });
  
  const { data: existing } = await supabaseAdmin.from('issuer_settings').select('id').limit(1).single();
  
  let result;
  if (existing?.id) {
    result = await supabaseAdmin.from('issuer_settings').update(parsed.data).eq('id', existing.id).select().single();
  } else {
    result = await supabaseAdmin.from('issuer_settings').insert(parsed.data).select().single();
  }

  if (result.error) return res.status(500).json({ error: result.error.message });
  res.json(result.data);
});

// 2. Geração Dinâmica de Payload PIX (BRCode EMV) com valor da OS/Venda
app.post('/api/pix/payload', async (req: Request, res: Response) => {
  const { amount, txId, description } = req.body;
  
  // Busca a chave PIX e dados do emitente no banco
  const { data: issuer } = await supabaseAdmin.from('issuer_settings').select('*').limit(1).single();
  if (!issuer || !issuer.pix_key) {
    return res.status(400).json({ error: 'Chave PIX do emitente não configurada.' });
  }

  const payload = generatePixPayload({
    pixKey: issuer.pix_key,
    merchantName: issuer.trade_name || issuer.full_name,
    merchantCity: issuer.city || 'BRASIL',
    amount: Number(amount) || 0,
    txId: txId || 'OS',
    description: description || 'Servico de Assistencia Tecnica',
  });

  res.json({ payload });
});

// 3. Consulta Pública da OS por Token (Acesso do Cliente sem autenticação)
app.get('/api/public/os/:token', async (req: Request, res: Response) => {
  const { token } = req.params;
  const { data: os, error } = await supabaseAdmin
    .from('service_orders')
    .select(`
      *,
      client:clients(name, phone),
      services:os_services(*),
      products:os_products(*),
      attachments:os_attachments(*)
    `)
    .eq('public_tracking_token', token)
    .single();

  if (error || !os) return res.status(404).json({ error: 'Ordem de Serviço não encontrada.' });

  // Busca dados do emitente para o cabeçalho público
  const { data: issuer } = await supabaseAdmin.from('issuer_settings').select('trade_name, full_name, phone, whatsapp, pix_key, pix_key_type').limit(1).single();

  res.json({ os, issuer });
});

// 4. Endpoint Oficial de Webhooks do Mercado Pago (Recebe POST e responde HTTP 200 OK)
app.all('/api/mercadopago/webhook', async (req: Request, res: Response) => {
  console.log(`[Mercado Pago Webhook] Requisição recebida (${req.method}):`, req.body || req.query);

  // Health check manual ou ping do painel do Mercado Pago
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      message: 'Endpoint de Webhook do Mercado Pago ativo e pronto para receber notificações POST.',
      timestamp: new Date().toISOString()
    });
  }

  // Notificação POST oficial do Mercado Pago (payment.created, payment.updated, etc.)
  const body = req.body || {};
  const topic = req.query.topic || body.type || body.action;
  const paymentId = req.query.id || body.data?.id || body.id;

  console.log(`[Mercado Pago Webhook] Tópico: ${topic}, ID: ${paymentId}`);

  // Se houver ID de pagamento e token configurado, consulta a API e atualiza status
  if (paymentId && (topic === 'payment' || String(body.action).startsWith('payment.'))) {
    try {
      const accessToken = process.env.MP_ACCESS_TOKEN;
      if (accessToken) {
        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (mpRes.ok) {
          const paymentData = await mpRes.json();
          console.log(`[Mercado Pago Webhook] Pagamento #${paymentId} status: ${paymentData.status}`);
          
          if (paymentData.status === 'approved' && paymentData.external_reference) {
            // external_reference: fmt_os_{id}_num_{os_number}_hash_{token}
            const match = String(paymentData.external_reference).match(/fmt_os_([a-zA-Z0-9_-]+)_num_/);
            const osId = match ? match[1] : null;
            if (osId) {
              await supabaseAdmin.from('service_orders').update({
                status: 'finalizado',
                invoiced: true,
                mp_payment_id: String(paymentId),
                mp_payment_status: 'approved'
              }).eq('id', osId);
              console.log(`[Mercado Pago Webhook] OS #${osId} atualizada para finalizado e faturada!`);
            }
          }
        }
      }
    } catch (err) {
      console.error('[Mercado Pago Webhook] Erro ao consultar pagamento na API:', err);
    }
  }

  // O Mercado Pago exige resposta HTTP 200 (ou 201) em até 22 segundos
  return res.status(200).send('OK');
});

const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`MapOS PF Backend rodando na porta ${PORT}`);
  });
}

export default app;
