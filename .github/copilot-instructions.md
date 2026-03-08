# Copilot Instructions — Recreating this Project

This document captures the steps, tooling, and best practices needed to recreate this project from scratch or restore it on a new machine. Follow the sections below for a reproducible development environment, build and deployment steps, and recommended maintenance processes.

---

## Table of contents

- Purpose and scope
- Prerequisites
- Quick start (local)
- Recreate from scratch (detailed)
- Project layout and important files
- Skills and tools
- Environment variables and secrets
- Docker and containerized run
- Development workflow and branching
- Testing, linting, and CI
- Release, tagging and deployment
- Backup, reproducibility and versioning
- Troubleshooting tips
- Maintenance and best practices

---

## Purpose and scope

This file documents how to reproduce the same project structure, runtime environment, and deployment artifacts so a developer (or automation) can rebuild, run, and maintain the project consistently. It assumes the repository contents include: app.js, generator.js, evaluator.js, index.html, styles.css, Dockerfile, docker-compose.yml, README.md and other artifacts.

## Prerequisites

- Git (>= 2.20)
- Node.js LTS (recommend: 18.x or newer) and npm (or yarn)
- nvm (recommended) to pin Node versions: https://github.com/nvm-sh/nvm
- Docker & docker-compose (if you plan to run in containers)
- An editor (VS Code recommended) and linters/formatters (eslint, prettier)


## Quick start (local)

These steps assume the repo has a package.json. If package.json is missing, see "Recreate from scratch" below.

1. Clone the repository

   git clone <REPO_URL> math-work
   cd math-work

2. Install dependencies

   npm ci        # if package-lock.json present
   # or
   npm install

3. Create configuration

   cp .env.example .env   # if .env.example exists; edit values as needed

4. Start the app

   npm start    # expects a start script that runs `node app.js`
   # or
   npm run dev  # for local development with nodemon

5. Open the app

   Visit http://localhost:3000 (or whichever port app.js exposes)

6. Run utilities (generator/evaluator)

   node generator.js
   node evaluator.js


## Recreate from scratch (detailed)

If you need to recreate the project on a fresh machine or from design notes, follow these steps:

1. Create project directory and init git

   mkdir math-work && cd math-work
   git init
   git checkout -b main

2. Initialize Node project

   nvm install --lts
   nvm use --lts
   npm init -y

3. Add dependencies (example — inspect app.js/generator.js to identify exact packages used)

   # common runtime deps
   npm install express dotenv

   # common dev deps
   npm install --save-dev nodemon eslint prettier husky lint-staged

4. Add main entry and helper scripts

   - app.js: Express static server or your runtime entry.
   - generator.js, evaluator.js: CLI scripts used by project.

   Add package.json scripts (example):

   "scripts": {
     "start": "node app.js",
     "dev": "nodemon app.js",
     "generate": "node generator.js",
     "evaluate": "node evaluator.js",
     "lint": "eslint . --ext .js",
     "format": "prettier --write ."
   }

5. Add static files

   - index.html, styles.css: place under project root or a `public/` directory and serve via express static.

6. Add Dockerfile and docker-compose.yml

   - Dockerfile should create a production image for the Node app.
   - docker-compose.yml can define a simple service that maps ports and mounts volumes for development.

7. Create .env.example

   - Add all environment variables used by the app, with safe example values or placeholders.

8. Add a README.md with the quick start steps and any architecture notes.


## Project layout and important files

Keep this structure (or close to it) — consistency reduces onboarding friction:

- app.js           # main server / entrypoint
- generator.js     # script to generate sample content or assets
- evaluator.js     # script to run evaluation/analysis
- index.html       # front-end entrypoint (served statically)
- styles.css       # front-end styles
- Dockerfile
- docker-compose.yml
- .github/          # workflows, CODEOWNERS, copilot-instructions.md
- README.md
- .env.example
- package.json
- package-lock.json (or yarn.lock)

Add `src/` if codebase grows; keep `/public` for static assets.

## Skills and tools

Document the skills (Copilot skills or custom sub-agents) and external tools used to build or maintain this project. For each skill include the name, a short description, a link to the skill definition, and notes on how/when to invoke it.

