const { Product } = require('../models/Product');
const { Order } = require('../models/Order');
const User = require('../models/User');
const Newsletter = require('../models/Newsletter');

describe('Sequelize model attribute definitions', () => {
  test('Product exposes all required attributes', () => {
    const attrs = Product.rawAttributes;
    expect(attrs.id).toBeDefined();
    expect(attrs.name).toBeDefined();
    expect(attrs.slug).toBeDefined();
    expect(attrs.price).toBeDefined();
    expect(attrs.rating).toBeDefined();
    expect(attrs.inStock).toBeDefined();
    expect(attrs.category).toBeDefined();
    expect(attrs.brand).toBeDefined();
    expect(attrs.skinType).toBeDefined();
    expect(attrs.status).toBeDefined();
  });

  test('Order exposes user history and recency attributes', () => {
    const attrs = Order.rawAttributes;
    expect(attrs.id).toBeDefined();
    expect(attrs.userId).toBeDefined();
    expect(attrs.totalPrice).toBeDefined();
    expect(attrs.isPaid).toBeDefined();
    expect(attrs.fulfillmentStatus).toBeDefined();
  });

  test('User exposes reset token lookup attributes', () => {
    const attrs = User.rawAttributes;
    expect(attrs.id).toBeDefined();
    expect(attrs.email).toBeDefined();
    expect(attrs.passwordResetToken).toBeDefined();
    expect(attrs.passwordResetExpires).toBeDefined();
  });

  test('Newsletter exposes unsubscribe token lookup attributes', () => {
    const attrs = Newsletter.rawAttributes;
    expect(attrs.id).toBeDefined();
    expect(attrs.email).toBeDefined();
    expect(attrs.unsubscribeToken).toBeDefined();
    expect(attrs.unsubscribeTokenExpires).toBeDefined();
  });
});
