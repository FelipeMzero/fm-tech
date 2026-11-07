// Serverless Function para Vercel / Netlify / Node.js
// Endpoint: POST /api/mercadopago-webhook
export default async function handler(req: any, res: any) {
  // Configuração CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Se for teste manual ou GET para verificar status
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      message: 'Endpoint de Webhook FM Tech ativo e aguardando POST do Mercado Pago.',
      timestamp: new Date().toISOString()
    });
  }

  // Notificações POST enviadas pelo Mercado Pago
  if (req.method === 'POST') {
    const body = req.body || {};
    const query = req.query || {};
    const action = body.action || body.type || query.topic;
    const paymentId = body.data?.id || body.id || query.id;

    console.log(`[Mercado Pago Webhook Serverless] Ação: ${action}, ID: ${paymentId}`);

    // Mercado Pago exige retorno HTTP 200 rápido (menos de 22 segundos)
    return res.status(200).json({
      status: 'received',
      action,
      paymentId,
      timestamp: new Date().toISOString()
    });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
