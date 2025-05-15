import OpenAI from "npm:openai@4.28.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) throw new Error('Falta la clave de API de OpenAI');

    const characterPrompt = Deno.env.get('PROMPT_CREAR_MINIATURA_PERSONAJE');
    if (!characterPrompt) throw new Error('Falta el prompt de generación de personaje');

    const rawPayload = await req.json().catch(() => {
      throw new Error('Payload JSON inválido');
    });
    console.log('[describe-and-sketch] [INIT] rawPayload =', rawPayload);

    const { imageBase64, userNotes, name, age } = validatePayload(rawPayload);

    const sanitizedName  = sanitizeText(name);
    const sanitizedAge   = sanitizeText(age);
    const sanitizedNotes = sanitizeText(userNotes);

    if (!sanitizedNotes && !imageBase64) {
      throw new Error('Se requiere una descripción o una imagen');
    }
    if (imageBase64 && !isValidBase64Image(imageBase64)) {
      throw new Error('Formato de imagen inválido');
    }

    const openai = new OpenAI({ apiKey: openaiKey });
    const notesForPrompt = sanitizedNotes.trim() || 'sin información';

    // Generación de miniatura
    let imagePrompt = characterPrompt
      .replace(/\$\{name\}/g, sanitizedName)
      .replace(/\$\{sanitizedAge\}/g, sanitizedAge)
      .replace(
        /\$\{sanitizedNotes\s*\|\|\s*'sin información'\}/g,
        notesForPrompt
      );
    if (imageBase64) {
      imagePrompt += `\n\nReferencia de la imagen: ${imageBase64}`;
    }
    console.log('[describe-and-sketch] [Generación de imagen] [IN] ', imagePrompt);

    // Descarga la imagen de referencia y crea un File para edits
    const refRes = await fetch(imageBase64!);
    if (!refRes.ok) {
      throw new Error(`No se pudo descargar la imagen de referencia: ${refRes.status}`);
    }
    const refBuf = await refRes.arrayBuffer();
    const refFile = new File([refBuf], "reference.png", { type: "image/png" });

    // Usa el endpoint edits
    const imageResponse = await openai.images.edit({
      model:           "gpt-image-1",
      image:           refFile,
      prompt:          imagePrompt,
      size:            "1024x1024",
      n:               1,
      response_format: "url"
    }).catch(err => {
      if (err.status === 429) throw new Error('Demasiadas solicitudes a OpenAI');
      throw new Error(`Error al editar la imagen: ${err.message}`);
    });

    const thumbUrl = imageResponse.data?.[0]?.url;
    console.log('[describe-and-sketch] [Generación de imagen] [OUT] ', thumbUrl);
    if (!thumbUrl) throw new Error('No se pudo generar la imagen del personaje');

    return new Response(JSON.stringify({
      thumbnailUrl: thumbUrl
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  catch (error: any) {
    console.error('Error in describe-and-sketch:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Error al generar la miniatura'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
