# Elementary Math Practice (Public Release)

A small, client-side math worksheet web app for young learners (Kindergarten, Grade 1 and Grade 4). The app is a static HTML/CSS/JS single-page application that generates problems on the fly and evaluates answers in the browser; no server-side backend is required.

## Features

- Topics: Addition, Subtraction, Multiplication, Division, Fractions, Mixed Fractions (addition only), Counting (K), Sight words (honor system)
- Difficulty controls: Mixed Fractions (Level 1 = add 2 mixed numbers, Level 2 = add 3)
- Timer per-question, per-session score badge and animated +10 point feedback
- Accessibility-minded markup and keyboard-friendly controls
- Fully client-side: works offline once served as static files

## Point system for kids

- Correct numeric answers award +10 points (displayed in the score badge and shown as a floating +10 animation).
- Sight-words use an honor system: clicking "I read it!" rewards +10 points and advances to the next word.
- Final score is shown as a toast when returning to the grade selection screen. Adjust point values in `app.js` (update `updateScore(10)` calls) if needed.

## Running locally

Option A — Open the static site directly

1. Open `index.html` in your browser (double-click or use `file://` URL).

Option B — Lightweight static server (recommended for modern browsers)

- Python 3:
  python -m http.server 8080
  Open: http://localhost:8080

- Node (http-server):
  npx http-server -p 8080
  Open: http://localhost:8080

Option C — Docker (production-like)

- Using docker-compose (recommended):
  docker-compose up --build -d
  Open: http://localhost:8090

- Using docker directly:
  docker build -t math-worksheets .
  docker run --rm -p 8080:80 math-worksheets

## Development

- Edit `generator.js` to tweak number ranges, fraction denominators, or sight word lists.
- Edit `evaluator.js` to change parsing/validation rules and solution explanations.
- Run a local static server (see above) and make changes in the browser.

## Security & Privacy — Sanitization performed

- Removed hardcoded remote host and username from `scp.sh`. The script now requires remote details to be provided via environment variables or positional arguments (see script header for usage).
- No API keys, passwords, or private key files were found in the working directory when scanned with simple pattern checks. Still perform a final manual review before publishing.
- Added guidance to avoid external resources (e.g., Google Fonts) in classrooms that disallow external requests — consider self-hosting fonts.
- DO NOT commit secrets or credentials. If secrets were accidentally committed in the past, rotate them immediately and remove them from the git history (use tools like `git filter-repo` or the BFG Repo-Cleaner).

## How to deploy / share

- For simple sharing: host the static files on GitHub Pages or Netlify.
- For self-hosting with Docker: use the included `Dockerfile` and `docker-compose.yml`.
- For copying to a remote host: use `scp.sh` but provide `REMOTE_USER`, `REMOTE_HOST`, and `REMOTE_DIR` via environment variables or as arguments. Example:

  REMOTE_USER=alice REMOTE_HOST=example.com REMOTE_DIR=~/maths ./scp.sh

## Checks to run before making the repo public

- Search for secrets locally:

  grep -IRnE "SECRET|API_KEY|TOKEN|PASSWORD|PRIVATE KEY|BEGIN" . || true

- Ensure there are no private key files (`id_rsa`, `*.pem`) or `.env` files in the repo.
- Remove or replace any real IP addresses, usernames, or hostnames in scripts (already sanitized `scp.sh`).

## Files to review for privacy

- `scp.sh` (deployment script) — sanitized
- `index.html` — includes Google Fonts; consider self-hosting
- Any files added later (images, assets) — avoid embedding PII

## Contributing

- Use small, focused pull requests
- Include testing steps in PR descriptions (how to run locally and example inputs)

## License

Add your preferred open-source license to the repository (e.g., MIT).

## Contact

If anything in this README is unclear or you want help with public release steps (removing secrets from history, configuring CI with GitHub Secrets, or creating a safer deploy pipeline), open an issue or reach out to the maintainer.
