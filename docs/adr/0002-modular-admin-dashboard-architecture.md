# ADR 0002: Modular Admin Dashboard Architecture

## Status

Accepted

## Context

The Beautify Africa Admin Dashboard encompasses multiple enterprise workspaces: Orders Ledger & Fulfillments, Product Catalog & Variant Studio, Inventory Restocking & Low-Stock Alerts, Business Analytics & Revenue Pulse, and Customer Intelligence Studio.

Previously, administrative features were accumulating inside large, tightly coupled controllers and monolithic service files, increasing coupling between unrelated administrative domains (such as order status transitions directly sharing files with product inventory restocks).

## Decision

We adopt a **domain-driven modular architecture** for administrative functionality:

1. **Domain-Segregated Controllers & Services**:
   - `adminOrderController.js` / `adminOrderService.js`: Orders, fulfillment lanes, timeline events, and notes.
   - `adminProductController.js` / `adminProductService.js`: Catalog CRUD, variant inventory, stock adjustments, and archive states.
   - `adminInventoryController.js`: Low-stock triggers, supplier reorder plans, and stock notifications.
   - `adminCustomerController.js` / `adminCustomerService.js`: Customer intelligence, LTV aggregation, VIP classifications, and guest buyer detection.
   - `adminDashboardService.js`: Cross-cutting dashboard KPI compilation and lane aggregation.
2. **Unified API Facades**:
   - `Back-End/services/adminService.js` and `Back-End/controllers/adminController.js` act as facades re-exporting all sub-domain functions.
   - `Front-End/src/services/adminApi.js` re-exports modular API clients from `Front-End/src/services/adminApi/`.
3. **Dedicated Frontend Workspaces**:
   - Each domain resides in its own isolated component tree (`AdminOrders/`, `AdminProducts/`, `AdminCustomers/`, `AdminShared/`).

## Consequences

### Positive

- Clear domain boundaries prevent accidental cross-domain regressions.
- Enables parallel pair-programming and feature development without file merge conflicts.
- Adheres to the 300-LOC ceiling across all admin files.
- Full backward compatibility for all existing route declarations and test suites.

### Negative / Trade-offs

- Slight indirection through facade files requiring new developers to understand the module structure.
