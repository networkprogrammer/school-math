export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json', 'Allow': 'GET' } });
  }

  // Ensure KV is bound; if not, respond with empty scores so frontend can still render map
  if (!env.STATE_SCORES) {
    console.error('Missing KV binding: STATE_SCORES');
    return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json', 'X-StateScores-Bound': 'false' } });
  }
  try {
    const listing = await env.STATE_SCORES.list({ prefix: 'score:' });
    const result = {};

    await Promise.all(listing.keys.map(async (k) => {
      const value = await env.STATE_SCORES.get(k.name);
      if (value !== null) {
        const state = k.name.replace(/^score:/, '');
        result[state] = Number(value);
      }
    }));

    return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('KV list/get error:', err);
    return new Response(JSON.stringify({ error: 'Server error reading scores.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
