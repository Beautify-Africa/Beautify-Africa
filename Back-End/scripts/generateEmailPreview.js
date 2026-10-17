// scripts/generateEmailPreview.js
const fs = require('fs');
const path = require('path');
const {
  generateWelcomeNewsletterEmail,
  generateNewsletterUnsubscribeEmail,
  generatePasswordResetEmail,
  generateLuxuryLowStockEmail,
  generateLuxuryRestockEmail,
} = require('../services/emailTemplates');

const clientUrl = 'http://localhost:5173';

const emails = {
  welcome: generateWelcomeNewsletterEmail({
    clientUrl,
    manageNewsletterLink: clientUrl + '/newsletter/preferences',
    email: 'elena.vance@luxurybeauty.com',
  }),
  resetPassword: generatePasswordResetEmail({
    resetLink: clientUrl + '/reset-password?token=sample-reset-token-abc123xyz',
    clientUrl,
    email: 'elena.vance@luxurybeauty.com',
  }),
  unsubscribe: generateNewsletterUnsubscribeEmail({
    unsubscribeLink: clientUrl + '/newsletter/unsubscribe?token=sample-unsub-token-789xyz',
    clientUrl,
    email: 'elena.vance@luxurybeauty.com',
  }),
  lowStock: generateLuxuryLowStockEmail({
    items: [
      { productName: 'Velvet Botanique Matte Lipstick (Shade: Sahara Rose)', sku: 'VBM-SR01', stock: 2, type: 'variant' },
      { productName: 'Luminous Silk Hydrating Botanical Serum (50ml)', sku: 'LSH-050', stock: 0, type: 'main' },
      { productName: 'Radiance Mineral Sculpt Bronzer Palette', sku: 'RMS-BP02', stock: 4, type: 'main' },
    ],
    threshold: 5,
    dashboardUrl: clientUrl + '/admin',
  }),
  restock: generateLuxuryRestockEmail({
    productName: 'Luminous Silk Hydrating Botanical Serum (50ml)',
    itemSku: 'LSH-050',
    newStock: 75,
    variantId: 'var-serum-50ml',
    dashboardUrl: clientUrl + '/admin',
  }),
};

const payload = JSON.stringify({
  welcome: emails.welcome.html,
  resetPassword: emails.resetPassword.html,
  unsubscribe: emails.unsubscribe.html,
  lowStock: emails.lowStock.html,
  restock: emails.restock.html,
});

const previewPageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Beautify Africa — Email Templates Preview Studio</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background-color: #0F0F11;
      color: #F4F4F5;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      background-color: #18181B;
      border-bottom: 1px solid #27272A;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }
    .brand-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 3px;
      color: #FAF9F6;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-badge {
      background: #FEF3C7;
      color: #92400E;
      font-family: 'Inter', sans-serif;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.5px;
      padding: 3px 8px;
      border-radius: 999px;
      text-transform: uppercase;
    }
    .nav-tabs {
      display: flex;
      gap: 8px;
      background: #27272A;
      padding: 4px;
      border-radius: 8px;
      flex-wrap: wrap;
    }
    .nav-btn {
      background: transparent;
      border: none;
      color: #A1A1AA;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .nav-btn:hover {
      color: #FFFFFF;
      background: rgba(255,255,255,0.06);
    }
    .nav-btn.active {
      background: #D97706;
      color: #FFFFFF;
      box-shadow: 0 2px 8px rgba(217, 119, 6, 0.4);
    }
    .view-toggles {
      display: flex;
      gap: 6px;
      background: #27272A;
      padding: 4px;
      border-radius: 8px;
    }
    .view-btn {
      background: transparent;
      border: none;
      color: #A1A1AA;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .view-btn.active {
      background: #3F3F46;
      color: #FFFFFF;
    }
    main {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
      background: radial-gradient(circle at 50% 0%, #222226 0%, #0F0F11 75%);
    }
    .frame-container {
      width: 100%;
      max-width: 660px;
      transition: max-width 0.3s ease;
      background: #FAF9F6;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08);
    }
    .frame-container.mobile {
      max-width: 390px;
    }
    iframe {
      width: 100%;
      height: 820px;
      border: none;
      display: block;
      background: #FAF9F6;
    }
  </style>
</head>
<body>
  <header>
    <div class="brand-title">
      <span>BEAUTIFY</span>
      <span class="brand-badge">Email Studio</span>
    </div>

    <div class="nav-tabs">
      <button class="nav-btn active" onclick="switchEmail('welcome', this)">1. Newsletter Welcome</button>
      <button class="nav-btn" onclick="switchEmail('resetPassword', this)">2. Forgot Password</button>
      <button class="nav-btn" onclick="switchEmail('unsubscribe', this)">3. Unsubscribe Request</button>
      <button class="nav-btn" onclick="switchEmail('lowStock', this)">4. Low Stock Alert</button>
      <button class="nav-btn" onclick="switchEmail('restock', this)">5. Restock Verified</button>
    </div>

    <div class="view-toggles">
      <button class="view-btn active" id="btn-desktop" onclick="setView('desktop')">Desktop (600px)</button>
      <button class="view-btn" id="btn-mobile" onclick="setView('mobile')">Mobile (390px)</button>
    </div>
  </header>

  <main>
    <div class="frame-container" id="frameWrapper">
      <iframe id="previewFrame" title="Email Preview"></iframe>
    </div>
  </main>

  <script>
    const emails = ${payload};
    let current = 'welcome';

    function render() {
      const frame = document.getElementById('previewFrame');
      const doc = frame.contentWindow.document;
      doc.open();
      doc.write(emails[current]);
      doc.close();
    }

    function switchEmail(key, btn) {
      current = key;
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render();
    }

    function setView(mode) {
      const wrapper = document.getElementById('frameWrapper');
      document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
      if (mode === 'mobile') {
        wrapper.classList.add('mobile');
        document.getElementById('btn-mobile').classList.add('active');
      } else {
        wrapper.classList.remove('mobile');
        document.getElementById('btn-desktop').classList.add('active');
      }
    }

    window.onload = render;
  </script>
</body>
</html>`;

const targetPath = path.resolve(__dirname, '../../Front-End/public/email-preview.html');
fs.writeFileSync(targetPath, previewPageHtml, 'utf8');
console.log('Successfully generated Front-End/public/email-preview.html');
