import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { EdgeFunctionLogger } from '../_shared/logger.ts'
import { configureForEdgeFunction, captureException, withErrorCapture, setTags, setContext } from '../_shared/sentry.ts'

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
  // Initialize Sentry for this request
  configureForEdgeFunction('generate-receipt-pdf', req)
  const logger = new EdgeFunctionLogger('generate-receipt-pdf')

  // Handle CORS
  if (req.method === 'OPTIONS') {
    logger.debug('CORS preflight request handled')
    return new Response('ok', { headers: corsHeaders })
  }

  const operationStart = Date.now()
  logger.startOperation('generate_receipt_pdf')

  try {
    logger.info('Receipt PDF generation request received')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let requestBody;
    try {
      requestBody = await req.json()
    } catch (error) {
      logger.error('Failed to parse request JSON', error)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { order_id } = requestBody

    if (!order_id) {
      logger.warn('Missing order_id in request', { requestBody })
      return new Response(
        JSON.stringify({ error: 'order_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    logger.setContext('order_id', order_id)
    setTags({ 'order.id': order_id })
    logger.info('Processing receipt generation', { order_id })

    // Obtener datos de la orden con items
    logger.debug('Fetching order data for receipt', { order_id })
    
    const orderResult = await withErrorCapture(
      () => supabaseClient
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
        .single(),
      'fetch_order_data_for_receipt',
      { order_id }
    )

    const { data: orderData, error: orderError } = orderResult

    if (orderError || !orderData) {
      logger.error('Failed to fetch order data for receipt', orderError, { 
        order_id,
        error_code: orderError?.code,
        error_message: orderError?.message 
      })
      
      const errorMessage = orderError?.code === 'PGRST116' 
        ? 'Order not found or not paid' 
        : 'Database error while fetching order'
        
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    logger.info('Order data fetched for receipt generation', { 
      order_id,
      user_email: orderData.user_email,
      items_count: orderData.items?.length || 0,
      total_amount: orderData.total_amount
    })

    setContext('user', { email: orderData.user_email })
    setTags({ 
      'user.email': orderData.user_email,
      'order.items_count': orderData.items?.length || 0
    })

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

    const operationDuration = Date.now() - operationStart
    logger.completeOperation('generate_receipt_pdf', operationDuration)
    
    logger.info('Receipt HTML generated successfully', {
      order_id,
      html_length: receiptHtml.length,
      duration_ms: operationDuration
    })

    setContext('receipt_result', {
      html_length: receiptHtml.length,
      success: true,
      duration_ms: operationDuration
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        receipt_html: receiptHtml,
        order_id: order.id,
        generated_at: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const operationDuration = Date.now() - operationStart
    logger.failOperation('generate_receipt_pdf', operationDuration)
    
    logger.error('Unexpected error in generate-receipt-pdf', error, {
      order_id: logger.context.order_id,
      duration_ms: operationDuration
    })

    // Captura crítica en Sentry
    captureException(error, {
      tags: {
        'function': 'generate-receipt-pdf',
        'critical': 'true'
      },
      extra: {
        order_id: logger.context.order_id,
        duration_ms: operationDuration,
        request_method: req.method
      }
    })

    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message || 'Unknown error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})