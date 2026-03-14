const path = require('path');
const { pathToFileURL } = require('url');

// Reads PRODUCTS from [shopData.js](http://_vscodecontentref_/4)
async function loadProducts() {
  const dataPath = path.resolve(__dirname, '../../Front-End/src/data/shopData.js');
  const dataUrl = pathToFileURL(dataPath).href;
  const moduleData = await import(dataUrl);

  if (!Array.isArray(moduleData.PRODUCTS)) {
    throw new Error('PRODUCTS array was not found in Front-End/src/data/shopData.js');
  }

  return moduleData.PRODUCTS;
}

// GET /api/products
async function getProducts(req, res) {
  try {
    let products = await loadProducts();

    // Optional query filters:
    // /api/products?category=Skincare&brand=Lumière&inStock=true
    const { category, brand, inStock, minPrice, maxPrice, q, sort } = req.query;

    if (category) {
      products = products.filter(
        (p) => String(p.category).toLowerCase() === String(category).toLowerCase()
      );
    }

    if (brand) {
      products = products.filter(
        (p) => String(p.brand).toLowerCase() === String(brand).toLowerCase()
      );
    }

    if (inStock === 'true' || inStock === 'false') {
      const stockValue = inStock === 'true';
      products = products.filter((p) => p.inStock === stockValue);
    }

    if (minPrice !== undefined && !Number.isNaN(Number(minPrice))) {
      products = products.filter((p) => Number(p.price) >= Number(minPrice));
    }

    if (maxPrice !== undefined && !Number.isNaN(Number(maxPrice))) {
      products = products.filter((p) => Number(p.price) <= Number(maxPrice));
    }

    if (q) {
      const query = String(q).toLowerCase();
      products = products.filter((p) => {
        const name = String(p.name || '').toLowerCase();
        const description = String(p.description || '').toLowerCase();
        return name.includes(query) || description.includes(query);
      });
    }

    if (sort === 'price-low') {
      products = [...products].sort((a, b) => a.price - b.price);
    } else if (sort === 'price-high') {
      products = [...products].sort((a, b) => b.price - a.price);
    } else if (sort === 'rating') {
      products = [...products].sort((a, b) => b.rating - a.rating);
    }

    return res.status(200).json({
      status: 'success',
      count: products.length,
      data: products,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
}

function toSlug(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// GET /api/products/:idOrSlug
async function getProductByIdOrSlug(req, res) {
  try {
    const products = await loadProducts();
    const key = String(req.params.idOrSlug).toLowerCase();

    const product = products.find((p) => {
      const idMatch = String(p.id) === key;
      const slugMatch = toSlug(p.name) === key;
      return idMatch || slugMatch;
    });

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
}

module.exports = {
  getProducts,
  getProductByIdOrSlug,
};