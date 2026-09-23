const {
  generateUsers,
  generateProducts,
  generateOrders,
  generateFixtureDataset,
  CATEGORIES,
} = require('../scripts/seedRealisticFixtures');

describe('Synthetic Test Fixtures Generator Suite', () => {
  test('generates valid users with role separation and email format', () => {
    const users = generateUsers();
    expect(users.length).toBeGreaterThanOrEqual(3);

    const admin = users.find((u) => u.role === 'admin');
    expect(admin).toBeDefined();
    expect(admin.email).toBe('admin@beautifyafrica.test');
    expect(admin.isTwoFactorEnabled).toBe(true);

    const customers = users.filter((u) => u.role === 'customer');
    expect(customers.length).toBeGreaterThanOrEqual(2);
    customers.forEach((c) => {
      expect(c.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });
  });

  test('generates botanical African products with pricing and category taxonomy', () => {
    const products = generateProducts();
    expect(products.length).toBeGreaterThanOrEqual(5);

    products.forEach((p) => {
      expect(p.id).toBeDefined();
      expect(p.slug).toMatch(/^[a-z0-9-]+$/);
      expect(CATEGORIES).toContain(p.category);
      expect(p.price).toBeGreaterThan(0);
      expect(p.inStock).toBe(true);
      expect(p.stockQuantity).toBeGreaterThan(0);
      expect(Array.isArray(p.images)).toBe(true);
      expect(p.images.length).toBeGreaterThan(0);
    });
  });

  test('generates orders matching user IDs and line items', () => {
    const dataset = generateFixtureDataset(8);
    expect(dataset.orders.length).toBe(8);

    dataset.orders.forEach((order) => {
      expect(order.userId).toBeDefined();
      expect(order.orderItems.length).toBeGreaterThan(0);
      expect(order.shippingAddress.fullName).toBeDefined();
      expect(order.shippingAddress.country).toBeDefined();
      expect(order.totalPrice).toBeGreaterThan(0);
      expect(order.isPaid).toBe(true);
      expect(['pending', 'processing', 'completed', 'delivered']).toContain(order.fulfillmentStatus);
    });
  });
});
