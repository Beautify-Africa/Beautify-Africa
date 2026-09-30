# Beautify Africa Front-End

React storefront and operational console for Beautify Africa, responsible for customer shopping journeys, profile/order experiences, and the full administrative suite.

---

## 🏛 Architecture & Code Standards

- **Maximum 300 Lines of Code (LOC) per File**: Every component, hook, and API service is partitioned into focused, single-responsibility units.
- **Single Responsibility Principle (SRP)**: Presentational components handle display and interaction; custom hooks handle state and orchestration; API adapters handle network calls.
- **Domain-Driven Organization**: Admin workspaces are segmented into dedicated directories (`AdminOrders/`, `AdminProducts/`, `AdminCustomers/`, `AdminAnalytics/`, `AdminShared/`).
- **Design Rationale (ADRs)**: Documented under `docs/adr/` in the repository root.

---

## Scope

This application provides:

- Product browsing, category filtering, and instant search
- Cart drawer and optimized multi-gateway checkout (Stripe, Paystack, M-Pesa STK Push)
- Profile and order-tracking timeline experiences
- Auth UI flows (login, register, session restore, password reset)
- Newsletter subscription and unsubscribe preferences
- Complete Admin Operating Suite:
  - **Orders Console**: Dispatch rhythm, live queue, order inspection drawer
  - **Products Studio**: Merchandising editor, variant stock manager, CSV bulk ingestion
  - **Inventory Dashboard**: Low-stock alerts, safety thresholds, replenishment recommendations
  - **Customers Console**: RFM metrics, segment filtering, customer profile view
  - **Commerce Analytics**: Velocity vectors, demand forecasting, KPI telemetry

---

## Technology Stack

- **React 18**: Component-based reactive UI
- **Vite 7**: Ultra-fast bundler and development environment
- **Tailwind CSS 4**: Modern responsive utility styling
- **TanStack Query v5**: Server state management with optimistic caching
- **React Router 7**: Declarative client-side routing
- **Stripe React SDK**: Payment element integrations
- **Framer Motion**: Micro-interactions and UI transitions
- **React Helmet Async**: SEO and open-graph metadata management

---

## Runtime Integration

- Front-end calls the backend API through `VITE_API_URL`.
- API base normalization is handled in `src/services/apiConfig.js`.
- Stripe publishable key is injected at build time.
- Containerized runtime serves static assets via Nginx with security headers.

---

## Environment Variables

Required for full functionality:

- `VITE_API_URL`: Base URL to backend service (example: `http://localhost:5000`)
- `VITE_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key for payment UI

_Note: Vite embeds environment values at build time. Changing these values requires rebuilding._

---

## Local Development

From `Front-End/`:

```bash
npm ci
npm run dev
```

Default dev server URL: `http://localhost:5173`

---

## Quality Gates

From `Front-End/`:

```bash
npm run lint
npm run build
npm test
```

---

## Primary Routes

- `/`: Storefront landing page
- `/shop`: Product catalog and category filter
- `/profile`: Customer account and order history
- `/track-orders`: Real-time order fulfillment timeline
- `/reset-password`: Account password recovery
- `/newsletter/unsubscribe`: Newsletter preferences
- `/admin/orders`: Orders and fulfillment workspace
- `/admin/products`: Product merchandising studio
- `/admin/inventory`: Inventory safety margin manager
- `/admin/customers`: Customer relationship console
- `/admin/analytics`: Commerce velocity and forecasting
