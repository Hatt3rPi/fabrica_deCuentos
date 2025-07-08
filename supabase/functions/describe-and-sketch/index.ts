import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { logPromptMetric, getUserId } from '../_shared/metrics.ts';
import { startInflightCall, endInflightCall } from '../_shared/inflight.ts';
import { isActivityEnabled } from '../_shared/stages.ts';
import { encode as base64Encode } from "https://deno.land/std@0.203.0/encoding/base64.ts";
import { generateWithOpenAI } from "../_shared/openai.ts";
import { configureForEdgeFunction, captureException, setUser, setTags } from '../_shared/sentry.ts';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false, autoRefreshToken: false } }
);
const FILE = 'describe-and-sketch';
const STAGE = 'personajes';
const ACTIVITY = 'miniatura';

// Valida si la cadena es:
//  • Un data URI de imagen
//  • Un base64 puro
//  • O una URL HTTP(S)
function isValidBase64Image(str: string) {
  if (!str) return false;
  try {
    if (str.startsWith('data:image/')) {
      const base64 = str.split(',')[1];
      return !!(base64 && base64.length);
    }
    if (str.startsWith('http://') || str.startsWith('https://')) {
      return true;
    }
    return /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/.test(str);
  } catch {
    return false;
  }
}

function sanitizeText(text: unknown): string {
  if (!text) return '';
  if (typeof text === 'object' && text !== null && 'es' in (text as any)) {
    return sanitizeText((text as any).es);
  }
  const s = String(text);
  return s.replace(/[^\w\s.,!?-]/g, '').trim().slice(0, 500);
}

function validatePayload(payload: any) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid request payload');
  }
  return {
    imageBase64: payload.imageBase64 != null
      ? String(payload.imageBase64)
      : payload.referenceImage != null
        ? String(payload.referenceImage)
        : null,
    userNotes: String(payload.userNotes || ''),   // ← solo de userNotes
    name:      String(payload.name || ''),
    age:       String(payload.age || '')
  };
}

