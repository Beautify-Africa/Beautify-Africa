const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') });

const Product = require('./models/Product');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for migration');

    // Rename old 'reviews' (Number) field to 'numReviews' for all documents
    // This securely clears the 'reviews' field path so Mongoose can use it as an Array of objects
    const result = await Product.collection.updateMany(
      { reviews: { $type: "number" } }, // only rename if it's the old numeric format
      { $rename: { 'reviews': 'numReviews' } }
    );
    
    // In case there are some that already got updated but still have mismatched arrays
    await Product.collection.updateMany(
      { reviews: { $exists: false } },
      { $set: { reviews: [] } }
    );

    console.log(`Migration Complete! Modified ${result.modifiedCount} documents.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

migrate();
