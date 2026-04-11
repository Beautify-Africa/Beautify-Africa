# Beautify Africa

An e-commerce platform for skincare operations, combining a React storefront with an Express API, MongoDB persistence, Stripe payments, and production-oriented delivery pipelines.

## Project Scope

This repository delivers:

- Customer storefront (catalog, cart, checkout, profile, order history)
- Admin operations dashboard and fulfillment actions
- Secure authentication and password reset workflows
- Newsletter subscribe and tokenized unsubscribe workflows
- Stripe payment intent flow with webhook confirmation
- Containerized local/runtime deployment
- OpenAPI documentation and GitHub CI/CD automation

## Architecture

- Front-End: React + Vite + Tailwind
- Back-End: Node.js + Express + Mongoose
- Database: MongoDB
- Payments: Stripe
- Email: SMTP via Nodemailer
- Packaging/Runtime: Docker + Docker Compose
- API Docs: OpenAPI 3.0.3 + Swagger UI
- CI/CD: GitHub Actions (quality gates + container publishing)

## Repository Layout

- Back-End: API server, business services, models, middleware, tests
- Front-End: web client application
- docker-compose.yml: local multi-service orchestration
- .github/workflows/ci.yml: continuous integration checks
- .github/workflows/cd.yml: container image publishing to GHCR

## API Documentation

After starting the backend service:

- Swagger UI: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
- OpenAPI JSON: [http://localhost:5000/api/openapi.json](http://localhost:5000/api/openapi.json)

## Local Run

### Option A: Docker Compose (recommended)

1. Ensure Docker Desktop is running.
2. From repository root:

```bash
docker compose up --build
```

1. Access services:

- Frontend: [http://localhost:4173](http://localhost:4173)
- Backend API: [http://localhost:5000](http://localhost:5000)

### Option B: Run services independently

Backend:

```bash
cd Back-End
npm ci
npm run dev
```

Frontend:

```bash
cd Front-End
npm ci
npm run dev
```

## Environment Configuration

### Back-End required

- MONGO_URI
- JWT_SECRET

### Back-End required for full payment/email features

- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- EMAIL_USER
- EMAIL_PASS

### Back-End operational configuration (recommended)

- PORT
- CLIENT_URL
- REQUEST_BODY_LIMIT
- JWT_EXPIRES_IN
- ADMIN_EMAILS
- ADMIN_DASHBOARD_PASSWORD
- PASSWORD_RESET_URL_BASE
- PASSWORD_RESET_TOKEN_TTL_MINUTES
- NEWSLETTER_UNSUBSCRIBE_URL_BASE
- NEWSLETTER_UNSUBSCRIBE_TOKEN_TTL_MINUTES
- API_BASE_URL
- EMAIL_HOST
- EMAIL_PORT

### Front-End build/runtime variables

- VITE_API_URL
- VITE_STRIPE_PUBLISHABLE_KEY

## Quality Gates

Backend:

```bash
cd Back-End
npm test
```

Frontend:

```bash
cd Front-End
npm run lint
npm run build
```

## CI/CD

### CI workflow

File: .github/workflows/ci.yml

On push and pull request to main, CI executes:

- Back-End test suite
- Front-End lint
- Front-End production build

### CD workflow

File: .github/workflows/cd.yml

After CI succeeds on main, CD builds and publishes Docker images to GitHub Container Registry:

- ghcr.io/{owner}/beautify-africa-backend:latest
- ghcr.io/{owner}/beautify-africa-backend:{short-sha}
- ghcr.io/{owner}/beautify-africa-frontend:latest
- ghcr.io/{owner}/beautify-africa-frontend:{short-sha}

## Security And Operations Baseline

Implemented controls include:

- Helmet security headers
- Auth and API rate limiting
- Request sanitization against operator-style payload abuse
- Configurable body-size limits with explicit 413 handling
- JWT-protected private/admin routes
- Tokenized password reset and newsletter unsubscribe flows
- Health endpoint at /health

## Operational Notes

- Backend startup fails fast if critical variables are missing.
- API docs are generated from current server contracts and served at runtime.
- Docker Compose defines the primary local developer runtime topology.

## Existing Technical Debt (Known)

- Front-End/README.md still contains default Vite template text and should be replaced with project-specific guidance.
- Production secret management should be externalized via a vault or cloud secret manager before enterprise deployment.
