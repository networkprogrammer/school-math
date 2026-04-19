export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Allow': 'GET' }
    });
  }

  if (!env.STATE_SCORES) {
    console.error('Missing KV binding: STATE_SCORES');
    return new Response(JSON.stringify({ items: [], generatedAt: Date.now() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-StateScores-Bound': 'false' }
    });
  }

  try {
    const keyNames = [];
    let cursor;

    do {
      const listing = await env.STATE_SCORES.list({ prefix: 'cscore:', cursor });
      for (const k of listing.keys) {
        keyNames.push(k.name);
      }
      cursor = listing.list_complete ? undefined : listing.cursor;
    } while (cursor);

    const items = await Promise.all(keyNames.map(async (name) => {
      const value = await env.STATE_SCORES.get(name);
      const score = value === null ? NaN : Number(value);
      if (!Number.isFinite(score)) return null;
      const country = name.replace(/^cscore:/, '');
      return { country, score };
    }));

    const sorted = items
      .filter(Boolean)
      .sort((a, b) => b.score - a.score || a.country.localeCompare(b.country));

    return new Response(JSON.stringify({ items: sorted, generatedAt: Date.now() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('KV list/get error (country scores):', err);
    return new Response(JSON.stringify({ error: 'Server error reading country scores.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
