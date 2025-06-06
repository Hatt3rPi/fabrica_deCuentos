import OpenAI from "npm:openai@4.28.0";
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { logPromptMetric, getUserId } from '../_shared/metrics.ts';
import { startInflightCall, endInflightCall } from '../_shared/inflight.ts';
import { isActivityEnabled } from '../_shared/stages.ts';
import { encode as base64Encode } from 'https://deno.land/std@0.203.0/encoding/base64.ts';

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
      .select('id, content, endpoint, model')
      .eq('type', 'PROMPT_CREAR_MINIATURA_PERSONAJE')
      .single();
    const characterPrompt = promptRow?.content || '';
    const apiEndpoint = promptRow?.endpoint || 'https://api.openai.com/v1/images/edits';
    apiModel = promptRow?.model || 'gpt-image-1';
    promptId = promptRow?.id;
    if (!characterPrompt) throw new Error('Falta el prompt de generación de personaje');

    userId = await getUserId(req);
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
    console.log('[describe-and-sketch] [INIT] rawPayload =', rawPayload);
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
    if (imageBase64) {
      imagePrompt += `\n\nReferencia de la imagen: ${imageBase64}`;
    }
    console.log('[describe-and-sketch] [Generación de imagen] [IN] ', imagePrompt);

    // 5) Descargar referencia y preparar Blob con MIME correcto
    const refRes = await fetch(imageBase64!);
    if (!refRes.ok) {
      throw new Error(`No se pudo descargar la imagen de referencia: ${refRes.status}`);
    }
    const refBuf = await refRes.arrayBuffer();
    const urlPath = new URL(imageBase64!).pathname;
    const ext = urlPath.split('.').pop()!.toLowerCase();
    const mimeMap: Record<string,string> = {
      jpg:  'image/jpeg',
      jpeg: 'image/jpeg',
      png:  'image/png',
      webp: 'image/webp'
    };
    const mimeType = mimeMap[ext] || 'image/png';
    const refBlob = new Blob([refBuf], { type: mimeType });

    let thumbnailUrl = '';
    let elapsed = 0;
    let tokensEntrada = 0;
    let tokensSalida = 0;

    const start = Date.now();
    if (apiEndpoint.includes('bfl.ai')) {
      const fluxKey = Deno.env.get('BFL_API_KEY');
      const base64Image = base64Encode(new Uint8Array(refBuf));
      const fluxPayload = { prompt: imagePrompt, input_image: base64Image };
      console.log('[describe-and-sketch] [REQUEST]', JSON.stringify(fluxPayload));
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'x-key': fluxKey ?? '', 'Content-Type': 'application/json' },
        body: JSON.stringify(fluxPayload)
      });
      const data = await res.json();
      const requestId = data.id;
      let status = data.status;
      elapsed = Date.now() - start;
      for (let i = 0; i < 20 && requestId; i++) {
        const poll = await fetch(`https://api.bfl.ai/v1/get_result?id=${requestId}`, {
          headers: { 'x-key': fluxKey ?? '' }
        });
        const pollData = await poll.json();
        status = pollData.status;
        if (status === 'Ready') {
          thumbnailUrl = pollData.result?.sample || '';
          break;
        }
        if (status !== 'Processing' && status !== 'Queued') {
          throw new Error('Flux error');
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
      if (!thumbnailUrl) throw new Error('No image returned');
    } else {
      // Enviar a /v1/images/edits vía fetch + FormData
      const formData = new FormData();
      formData.append('model', apiModel);
      formData.append('prompt', imagePrompt);
      formData.append('size', '1024x1024');
      formData.append('n', '1');
      formData.append('image', refBlob, `reference.${ext}`);

      const requestJson = {
        model: apiModel,
        prompt: imagePrompt,
        size: '1024x1024',
        n: 1,
        image: `reference.${ext}`,
      };
      console.log('[describe-and-sketch] [REQUEST]', JSON.stringify(requestJson));
      const editRes = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: formData,
      });
      elapsed = Date.now() - start;
      const editData = await editRes.json();
      tokensEntrada = editData.usage?.input_tokens ?? 0;
      tokensSalida = editData.usage?.output_tokens ?? 0;
      if (!editRes.ok) {
        const msg = editData.error?.message || editRes.statusText;
        throw new Error(`Error al editar la imagen: ${msg}`);
      }
      // GPT-image-1 siempre devuelve b64_json
      const b64 = editData.data?.[0]?.b64_json;
      if (!b64) {
        throw new Error('No se generó la imagen editada');
      }
      thumbnailUrl = `data:${mimeType};base64,${b64}`;
      console.log('[describe-and-sketch] [Generación de imagen] [OUT] ', thumbnailUrl);
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
