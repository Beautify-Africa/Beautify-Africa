require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const existingProducts = require('../data/seedProducts.js');

const categories = ['Makeup', 'Skincare', 'Tools & Accessories', 'Fragrance', 'Haircare'];
const brands = ['Beautify', 'Lumière', 'Velour', 'Essence', 'Aura'];

const adjectives = ['Luminous', 'Velvet', 'Radiant', 'Hydrating', 'Matte', 'Clarifying', 'Soothing', 'Midnight', 'Golden', 'Silk', 'Obsidian', 'Essential'];
const nouns = ['Serum', 'Foundation', 'Brush Set', 'Eyeliner', 'Toner', 'Moisturizer', 'Mask', 'Perfume', 'Hair Oil', 'Lipstick', 'Sunscreen', 'Pillowcase'];

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPrice() {
  return randomNumber(15, 150);
}

// Fisher-Yates shuffle Algorithm: to guarantee randomized pop order
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function fetchUnsplashImages() {
  const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
  if (!ACCESS_KEY) {
    throw new Error('UNSPLASH_ACCESS_KEY is missing in .env');
  }

  console.log('Fetching strict product photography from Unsplash API...');
  let photos = [];
  
  // Fetch 8 pages of 30 images to build a robust pool of 240 images
  // Using very strict queries to enforce product-centric imagery without models
  for (let page = 1; page <= 8; page++) {
    const res = await fetch(`https://api.unsplash.com/search/photos?query=cosmetics+product+photography+mockup&per_page=30&page=${page}&client_id=${ACCESS_KEY}`);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      photos = photos.concat(data.results.map(photo => photo.urls.regular));
    } else {
        console.warn('Warning: End of Unsplash results or rate limit reached.');
        break;
    }
  }

  if (photos.length === 0) {
      throw new Error('Could not fetch any images from Unsplash.');
  }

  const uniquePhotos = [...new Set(photos)]; // Remove any unexpected doubles from API
  console.log(`Successfully fetched ${uniquePhotos.length} strictly unique images from Unsplash!`);
  
  return shuffleArray(uniquePhotos);
}

async function generate() {
  const targetCount = 100;
  const baseProducts = existingProducts.slice(0, 12);
  let newProductsCount = targetCount - baseProducts.length;
  const generatedProducts = [...baseProducts];
  let currentId = existingProducts.length > 0 ? Math.max(...existingProducts.map(p => p.id)) + 1 : 1;

  // Retrieve authentic image pool
  let imagePool = await fetchUnsplashImages();

  for (let i = 0; i < newProductsCount; i++) {
    const brand = randomElement(brands);
    const category = randomElement(categories);
    const name = `${randomElement(adjectives)} ${randomElement(nouns)} ${i}`;
    
    const price = randomPrice();
    const isOnSale = Math.random() > 0.8;
    const originalPrice = isOnSale ? price + randomNumber(10, 50) : null;
    
    const tags = [];
    if (isOnSale) tags.push('On Sale');
    if (Math.random() > 0.7) tags.push(randomElement(['Best Seller', 'New Arrival', 'Staff Pick']));
    
    const isNew = tags.includes('New Arrival');
    const isBestSeller = tags.includes('Best Seller');
    const inStock = !(tags.includes('Sold Out') || Math.random() > 0.95);
    if (!inStock && !tags.includes('Sold Out')) tags.push('Sold Out');

    // Strict ZERO duplication logic: remove items dynamically so they are never re-used
    if (imagePool.length < 2) {
        throw new Error('Not enough unique images left in the pool!');
    }
    const img1 = imagePool.pop();
    const img2 = imagePool.pop();

    generatedProducts.push({
      id: currentId++,
      name,
      brand,
      category,
      price,
      originalPrice,
      rating: (Math.random() * 1 + 4).toFixed(1) * 1, // 4.0 to 5.0
      reviews: randomNumber(10, 800),
      inStock,
      image: img1,
      images: [img1, img2],
      description: `A superior ${category.toLowerCase()} formulated item designed for optimal results. It delivers unmatched quality by ${brand}.`,
      skinType: [randomElement(['All', 'Oily', 'Dry', 'Combination', 'Sensitive'])],
      ingredients: 'Proprietary Blend, Aqua, Extracts.',
      howToUse: 'Apply as directed for best results.',
      tags,
      isNew,
      isBestSeller
    });
  }

  const outputPath = path.join(__dirname, '../data/seedProducts.js');
  const exportString = `module.exports = ${JSON.stringify(generatedProducts, null, 2)};\n`;

  fs.writeFileSync(outputPath, exportString, 'utf-8');
  console.log(`Successfully generated and wrote ${targetCount} perfectly unique items to seedProducts.js`);
}

generate().catch(console.error);
