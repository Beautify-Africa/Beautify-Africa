# Edge Security, DNS Hardening & WAF Architecture

## 1. Perimeter Defense Overview

Beautify Africa implements defense-in-depth across three architectural tiers:

1. **Edge Tier (Cloudflare / CloudFront)**: DNS security, DDoS mitigation, Web Application Firewall (WAF), TLS termination, and Origin Shielding.
2. **Reverse Proxy / Ingress Tier (Nginx / Load Balancer)**: SSL cipher restriction, rate limiting, and HTTP connection hygiene.
3. **Application Tier (Node.js Express & PostgreSQL)**: Helmet headers, CORS restrictions, CSRF tokens, Zod validation, TOTP 2FA, and Row-Level Security.

---

## 2. DNS Security & Anti-Spoofing Configuration

To prevent domain impersonation, spear-phishing, and business email compromise (BEC), all authoritative DNS zones must publish the following records:

### 2.1 Sender Policy Framework (SPF)

Restricts which IP addresses and mail transfer agents (MTAs) are authorized to send emails on behalf of `@beautifyafrica.app`:

```dns
# Root Domain SPF Record (TXT)
beautifyafrica.app.    300    IN    TXT    "v=spf1 include:_spf.google.com include:mailgun.org ~all"
```

### 2.2 DomainKeys Identified Mail (DKIM)

Provides cryptographic authenticity and tamper-proofing for outbound emails:

```dns
# DKIM 2048-bit Public Key Record (TXT)
k1._domainkey.beautifyafrica.app.    300    IN    TXT    "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..."
```

### 2.3 Domain-based Message Authentication, Reporting, and Conformance (DMARC)

Instructs receiving mail servers how to treat messages that fail SPF and DKIM validation:

```dns
# DMARC Record (TXT)
_dmarc.beautifyafrica.app.    300    IN    TXT    "v=DMARC1; p=reject; sp=reject; pct=100; rua=mailto:dmarc-reports@beautifyafrica.app; ruf=mailto:dmarc-forensics@beautifyafrica.app; fo=1"
```

- `p=reject`: Highest security policy — immediately drops unauthorized spoofed emails.
- `rua`: Daily aggregate XML reports for visibility into domain reputation.
- `ruf`: Real-time forensic failure notifications.

### 2.4 DNS Certification Authority Authorization (CAA)

Restricts SSL/TLS certificate issuance to trusted Certificate Authorities:

```dns
beautifyafrica.app.    300    IN    CAA    0 issue "letsencrypt.org"
beautifyafrica.app.    300    IN    CAA    0 issue "digicert.com"
beautifyafrica.app.    300    IN    CAA    0 issuewild ";"
beautifyafrica.app.    300    IN    CAA    0 iodef "mailto:security@beautifyafrica.app"
```

---

## 3. Web Application Firewall (WAF) & Edge Rules

### 3.1 OWASP Core Rule Set (CRS)

Enable Cloudflare Managed Ruleset / AWS WAF Core Rule Set targeting:

- SQL Injection (`SQLi`)
- Cross-Site Scripting (`XSS`)
- Local & Remote File Inclusion (`LFI`/`RFI`)
- Server-Side Request Forgery (`SSRF`)
- Protocol Anomaly Enforcement (blocking invalid HTTP verbs, malformed headers)

### 3.2 Edge Rate Limiting Policies

| Zone | Threshold | Action | Duration |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | 10 requests / 15 min per IP | Challenge / Block | 15 minutes |
| `/api/auth/admin-login` | 5 requests / 15 min per IP | Drop / CAPTCHA | 30 minutes |
| `/api/payment/*` | 15 requests / 15 min per IP | Rate Limit (429) | 15 minutes |
| Global API `/api/*` | 100 requests / 15 min per IP | Rate Limit (429) | 15 minutes |

### 3.3 Origin Cloaking & Direct-to-Origin Prevention

- The origin server IP must never be disclosed publicly or recorded in DNS A/AAAA records.
- Configure origin firewall (`ufw` / AWS Security Groups) to drop all incoming TCP traffic on ports 80/443 **except** from validated Cloudflare IP ranges (`https://www.cloudflare.com/ips/`).
- Authenticated Origin Pulls (AOP) enforce mutual TLS (mTLS) between Cloudflare and the origin server.

---

## 4. Edge SSL/TLS Hardening

1. **Minimum TLS Version**: TLS 1.2 minimum, TLS 1.3 preferred.
2. **Cipher Suites**:
   - `TLS_AES_128_GCM_SHA256`
   - `TLS_AES_256_GCM_SHA384`
   - `TLS_CHACHA20_POLY1305_SHA256`
   - `ECDHE-ECDSA-AES128-GCM-SHA256`
   - `ECDHE-RSA-AES128-GCM-SHA256`
3. **HTTP/2 & HTTP/3 (QUIC)**: Enabled for improved multiplexing performance and connection security.
4. **HSTS Preloading**: Domain registered on `hstspreload.org` to ensure browsers permanently force HTTPS before the first connection.
