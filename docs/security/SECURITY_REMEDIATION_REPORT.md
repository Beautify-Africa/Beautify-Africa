# Beautify Africa Security Remediation Report

**Date:** 2026-09-25  
**Scope:** `Back-End`, `Front-End`, Docker configuration, and repository security documentation  
**Purpose:** Define the work required to close identified security gaps and make the existing controls verifiable in production.

## 1. Executive Summary

Beautify Africa has a solid application-security foundation. The repository already contains security headers, CORS restrictions, CSRF defenses, JWT authentication, RBAC, password hashing, account lockout, rate limiting, request validation, upload controls, payment webhook signature handling, database transactions, and security-focused tests.

The application should not yet be considered fully production-hardened for real transactions. The highest-risk areas are:

1. Payment order ownership and payment-to-order binding are not enforced consistently.
2. Database TLS certificate verification is disabled unless explicitly enabled.
3. JWTs are returned to the browser in JSON even though HttpOnly cookies are available.
4. The frontend Nginx layer lacks a production CSP and HSTS policy.
5. Disabling 2FA can succeed with only a password when 2FA is enabled.
6. Docker Compose exposes infrastructure ports and supplies insecure fallback credentials.
7. Several perimeter and compliance controls are documented but require deployment evidence before being treated as implemented.

The recommended implementation order is: payment authorization, transport and secret hardening, authentication-session hardening, frontend headers, infrastructure lockdown, then monitoring and assurance automation.

## 1.1 Implementation Status (2026-09-26)

The repository-level P0 and P1 application changes in this report are implemented:

- CSRF now fails closed when the cookie or header is missing.
- Browser authentication uses HttpOnly cookies without returning or constructing bearer JWTs in the frontend.
- Payment verification and both Stripe and multi-gateway webhook paths validate ownership, gateway, reference, amount, currency, and webhook order metadata.
- Payment amounts are normalized before comparison.
- 2FA disablement requires TOTP or a recovery code.
- Production/staging database TLS verification is enforced; only the test environment may opt into unverified certificates for local fixtures.
- Frontend CSP/HSTS, explicit CORS origins, and Docker infrastructure lockdown are implemented.

The remaining work is deployment and assurance work: prove WAF/origin firewall/DNS controls, configure monitoring and alerting, add secret and container scanning where not already present in CI, and have the compliance owner review the PCI documentation against production evidence. The repository test suites currently pass: 29 backend suites with 216 tests and 7 frontend files with 47 tests.

## 2. Verified Controls Already Present

| Area | Existing implementation | Evidence |
|---|---|---|
| HTTP hardening | Helmet, frame protection, MIME sniffing protection, CSP, referrer policy, HSTS in production-like environments | `Back-End/config/helmetConfig.js`, `Back-End/server.js` |
| CORS | Explicit origin allowlist, credential support, explicit methods and headers | `Back-End/config/corsConfig.js` |
| CSRF | Safe-method exemptions, Origin/Referer checks, double-submit cookie/header support | `Back-End/middlewares/csrfProtection.js` |
| Authentication | HS256 algorithm restriction, expiry, blacklist lookup, token-version revocation, admin authorization | `Back-End/middlewares/authMiddleware.js`, `Back-End/services/authService.js` |
| Credential protection | bcrypt password hashing, dummy comparison for unknown users, failed-login lockout | `Back-End/models/User.js`, `Back-End/controllers/authController.js` |
| 2FA | TOTP, recovery codes, replay detection | `Back-End/controllers/authController.js`, `Back-End/services/totpService.js` |
| Abuse controls | Authentication, admin, password-reset, cart, payment, search, newsletter and API rate limits | `Back-End/middlewares/rateLimiters.js` |
| Input protection | Zod validation, body-size limits, query caps, request sanitization | `Back-End/middlewares/validate.js`, `Back-End/middlewares/bodyParser.js`, `Back-End/middlewares/queryCaps.js` |
| Upload protection | Admin-only access, MIME/extension allowlists, magic-byte checks, size limit, randomized Cloudinary IDs | `Back-End/routes/uploadRoutes.js` |
| Payment webhooks | Raw body handling, provider signature verification, event deduplication, database transactions | `Back-End/routes/stripeRoutes.js`, `Back-End/routes/paymentRoutes.js`, payment services |
| Database | PostgreSQL, migration-based schema, indexes, statement timeouts, RLS hardening scripts | `Back-End/config/db.js`, `Back-End/migrations/`, `Back-End/scripts/enableDatabaseSecurity.js` |
| Testing | Security-header, CORS, CSRF, validation, upload and payment-service tests | `Back-End/tests/apiSecurityHardening.test.js`, payment tests |