// Helper: extrae el parámetro ?url=…
function getQueryUrl(request: Request): string | null {
  try {
    const url = new URL(request.url);
    return url.searchParams.get("url");
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let promptId: string | undefined;
  let userId: string | null = null;
  let apiModel = '';

  try {

    // 1) Config y prompts
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) throw new Error('Falta la clave de API de OpenAI');
    const { data: promptRow } = await supabaseAdmin
      .from('prompts')
      .select('id, content, endpoint, model, size, quality, width, height')
      .eq('type', 'PROMPT_CREAR_MINIATURA_PERSONAJE')
      .single();
    const characterPrompt = promptRow?.content || '';
    const apiEndpoint = promptRow?.endpoint || 'https://api.openai.com/v1/images/edits';
    apiModel = promptRow?.model || 'gpt-image-1';
    promptId = promptRow?.id;
    if (!characterPrompt) throw new Error('Falta el prompt de generación de personaje');

    userId = await getUserId(req);
    
    // Configurar contexto de usuario en Sentry
    if (userId) {
      setUser({ id: userId });
    }
    
    // Configurar tags básicos
    setTags({
      'function.name': 'describe-and-sketch'
    });
const enabled = await isActivityEnabled(STAGE, ACTIVITY);
    if (!enabled) {
      return new Response(
        JSON.stringify({ error: 'Actividad deshabilitada' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    await startInflightCall({
      user_id: userId,
      etapa: STAGE,
      actividad: ACTIVITY,
      modelo: apiModel,
      input: { promptType: 'PROMPT_CREAR_MINIATURA_PERSONAJE' }
    });

    // 2) Payload
    const rawPayload = await req.json().catch(() => {
      throw new Error('Payload JSON inválido');
    });
    const { imageBase64, userNotes, name, age } = validatePayload(rawPayload);

    // 3) Sanitización
    const sanitizedName  = sanitizeText(name);
    const sanitizedAge   = sanitizeText(age);
    const sanitizedNotes = sanitizeText(userNotes);
    if (!sanitizedNotes && !imageBase64) {
      throw new Error('Se requiere una descripción o una imagen');
    }
    if (imageBase64 && !isValidBase64Image(imageBase64)) {
      throw new Error('Formato de imagen inválido');
    }

    // 4) Construir prompt
    const notesForPrompt = sanitizedNotes.trim() || 'sin información';
    let imagePrompt = characterPrompt
      .replace(/\$\{name\}/g, sanitizedName)
      .replace(/\$\{sanitizedAge\}/g, sanitizedAge)
      .replace(/\$\{age\}/g, sanitizedAge)
      .replace(
        /\$\{sanitizedNotes(?:\s*\|\|\s*'sin información')?\}/g,
        notesForPrompt
      )
      .replace(/\$\{notes\}/g, notesForPrompt);

    // 5) Descargar referencia y preparar ArrayBuffer/Blob con MIME correcto
    let refBuf: ArrayBuffer;

    // Si imageBase64 es un data URI (p. ej. "data:image/png;base64,AAA...")
    if (imageBase64!.startsWith("data:image/")) {
      const [, b64data] = imageBase64!.split(",");
      // Decodificamos base64 a binario usando la función global atob de Deno
      const binaryString = atob(b64data);
      const arr = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        arr[i] = binaryString.charCodeAt(i);
      }
      refBuf = arr.buffer;
    }
    // Si imageBase64 parece ser un base64 puro (sin prefijo "data:image/...")
    else if (/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/.test(imageBase64!)) {
      const binaryString = atob(imageBase64!);
      const arr = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        arr[i] = binaryString.charCodeAt(i);
      }
      refBuf = arr.buffer;
    }
    // Si no es data URI ni base64, asumimos que es una URL HTTP/S
    else {
      // Convertir URL localhost a URL interna de Docker para desarrollo local
      let processedImageUrl = imageBase64!;
      if (imageBase64!.includes('127.0.0.1:54321') || imageBase64!.includes('localhost:54321')) {
        processedImageUrl = imageBase64!.replace('http://127.0.0.1:54321', 'http://supabase_kong_supabase:8000')
                                       .replace('http://localhost:54321', 'http://supabase_kong_supabase:8000');
      }
      
      const refRes = await fetch(processedImageUrl);
      if (!refRes.ok) {
        throw new Error(`No se pudo descargar la imagen de referencia: ${refRes.status}`);
      }
      refBuf = await refRes.arrayBuffer();
    }

    // A partir de refBuf determinamos la extensión y MIME para el Blob
    let ext = "";
    let mimeType = "image/png";
    if (imageBase64!.startsWith("data:image/")) {
      const match = imageBase64!.match(/^data:(image\/[a-zA-Z]+);base64,/);
      if (match) {
        mimeType = match[1];
        ext = mimeType.split("/")[1];
      }
    }
    if (!ext) {
      const urlPath = new URL(imageBase64!).pathname;
      ext = urlPath.split(".").pop()!.toLowerCase();
      const mimeMap: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        webp: "image/webp"
      };
      mimeType = mimeMap[ext] || "image/png";
    }

    const refBlob = new Blob([refBuf], { type: mimeType });

    let thumbnailUrl = '';
    let elapsed = 0;
    let tokensEntrada = 0;
    let tokensSalida = 0;

    const start = Date.now();

    // ----------------------------------------------------------------
    //  Aquí forzamos a usar la URL del ejemplo: https://api.us1.bfl.ai/v1/flux-kontext-pro
    //const apiEndpoint = 'https://api.bfl.ai/v1/flux-kontext-pro';

    if (apiEndpoint.includes('bfl.ai')) {
      const fluxKey = Deno.env.get('BFL_API_KEY');
      // 1) Codificamos refBuf a base64 puro
      const base64Image = base64Encode(new Uint8Array(refBuf));

      // 2) Armamos el payload completo
      const fluxPayload: Record<string, unknown> = {
        prompt: imagePrompt,
        input_image: base64Image,
        seed: 42,
        aspect_ratio: "1:1",       // Igual que "square"
        output_format: "jpeg",
        prompt_upsampling: false,
        safety_tolerance: 2
        // Para modo webhook, podrías agregar:
        // , webhook_url: "https://tu-dominio.com/mi-webhook-endpoint"
        // , webhook_secret: "mi-secreto-para-validar-el-webhook"
      };

      // 3) Loguear solo los primeros 6 caracteres de input_image
      const shortPayload = {
        ...fluxPayload,
        input_image: `${(fluxPayload.input_image as string).slice(0, 6)}...`
      };
      console.log('[describe-and-sketch] [REQUEST]', JSON.stringify(shortPayload));

      // 4) Llamada inicial a Flux-Kontext Pro (usando la URL fija del ejemplo)
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'X-Key': fluxKey ?? '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fluxPayload)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Flux init failed: ${res.status} ${errText}`);
      }
      const data = await res.json();
      console.log('[describe-and-sketch] [FLUX INIT RESPONSE]', data);

      // 5) Extraemos y usamos el polling_url que devuelve la API
      const pollingUrl = data.polling_url as string;
      if (!pollingUrl) {
        throw new Error('Flux init no devolvió polling_url');
      }

      // 6) Hacemos polling usando esa misma polling_url
      for (let i = 0; i < 20; i++) {
        const pollRes = await fetch(pollingUrl, {
          headers: { 'X-Key': fluxKey ?? '' }
        });
        if (!pollRes.ok) {
          const errText = await pollRes.text();
          console.error(`[describe-and-sketch] [POLL ${i}] HTTP ${pollRes.status}: ${errText}`);
          throw new Error(`Flux poll failed: ${pollRes.status}`);
        }
        const pollData = await pollRes.json();
        console.log(`[describe-and-sketch] [POLL ${i}] pollData:`, pollData);

        const status = pollData.status as string;
        if (status === 'Ready') {
          thumbnailUrl = pollData.result?.sample as string;
          console.log('[describe-and-sketch] Imagen lista:', thumbnailUrl);
          break;
        }
        if (status === 'Failed' || status === 'Cancelled') {
          console.error('[describe-and-sketch] Flux devolvió estado inesperado:', status, pollData);
          throw new Error(`Flux error: ${status}`);
        }
        // Si sigue en "Queued" o "Processing", esperamos antes de volver a intentar
        await new Promise((r) => setTimeout(r, 1500));
      }

      // 7) Si tras 20 intentos no hay thumbnailUrl, lanzamos error
      if (!thumbnailUrl) {
        const elapsedSec = ((Date.now() - start) / 1000).toFixed(1);
        throw new Error(`No image returned después de ${elapsedSec}s`);
      }

      elapsed = Date.now() - start;
    }
    else {
      // En caso de no usar BFL.ai, utilizamos OpenAI directamente
      const startGenerate = Date.now();
      const configuredSize = promptRow?.size || '1024x1024';
      const configuredQuality = promptRow?.quality || 'standard';
      const result = await generateWithOpenAI({
        endpoint: apiEndpoint,
        payload: {
          model: apiModel,
          prompt: imagePrompt,
          size: configuredSize,
          quality: configuredQuality,
          n: 1,
        },
        files: { image: refBlob },
        mimeType,
      });
      elapsed = Date.now() - startGenerate;
      tokensEntrada = result.tokensIn;
      tokensSalida = result.tokensOut;
      thumbnailUrl = result.url;
      console.log('[describe-and-sketch] [Generación de imagen] [OUT]', thumbnailUrl);
    }

    await logPromptMetric({
      prompt_id: promptId,
      modelo_ia: apiModel,
      tiempo_respuesta_ms: elapsed,
      estado: 'success',
      error_type: null,
      tokens_entrada: tokensEntrada,
      tokens_salida: tokensSalida,
      usuario_id: userId,
      actividad: ACTIVITY,
      edge_function: FILE,
    });
    await endInflightCall(userId, ACTIVITY);
    return new Response(JSON.stringify({ thumbnailUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in describe-and-sketch:', error);
    await endInflightCall(userId, ACTIVITY);
    await logPromptMetric({
      prompt_id: promptId,
      modelo_ia: apiModel,
      tiempo_respuesta_ms: 0,
      estado: 'error',
      error_type: 'service_error',
      tokens_entrada: 0,
      tokens_salida: 0,
      usuario_id: userId,
      metadatos: { error: (error as Error).message },
      actividad: ACTIVITY,
      edge_function: FILE,
    });
    return new Response(
      JSON.stringify({ error: error.message || 'Error al generar la miniatura' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});