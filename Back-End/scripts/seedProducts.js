// scripts/seedProducts.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { pathToFileURL } = require('url');

// Load environment variables from Back-End/.env
// path.resolve(__dirname, '../.env') means: go up one folder from scripts/, find .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import the Product model from Back-End/models/Product.js
const Product = require('../models/Product');

async function seed() {
  try {
    // 1. Connect to MongoDB using the same MONGO_URI from your .env file
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // 2. Load the static product data from the front-end file
    const dataPath = path.resolve(__dirname, '../../Front-End/src/data/shopData.js');
    const dataUrl = pathToFileURL(dataPath).href;
    const shopModule = await import(dataUrl);

    if (!Array.isArray(shopModule.PRODUCTS)) {
      throw new Error('PRODUCTS array not found in shopData.js');
    }

    const products = shopModule.PRODUCTS;
    console.log('Found ' + products.length + ' products in shopData.js');

    // 3. Clear any existing products in MongoDB
    const deleteResult = await Product.deleteMany({});
    console.log('Cleared ' + deleteResult.deletedCount + ' existing products from database');

    // 4. Insert each product one by one using Product.create()
    //    We use create() instead of insertMany() because create() triggers
    //    the pre('save') hook that auto-generates the slug field
    const inserted = [];
    for (const productData of products) {
      // Map front-end-only fields to the Product schema before creating docs.
      // shopData uses "reviews" as a number and "isNew" as a boolean, while
      // the schema expects "reviews" as an array and uses "numReviews" / "isNewProduct".
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
        reviews: [],
      };

      const product = await Product.create(normalizedProduct);
      inserted.push(product);
    }

    // 5. Print results to confirm everything worked
    console.log('');
    console.log('Successfully seeded ' + inserted.length + ' products:');
    console.log('');
    inserted.forEach(function (p) {
      console.log('  Name:  ' + p.name);
      console.log('  Slug:  ' + p.slug);
      console.log('  Price: $' + p.price);
      console.log('  _id:   ' + p._id);
      console.log('');
    });

  } catch (error) {
    console.error('Seed failed:', error.message);
  } finally {
    // Always close the database connection when done
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

seed();
