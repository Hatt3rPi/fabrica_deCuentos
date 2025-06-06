export async function generateWithFlux(prompt: string, inputUrl?: string): Promise<string> {
  const fluxKey = Deno.env.get('BFL_API_KEY');
  if (!fluxKey) throw new Error('Falta BFL_API_KEY');
  let inputBase64: string | undefined;
  if (inputUrl) {
    const res = await fetch(inputUrl);
    if (!res.ok) {
      throw new Error(`No se pudo descargar la imagen de referencia: ${res.status}`);
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    const { encode: base64Encode } = await import('https://deno.land/std@0.203.0/encoding/base64.ts');
    inputBase64 = base64Encode(buf);
  }
  const payload: Record<string, unknown> = { prompt };
  if (inputBase64) payload.input_image = inputBase64;
  console.log('[flux] [REQUEST]', JSON.stringify(payload));
  const start = Date.now();
  const req = await fetch('https://api.bfl.ai/v1/flux-kontext-pro', {
    method: 'POST',
    headers: { 'x-key': fluxKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await req.json();
  const requestId = data.id;
  let status = data.status;
  for (let i = 0; i < 20 && requestId; i++) {
    const poll = await fetch(`https://api.bfl.ai/v1/get_result?id=${requestId}`, {
      headers: { 'x-key': fluxKey }
    });
    const pollData = await poll.json();
    status = pollData.status;
    if (status === 'Ready') {
      const url = pollData.result?.sample;
      if (!url) throw new Error('Flux sin resultado');
      const imgRes = await fetch(url);
      const mime = imgRes.headers.get('content-type') || 'image/jpeg';
      const imgBuf = new Uint8Array(await imgRes.arrayBuffer());
      const { encode: base64Encode2 } = await import('https://deno.land/std@0.203.0/encoding/base64.ts');
      return `data:${mime};base64,${base64Encode2(imgBuf)}`;
    }
    if (status !== 'Processing' && status !== 'Queued') {
      throw new Error('Flux error');
    }
    await new Promise(r => setTimeout(r, 1500));
  }
  throw new Error('Flux no devolvió imagen');
}
