/**
 * Beautify Africa - Realistic Synthetic Fixture Engine
 *
 * Generates corporate-grade synthetic e-commerce datasets for unit, integration,
 * E2E, and load testing harnesses without external dependencies.
 *
 * Usage:
 *   node scripts/seedRealisticFixtures.js [--count=10] [--json] [--output=scratch/fixtures.json]
 */

const fs = require('fs');
const path = require('path');

const CATEGORIES = ['Skincare', 'Haircare', 'Body & Bath', 'Fragrance', 'Wellness'];
const CURRENCIES = ['USD', 'KES', 'NGN', 'ZAR', 'EUR'];
const PAYMENT_METHODS = ['stripe', 'mpesa', 'paystack'];
const ORDER_STATUSES = ['pending', 'processing', 'completed', 'delivered'];

/**
 * Generates synthetic user accounts with standard roles and security attributes
 */
function generateUsers() {
  return [
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      name: 'Super Admin',
      email: 'admin@beautifyafrica.test',
      role: 'admin',
      isVerified: true,
      isTwoFactorEnabled: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000002',
      name: 'Jane Mwangi',
      email: 'jane.mwangi@beautifyafrica.test',
      role: 'customer',
      isVerified: true,
      isTwoFactorEnabled: false,
      createdAt: '2026-02-15T10:30:00.000Z',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000003',
      name: 'Amina Diallo',
      email: 'amina.diallo@beautifyafrica.test',
      role: 'customer',
      isVerified: true,
      isTwoFactorEnabled: false,
      createdAt: '2026-03-20T14:15:00.000Z',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000004',
      name: 'Kofi Mensah',
      email: 'kofi.mensah@beautifyafrica.test',
      role: 'customer',
      isVerified: true,
      isTwoFactorEnabled: true,
      createdAt: '2026-04-05T09:45:00.000Z',
    },
  ];
}

/**
 * Generates realistic catalog products with botanical African ingredients
 */
function generateProducts() {
  return [
    {
      id: 'b0000000-0000-0000-0000-000000000001',
      name: 'Ugandan Shea Nilotica Whipped Facial Butter',
      slug: 'ugandan-shea-nilotica-whipped-facial-butter',
      description: 'Cold-pressed wild-harvested Shea Nilotica butter that melts effortlessly into skin, delivering high concentrations of oleic acid.',
      price: 38.0,
      currency: 'USD',
      category: 'Skincare',
      brand: 'Nilotica Botanicals',
      inStock: true,
      stockQuantity: 150,
      rating: 4.9,
      numReviews: 42,
      images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80'],
      isArchived: false,
      variants: [
        { sku: 'SN-FB-50ML', name: '50ml Travel Jar', price: 24.0, stockQuantity: 60 },
        { sku: 'SN-FB-100ML', name: '100ml Full Size', price: 38.0, stockQuantity: 90 },
      ],
    },
    {
      id: 'b0000000-0000-0000-0000-000000000002',
      name: 'Baobab & Marula Restorative Hair Elixir',
      slug: 'baobab-marula-restorative-hair-elixir',
      description: 'Enriched with cold-pressed baobab seed oil and Kalahari marula to seal moisture, tame frizz, and protect delicate hair fibers.',
      price: 42.0,
      currency: 'USD',
      category: 'Haircare',
      brand: 'Savanna Roots',
      inStock: true,
      stockQuantity: 95,
      rating: 4.8,
      numReviews: 29,
      images: ['https://images.unsplash.com/photo-1608248597359-2a96b797825d?auto=format&fit=crop&w=600&q=80'],
      isArchived: false,
      variants: [
        { sku: 'BM-HE-100ML', name: '100ml Glass Dropper', price: 42.0, stockQuantity: 95 },
      ],
    },
    {
      id: 'b0000000-0000-0000-0000-000000000003',
      name: 'Kalahari Melon Balancing Gel Cleanser',
      slug: 'kalahari-melon-balancing-gel-cleanser',
      description: 'Gently cleanses while maintaining lipid barrier equilibrium with antioxidant-rich Namibian watermelon seed oil.',
      price: 32.0,
      currency: 'USD',
      category: 'Skincare',
      brand: 'Kalahari Earth',
      inStock: true,
      stockQuantity: 120,
      rating: 4.7,
      numReviews: 18,
      images: ['https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=600&q=80'],
      isArchived: false,
      variants: [],
    },
    {
      id: 'b0000000-0000-0000-0000-000000000004',
      name: 'Rooibos & Hibiscus Brightening Glow Tonic',
      slug: 'rooibos-hibiscus-brightening-glow-tonic',
      description: 'Fermented red bush extract blended with hibiscus AHA acids for gentle exfoliation and luminous complexion.',
      price: 36.0,
      currency: 'USD',
      category: 'Skincare',
      brand: 'Cape Flora',
      inStock: true,
      stockQuantity: 80,
      rating: 4.9,
      numReviews: 35,
      images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80'],
      isArchived: false,
      variants: [],
    },
    {
      id: 'b0000000-0000-0000-0000-000000000005',
      name: 'Atlas Cedar & Amber Royal Body Polish',
      slug: 'atlas-cedar-amber-royal-body-polish',
      description: 'Sugar and fine volcanic pumice steeped in sweet almond and Moroccan argan oil for silky smooth exfoliation.',
      price: 45.0,
      currency: 'USD',
      category: 'Body & Bath',
      brand: 'Maghreb Rituals',
      inStock: true,
      stockQuantity: 70,
      rating: 5.0,
      numReviews: 12,
      images: ['https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=600&q=80'],
      isArchived: false,
      variants: [],
    },
  ];
}

