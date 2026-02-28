const fs = require('fs');
const path = require('path');

const componentsMap = {
  AuthModal: 'Auth',
  CartDrawer: 'Cart',
  FeaturedCollections: 'Home',
  Hero: 'Home',
  HeroBackground: 'Home',
  HeroCards: 'Home',
  HeroReviews: 'Home',
  RegimenCollection: 'Home',
  TheJournal: 'Home',
  ProductCard: 'Shop',
  ProductDetailsModal: 'Shop',
  PromoBanner: 'Shop',
  ShopFilterBar: 'Shop',
  ShopPage: 'Shop',
  ShopSidebar: 'Shop',
  FadeIn: 'Shared',
  Footer: 'Shared',
  Icons: 'Shared',
  InteractiveButton: 'Shared',
  MarqueeText: 'Shared',
  Navbar: 'Shared',
  Newsletter: 'Shared',
  SocialProof: 'Shared',
  TrustBar: 'Shared',
  CheckoutModal: 'Checkout'
};

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Normalize path separators to forward slash for consistent regex matching
  const normalizedFile = file.replace(/\\/g, '/');
  let isInsideComponents = false;
  let fileDomain = null;
  const matchDomain = normalizedFile.match(/src\/Components\/([^\/]+)\//);
  if (matchDomain) {
    isInsideComponents = true;
    fileDomain = matchDomain[1];
  }

  // 1. External imports: `from '.../Components/X'` -> `from '.../Components/Domain/X'`
  Object.keys(componentsMap).forEach(comp => {
    const domain = componentsMap[comp];

    // External generic: from '../Components/Comp' / '@/Components/Comp'
    const re1 = new RegExp('(/Components/)' + comp + '([\'"])', 'g');
    if (re1.test(content)) {
      content = content.replace(re1, '$1' + domain + '/' + comp + '$2');
      changed = true;
    }
    const re1b = new RegExp('(/Components/)' + comp + '(/|\\\\)', 'g');
    if (re1b.test(content)) {
      content = content.replace(re1b, '$1' + domain + '/' + comp + '$2');
      changed = true;
    }

    // Internal internal components imports: `from './CompName'`
    const re2 = new RegExp('([\'"])\\.\\/' + comp + '([\'"])', 'g');
    if (re2.test(content)) {
      if (isInsideComponents) {
        if (domain !== fileDomain) {
          content = content.replace(re2, '$1../' + domain + '/' + comp + '$2');
          changed = true;
        }
      } else {
        // Just in case there are root src files importing `./CompName` (unlikely but safe to cover)
      }
    }
  });

  // Handle `./checkout/...` inside components and `/Components/checkout/...` everywhere
  const check1 = new RegExp('/Components/checkout/', 'g');
  if (check1.test(content)) {
    content = content.replace(check1, '/Components/Checkout/');
    changed = true;
  }

  if (isInsideComponents) {
    const check2 = new RegExp('([\'"])\\.\\/checkout/([^\'"]+)([\'"])', 'g');
    if (check2.test(content) && fileDomain !== 'Checkout') {
      content = content.replace(check2, '$1../Checkout/$2$3');
      changed = true;
    } else if (check2.test(content) && fileDomain === 'Checkout') {
      content = content.replace(check2, '$1./$2$3');
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log("Updated", file);
  }
});
