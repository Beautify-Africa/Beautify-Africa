# Beautify Africa — Enterprise E-Commerce Platform

[![CI](https://github.com/Beautify-Africa/Beautify-Africa/actions/workflows/ci.yml/badge.svg)](https://github.com/Beautify-Africa/Beautify-Africa/actions/workflows/ci.yml)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)

An enterprise-grade, high-performance e-commerce platform dedicated to African-inspired luxury beauty and wellness products. Engineered with modern JavaScript standards, transactional integrity, and reactive frontend resilience.

---

## 🏛 Architecture Overview

Beautify Africa is structured as an **npm workspaces monorepo** separating presentation and server concerns while maintaining shared code standards, linting, and formatting.

```text
Beautify-Africa/
├── Back-End/                       # Express 5 & Sequelize REST API
│   ├── config/                     # Database, Redis, Migrator, BullMQ
│   ├── controllers/                # Request handlers & HTTP endpoints
│   ├── middlewares/                # Auth (RBAC), Rate Limiters, Request ID, Zod Validator
│   ├── migrations/                 # Umzug reversible database migrations
│   ├── models/                     # Sequelize models (User, Product, Order, InventoryLedger, etc.)
│   ├── queues/ & workers/          # BullMQ background workers (email, stock alerts)
│   ├── routes/                     # Express route declarations
│   ├── services/                   # Business logic (inventory locks, orders, auth)
│   ├── tests/                      # Jest unit & integration test suites
│   ├── utils/                      # Pino logger, email dispatches
│   └── validations/                # Zod request validation schemas
│
├── Front-End/                      # React 18 & Vite SPA
│   ├── e2e/                        # Playwright end-to-end browser test suites
│   ├── src/
│   │   ├── Components/             # Atomic & domain UI components (Shop, Cart, Checkout, Admin)
│   │   ├── context/                # React Context (Auth, Cart)
│   │   ├── hooks/                  # Custom hooks & TanStack Query hooks (useProductsQuery, etc.)
│   │   ├── lib/                    # QueryClient configuration with smart retry & caching
│   │   ├── pages/                  # Route views (HomePage, ShopPageLayout, Admin, Profile)
│   │   ├── services/               # Axios/Fetch API client modules
│   │   ├── utils/                  # Sonner toast wrapper, image formatters
│   │   └── validations/            # Client-side Zod validation schemas
│   ├── nginx.conf                  # Production reverse proxy with security headers
│   └── playwright.config.js        # Playwright E2E configuration
│
├── .github/workflows/              # Automated CI/CD pipelines (Lint, Tests, Build, Docker)
├── docker-compose.yml              # Local orchestration (PostgreSQL 16, Redis 7, Backend, Frontend)
└── package.json                    # Monorepo root workspace configuration
```

---

## 🛠 Technology Stack

| Layer        | Technologies                                                                     |
| ------------ | -------------------------------------------------------------------------------- |
| **Frontend** | React 18, Vite 7, Tailwind CSS 4, TanStack Query v5, Zod, Sonner, Framer Motion  |
| **Backend**  | Node.js 20, Express 5, Sequelize v6, PostgreSQL 16, Redis 7, BullMQ, Pino Logger |
| **Testing**  | Vitest, React Testing Library, Jest, Playwright E2E                              |
| **DevOps**   | Docker, Docker Compose, Nginx, GitHub Actions CI/CD                              |
| **Security** | RBAC, Bcrypt, httpOnly cookies, Helmet, Express Rate Limit, RFC 7807 Errors      |

---

## 🚀 Quickstart Guide

### Prerequisites

- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **Docker & Docker Compose**: (optional, for containerized execution)
- **PostgreSQL 16+** & **Redis 7+** (for native execution)

---

### Option A: Running with Docker Compose (Recommended)

The easiest way to boot the full production stack including database and cache:

1. **Clone the repository**:

   ```bash
   git clone https://github.com/Beautify-Africa/Beautify-Africa.git
   cd Beautify-Africa
   ```

2. **Configure Environment Variables**:

   ```bash
   cp .env.example .env
   cp Back-End/.env.example Back-End/.env
   cp Front-End/.env.example Front-End/.env
   ```

3. **Start All Services**:

   ```bash
   docker compose up --build -d
   ```

4. **Verify Health**:
   - Storefront UI: [http://localhost:4173](http://localhost:4173)
   - Backend API: [http://localhost:5000/health/ready](http://localhost:5000/health/ready)
   - API Documentation / Base: [http://localhost:5000/api](http://localhost:5000/api)

---

### Option B: Native Local Development

1. **Install All Workspace Dependencies**:

   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create `Back-End/.env` and `Front-End/.env` from their respective `.env.example` templates.

3. **Run Database Migrations**:

   ```bash
   npm run migrate
   ```

4. **Seed Initial Products (Optional)**:

   ```bash
   npm --prefix Back-End run seed
   ```

5. **Start Frontend & Backend Concurrently**:

   ```bash
   npm run dev
   ```

   - Frontend runs at: `http://localhost:5173`
   - Backend runs at: `http://localhost:5000`

---

## 📜 Monorepo Command Reference

| Command                    | Action                                                       |
| -------------------------- | ------------------------------------------------------------ |
| `npm run dev`              | Starts Backend and Frontend development servers concurrently |
| `npm run dev:backend`      | Starts Express backend with nodemon hot reload               |
| `npm run dev:frontend`     | Starts Vite frontend development server                      |
| `npm run build`            | Compiles production-optimized frontend bundle with Vite      |
| `npm run migrate`          | Executes pending Umzug database migrations                   |
| `npm run migrate:rollback` | Reverts the most recent database migration                   |
| `npm run test:all`         | Executes all 114 backend (Jest) and frontend (Vitest) tests  |
| `npm run test:backend`     | Runs backend Jest test suites (13 suites, 86 tests)          |
| `npm run test:frontend`    | Runs frontend Vitest test suites (5 suites, 28 tests)        |
| `npm run test:e2e`         | Runs Playwright browser end-to-end tests (5 scenarios)       |
| `npm run lint`             | Checks frontend code quality with ESLint                     |
| `npm run format`           | Auto-formats all codebase files using Prettier               |
| `npm run format:check`     | Verifies code formatting conformance                         |

---

## 🔒 Security & Enterprise Practices

1. **Role-Based Access Control (RBAC)**:
   - System user roles: `customer`, `admin`, `manager`, `support`.
   - Admin and manager endpoints are protected via `requireRole(['admin', 'manager'])` middleware.
   - Frontend route guarding via `<ProtectedRoute adminOnly>` redirects unauthorized users before executing sensitive components.

2. **Atomic Concurrency & Inventory Ledger**:
   - Stock adjustments execute within database transactions using row-level locks (`transaction.LOCK.UPDATE`).
   - Every stock movement records an audit entry in `InventoryLedger` tracking delta, reason, order reference, and actor.

3. **Idempotent Webhooks & Safe Payments**:
   - Stripe webhooks verify signatures and log event IDs to `WebhookEvent` table to prevent duplicate order fulfillment or double-charging.

4. **Structured Logging & Observability**:
   - Pino structured JSON logger with correlation IDs (`x-request-id`) forwarded through headers.
   - Health probes: `/health/live` (process liveness) and `/health/ready` (PostgreSQL and Redis connectivity check).

5. **Client Resilience**:
   - Global and sectional React `<ErrorBoundary>` fallback components prevent full-application whiteout on render exceptions.
   - TanStack Query eliminates manual `AbortController` fetch loops and provides intelligent stale-while-revalidate background caching.

---

## 🧪 Testing Architecture

```text
Tests (119 Total)
├── Backend Jest (86 Tests)
│   ├── Authentication & Role Access Control
│   ├── Order Processing & Pricing Calculations
│   ├── Atomic Inventory Deduction & Restock Ledger
│   ├── Request Body Parsing & Sanitization
│   ├── Model Indexes & Unique Constraints
│   └── Observability & Health Probes
│
├── Frontend Vitest (28 Tests)
│   ├── Zod Shipping Form Validation
│   ├── Cart State Mutations & Price Calculations
│   ├── Protected Route Guard Redirection
│   ├── Error Boundary Recovery & Rendering
│   └── Toast Notification Dispatching
│
└── Playwright E2E (5 Tests)
    ├── Customer Browsing & Storefront Loading
    ├── Sliding Cart Drawer Interaction & Keyboard Traps
    └── Admin Route Guard Redirection
```

---

## 🏛 Code Maintainability & Architectural Decision Records (ADRs)

Beautify Africa enforces high maintainability standards across all layers:

- **300 LOC Ceiling**: All application components, controllers, services, and utilities are strictly partitioned to <= 300 lines of code.
- **Single Responsibility Principle (SRP)**: Each module owns one clearly defined business or presentational concern.
- **Architectural Decision Records (ADRs)**: Critical design decisions and system rationales are documented in [`docs/adr/`](docs/adr/README.md):
  - [ADR-0001: Code Maintainability and 300 LOC File Boundary](docs/adr/0001-code-maintainability-and-300-loc-boundary.md)
  - [ADR-0002: Modular Admin Dashboard Architecture](docs/adr/0002-modular-admin-dashboard-architecture.md)
  - [ADR-0003: Dual-Layer Cart Latency Optimization](docs/adr/0003-dual-layer-cart-latency-optimization.md)
  - [ADR-0004: Real-Time Fulfillment Synchronization](docs/adr/0004-realtime-fulfillment-synchronization.md)
- **Automated Formatting**: Monorepo-wide code style is enforced via `.prettierrc`.

---

## 🚢 Deployment & Production Readiness

- **Production Health Checks**:
  - `GET /health/live`: 200 OK (uptime, timestamp).
  - `GET /health/ready`: 200 OK when PostgreSQL and Redis connections are verified; 503 if degraded.
- **Dockerized Multi-Stage Build**:
  - `Front-End/Dockerfile`: Compiles React SPA into static assets served via an alpine Nginx server with Brotli/Gzip compression, security headers, and caching headers.
  - `Back-End/Dockerfile`: Runs pruned production dependencies, applies Umzug migrations on boot, and starts Express.

---

## 📄 License

This project is licensed under the ISC License.
