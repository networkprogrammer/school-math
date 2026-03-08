Configuration for QUIZ_SECRET

This project requires a secret value (QUIZ_SECRET) for generating and verifying quiz tokens. The secret must NOT be committed to source control.

How to set QUIZ_SECRET

- Cloudflare Workers (wrangler):
  - Run: `wrangler secret put QUIZ_SECRET` and follow the prompt to enter the secret.

- Local development (macOS / Linux / WSL):
  - Bash/zsh: `export QUIZ_SECRET="your-secret"`
  - Then run your local server in the same shell session.

- Docker / docker-compose:
  - Add QUIZ_SECRET to your `.env` file (do NOT commit this file), or add it to the `environment` section for the service in `docker-compose.yml`.

- Miniflare or other Workers-compatible runtimes:
  - Check the runtime documentation for how to provide environment bindings; often an `.env` file or CLI flag is supported.

If you see the error `{ "error": "Server misconfiguration: missing QUIZ_SECRET" }` then the server did not have the QUIZ_SECRET binding. Set the secret using one of the methods above and retry.

Security note: never commit the secret into the repository. Use CI/CD secret managers (GitHub Secrets, Cloudflare secrets, etc.) when deploying to production.