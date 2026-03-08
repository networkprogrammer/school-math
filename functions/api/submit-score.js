export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json', 'Allow': 'POST' } });
  }

  const cf = request.cf || {};
  const country = cf.country || request.headers.get('x-debug-cf-country');
  const regionCode = cf.regionCode || request.headers.get('x-debug-cf-region');

  if (country !== 'US') {
    return new Response(JSON.stringify({ error: 'Only visitors from the United States (US) are accepted.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  if (!regionCode) {
    return new Response(JSON.stringify({ error: 'State (region) unknown.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // parse JSON body
  let body;
  try {
    body = await request.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const token = body && body.token;
  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing token.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const secret = env.QUIZ_SECRET;
  if (!secret) {
    const hint = 'Set QUIZ_SECRET (e.g., wrangler secret put QUIZ_SECRET, or export QUIZ_SECRET="your-secret") for local runs. Do NOT commit secrets to source control.';
    return new Response(JSON.stringify({ error: 'Server misconfiguration: missing QUIZ_SECRET', hint }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

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
  function base64UrlEncodeString(str) {
    return base64UrlEncode(encoder.encode(str));
  }
  function base64UrlDecodeToString(b64) {
    b64 = b64.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  async function hmacBase64Url(secretVal, message) {
    const key = await crypto.subtle.importKey('raw', encoder.encode(secretVal), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
    return base64UrlEncode(sig);
  }
  function safeEqual(a, b) {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return result === 0;
  }

  // verify token
  const parts = String(token).split('.');
  if (parts.length !== 2) {
    return new Response(JSON.stringify({ error: 'Invalid token format.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const payloadB64 = parts[0];
  const sigB64 = parts[1];
  let expectedSig;
  try {
    expectedSig = await hmacBase64Url(secret, payloadB64);
  } catch (e) {
    console.error('HMAC error', e);
    return new Response(JSON.stringify({ error: 'Server error.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  if (!safeEqual(expectedSig, sigB64)) {
    return new Response(JSON.stringify({ error: 'Invalid token signature.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  // parse payload
  let payload;
  try {
    const payloadJson = base64UrlDecodeToString(payloadB64);
    payload = JSON.parse(payloadJson);
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid token payload.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const questionCount = Number(payload && payload.questionCount);
  const startTime = Number(payload && payload.startTime);
  if (!Number.isFinite(questionCount) || questionCount < 1) {
    return new Response(JSON.stringify({ error: 'Invalid question count in token.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  if (!Number.isFinite(startTime)) {
    return new Response(JSON.stringify({ error: 'Invalid start time in token.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // elapsed time validation
  const now = Date.now();
  if (startTime > now + 60 * 1000) {
    return new Response(JSON.stringify({ error: 'Invalid token start time.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const elapsedSeconds = (now - startTime) / 1000;
  const MIN_PER_Q = 1; // seconds
  const MAX_PER_Q = 60; // seconds
  const minElapsed = questionCount * MIN_PER_Q;
  const maxElapsed = questionCount * MAX_PER_Q;
  if (elapsedSeconds < minElapsed || elapsedSeconds > maxElapsed) {
    return new Response(JSON.stringify({ error: 'Elapsed time not in allowed range for this quiz.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // rate limit per IP
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const rateKey = `rl:${ip}`;
  const RATE_LIMIT = 5;
  const RATE_WINDOW = 60;
  try {
    const rateRaw = await env.STATE_SCORES.get(rateKey);
    const rate = rateRaw ? parseInt(rateRaw, 10) : 0;
    if (rate >= RATE_LIMIT) {
      return new Response(JSON.stringify({ error: 'Too many submissions. Slow down.' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    }
    await env.STATE_SCORES.put(rateKey, String(rate + 1), { expirationTtl: RATE_WINDOW });
  } catch (err) {
    console.error('KV rate check error:', err);
  }

  // validate score
  let score = Number(body.score);
  if (!Number.isFinite(score)) {
    return new Response(JSON.stringify({ error: 'Score must be a number.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  if (score < 0) {
    return new Response(JSON.stringify({ error: 'Negative scores are not allowed.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  let clamped = false;
  if (score > questionCount) {
    score = questionCount;
    clamped = true;
  }
  score = Math.round(score);

  const state = regionCode.toUpperCase();
  const stateKey = `score:${state}`;

  try {
    if (!env.STATE_SCORES) {
      console.error('Missing KV binding: STATE_SCORES');
      // Return a non-error response but indicate persistence didn't happen
      return new Response(JSON.stringify({ state, previousScore: null, newScore: score, updated: false, clamped, message: 'STATE_SCORES not bound; score not persisted' }), { status: 200, headers: { 'Content-Type': 'application/json', 'X-StateScores-Bound': 'false' } });
    }
    const existingRaw = await env.STATE_SCORES.get(stateKey);
    const existing = existingRaw === null ? null : Number(existingRaw);

    if (existing === null || score > existing) {
      await env.STATE_SCORES.put(stateKey, String(score));
      return new Response(JSON.stringify({ state, previousScore: existing, newScore: score, updated: true, clamped }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } else {
      return new Response(JSON.stringify({ state, previousScore: existing, newScore: score, updated: false, clamped }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  } catch (err) {
    console.error('KV put/get error:', err);
    return new Response(JSON.stringify({ error: 'Server error storing score.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
