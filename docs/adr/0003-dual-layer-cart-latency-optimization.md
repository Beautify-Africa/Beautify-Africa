# ADR 0003: Dual-Layer Cart Latency Optimization

## Status

Accepted

## Context

Shoppers experienced noticeable delay when adding items or updating quantities in the cart. Profiling revealed two primary latency bottlenecks:

1. **Frontend Latency**: `CartContext.jsx` blocked local state updates until HTTP API calls finished roundtrips across international networks.
2. **Backend Database Latency**: `cartController.js` executed product in-stock validation and cart retrieval sequentially using chained `await` statements, doubling database roundtrip latency.

## Decision

We implemented a **dual-layer optimization strategy**:

1. **Client-Side Optimistic Updates**:
   - `CartContext.jsx` optimistically updates local React state immediately for `addItem`, `updateQuantity`, `removeItem`, and `clearCart`.
   - Shoppers perceive 0ms latency: item counts, badges, and subtotals update instantaneously.
   - If a network error or stock conflict occurs on the backend, the cart state automatically rolls back to its previous snapshot and notifies the user with a dismissible notification.
2. **Server-Side Concurrent Querying**:
   - `cartController.js` executes `findInStockProduct(productId)` and `findOrCreateCart(userId)` concurrently using `Promise.all(...)`.
   - Server-side response time is halved, reducing overall database connection wait times.

## Consequences

### Positive

- Sub-second, instantaneous cart interactions for shoppers.
- Resilient rollback mechanism protects against desynchronization in offline or high-latency scenarios.
- Halved server-side database latency during peak checkout traffic.

### Negative / Trade-offs

- Cart state logic in React requires snapshot preservation to facilitate clean rollbacks on error.
