import { Resend } from 'npm:resend@3.2.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, token } = await req.json();

    if (!email || !token) {
      throw new Error('Email and token are required');
    }

    // Initialize Resend client
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    // Send email
    await resend.emails.send({
      from: 'no-reply@fabrica.com',
      to: email,
      subject: 'Recuperación de contraseña - La CuenterIA',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #7C3AED; text-align: center;">La CuenterIA</h1>
          <p>Has solicitado restablecer tu contraseña. Utiliza el siguiente código para continuar:</p>
          <div style="background-color: #F3F4F6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <code style="font-size: 24px; letter-spacing: 4px;">${token}</code>
          </div>
          <p style="color: #6B7280; font-size: 14px;">
            Este código expirará en 10 minutos. Si no solicitaste restablecer tu contraseña, puedes ignorar este mensaje.
          </p>
        </div>
      `
    });

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error sending reset email:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});