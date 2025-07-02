import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'
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
    cover_url?: string;
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
  configureForEdgeFunction('send-purchase-confirmation', req)
  const logger = new EdgeFunctionLogger('send-purchase-confirmation')

  // Handle CORS
  if (req.method === 'OPTIONS') {
    logger.debug('CORS preflight request handled')
    return new Response('ok', { headers: corsHeaders })
  }

  const operationStart = Date.now()
  logger.startOperation('send_purchase_confirmation_email')

  try {
    logger.info('Purchase confirmation email request received')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

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
    logger.info('Processing purchase confirmation', { order_id })

    // Obtener datos de la orden con items y usuario
    logger.debug('Fetching order data from database', { order_id })
    
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
              title,
              cover_url
            )
          )
        `)
        .eq('id', order_id)
        .eq('status', 'paid')
        .single(),
      'fetch_order_data',
      { order_id }
    )

    const { data: orderData, error: orderError } = orderResult

    if (orderError || !orderData) {
      logger.error('Failed to fetch order data', orderError, { 
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

    logger.info('Order data fetched successfully', { 
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
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // Generar HTML del email
    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Confirmación de Compra - La CuenterIA</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f8f9fa;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%);
          padding: 40px 30px;
          text-align: center;
          color: white;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .content {
          padding: 30px;
        }
        .success-badge {
          background-color: #10b981;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          display: inline-block;
          margin-bottom: 20px;
        }
        .order-summary {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          padding-bottom: 15px;
          border-bottom: 1px solid #e2e8f0;
        }
        .order-id {
          font-size: 14px;
          color: #64748b;
        }
        .order-total {
          font-size: 18px;
          font-weight: 700;
          color: #9333ea;
        }
        .story-item {
          display: flex;
          align-items: center;
          padding: 15px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .story-item:last-child {
          border-bottom: none;
        }
        .story-thumbnail {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          background-color: #e2e8f0;
          margin-right: 15px;
          object-fit: cover;
        }
        .story-info {
          flex: 1;
        }
        .story-title {
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 5px 0;
        }
        .story-details {
          font-size: 14px;
          color: #64748b;
        }
        .status-info {
          background-color: #fef3c7;
          border: 1px solid #fcd34d;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
          text-align: center;
        }
        .status-info h3 {
          margin: 0 0 5px 0;
          color: #92400e;
          font-size: 16px;
        }
        .status-info p {
          margin: 0;
          color: #b45309;
          font-size: 14px;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%);
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          margin: 10px 5px;
          text-align: center;
        }
        .footer {
          background-color: #f8fafc;
          padding: 20px 30px;
          text-align: center;
          color: #64748b;
          font-size: 14px;
        }
        .footer a {
          color: #9333ea;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>La CuenterIA</h1>
          <div class="success-badge">✓ Compra confirmada</div>
        </div>

        <div class="content">
          <h2>¡Gracias por tu compra!</h2>
          <p>Tu pedido ha sido procesado exitosamente. Aquí tienes los detalles:</p>

          <div class="order-summary">
            <div class="order-header">
              <div>
                <div class="order-id">Orden #${order.id.slice(0, 8)}</div>
                <div style="font-size: 14px; color: #64748b;">${formatDate(order.paid_at)}</div>
              </div>
              <div class="order-total">${formatPrice(order.total_amount)}</div>
            </div>

            ${order.items.map(item => `
              <div class="story-item">
                ${item.story?.cover_url ? 
                  `<img src="${item.story.cover_url}" alt="${item.story?.title}" class="story-thumbnail">` :
                  `<div class="story-thumbnail"></div>`
                }
                <div class="story-info">
                  <div class="story-title">${item.story?.title || 'Historia personalizada'}</div>
                  <div class="story-details">Libro Digital × ${item.quantity}</div>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="status-info">
            <h3>🎨 Generando tus libros</h3>
            <p>Estamos creando tus libros digitales personalizados. Te notificaremos cuando estén listos para descargar (puede tomar unos minutos).</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get('SITE_URL')}/purchase-confirmation/${order.id}" class="cta-button">
              Ver detalles de compra
            </a>
            <a href="${Deno.env.get('SITE_URL')}/my-purchases" class="cta-button">
              Mis compras
            </a>
          </div>

          <p style="color: #64748b; font-size: 14px;">
            Si tienes alguna pregunta sobre tu pedido, no dudes en contactarnos.
          </p>
        </div>

        <div class="footer">
          <p>
            Este email fue enviado por <a href="${Deno.env.get('SITE_URL')}">La CuenterIA</a><br>
            <a href="${Deno.env.get('SITE_URL')}/my-purchases">Ver mis compras</a>
          </p>
        </div>
      </div>
    </body>
    </html>
    `

    // Enviar email
    logger.info('Sending purchase confirmation email', {
      order_id,
      recipient: order.user_email,
      subject: `✅ Compra confirmada - Orden #${order.id.slice(0, 8)}`
    })

    const emailResult = await withErrorCapture(
      () => resend.emails.send({
        from: 'La CuenterIA <no-reply@fabrica.com>',
        to: [order.user_email],
        subject: `✅ Compra confirmada - Orden #${order.id.slice(0, 8)}`,
        html: emailHtml,
      }),
      'send_email',
      { 
        order_id,
        recipient: order.user_email 
      }
    )

    const { data: emailData, error: emailError } = emailResult

    if (emailError) {
      logger.error('Failed to send purchase confirmation email', emailError, {
        order_id,
        recipient: order.user_email,
        error_type: emailError.name || 'ResendError'
      })
      
      // Enviar alerta crítica a Sentry
      captureException(emailError, {
        tags: {
          'operation': 'send_purchase_confirmation_email',
          'order.id': order_id,
          'critical': 'true'
        },
        extra: {
          order_id,
          recipient: order.user_email,
          resend_error: emailError
        }
      })

      return new Response(
        JSON.stringify({ 
          error: 'Failed to send confirmation email', 
          details: emailError.message || 'Unknown email service error'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const operationDuration = Date.now() - operationStart
    logger.completeOperation('send_purchase_confirmation_email', operationDuration)
    
    logger.info('Purchase confirmation email sent successfully', {
      order_id,
      email_id: emailData?.id,
      recipient: order.user_email,
      duration_ms: operationDuration
    })

    setContext('email_result', {
      email_id: emailData?.id,
      success: true,
      duration_ms: operationDuration
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Purchase confirmation email sent successfully',
        email_id: emailData?.id,
        order_id 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const operationDuration = Date.now() - operationStart
    logger.failOperation('send_purchase_confirmation_email', operationDuration)
    
    logger.error('Unexpected error in send-purchase-confirmation', error, {
      order_id: logger.context.order_id,
      duration_ms: operationDuration
    })

    // Captura crítica en Sentry
    captureException(error, {
      tags: {
        'function': 'send-purchase-confirmation',
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