- frontend-developer — Front-end design, UI components, and styling workflows. Skill definition: https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md
- (Add others as applicable) e.g., backend-developer, devops, testing, accessibility

Notes:

- When automating tasks or onboarding, reference the exact skill name and link above.
- Pin the skill version or commit when possible and document expected inputs/outputs and any required configuration.
- Add example invocations or GitHub Actions steps that call specific skills (if applicable).


## Environment variables and secrets

- Never commit secrets or production credentials to git.
- Add a `.env.example` to the repo with all required keys documented.
- Use GitHub Secrets for CI and deployment.
- Local dev: copy `.env.example` to `.env` and fill values.
- Validate required env vars at startup and fail fast with a clear error message.


## Docker and containerized run

- Local developer flow (development):

  docker-compose up --build

- Build and run single image (production):

  docker build -t math-work:latest .
  docker run -p 3000:3000 --env-file .env math-work:latest

- Keep Dockerfile small: use an official Node base image, install only production deps, and use a non-root user.


## Development workflow and branching

Adopt a simple, clear workflow:

- Branches: `main` (protected, production), `develop` (optional), `feature/<short-desc>`, `fix/<ticket>`
- PRs: Require at least one approving review and passing CI before merge
- Commit messages: use conventional commits (feat:, fix:, chore:, docs:, test:) to simplify changelogs and releases
- Small frequent PRs are preferred over large monoliths

PR template should include:
- Summary of changes
- How to test locally
- Any config or DB changes
- Checklist (tests, lint, docs)


## Testing, linting, and CI

- Add unit tests for `generator.js` and `evaluator.js`. Use a test runner (Jest, Mocha) and assert expected output.
- Add `npm run lint` (eslint) and `npm run format` (prettier) as part of CI.
- Example GitHub Actions workflow (store under `.github/workflows/ci.yml`):
  - Checkout, set up Node, install deps, run lint, run tests, build docker image (optional)
- Use `npm ci` in CI to ensure reproducible installs.


## Release, tagging and deployment

- Use semantic versioning (vMAJOR.MINOR.PATCH) for releases.
- Tag releases in Git and create GitHub releases.
- Automate deployments via CI after tagging (e.g., push Docker image to registry and deploy to server or cloud service).


## Backup, reproducibility and versioning

- Commit lock files (`package-lock.json` or `yarn.lock`) for reproducible installs.
- Use `.nvmrc` or `package.json.engines` to pin Node version.
- Keep a small set of integration test cases that can validate the system on any machine.


## Troubleshooting tips

- Missing dependencies or package.json: inspect `app.js`/`generator.js` for `require()` calls to determine packages.
- Port already in use: change PORT env var or kill existing process using that port.
- Docker build fails: check cache issues, add `--no-cache` for a clean build.
- Permission issues: prefer running container processes under non-root user and ensure volumes have correct permissions.


## Maintenance and best practices

- Keep dependencies up to date; use Dependabot or Renovate to open PRs for upgrades.
- Run security scans on dependencies (GitHub Dependabot security alerts, `npm audit`).
- Add clear README sections: development, testing, deployment, troubleshooting.
- Add CODEOWNERS and a CONTRIBUTING.md if multiple maintainers exist.
- Add tests for any logic in `generator.js`/`evaluator.js` to prevent regressions.
- Add logging with levels and a strategy for local vs production logs.


## Example checklist when re-creating the project

- [ ] Install Node and Docker
- [ ] Clone repo and install deps
- [ ] Create `.env` from `.env.example`
- [ ] Run `npm run dev` and confirm app serves static site
- [ ] Run `node generator.js` and `node evaluator.js` and validate outputs
- [ ] Build Docker image and run container to validate production image
- [ ] Add CI workflow and test/lint steps


## Contact and ownership

If something is missing or unclear, open an issue titled `recreate: <short description>` and tag a maintainer. Keep this document up to date whenever the project changes (architecture, env vars, or build process).

---

Thank you — following these steps will make it straightforward to recreate and maintain a consistent development and deployment environment for this project.