These controls reduce risk but do not replace authorization checks, secure deployment configuration, monitoring, or independent verification.

## 3. Remediation Priorities

### P0: Block release until complete

#### P0.1 Bind every payment operation to the correct order

**Problem**

`POST /api/payments/initialize` accepts an existing `orderId` while authentication is optional. `GET /api/payments/verify/:gateway/:reference` accepts a caller-provided `orderId`. The payment service can mark an order as paid without proving that the provider reference, amount, currency, gateway, and order metadata all match.

Relevant areas:

- `Back-End/controllers/paymentController.js`
- `Back-End/services/paymentGatewayService.js`
- `Back-End/routes/paymentRoutes.js`

**Required design**

1. For authenticated orders, require `order.userId === req.user.id` unless the caller is an authorized administrative service.
2. For guest orders, issue a high-entropy, short-lived checkout capability token tied to the order. Do not use a sequential order ID as authorization.
3. When initializing payment for an existing order, reject orders that are already paid, cancelled, expired, or owned by another user.
4. Store the expected gateway, currency, amount in minor units, and provider reference on the order before verification.
5. During verification, obtain the transaction status from the provider and compare:
   - provider reference to the order's stored reference;
   - provider gateway to the order gateway;
   - provider currency to the order currency;
   - provider amount to the expected payable amount;
   - provider metadata/order identifier to the internal order ID where supported.
6. Never trust `orderId` from the query string as proof of ownership or payment identity.
7. Make payment confirmation a single transactional service method with an explicit authorization and reconciliation result.
8. Reject mismatches with a generic response and log a security event containing request ID, gateway, order ID, and mismatch category, but never secrets or card data.

**Tests required**

- Customer cannot initialize or verify another customer's order.
- Guest capability cannot be reused for another order or after expiry.
- Wrong amount, currency, gateway, reference, and metadata are rejected.
- A provider success for an already paid or cancelled order is idempotent and does not deduct inventory twice.
- Webhook confirmation is accepted only after signature and payment-to-order binding pass.

#### P0.2 Enforce database TLS verification

**Problem**

`Back-End/config/db.js` sets `rejectUnauthorized` to `false` unless `PG_SSL_REJECT_UNAUTHORIZED=true`. A production connection can therefore be encrypted but not authenticated against a trusted certificate.

**Implementation**

- In `production` and `staging`, fail startup unless certificate verification is enabled.
- Use `PGSSLROOTCERT` or the provider's CA bundle where required.
- Permit disabled verification only for explicitly local development connections.
- Add a startup diagnostic that reports TLS mode without printing the connection string.
- Add a test covering production, staging, local, and test environment behavior.

#### P0.3 Stop returning bearer JWTs to the browser

**Problem**

Registration and login return `token` in JSON while also setting HttpOnly cookies. The frontend then retains the token in React state and sends it in Authorization headers. Any XSS defect can steal that token.

Relevant areas:

- `Back-End/controllers/authController.js`
- `Front-End/src/context/AuthContext.jsx`
- `Front-End/src/services/authApi.js`
- `Front-End/src/services/apiConfig.js`

**Implementation**

1. Use the secure HttpOnly cookie as the browser session credential.
2. Remove `token` from registration, login, admin-login, and session responses.
3. Set `credentials: 'include'` on browser API requests.
4. Fetch `/api/csrf-token` before cookie-authenticated mutations and send `X-CSRF-Token`.
5. Remove frontend token state and Authorization-header fallback after all callers migrate.
6. Keep server-side Bearer support only for explicitly documented non-browser clients, or remove it after migration.
7. Confirm cookies use `Secure`, `HttpOnly`, `SameSite=Lax` or stricter, and an appropriate `__Host-` cookie in production.
8. Invalidate all sessions after password reset, password change, and 2FA security changes.

**Tests required**

- Login response contains no JWT.
- Browser requests authenticate using cookies.
- Cross-site mutation without a valid CSRF token fails.
- Logout clears every auth cookie and invalidates the session.
- API clients that are intentionally supported still use a documented authentication mechanism.

#### P0.4 Require the second factor to disable 2FA

**Problem**

`disableTwoFactor()` checks the TOTP code only when one is supplied. An enabled account can therefore disable 2FA using only the password.

