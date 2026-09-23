// config/helmetConfig.js
/**
 * Hardened Helmet & HTTP Security Headers Configuration
 * Enforces modern defense-in-depth headers:
 *  - HSTS (HTTP Strict Transport Security with preload)
 *  - CSP (Content Security Policy with mixed-content protection)
 *  - Framing defense (X-Frame-Options: DENY)
 *  - Sniffing defense (X-Content-Type-Options: nosniff)
 *  - Permissions Policy (Hardware API lockdown)
 *  - Origin Agent Clustering, DNS Prefetch Control, and Cross-Domain policies
 */
function createHelmetOptions() {
  const isProductionLike =
    process.env.NODE_ENV === 'production' ||
    process.env.NODE_ENV === 'staging' ||
    process.env.FORCE_HSTS === 'true';

  return {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://js.stripe.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://res.cloudinary.com',
          'https://images.unsplash.com',
          'https://*.stripe.com',
        ],
        connectSrc: [
          "'self'",
          'https://api.stripe.com',
          'https://api.paystack.co',
          'https://sandbox.safaricom.co.ke',
          'https://api.safaricom.co.ke',
        ],
        frameSrc: [
          "'self'",
          'https://js.stripe.com',
          'https://hooks.stripe.com',
          'https://checkout.paystack.com',
        ],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        ...(isProductionLike ? { upgradeInsecureRequests: [] } : {}),
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    frameguard: { action: 'deny' },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    originAgentCluster: true,
    dnsPrefetchControl: { allow: false },
    ieNoOpen: true,
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    hsts: isProductionLike
      ? {
          maxAge: 31536000, // 1 year
          includeSubDomains: true,
          preload: true,
        }
      : false,
  };
}

function permissionsPolicyMiddleware(req, res, next) {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
}

module.exports = {
  createHelmetOptions,
  permissionsPolicyMiddleware,
};