/**
 * Generates synthetic customer orders
 */
function generateOrders(users, products, count = 6) {
  const customers = users.filter((u) => u.role === 'customer');
  const orders = [];

  for (let i = 0; i < count; i++) {
    const user = customers[i % customers.length];
    const product = products[i % products.length];
    const quantity = (i % 2) + 1;
    const itemPrice = product.price;
    const subtotal = itemPrice * quantity;
    const shippingPrice = subtotal > 50 ? 0 : 10;
    const totalPrice = subtotal + shippingPrice;

    orders.push({
      id: `c0000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`,
      userId: user.id,
      orderItems: [
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity,
          image: product.images[0],
        },
      ],
      shippingAddress: {
        fullName: user.name,
        address: `${100 + i} Kimathi Street`,
        city: i % 2 === 0 ? 'Nairobi' : 'Johannesburg',
        country: i % 2 === 0 ? 'Kenya' : 'South Africa',
        postalCode: '00100',
        phone: '+254712345678',
      },
      paymentMethod: PAYMENT_METHODS[i % PAYMENT_METHODS.length],
      paymentResult: {
        status: 'succeeded',
        id: `pay_${Date.now()}_${i}`,
      },
      currency: 'USD',
      itemsPrice: subtotal,
      shippingPrice,
      totalPrice,
      isPaid: true,
      paidAt: '2026-09-01T12:00:00.000Z',
      fulfillmentStatus: ORDER_STATUSES[i % ORDER_STATUSES.length],
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    });
  }

  return orders;
}

/**
 * Generates the complete fixture bundle
 */
function generateFixtureDataset(orderCount = 6) {
  const users = generateUsers();
  const products = generateProducts();
  const orders = generateOrders(users, products, orderCount);

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      generator: 'Beautify Africa Synthetic Fixture Engine v1.0',
      totalUsers: users.length,
      totalProducts: products.length,
      totalOrders: orders.length,
    },
    users,
    products,
    orders,
  };
}

/**
 * CLI Runner
 */
function main() {
  const args = process.argv.slice(2);
  const countArg = parseInt(args.find((a) => a.startsWith('--count='))?.split('=')[1], 10);
  const orderCount = !isNaN(countArg) ? countArg : 6;
  const isJson = args.includes('--json');
  const outputPath = args.find((a) => a.startsWith('--output='))?.split('=')[1];

  const dataset = generateFixtureDataset(orderCount);

  if (isJson && !outputPath) {
    console.log(JSON.stringify(dataset, null, 2));
    return;
  }

  if (outputPath) {
    const fullOutputPath = path.resolve(outputPath);
    const parentDir = path.dirname(fullOutputPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(fullOutputPath, JSON.stringify(dataset, null, 2), 'utf8');
    console.log(`Successfully generated and wrote synthetic fixtures to: ${fullOutputPath}`);
    return;
  }

  console.log('========================================================');
  console.log('  BEAUTIFY AFRICA - SYNTHETIC FIXTURE GENERATOR');
  console.log('========================================================');
  console.log(`Generated Users:     ${dataset.users.length}`);
  console.log(`Generated Products:  ${dataset.products.length}`);
  console.log(`Generated Orders:    ${dataset.orders.length}`);
  console.log('--------------------------------------------------------');
  console.log(`Sample User:     ${dataset.users[0].name} <${dataset.users[0].email}> (${dataset.users[0].role})`);
  console.log(`Sample Product:  ${dataset.products[0].name} ($${dataset.products[0].price})`);
  console.log(`Sample Order:    ${dataset.orders[0].id} (Total: $${dataset.orders[0].totalPrice})`);
  console.log('========================================================\n');
}

if (require.main === module) {
  main();
}

module.exports = {
  generateUsers,
  generateProducts,
  generateOrders,
  generateFixtureDataset,
  CATEGORIES,
  CURRENCIES,
  PAYMENT_METHODS,
  ORDER_STATUSES,
};
