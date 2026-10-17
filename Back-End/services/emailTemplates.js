// services/emailTemplates.js
/**
 * Luxury Email Templates for Beautify Africa
 * Handcrafted, responsive, cross-client compatible email templates (Gmail, Apple Mail, Outlook, Yahoo).
 * Brand Aesthetic: Warm Ivory canvas (#FAF9F6), Pure Card (#FFFFFF), Obsidian accents (#18181B), Radiant Amber Gold (#D97706 / #F59E0B / #92400E).
 * Typography: 'Playfair Display' / Georgia serif editorial headers with 'Inter' / system sans-serif body.
 */

const DEFAULT_CLIENT_URL = 'https://beautify-africa.com';

/**
 * Shared Base Email Wrapper
 * Provides responsive layout, luxury header, gold accent bar, and compliance footer.
 */
function renderBaseEmailTemplate({
  previewText = '',
  eyebrow = 'THE HOUSE OF BEAUTIFY',
  title = '',
  contentHtml = '',
  clientUrl = DEFAULT_CLIENT_URL,
  unsubscribeLink = null,
  managePreferencesLink = null,
}) {
  const safeClientUrl = clientUrl || DEFAULT_CLIENT_URL;
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${title ? `${title} — Beautify` : 'Beautify'}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <!-- Google Fonts for supported clients (Apple Mail, iOS Mail, Android Mail) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #FAF9F6; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    a { color: #D97706; text-decoration: none; }
    .email-container { max-width: 600px !important; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .fluid-padding { padding-left: 20px !important; padding-right: 20px !important; }
      .fluid-content { padding-left: 24px !important; padding-right: 24px !important; padding-top: 28px !important; padding-bottom: 32px !important; }
      .stack-column { display: block !important; width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; margin-bottom: 12px !important; }
      .stack-column:last-child { margin-bottom: 0 !important; }
      .mobile-center { text-align: center !important; }
      .mobile-hide { display: none !important; }
      .mobile-title { font-size: 23px !important; line-height: 1.25 !important; }
      .mobile-voucher-code { font-size: 16px !important; letter-spacing: 2px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF9F6; color: #292524; -webkit-font-smoothing: antialiased;">
  <!-- Preheader text for inbox preview -->
  <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">
    ${previewText}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #FAF9F6; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 36px 12px 48px 12px;">
        <!-- Email Card Container -->
        <!--[if (gte mso 9)|(IE)]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
        <tr>
        <td align="center" valign="top" width="600">
        <![endif]-->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; background-color: #FFFFFF; border-radius: 8px; overflow: hidden; border: 1px solid #E7E5E4; box-shadow: 0 10px 30px -5px rgba(24, 24, 27, 0.05), 0 0 1px 1px rgba(24, 24, 27, 0.03);">
          
          <!-- Top Radiant Gold Ribbon Bar -->
          <tr>
            <td style="height: 5px; background: #D97706; background-image: linear-gradient(90deg, #92400E 0%, #D97706 25%, #F59E0B 50%, #D97706 75%, #92400E 100%); line-height: 5px; font-size: 1px;">&nbsp;</td>
          </tr>

          <!-- Brand Header -->
          <tr>
            <td align="center" class="fluid-padding" style="padding: 38px 40px 26px 40px; text-align: center; border-bottom: 1px solid #F5F5F4; background-color: #FFFFFF;">
              <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto;">
                <tr>
                  <td align="center">
                    <!-- Brand Wordmark -->
                    <a href="${safeClientUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
                      <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto;">
                        <tr>
                          <td align="center" style="font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-size: 29px; font-weight: 700; letter-spacing: 7px; color: #18181B; text-transform: uppercase;">
                            BEAUTIFY
                          </td>
                        </tr>
                      </table>
                    </a>
                    
                    <!-- Brand Subtitle / Motto -->
                    <span style="display: block; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 3.5px; color: #B45309; text-transform: uppercase; margin-top: 8px;">
                      World-Class Beauty &amp; Luxury Cosmetics
                    </span>

                    <!-- Decorative Diamond Hairline Ornament -->
                    <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 14px auto 0 auto; width: 140px;">
                      <tr>
                        <td style="border-bottom: 1px solid #E7E5E4; height: 1px; width: 50px; font-size: 1px; line-height: 1px;">&nbsp;</td>
                        <td align="center" style="width: 40px; font-size: 11px; color: #D97706; line-height: 1; padding: 0 4px; font-family: sans-serif;">✦</td>
                        <td style="border-bottom: 1px solid #E7E5E4; height: 1px; width: 50px; font-size: 1px; line-height: 1px;">&nbsp;</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body Content -->
          <tr>
            <td class="fluid-content" style="padding: 38px 44px 40px 44px; background-color: #FFFFFF;">
              ${eyebrow ? `
              <div style="text-align: center; margin-bottom: 14px;">
                <span style="display: inline-block; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 2.5px; color: #92400E; text-transform: uppercase; background-color: #FEF3C7; border: 1px solid #FDE68A; padding: 5px 14px; border-radius: 999px;">
                  ✦ ${eyebrow} ✦
                </span>
              </div>` : ''}

              ${title ? `
              <h1 class="mobile-title" style="font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-size: 27px; line-height: 1.3; font-weight: 600; color: #18181B; text-align: center; margin: 0 0 24px 0; letter-spacing: -0.3px;">
                ${title}
              </h1>` : ''}

              ${contentHtml}
            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td class="fluid-padding" style="padding: 34px 40px 32px 40px; background-color: #FAFAF9; border-top: 1px solid #F5F5F4; text-align: center;">
              
              <!-- Brand Value Statement -->
              <p style="font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-size: 13px; font-style: italic; color: #78716C; margin: 0 0 18px 0; letter-spacing: 0.2px;">
                Where Beauty Transcends Boundaries &bull; Top Global Brands &bull; 100% Cruelty-Free
              </p>

              <!-- Footer Quick Links -->
              <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto 20px auto;">
                <tr>
                  <td align="center" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase;">
                    <a href="${safeClientUrl}/shop" target="_blank" style="color: #44403C; text-decoration: none; font-weight: 600; margin: 0 10px;">The Collection</a>
                    <span style="color: #D6D3D1;">&bull;</span>
                    <a href="${safeClientUrl}/#society" target="_blank" style="color: #44403C; text-decoration: none; font-weight: 600; margin: 0 10px;">The Society</a>
                    <span style="color: #D6D3D1;">&bull;</span>
                    <a href="${safeClientUrl}/track-orders" target="_blank" style="color: #44403C; text-decoration: none; font-weight: 600; margin: 0 10px;">Track Orders</a>
                  </td>
                </tr>
              </table>

              <!-- Trust Pillars Mini Bar -->
              <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto 20px auto;">
                <tr>
                  <td align="center" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 10px; color: #A8A29E; letter-spacing: 0.5px;">
                    <span style="color: #D97706;">✦</span> Express Delivery &nbsp;&bull;&nbsp;
                    <span style="color: #D97706;">✦</span> Authenticity Guaranteed &nbsp;&bull;&nbsp;
                    <span style="color: #D97706;">✦</span> Mindful Self-Care
                  </td>
                </tr>
              </table>

              <!-- Preferences / Unsubscribe Row -->
              ${(managePreferencesLink || unsubscribeLink) ? `
              <p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; line-height: 1.7; color: #A8A29E; margin: 0 0 18px 0;">
                ${managePreferencesLink ? `<a href="${managePreferencesLink}" target="_blank" style="color: #78716C; text-decoration: underline; font-weight: 500;">Manage newsletter preferences</a>` : ''}
                ${(managePreferencesLink && unsubscribeLink) ? ' &bull; ' : ''}
                ${unsubscribeLink ? `<a href="${unsubscribeLink}" target="_blank" style="color: #78716C; text-decoration: underline; font-weight: 500;">Unsubscribe</a>` : ''}
              </p>` : ''}

              <!-- Legal & Security Note -->
              <p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; line-height: 1.7; color: #A8A29E; margin: 0;">
                &copy; ${currentYear} Beautify Africa. All rights reserved.<br>
                Crafted for connoisseurs of fine cosmetics and mindful self-care.
              </p>
            </td>
          </tr>

        </table>
        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Bulletproof Centered CTA Button
 */
function renderEmailButton({ href, label }) {
  return `
    <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 30px auto;">
      <tr>
        <td align="center" style="border-radius: 3px; background-color: #18181B; box-shadow: 0 4px 12px rgba(24, 24, 27, 0.15);">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:46px;v-text-anchor:middle;width:260px;" arcsize="6%" stroke="f" fillcolor="#18181B">
          <w:anchorlock/>
          <center style="color:#ffffff;font-family:'Inter', sans-serif;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">
            ${label}
          </center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <a href="${href}" target="_blank" style="display: inline-block; padding: 15px 36px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 700; color: #FFFFFF; text-decoration: none; text-transform: uppercase; letter-spacing: 2px; border: 1px solid #18181B; border-radius: 3px; transition: background-color 0.2s ease;">
            ${label}
          </a>
          <!--<![endif]-->
        </td>
      </tr>
    </table>
  `;
}

/**
 * 1. Welcome to Newsletter Email
 * Sent upon subscribing to the newsletter / Beautify Society
 */
function generateWelcomeNewsletterEmail({ clientUrl, manageNewsletterLink, email = '' }) {
  const safeClientUrl = clientUrl || DEFAULT_CLIENT_URL;
  const shopUrl = `${safeClientUrl}/shop`;

  const contentHtml = `
    <!-- Editorial Narrative Intro -->
    <p style="font-size: 16px; line-height: 1.75; color: #3F3F46; margin: 0 0 16px 0; text-align: center;">
      Welcome to <strong>The Beautify Society</strong>. We are delighted to invite you into an intentional circle where beauty meets artistic luxury.
    </p>

    <p style="font-size: 14px; line-height: 1.7; color: #71717A; margin: 0 0 28px 0; text-align: center;">
      As a verified member, you receive premier access to limited product drops, shade launches formulated for every undertone, and masterclass tutorials from top cosmetics experts.
    </p>

    <!-- VIP Welcome Privilege Voucher Box -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #FFFBEB; border: 1px solid #FDE68A; border-radius: 6px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(217, 119, 6, 0.06);">
      <tr>
        <td style="padding: 24px 20px; text-align: center;">
          <span style="display: inline-block; font-family: 'Inter', sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 2.5px; color: #92400E; text-transform: uppercase; background-color: #FEF3C7; border: 1px solid #FCD34D; padding: 3px 12px; border-radius: 999px; margin-bottom: 8px;">
            EXCLUSIVE WELCOME PRIVILEGE
          </span>
          <span style="display: block; font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 700; color: #78350F; margin: 6px 0 12px 0;">
            10% Off Your Curated Order
          </span>
          
          <!-- Dashed Voucher Code -->
          <div style="display: inline-block; background-color: #FFFFFF; border: 1.5px dashed #D97706; padding: 8px 24px; border-radius: 4px; margin: 4px 0 12px 0;">
            <span class="mobile-voucher-code" style="font-family: 'Courier New', Courier, monospace; font-size: 18px; font-weight: 700; letter-spacing: 3.5px; color: #92400E;">BEAUTY10</span>
          </div>

          <p style="font-size: 12px; color: #B45309; margin: 0; line-height: 1.5;">
            Use code <strong>BEAUTY10</strong> at checkout &bull; Valid on all luxury cosmetics &amp; skincare.
          </p>
        </td>
      </tr>
    </table>

    <!-- 3 Core Pillars -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 28px;">
      <tr>
        <td style="padding: 16px 0; border-top: 1px solid #F5F5F4; border-bottom: 1px solid #F5F5F4;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
            <tr>
              <td width="33%" class="stack-column" valign="top" style="padding: 12px 10px; text-align: center; background-color: #FAFAF9; border-radius: 4px;">
                <span style="font-size: 18px; color: #D97706; display: block; margin-bottom: 6px;">✦</span>
                <span style="font-size: 12px; font-weight: 700; color: #18181B; display: block; text-transform: uppercase; letter-spacing: 1.5px;">Top Brands</span>
                <span style="font-size: 11px; color: #78716C; line-height: 1.45; display: block; margin-top: 4px;">Handpicked global cosmetics</span>
              </td>
              <td width="3%" class="stack-column" style="font-size: 1px; line-height: 1px;">&nbsp;</td>
              <td width="33%" class="stack-column" valign="top" style="padding: 12px 10px; text-align: center; background-color: #FAFAF9; border-radius: 4px;">
                <span style="font-size: 18px; color: #D97706; display: block; margin-bottom: 6px;">✦</span>
                <span style="font-size: 12px; font-weight: 700; color: #18181B; display: block; text-transform: uppercase; letter-spacing: 1.5px;">Every Shade</span>
                <span style="font-size: 11px; color: #78716C; line-height: 1.45; display: block; margin-top: 4px;">50+ inclusive complexion tones</span>
              </td>
              <td width="3%" class="stack-column" style="font-size: 1px; line-height: 1px;">&nbsp;</td>
              <td width="33%" class="stack-column" valign="top" style="padding: 12px 10px; text-align: center; background-color: #FAFAF9; border-radius: 4px;">
                <span style="font-size: 18px; color: #D97706; display: block; margin-bottom: 6px;">✦</span>
                <span style="font-size: 12px; font-weight: 700; color: #18181B; display: block; text-transform: uppercase; letter-spacing: 1.5px;">Cruelty-Free</span>
                <span style="font-size: 11px; color: #78716C; line-height: 1.45; display: block; margin-top: 4px;">Zero animal testing, ever</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Call to action button -->
    ${renderEmailButton({ href: shopUrl, label: 'Explore The Collection' })}

    <!-- Newsletter Preferences link -->
    <p style="font-size: 12px; line-height: 1.6; color: #78716C; text-align: center; margin: 24px 0 0 0;">
      You can refine or update your subscription anytime via your 
      <a href="${manageNewsletterLink}" target="_blank" style="color: #44403C; text-decoration: underline; font-weight: 600;">newsletter preferences</a>.
    </p>
  `;

  const html = renderBaseEmailTemplate({
    previewText: 'Welcome to The Beautify Society — Discover luxury cosmetics and global beauty formulated for every skin tone.',
    eyebrow: 'THE BEAUTIFY SOCIETY • VIP MEMBERSHIP',
    title: 'Welcome to the Inner Circle',
    contentHtml,
    clientUrl: safeClientUrl,
    managePreferencesLink: manageNewsletterLink,
  });

  const text = [
    'BEAUTIFY — Welcome to The Beautify Society',
    '=========================================',
    '',
    'Hello,',
    '',
    'Thank you for subscribing to the Beautify newsletter! We are thrilled to welcome you to our community.',
    '',
    'You are now on the exclusive list to receive our latest product launches, skincare secrets, and VIP promotional offers directly in your inbox.',
    '',
    'EXCLUSIVE WELCOME PRIVILEGE: 10% Off Your First Order',
    'Use code BEAUTY10 at checkout.',
    '',
    `Explore the Collection: ${shopUrl}`,
    '',
    `Manage your newsletter preferences: ${manageNewsletterLink}`,
    '',
    'Always authentically Beautify. Where beauty transcends boundaries.',
  ].join('\n');

  return { html, text };
}

/**
 * 2. Newsletter Unsubscribe Request Email
 * Sent when a user requests to unsubscribe from the newsletter
 */
function generateNewsletterUnsubscribeEmail({ unsubscribeLink, clientUrl, email = '' }) {
  const safeClientUrl = clientUrl || DEFAULT_CLIENT_URL;

  const contentHtml = `
    <!-- Explanatory note -->
    <p style="font-size: 16px; line-height: 1.75; color: #3F3F46; margin: 0 0 16px 0; text-align: center;">
      We received a request to remove <strong>${email || 'this email address'}</strong> from the Beautify newsletter and VIP drops.
    </p>

    <p style="font-size: 14px; line-height: 1.7; color: #71717A; margin: 0 0 26px 0; text-align: center;">
      To complete this request and update your preferences, please confirm by clicking the button below. This single-use link expires shortly for your security:
    </p>

    <!-- Confirmation CTA Button -->
    ${renderEmailButton({ href: unsubscribeLink, label: 'Confirm Unsubscribe' })}

    <!-- Fallback Direct Link -->
    <div style="background-color: #FAFAF9; border: 1px solid #E7E5E4; border-radius: 6px; padding: 16px 20px; margin: 28px 0; word-break: break-all;">
      <span style="display: block; font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 700; color: #78716C; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">
        Direct Confirmation Link
      </span>
      <a href="${unsubscribeLink}" target="_blank" style="font-family: monospace; font-size: 12px; color: #B45309; text-decoration: underline; line-height: 1.5;">
        ${unsubscribeLink}
      </a>
    </div>

    <!-- Security reassurance note -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-top: 20px;">
      <tr>
        <td style="padding: 14px 18px; background-color: #FAF9F6; border-radius: 4px; text-align: center; border: 1px dashed #E7E5E4;">
          <p style="font-size: 12px; line-height: 1.6; color: #78716C; margin: 0;">
            If you did not initiate this request, no action is needed. You will remain subscribed and your preferences will not be altered.
          </p>
        </td>
      </tr>
    </table>
  `;

  const html = renderBaseEmailTemplate({
    previewText: 'Confirm your request to unsubscribe from the Beautify newsletter.',
    eyebrow: 'PREFERENCES • SUBSCRIPTION MANAGEMENT',
    title: 'Confirm Newsletter Unsubscribe',
    contentHtml,
    clientUrl: safeClientUrl,
    unsubscribeLink,
  });

  const text = [
    'Confirm newsletter unsubscribe — Beautify',
    '========================================',
    '',
    'We received a request to remove this email from Beautify newsletter updates.',
    '',
    'Click the link below to confirm the unsubscribe request:',
    unsubscribeLink,
    '',
    'If you did not request this, you can ignore this email. Your subscription will remain active.',
    '',
    'Beautify Client Care',
  ].join('\n');

  return { html, text };
}

/**
 * 3. Password Reset / Forgot Password Email
 * Sent when a user requests a password reset
 */
function generatePasswordResetEmail({ resetLink, clientUrl, email = '' }) {
  const safeClientUrl = clientUrl || DEFAULT_CLIENT_URL;

  const contentHtml = `
    <!-- Reassuring Security Intro -->
    <p style="font-size: 16px; line-height: 1.75; color: #3F3F46; margin: 0 0 16px 0; text-align: center;">
      We received a request to reset the password associated with your Beautify account.
    </p>

    <p style="font-size: 14px; line-height: 1.7; color: #71717A; margin: 0 0 26px 0; text-align: center;">
      Click the secure button below to choose a new password. For your protection, this link is single-use and will expire in <strong>1 hour</strong>.
    </p>

    <!-- Password Reset CTA Button -->
    ${renderEmailButton({ href: resetLink, label: 'Reset My Password' })}

    <!-- Amber Security Notice Box -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #FFFBEB; border: 1px solid #FDE68A; border-left: 4px solid #D97706; border-radius: 4px; margin: 28px 0; box-shadow: 0 1px 4px rgba(217, 119, 6, 0.05);">
      <tr>
        <td style="padding: 16px 18px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
            <tr>
              <td width="26" valign="top" style="font-size: 18px; line-height: 1;">🔒</td>
              <td style="padding-left: 10px; font-family: 'Inter', sans-serif; font-size: 12px; line-height: 1.65; color: #92400E;">
                <strong>Security Advisory:</strong> If you did not request a password reset, you can safely disregard this email. Your password will remain unchanged and your account is secure.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Fallback Direct URL Box -->
    <div style="background-color: #FAFAF9; border: 1px solid #E7E5E4; border-radius: 6px; padding: 16px 20px; margin-bottom: 24px; word-break: break-all;">
      <span style="display: block; font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 700; color: #78716C; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">
        Button not working? Copy and paste this URL into your browser:
      </span>
      <a href="${resetLink}" target="_blank" style="font-family: monospace; font-size: 12px; color: #B45309; text-decoration: underline; line-height: 1.5;">
        ${resetLink}
      </a>
    </div>

    <!-- Concierge note -->
    <p style="font-size: 12px; line-height: 1.6; color: #A8A29E; text-align: center; margin: 0;">
      Need additional assistance? Contact our concierge team at <a href="mailto:care@beautify-africa.com" style="color: #78716C; text-decoration: underline;">care@beautify-africa.com</a>.
    </p>
  `;

  const html = renderBaseEmailTemplate({
    previewText: 'Reset your Beautify account password. This secure link expires in 1 hour.',
    eyebrow: 'SECURITY • ACCOUNT VERIFICATION',
    title: 'Reset Your Password',
    contentHtml,
    clientUrl: safeClientUrl,
  });

  const text = [
    'Reset your Beautify password',
    '============================',
    '',
    'We received a request to reset your password.',
    '',
    'Use the link below to set a new password:',
    resetLink,
    '',
    'This link will expire in 1 hour.',
    'If you did not request this, you can ignore this email.',
    '',
    'Beautify Security Team',
  ].join('\n');

  return { html, text };
}

/**
 * 4. Executive Low Stock Alert Email
 * Sent to administrators when inventory dips below threshold
 */
function generateLuxuryLowStockEmail({ items, threshold, dashboardUrl }) {
  const safeDashboardUrl = dashboardUrl || 'https://admin.beautify-africa.com';
  const itemRows = items
    .map(
      (item, index) => `
    <tr style="border-bottom: 1px solid #F5F5F4; background-color: ${index % 2 === 0 ? '#FFFFFF' : '#FAFAF9'};">
      <td style="padding: 14px 14px; font-size: 13px; font-weight: 600; color: #18181B; text-align: left;">
        ${item.productName}
      </td>
      <td style="padding: 14px 14px; font-size: 12px; font-family: monospace; color: #78716C; text-align: left;">
        ${item.sku || 'N/A'}
      </td>
      <td style="padding: 14px 14px; font-size: 13px; font-weight: 700; color: #18181B; text-align: center;">
        ${item.stock}
      </td>
      <td style="padding: 14px 14px; font-size: 12px; color: #57534E; text-align: center;">
        ${item.type === 'variant' ? 'Variant' : 'Main'}
      </td>
      <td style="padding: 14px 14px; text-align: center;">
        <span style="display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding: 4px 10px; border-radius: 999px; ${
          item.stock === 0
            ? 'background-color: #FEE2E2; color: #991B1B; border: 1px solid #FECACA;'
            : 'background-color: #FEF3C7; color: #92400E; border: 1px solid #FDE68A;'
        }">
          ${item.stock === 0 ? 'Out of Stock' : 'Low Stock'}
        </span>
      </td>
    </tr>
  `
    )
    .join('');

  const outOfStockCount = items.filter((i) => i.stock === 0).length;

  const contentHtml = `
    <!-- Executive KPI Summary Row -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 26px;">
      <tr>
        <td width="31%" class="stack-column" style="padding: 14px 12px; background-color: #FAFAF9; border-radius: 6px; text-align: center; border: 1px solid #E7E5E4;">
          <span style="font-size: 10px; font-weight: 700; color: #78716C; text-transform: uppercase; letter-spacing: 1px; display: block;">Items Impacted</span>
          <span style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 700; color: #18181B; display: block; margin-top: 4px;">${items.length}</span>
        </td>
        <td width="3%" class="stack-column" style="font-size: 1px; line-height: 1px;">&nbsp;</td>
        <td width="31%" class="stack-column" style="padding: 14px 12px; background-color: ${outOfStockCount > 0 ? '#FEF2F2' : '#FAFAF9'}; border-radius: 6px; text-align: center; border: 1px solid ${outOfStockCount > 0 ? '#FECACA' : '#E7E5E4'};">
          <span style="font-size: 10px; font-weight: 700; color: ${outOfStockCount > 0 ? '#991B1B' : '#78716C'}; text-transform: uppercase; letter-spacing: 1px; display: block;">Depleted (0 Units)</span>
          <span style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 700; color: ${outOfStockCount > 0 ? '#991B1B' : '#18181B'}; display: block; margin-top: 4px;">${outOfStockCount}</span>
        </td>
        <td width="3%" class="stack-column" style="font-size: 1px; line-height: 1px;">&nbsp;</td>
        <td width="31%" class="stack-column" style="padding: 14px 12px; background-color: #FAFAF9; border-radius: 6px; text-align: center; border: 1px solid #E7E5E4;">
          <span style="font-size: 10px; font-weight: 700; color: #78716C; text-transform: uppercase; letter-spacing: 1px; display: block;">Threshold</span>
          <span style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 700; color: #18181B; display: block; margin-top: 4px;">&le; ${threshold}</span>
        </td>
      </tr>
    </table>

    <p style="font-size: 14px; line-height: 1.65; color: #57534E; margin: 0 0 22px 0;">
      The automated inventory monitor detected the following catalog items below safe operational reserves. Please initiate restocking to preserve storefront availability.
    </p>

    <!-- Inventory Table -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="border: 1px solid #E7E5E4; border-radius: 6px; overflow: hidden; margin-bottom: 24px;">
      <thead>
        <tr style="background-color: #FAFAF9; border-bottom: 1px solid #E7E5E4;">
          <th style="padding: 12px 14px; font-size: 11px; font-weight: 700; color: #78716C; text-transform: uppercase; letter-spacing: 1px; text-align: left;">Product</th>
          <th style="padding: 12px 14px; font-size: 11px; font-weight: 700; color: #78716C; text-transform: uppercase; letter-spacing: 1px; text-align: left;">SKU</th>
          <th style="padding: 12px 14px; font-size: 11px; font-weight: 700; color: #78716C; text-transform: uppercase; letter-spacing: 1px; text-align: center;">Stock</th>
          <th style="padding: 12px 14px; font-size: 11px; font-weight: 700; color: #78716C; text-transform: uppercase; letter-spacing: 1px; text-align: center;">Type</th>
          <th style="padding: 12px 14px; font-size: 11px; font-weight: 700; color: #78716C; text-transform: uppercase; letter-spacing: 1px; text-align: center;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    ${renderEmailButton({
      href: `${safeDashboardUrl}/inventory`,
      label: 'Open Inventory Dashboard',
    })}
  `;

  const html = renderBaseEmailTemplate({
    previewText: `⚠️ Low Stock Alert: ${items.length} product(s) below safe threshold.`,
    eyebrow: 'OPERATIONS • INVENTORY ALERT',
    title: 'Low Stock Notification',
    contentHtml,
    clientUrl: safeDashboardUrl,
  });

  const itemLines = items
    .map(
      (item) =>
        `\n• ${item.productName} (SKU: ${item.sku || 'N/A'})\n  Current Stock: ${item.stock} units\n  Status: ${item.stock === 0 ? 'OUT OF STOCK' : 'LOW'}`
    )
    .join('');

  const text = [
    'BEAUTIFY — LOW STOCK ALERT',
    '==========================',
    `Alert Summary: ${items.length} product(s) with stock below ${threshold} units`,
    itemLines,
    '',
    `Manage inventory: ${safeDashboardUrl}/inventory`,
    '',
    `Timestamp: ${new Date().toISOString()}`,
  ].join('\n');

  return { html, text };
}

/**
 * 5. Restock Completion Email
 * Sent when stock is successfully replenished
 */
function generateLuxuryRestockEmail({ productName, itemSku, newStock, variantId, dashboardUrl }) {
  const safeDashboardUrl = dashboardUrl || 'https://admin.beautify-africa.com';

  const contentHtml = `
    <!-- Verified Emerald Banner -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 6px; padding: 22px; margin-bottom: 26px;">
      <tr>
        <td align="center">
          <span style="font-size: 26px; display: block; margin-bottom: 8px;">✅</span>
          <span style="font-family: 'Playfair Display', Georgia, serif; font-size: 19px; font-weight: 700; color: #065F46; display: block;">
            Inventory Restock Verified
          </span>
          <span style="font-size: 13px; color: #047857; display: block; margin-top: 6px; line-height: 1.5;">
            The item has been restored and is actively available in the storefront catalog.
          </span>
        </td>
      </tr>
    </table>

    <!-- Product Summary Card -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="border: 1px solid #E7E5E4; border-radius: 6px; overflow: hidden; margin-bottom: 24px;">
      <tr style="border-bottom: 1px solid #F5F5F4; background-color: #FFFFFF;">
        <td style="padding: 14px 18px; font-size: 12px; font-weight: 700; color: #78716C; text-transform: uppercase; letter-spacing: 1px;">Product</td>
        <td style="padding: 14px 18px; font-size: 14px; font-weight: 600; color: #18181B; text-align: right;">${productName}</td>
      </tr>
      <tr style="border-bottom: 1px solid #F5F5F4; background-color: #FAFAF9;">
        <td style="padding: 14px 18px; font-size: 12px; font-weight: 700; color: #78716C; text-transform: uppercase; letter-spacing: 1px;">SKU</td>
        <td style="padding: 14px 18px; font-size: 13px; font-family: monospace; color: #44403C; text-align: right;">${itemSku}</td>
      </tr>
      <tr style="border-bottom: 1px solid #F5F5F4; background-color: #FFFFFF;">
        <td style="padding: 14px 18px; font-size: 12px; font-weight: 700; color: #78716C; text-transform: uppercase; letter-spacing: 1px;">New Stock Quantity</td>
        <td style="padding: 14px 18px; font-size: 14px; font-weight: 700; color: #065F46; text-align: right;">${newStock} units</td>
      </tr>
      ${variantId ? `
      <tr style="background-color: #FAFAF9;">
        <td style="padding: 14px 18px; font-size: 12px; font-weight: 700; color: #78716C; text-transform: uppercase; letter-spacing: 1px;">Variant ID</td>
        <td style="padding: 14px 18px; font-size: 12px; font-family: monospace; color: #78716C; text-align: right;">${variantId}</td>
      </tr>` : ''}
    </table>

    ${renderEmailButton({
      href: `${safeDashboardUrl}/inventory`,
      label: 'View in Inventory',
    })}
  `;

  const html = renderBaseEmailTemplate({
    previewText: `Restock Complete: ${productName} (${newStock} units available).`,
    eyebrow: 'OPERATIONS • RESTOCK CONFIRMATION',
    title: 'Inventory Restocked',
    contentHtml,
    clientUrl: safeDashboardUrl,
  });

  const text = [
    'BEAUTIFY — RESTOCK COMPLETE',
    '===========================',
    `Product: ${productName}`,
    `SKU: ${itemSku}`,
    `New Stock: ${newStock} units`,
    variantId ? `Variant: Yes (ID: ${variantId})` : '',
    '',
    `Dashboard: ${safeDashboardUrl}/inventory`,
  ].filter(Boolean).join('\n');

  return { html, text };
}

module.exports = {
  renderBaseEmailTemplate,
  renderEmailButton,
  generateWelcomeNewsletterEmail,
  generateNewsletterUnsubscribeEmail,
  generatePasswordResetEmail,
  generateLuxuryLowStockEmail,
  generateLuxuryRestockEmail,
};

