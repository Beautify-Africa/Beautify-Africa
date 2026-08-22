// scripts/seedProducts.js
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { connectDB, sequelize } = require('../config/db');
const { Product } = require('../models/Product');
const seedProducts = require('../data/seedProducts');

async function seed() {
  try {
    await connectDB();

    if (!Array.isArray(seedProducts)) {
      throw new Error('Seed products array not found in Back-End/data/seedProducts.js');
    }

    console.log('Found ' + seedProducts.length + ' products in Back-End/data/seedProducts.js');

    // Clear existing products and associated child records
    await sequelize.query('TRUNCATE TABLE products, product_variants, product_reviews, cart_items, wishlist_products CASCADE;');
    console.log('Cleared existing products from database');

    const inserted = [];
    for (const productData of seedProducts) {
      const {
        id,
        reviews,
        isNew,
        ...rest
      } = productData;

      const normalizedProduct = {
        ...rest,
        numReviews: typeof reviews === 'number' ? reviews : 0,
        isNewProduct: Boolean(isNew),
      };

      const product = await Product.create(normalizedProduct);
      inserted.push(product);
    }

    console.log('');
    console.log('Successfully seeded ' + inserted.length + ' products:');
    console.log('');
    inserted.forEach(function (p) {
      console.log('  Name:  ' + p.name);
      console.log('  Slug:  ' + p.slug);
      console.log('  Price: $' + p.price);
    });

    const { bumpProductCacheVersion } = require('../controllers/productController.cache');
    await bumpProductCacheVersion();
    console.log('Product cache version invalidated.');
  } catch (error) {
    console.error('Seed failed:', error.message);
  } finally {
    try {
      const redisClient = require('../config/redis');
      await redisClient.quit();
    } catch {}
    try {
      await sequelize.close();
    } catch {}
    console.log('Database connection closed');
  }
}

seed();
