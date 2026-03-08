export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json', 'Allow': 'GET' } });
  }

  const secret = env.QUIZ_SECRET;
  if (!secret) {
    return new Response(JSON.stringify({ error: 'Server misconfiguration: missing QUIZ_SECRET' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  const url = new URL(request.url);
  const q = Number(url.searchParams.get('count') || url.searchParams.get('questions') || 10);
  const questionCount = Math.max(1, Math.min(100, Math.round(q)));

  const payload = {
    startTime: Date.now(),
    questionCount
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

  return new Response(JSON.stringify({ token, startTime: payload.startTime, questionCount }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
