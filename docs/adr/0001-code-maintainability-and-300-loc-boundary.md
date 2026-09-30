# ADR 0001: Code Maintainability and 300-LOC Ceiling

## Status

Accepted

## Context

As the Beautify Africa platform expanded to support complex administrative workflows, inventory telemetry, customer intelligence, multi-gateway payments, and transactional ledger tracking, several core modules grew into monolithic files exceeding 400 to 600 lines of code.

These large files introduced several engineering challenges:

1. **Cognitive Overload**: Developers had to navigate hundreds of lines of presentation and business logic within single files.
2. **Single Responsibility Violations**: Components simultaneously managed UI layout, multiple payment gateway integrations, polling intervals, API serialization, and local state.
3. **Merge Conflict Friction**: High file churn across diverse features increased the risk of git conflicts and unintended regressions.
4. **Testing Friction**: Tightly coupled components made it difficult to isolate units for component and integration testing.

## Decision

We enforce a strict **300-lines-of-code (LOC) ceiling** across all production application logic in both `Front-End/src` and `Back-End`.

Specifically:

- **Component Decomposition**: React components exceeding 300 lines must be decomposed into domain-specific subcomponents, dedicated forms, and custom hooks following the Single Responsibility Principle (SRP).
- **Service & Controller Modularization**: Backend services and Express controllers exceeding 300 lines must be split into focused domain sub-services (e.g., `adminOrderService.js`, `adminProductService.js`, `adminDashboardService.js`).
- **Facade Pattern for Backward Compatibility**: Root services (e.g. `adminService.js`, `adminController.js`, `adminApi.js`) serve as lightweight facade modules re-exporting the underlying modular implementations. This guarantees zero breaking changes across existing callers, tests, and API routes.
- **Automated Verification**: Monorepo static analysis, Prettier formatting, and CI/CD quality gates must validate code size and style prior to release.

## Consequences

### Positive

- Every file has a single, well-defined reason to change.
- Significantly improved readability, maintainability, and developer onboarding velocity.
- Isolated unit testing for specialized subcomponents and helper functions.
- Façade re-exports ensure 100% backward compatibility with existing tests and imports.

### Negative / Trade-offs

- Increased total number of files in the project.
- Developers must maintain disciplined directory structures and avoid circular imports across modular layers.
