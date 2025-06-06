export interface OpenAIOptions {
  endpoint: string;
  payload: Record<string, unknown>;
  files?: Record<string, Blob | Blob[]>;
  mimeType?: string;
}

export interface OpenAIResult {
  url: string;
  tokensIn: number;
  tokensOut: number;
}

export async function generateWithOpenAI(opts: OpenAIOptions): Promise<OpenAIResult> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) throw new Error('Falta la clave de API de OpenAI');

  console.log('[openai] [REQUEST]', JSON.stringify(opts.payload));

  const headers: Record<string, string> = { 'Authorization': `Bearer ${openaiKey}` };
  let response;

  if (opts.files && Object.keys(opts.files).length > 0) {
    const formData = new FormData();
    for (const [k, v] of Object.entries(opts.payload)) {
      formData.append(k, String(v));
    }
    for (const [field, blob] of Object.entries(opts.files)) {
      if (Array.isArray(blob)) {
        blob.forEach((b, idx) => formData.append(field, b, `${field}_${idx}.png`));
      } else {
        formData.append(field, blob, field);
      }
    }
    response = await fetch(opts.endpoint, { method: 'POST', headers, body: formData });
  } else {
    headers['Content-Type'] = 'application/json';
    response = await fetch(opts.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(opts.payload)
    });
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || response.statusText);
  }
  const tokensIn = data.usage?.input_tokens ?? data.usage?.prompt_tokens ?? 0;
  const tokensOut = data.usage?.output_tokens ?? data.usage?.completion_tokens ?? 0;
  if (data.data?.[0]?.b64_json) {
    const mime = opts.mimeType || 'image/png';
    return { url: `data:${mime};base64,${data.data[0].b64_json}`, tokensIn, tokensOut };
  }
  if (data.data?.[0]?.url) {
    return { url: data.data[0].url, tokensIn, tokensOut };
  }
  throw new Error('OpenAI no devolvió imagen');
}
