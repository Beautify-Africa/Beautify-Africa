# Beautify Africa — Backend API

RESTful API and transactional backend service powering the Beautify Africa e-commerce platform. Built with Express 5, Sequelize v6 (PostgreSQL 16), Redis 7, and BullMQ background queues.

---

## 🏛 Architecture & Code Standards

The backend adheres strictly to modularity and clean code design standards:

- **Maximum 300 Lines of Code (LOC) per File**: Every service, controller, utility, and route is modularized into cohesive, single-responsibility units.
- **Single Responsibility Principle (SRP)**: Controllers handle HTTP serialization and error routing; services implement core domain and persistence logic.
- **Façade Pattern for Zero Breaking Changes**: Monolithic service entrypoints (e.g. `services/adminService.js`, `controllers/adminController.js`) act as thin, strongly typed facades delegating to specialized domain sub-services.
- **Architectural Decision Records (ADRs)**: Critical architectural choices are documented in `docs/adr/`.

---

## 📁 Directory Structure

```text
Back-End/
├── config/                     # Database, Redis, CORS, BullMQ queue configurations
│   ├── appMiddleware.js        # Global Express middlewares
│   ├── corsConfig.js           # Strict domain and preview environment CORS rules
│   ├── db.js                   # Sequelize connection pool
│   └── redis.js                # Upstash / native Redis connection
├── controllers/                # HTTP route controllers
│   ├── admin/                  # Modular admin domain handlers (orders, products, inventory, customers)
│   ├── adminController.js      # Facade exporting all admin handlers
│   ├── authController.js       # Customer and admin authentication
│   ├── authPasswordResetController.js # Password reset lifecycle
│   ├── orderController.js      # Order placement and retrieval
│   └── orderCancellationController.js # Transactional order cancellation
├── docs/                       # OpenAPI/Swagger documentation specifications
├── middlewares/                # Auth (RBAC), Rate Limiters, Request ID, Body Parsers
├── migrations/                 # Umzug reversible database migrations
├── models/                     # Sequelize models (User, Product, Order, InventoryLedger, etc.)
├── queues/ & workers/          # BullMQ background workers (email, low-stock alerts)
├── routes/                     # Express route declarations (products, orders, admin, etc.)
├── services/                   # Business logic layer
│   ├── admin/                  # Modular admin sub-services (order, product, dashboard, reorder, customer)
│   ├── adminService.js         # Facade delegating to admin sub-services
│   ├── gateways/               # Payment gateways (MpesaAdapter, MpesaClient, Stripe, Paystack)
│   ├── inventoryService.js     # Row-level locked stock reservations & transactions
│   └── orderService.js         # Cart price verification and order construction
├── tests/                      # Jest unit and integration test suites
└── utils/                      # Pino logger, email dispatchers
```

---

## 🛠 Setup & Development

### 1. Install Dependencies

```bash
cd Back-End
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure required variables:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/beautify_africa
JWT_SECRET=your_jwt_secret_key
REDIS_URL=redis://localhost:6379
```

### 3. Run Migrations & Seed

```bash
npm run migrate
npm run seed
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000` with hot-reload enabled via Nodemon.

---

## 🧪 Testing

Run backend test suites:

```bash
npm test
```

Or from the monorepo root:

```bash
npm run test:backend
```

All 17 test suites (107+ unit & integration tests) run with mocked database and redis layers for fast, isolated verification.
