# ADR 0004: Real-Time Order Fulfillment Synchronization

## Status

Accepted

## Context

Customers tracking orders on `/track-orders` expect immediate, visual insight into their order's journey through canonical African luxury fulfillment stages:

1. **Ritual Accepted** (`processing`, 0%)
2. **Atelier Wrapped** (`packed`, 33%)
3. **Continental Route** (`shipped`, 66%)
4. **Doorstep Arrival** (`delivered`, 100%)

Prior to this decision, the Admin Dashboard Orders drawer used disconnected dropdown selects, lacking visual timeline parity with the customer view. Furthermore, customers had to manually reload `/track-orders` to discover updates made by administrators.

## Decision

1. **Shared Fulfillment Stage Contract**:
   - Centralize fulfillment stage definitions in `Front-End/src/data/trackingStages.js`.
   - Embed `AdminShippingProgressTimeline.jsx` directly into the Admin Order Detail drawer, providing visual parity between admin actions and customer experience.
2. **Real-Time Polling Synchronization**:
   - Configure `useUserOrdersQuery.js` with a 10-second polling interval (`refetchInterval: 10000`, `staleTime: 5000`) and window focus revalidation (`refetchOnWindowFocus: true`).
   - When an administrator transitions an order status, customer tracking updates automatically within seconds without page reloads.

## Consequences

### Positive

- Perfect design and terminology parity across customer tracking and administrative operations.
- Real-time customer satisfaction with automated, live shipment status updates.
- Centralized tracking stage constants eliminate status string mismatches.

### Negative / Trade-offs

- Slight increase in background polling traffic on active `/track-orders` sessions, mitigated by caching and stale-time guards.
