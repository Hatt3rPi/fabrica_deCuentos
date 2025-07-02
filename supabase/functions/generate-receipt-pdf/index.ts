import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderItem {
  id: string;
  story_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  story?: {
    id: string;
    title: string;
  };
}

interface OrderData {
  id: string;
  user_id: string;
  total_amount: number;
  currency: string;
  payment_method: string;
  paid_at: string;
  items: OrderItem[];
  user_email: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { order_id } = await req.json()

    if (!order_id) {
      return new Response(
        JSON.stringify({ error: 'order_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Obtener datos de la orden con items
    const { data: orderData, error: orderError } = await supabaseClient
      .from('orders_with_items')
      .select(`
        id,
        user_id,
        total_amount,
        currency,
        payment_method,
        paid_at,
        user_email,
        items:order_items(
          id,
          story_id,
          quantity,
          unit_price,
          total_price,
          story:stories(
            id,
            title
          )
        )
      `)
      .eq('id', order_id)
      .eq('status', 'paid')
      .single()

    if (orderError || !orderData) {
      console.error('Error fetching order:', orderError)
      return new Response(
        JSON.stringify({ error: 'Order not found or not paid' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const order = orderData as OrderData

    // Formatear precio
    const formatPrice = (amount: number) => {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
      }).format(amount)
    }

    // Formatear fecha
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // Generar HTML para el comprobante
    const receiptHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Comprobante de Compra - La CuenterIA</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.4;
          color: #333;
          margin: 0;
          padding: 20px;
          font-size: 12px;
        }
        .receipt {
          max-width: 500px;
          margin: 0 auto;
          border: 1px solid #ddd;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #9333ea;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .company-name {
          font-size: 18px;
          font-weight: bold;
          color: #9333ea;
          margin-bottom: 5px;
        }
        .receipt-title {
          font-size: 16px;
          font-weight: bold;
          margin-top: 10px;
        }
        .order-info {
          margin-bottom: 20px;
        }
        .order-info table {
          width: 100%;
          border-collapse: collapse;
        }
        .order-info td {
          padding: 5px 0;
          border-bottom: 1px solid #eee;
        }
        .order-info td:first-child {
          font-weight: bold;
          width: 40%;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .items-table th {
          background-color: #f8f9fa;
          padding: 8px;
          text-align: left;
          border: 1px solid #ddd;
          font-weight: bold;
        }
        .items-table td {
          padding: 8px;
          border: 1px solid #ddd;
        }
        .total-section {
          border-top: 2px solid #9333ea;
          padding-top: 15px;
          text-align: right;
        }
        .total-amount {
          font-size: 16px;
          font-weight: bold;
          color: #9333ea;
        }
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
          text-align: center;
          font-size: 10px;
          color: #666;
        }
        .payment-method {
          background-color: #f0f0f0;
          padding: 10px;
          border-radius: 5px;
          margin: 10px 0;
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="company-name">La CuenterIA</div>
          <div>Cuentos Infantiles Personalizados</div>
          <div class="receipt-title">COMPROBANTE DE COMPRA DIGITAL</div>
        </div>

        <div class="order-info">
          <table>
            <tr>
              <td>Número de Orden:</td>
              <td>#${order.id.slice(0, 8)}</td>
            </tr>
            <tr>
              <td>Fecha de Compra:</td>
              <td>${formatDate(order.paid_at)}</td>
            </tr>
            <tr>
              <td>Cliente:</td>
              <td>${order.user_email}</td>
            </tr>
            <tr>
              <td>Método de Pago:</td>
              <td>${order.payment_method === 'flow' ? 'Tarjeta (Flow)' : 'WebPay Plus'}</td>
            </tr>
          </table>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cant.</th>
              <th>Precio Unit.</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>${item.story?.title || 'Historia Personalizada'}<br><small>Libro Digital</small></td>
                <td>${item.quantity}</td>
                <td>${formatPrice(item.unit_price)}</td>
                <td>${formatPrice(item.total_price)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-section">
          <div style="margin-bottom: 10px;">
            <strong>Subtotal: ${formatPrice(order.total_amount)}</strong>
          </div>
          <div style="margin-bottom: 10px;">
            IVA (0%): $0
          </div>
          <div class="total-amount">
            TOTAL: ${formatPrice(order.total_amount)}
          </div>
        </div>

        <div class="payment-method">
          <strong>Estado del Pago:</strong> ✅ PAGADO<br>
          <strong>Método:</strong> ${order.payment_method === 'flow' ? 'Tarjeta de Crédito/Débito' : 'WebPay Plus'}
        </div>

        <div class="footer">
          <p>
            <strong>NOTA:</strong> Este es un comprobante de compra digital.<br>
            Los productos fueron entregados digitalmente vía plataforma web.<br>
            Para acceder a sus productos visite: ${Deno.env.get('SITE_URL')}/my-purchases
          </p>
          <p>
            La CuenterIA - Plataforma de Cuentos Infantiles Personalizados<br>
            Soporte: soporte@lacuenteria.cl | Web: ${Deno.env.get('SITE_URL')}
          </p>
          <p>
            Documento generado automáticamente el ${new Date().toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    </body>
    </html>
    `

    // Para una implementación completa, aquí se convertiría el HTML a PDF
    // Por ahora retornamos el HTML para que pueda ser usado directamente
    // En el futuro se puede integrar con librerías como Puppeteer o jsPDF

    return new Response(
      JSON.stringify({ 
        success: true, 
        receipt_html: receiptHtml,
        order_id: order.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in generate-receipt-pdf:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})