**Implementation**

- Require password plus a valid current TOTP code, or a one-time recovery code, whenever `twoFactorEnabled` is true.
- Consume recovery codes atomically.
- Increment `tokenVersion` and revoke active sessions after disabling 2FA.
- Emit a security audit event and send an account notification.

**Tests required**

- Password alone cannot disable enabled 2FA.
- Valid TOTP disables 2FA.
- A recovery code works once and cannot be reused.
- Existing sessions are invalidated after the change.

### P1: Complete before broad production traffic

#### P1.1 Add security headers to the frontend edge

The backend Helmet policy does not protect static files served by Nginx. Update `Front-End/nginx.conf` and the production edge configuration to provide:

- A tested Content-Security-Policy matching the actual Stripe, Paystack, Cloudinary, API, font, and image origins.
- HSTS only when the public site is served entirely through HTTPS.
- `X-Frame-Options: DENY` and `frame-ancestors 'none'`.
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy` limiting unused browser capabilities.
- Removal of obsolete `X-XSS-Protection`.

Start CSP in report-only mode, collect violations, then enforce it. Remove `unsafe-eval`; replace unnecessary inline scripts/styles with external assets, hashes, or nonces. Keep payment provider origins narrowly scoped.

#### P1.2 Narrow CORS and preview-origin trust

`Back-End/config/corsConfig.js` permits a pattern of Vercel preview origins. Replace the wildcard-like project pattern with an explicit, environment-controlled list. Production should allow only the canonical production frontend origins. Preview environments should have separate API credentials and narrowly scoped allowlists.

Add tests for:

- canonical production origins;
- approved preview origins;
- lookalike domains;
- unrelated Vercel projects;
- requests with no Origin header.

#### P1.3 Remove insecure Docker defaults and exposed infrastructure

`docker-compose.yml` currently exposes PostgreSQL and Redis ports and supplies fallback credentials.

Implementation:

- Remove host `ports` for PostgreSQL and Redis from production compose profiles.
- Use internal Docker network access only.
- Replace default passwords and URLs with required environment variables or Docker secrets.
- Add a production compose profile separate from local development.
- Run containers as non-root users where supported.
- Pin image versions or digests and scan images in CI.
- Restrict backend exposure to the reverse proxy or load balancer.
- Use encrypted Redis/PostgreSQL connections for managed services.

#### P1.4 Harden admin access

- Require 2FA for every admin and privileged role.
- Replace the shared `ADMIN_DASHBOARD_PASSWORD` login model with individually managed admin accounts where practical.
- Apply an account-based and IP-based lockout strategy.
- Require recent authentication for high-impact actions such as product deletion, payout changes, role changes, and 2FA changes.
- Add audit records for every admin mutation, including actor ID, request ID, target resource, old state summary, and new state summary.
- Do not include credentials or reset tokens in logs.

#### P1.5 Strengthen upload processing

The current upload validation is good but should be supplemented for hostile or untrusted images:

- Re-encode images server-side or through a trusted media pipeline to remove metadata and polyglot content.
- Scan uploads with malware scanning where operationally possible.
- Keep uploads on a separate content origin with a restrictive content type and no script execution.
- Set Cloudinary transformation limits and reject oversized decompression workloads.
- Add tests for malformed image files, decompression bombs, and Cloudinary failures.

### P2: Assurance, monitoring, and operational maturity

#### P2.1 Add security event monitoring

Create structured, privacy-preserving events for:

- failed and successful authentication;
- account lockout;
- admin login and admin mutations;
- password reset request and completion;
- 2FA enrollment, disablement, and recovery-code use;
- CSRF/CORS blocks;
- payment mismatches and repeated verification failures;
- upload rejection;
- webhook signature failures;
- rate-limit trips.

Send high-risk events to a monitored sink with retention, alert thresholds, and access controls. Never log passwords, JWTs, reset tokens, payment client secrets, PAN, CVV, or full personal addresses.

#### P2.2 Automate dependency, secret, and container assurance

Add CI checks for:

- `npm audit` or an equivalent dependency scanner for both packages;
- secret scanning and push protection;
- container vulnerability scanning;
- SAST and dependency license review;
- lockfile consistency;
- security tests and production configuration tests.

Define remediation SLAs, for example: critical findings within 24 hours, high findings within seven days, and medium findings within 30 days.

#### P2.3 Verify perimeter controls with deployment evidence

The edge-security documentation describes Cloudflare/CloudFront, WAF, origin shielding, authenticated origin pulls, DNS records, SPF, DKIM, DMARC, CAA, TLS versions, and HSTS preload. These are not proven by repository files alone.

Production evidence should include:

- DNS export and certificate inventory;
- WAF managed rules and custom rules;
- origin firewall rules and proof that direct-origin traffic is blocked;
- TLS scan results;
- HSTS preload status;
- SPF, DKIM, and DMARC records;
- edge rate-limit rules;
- alert routing and incident ownership.

Do not label these controls compliant until evidence is captured and reviewed.

#### P2.4 Correct compliance documentation claims

Review `docs/security/PCI_DSS_SAQ_A_COMPLIANCE.md` and related documents. Statements such as “Compliant,” “SRI,” “Argon2/Bcrypt,” “CI automated dependency audits,” and “CSP violation reporting” must match implemented and evidenced controls.

Specifically:

- The repository uses bcrypt, not Argon2.
- SRI must not be claimed unless script integrity hashes are actually deployed and maintained.
- CI audits must point to real workflow files and successful runs.
- CSP reporting must identify a configured reporting endpoint and retention process.
- SAQ-A eligibility must be reviewed by the payment and compliance owner; code inspection alone is not an attestation.

## 4. Implementation Sequence

### Phase 1: Transaction safety and identity

1. Introduce an order authorization policy shared by order, payment, and verification routes.
2. Add payment reference/amount/currency/gateway binding and reconciliation checks.
3. Add guest checkout capability tokens.
4. Require TOTP or a recovery code to disable 2FA.
5. Add P0 regression tests before changing frontend authentication.

### Phase 2: Session and transport hardening

1. Enforce database certificate verification in staging and production.
2. Migrate browser authentication to HttpOnly cookie-only sessions.
3. Add CSRF token acquisition to the frontend request layer.
4. Remove JWTs from authentication response bodies.
5. Revoke sessions after password and 2FA changes.

### Phase 3: Edge and infrastructure hardening

1. Deploy frontend CSP in report-only mode, then enforce it.
2. Narrow CORS and preview origins.
3. Split local and production Docker Compose profiles.
4. Remove infrastructure port exposure and insecure defaults.
5. Confirm WAF, TLS, DNS, origin firewall, and monitoring configuration in the hosting platform.

### Phase 4: Operational assurance

1. Add security event schemas and alerting.
2. Add dependency, secret, SAST, and container scanning to CI.
3. Run external TLS, header, and authenticated/unauthenticated API tests.
4. Perform an authorization-focused penetration test, especially against order, payment, admin, upload, and reset flows.
5. Update compliance and security documents from evidence, not intended architecture.

## 5. Release Gates

A production release should be blocked unless all of the following are true:

- Payment authorization and provider-to-order reconciliation tests pass.
- No authentication response exposes a bearer JWT to browser clients.
- Production database TLS verification is enabled and tested.
- 2FA cannot be disabled without a second factor or recovery code.
- Frontend CSP is enforced without unresolved high-risk violations.
- PostgreSQL and Redis are not publicly exposed.
- No production secrets use repository or Compose fallback values.
- Critical and high dependency/container findings are resolved or formally accepted.
- WAF, origin protection, DNS email authentication, TLS, backups, logging, and alerting have deployment evidence.
- A rollback plan and incident contact are documented.

## 6. Recommended Test Inventory

Add or extend tests in the following areas:

- `Back-End/tests/paymentAuthorization.test.js`
- `Back-End/tests/authSessionSecurity.test.js`
- `Back-End/tests/securityConfiguration.test.js`
- `Back-End/tests/adminSecurity.test.js`
- `Front-End/src/services/authApi.test.js`
- `Front-End/src/services/apiConfig.test.js`
- Playwright tests for cookie-only login, CSRF-protected mutations, checkout authorization, and admin 2FA.

The security suite should run in CI for every pull request and again against the production-like Docker profile before deployment.

## 7. Final Risk Position

After P0 and P1 work is complete and verified, the application should have a strong baseline for a small-to-medium e-commerce deployment. It should still be treated as an ongoing security program: payment providers, third-party scripts, cloud edge configuration, dependencies, credentials, and operational access require periodic review.

This report is an implementation plan and repository assessment, not a penetration-test report, PCI attestation, legal opinion, or guarantee that deployed infrastructure matches the repository configuration.
