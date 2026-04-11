# Beautify Africa Front-End

React storefront for Beautify Africa, responsible for customer shopping journeys, profile/order experiences, and selected admin-facing UI surfaces.

## Scope

This application provides:

- Product browsing and filtering
- Cart and checkout experience
- Profile and order-tracking pages
- Auth UI flows (including password reset)
- Newsletter preference pages (unsubscribe request and confirmation)
- Admin orders interface route

## Technology Stack

- React 18
- Vite 7
- Tailwind CSS 4
- React Router 7
- Stripe React SDK
- Framer Motion
- React Helmet Async

## Runtime Integration

- Front-end calls the backend API through `VITE_API_URL`.
- API base normalization is handled in `src/services/apiConfig.js`.
- Stripe publishable key is injected at build time.
- Containerized runtime serves static assets via Nginx.

## Environment Variables

Required for full functionality:

- `VITE_API_URL`: Base URL to backend service (example: `http://localhost:5000`)
- `VITE_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key for payment UI

Important: Vite embeds environment values at build time. Changing these values requires rebuilding the frontend image/build artifacts.

## Local Development

From `Front-End/`:

```bash
npm ci
npm run dev
```

Default dev server URL: `http://localhost:5173`

Ensure backend API is available (default expected at `http://localhost:5000` unless overridden via `VITE_API_URL`).

## Quality Gates

From `Front-End/`:

```bash
npm run lint
npm run build
```

These are the same frontend gates executed in GitHub CI.

## Production Build And Preview

```bash
npm run build
npm run preview
```

Build output is emitted to `dist/`.

## Docker Deployment Notes

- Multi-stage Docker build compiles with Node and serves with Nginx.
- Build arguments used in `Front-End/Dockerfile`:
  - `VITE_API_URL`
  - `VITE_STRIPE_PUBLISHABLE_KEY`
- In `docker-compose.yml`, frontend is exposed on `http://localhost:4173`.

## Primary Routes

- `/`
- `/shop`
- `/profile`
- `/track-orders`
- `/reset-password`
- `/newsletter/unsubscribe-request`
- `/newsletter/unsubscribe`
- `/admin/orders`

## API Documentation Reference

Backend API docs (served by backend service):

- Swagger UI: `http://localhost:5000/api/docs`
- OpenAPI JSON: `http://localhost:5000/api/openapi.json`
