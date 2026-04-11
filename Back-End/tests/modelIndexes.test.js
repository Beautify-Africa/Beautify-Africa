const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Newsletter = require('../models/Newsletter');

function readSchemaIndex(schema, expectedKey) {
  const indexes = schema.indexes();
  return indexes.find(([key]) => JSON.stringify(key) === JSON.stringify(expectedKey));
}

describe('schema index definitions', () => {
  test('Product exposes listing sort indexes', () => {
    expect(readSchemaIndex(Product.schema, { createdAt: -1 })).toBeDefined();
    expect(readSchemaIndex(Product.schema, { price: 1 })).toBeDefined();
    expect(readSchemaIndex(Product.schema, { rating: -1 })).toBeDefined();
    expect(readSchemaIndex(Product.schema, { isBestSeller: -1, numReviews: -1 })).toBeDefined();
  });

  test('Order exposes user history and recency indexes', () => {
    expect(readSchemaIndex(Order.schema, { user: 1, createdAt: -1 })).toBeDefined();
    expect(readSchemaIndex(Order.schema, { createdAt: -1 })).toBeDefined();
  });

  test('User exposes reset token lookup index with partial filter', () => {
    const indexEntry = readSchemaIndex(User.schema, {
      passwordResetToken: 1,
      passwordResetExpires: 1,
    });

    expect(indexEntry).toBeDefined();
    expect(indexEntry[1]).toMatchObject({
      partialFilterExpression: {
        passwordResetToken: { $type: 'string' },
      },
    });
  });

  test('Newsletter exposes unsubscribe token lookup index with partial filter', () => {
    const indexEntry = readSchemaIndex(Newsletter.schema, {
      unsubscribeToken: 1,
      unsubscribeTokenExpires: 1,
    });

    expect(indexEntry).toBeDefined();
    expect(indexEntry[1]).toMatchObject({
      partialFilterExpression: {
        unsubscribeToken: { $type: 'string' },
      },
    });
  });
});
