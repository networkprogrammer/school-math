export async function onRequest(context) {
  const { request, env } = context;

  console.log('[START-QUIZ] Request received');

  if (request.method !== 'GET') {
    console.log('[START-QUIZ] Method not allowed:', request.method);
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json', 'Allow': 'GET' } });
  }

  const secret = env.QUIZ_SECRET;
  if (!secret) {
    console.error('[START-QUIZ] QUIZ_SECRET not configured - this is the problem!');
    const hint = 'Set QUIZ_SECRET in Cloudflare Pages: Settings → Environment variables → Add variable. Use any random string (e.g., a UUID or long random password).';
    return new Response(JSON.stringify({ error: 'Server misconfiguration: missing QUIZ_SECRET', hint }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  const url = new URL(request.url);
  const q = Number(url.searchParams.get('count') || url.searchParams.get('questions') || 10);
  const questionCount = Math.max(1, Math.min(100, Math.round(q)));
  const topic = url.searchParams.get('topic') || null;

  const payload = {
    startTime: Date.now(),
    questionCount,
    topic
  };

  // helpers
  const encoder = new TextEncoder();
  function base64UrlEncode(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer instanceof ArrayBuffer ? arrayBuffer : arrayBuffer.buffer || arrayBuffer);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  async function hmacBase64Url(secretVal, message) {
    const key = await crypto.subtle.importKey('raw', encoder.encode(secretVal), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
    return base64UrlEncode(sig);
  }

  const payloadJson = JSON.stringify(payload);
  const payloadB64 = base64UrlEncode(encoder.encode(payloadJson));
  const signature = await hmacBase64Url(secret, payloadB64);
  const token = `${payloadB64}.${signature}`;

  console.log('[START-QUIZ] Token generated successfully for', questionCount, 'questions');
  return new Response(JSON.stringify({ token, startTime: payload.startTime, questionCount }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
