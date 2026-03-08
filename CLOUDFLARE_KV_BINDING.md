Binding Workers KV for STATE_SCORES

If your Pages Functions are returning 500 with a KV list/get error, it means the STATE_SCORES KV namespace is not bound to the Pages Functions environment. Create and bind a Workers KV namespace named STATE_SCORES and redeploy.

Dashboard (quick):
1. Go to Cloudflare dashboard → Workers → KV (left menu) → Create namespace (name: any). After creation note the Namespace ID.
2. Go to Pages → your site → Functions (or Settings → Functions / Environment bindings) and add a KV binding with the Binding name: STATE_SCORES and paste the Namespace ID. Save and redeploy.

Wrangler (optional):
- Create a namespace:
  wrangler kv:namespace create "state-scores" --preview
  This returns an id; add it to wrangler.toml as:

kv_namespaces = [
  { binding = "STATE_SCORES", id = "<NAMESPACE_ID>" }
]

- Deploy with wrangler or from Pages after the binding exists.

Seeding a test score (optional):
- Use wrangler or the dashboard to add a key for testing, e.g. key: score:NY value: 8
  wrangler kv:key put --binding STATE_SCORES score:NY 8

Notes:
- Make sure the binding is added for both production and preview environments if you use test.k5math.pages.dev.
- After binding, the API endpoints /api/state-scores and /api/submit-score will persist and the map will show and update scores.