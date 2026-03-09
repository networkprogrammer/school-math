export async function onRequest(context) {
  const { request, env } = context;

  console.log('[SUBMIT-SCORE] Request received');

  if (request.method !== 'POST') {
    console.log('[SUBMIT-SCORE] Method not allowed:', request.method);
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json', 'Allow': 'POST' } });
  }

  const cf = request.cf || {};
  const country = cf.country || request.headers.get('x-debug-cf-country');
  const regionCode = cf.regionCode || request.headers.get('x-debug-cf-region');
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  
  console.log('[SUBMIT-SCORE] Request details:', { country, regionCode, ip, hasCfObject: !!request.cf });

  if (country !== 'US') {
    console.log('[SUBMIT-SCORE] Non-US visitor rejected:', country);
    return new Response(JSON.stringify({ error: 'Only visitors from the United States (US) are accepted.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  if (!regionCode) {
    console.log('[SUBMIT-SCORE] No region code found');
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
    console.error('[SUBMIT-SCORE] QUIZ_SECRET not configured');
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
    console.log('[SUBMIT-SCORE] Invalid start time (future):', { startTime, now });
    return new Response(JSON.stringify({ error: 'Invalid token start time.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const elapsedSeconds = (now - startTime) / 1000;
  const MIN_PER_Q = 0.5; // seconds - reduced from 1 to allow faster testing
  const MAX_PER_Q = 300; // seconds - increased from 60 to allow longer sessions
  const minElapsed = questionCount * MIN_PER_Q;
  const maxElapsed = questionCount * MAX_PER_Q;
  
  console.log('[SUBMIT-SCORE] Time validation:', { 
    elapsedSeconds: elapsedSeconds.toFixed(1), 
    minElapsed, 
    maxElapsed, 
    questionCount 
  });
  
  if (elapsedSeconds < minElapsed || elapsedSeconds > maxElapsed) {
    console.log('[SUBMIT-SCORE] Time validation failed:', { 
      elapsedSeconds: elapsedSeconds.toFixed(1), 
      required: `${minElapsed}-${maxElapsed}s` 
    });
    return new Response(JSON.stringify({ 
      error: 'Elapsed time not in allowed range for this quiz.',
      details: `Elapsed: ${elapsedSeconds.toFixed(1)}s, Expected: ${minElapsed}-${maxElapsed}s`
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // rate limit per IP
  const rateKey = `rl:${ip}`;
  const RATE_LIMIT = 5;
  const RATE_WINDOW = 60;
  try {
    const rateRaw = await env.STATE_SCORES.get(rateKey);
    const rate = rateRaw ? parseInt(rateRaw, 10) : 0;
    console.log('[SUBMIT-SCORE] Rate limit check:', { ip, rate, limit: RATE_LIMIT });
    if (rate >= RATE_LIMIT) {
      console.log('[SUBMIT-SCORE] Rate limit exceeded for IP:', ip);
      return new Response(JSON.stringify({ error: 'Too many submissions. Slow down.' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    }
    await env.STATE_SCORES.put(rateKey, String(rate + 1), { expirationTtl: RATE_WINDOW });
  } catch (err) {
    console.error('[SUBMIT-SCORE] KV rate check error:', err);
  }

  // validate score
  let score = Number(body.score);
  if (!Number.isFinite(score)) {
    return new Response(JSON.stringify({ error: 'Score must be a number.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  if (score < 0) {
    return new Response(JSON.stringify({ error: 'Negative scores are not allowed.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  score = Math.round(score);
  
  // Cap state leaderboard scores at 100 to prevent abuse (e.g., sight-words spam)
  // Users can still score higher locally, but state scores are capped for fairness
  const MAX_STATE_SCORE = 100;
  let clamped = false;
  if (score > MAX_STATE_SCORE) {
    console.log('[SUBMIT-SCORE] Score capped for state leaderboard:', { original: score, capped: MAX_STATE_SCORE });
    score = MAX_STATE_SCORE;
    clamped = true;
  }
  
  console.log('[SUBMIT-SCORE] Score validation passed:', { score, clamped, questionCount });

  const state = regionCode.toUpperCase();
  const stateKey = `score:${state}`;

  console.log('[SUBMIT-SCORE] Processing score:', { state, stateKey, score, clamped });

  try {
    if (!env.STATE_SCORES) {
      console.error('[SUBMIT-SCORE] Missing KV binding: STATE_SCORES');
      // Return a non-error response but indicate persistence didn't happen
      return new Response(JSON.stringify({ state, previousScore: null, newScore: score, updated: false, clamped, message: 'STATE_SCORES not bound; score not persisted' }), { status: 200, headers: { 'Content-Type': 'application/json', 'X-StateScores-Bound': 'false' } });
    }
    const existingRaw = await env.STATE_SCORES.get(stateKey);
    const existing = existingRaw === null ? null : Number(existingRaw);

    console.log('[SUBMIT-SCORE] Existing score check:', { state, existing, newScore: score });

    if (existing === null || score > existing) {
      await env.STATE_SCORES.put(stateKey, String(score));
      console.log('[SUBMIT-SCORE] Score updated successfully:', { state, previousScore: existing, newScore: score });
      return new Response(JSON.stringify({ state, previousScore: existing, newScore: score, updated: true, clamped }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } else {
      console.log('[SUBMIT-SCORE] Score NOT updated (not higher):', { state, existing, submitted: score });
      return new Response(JSON.stringify({ state, previousScore: existing, newScore: score, updated: false, clamped }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  } catch (err) {
    console.error('[SUBMIT-SCORE] KV put/get error:', err);
    return new Response(JSON.stringify({ error: 'Server error storing score.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
