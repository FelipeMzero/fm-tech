// Supabase Edge Function: Webhook Mercado Pago
// Deploy via: npx supabase functions deploy mercadopago-webhook --no-verify-jwt
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        status: "active",
        service: "FM Tech Mercado Pago Webhook",
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    )
  }

  if (req.method === "POST") {
    try {
      const payload = await req.json()
      console.log("[Mercado Pago Supabase Webhook] Payload:", payload)

      return new Response(
        JSON.stringify({ received: true, status: "ok" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      )
    } catch (e: any) {
      return new Response(JSON.stringify({ received: true, note: e.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      })
    }
  }

  return new Response("Method not allowed", { status: 405 })
})
