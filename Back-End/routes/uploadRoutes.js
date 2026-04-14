const express = require('express');
const multer = require('multer');
const multerStorageCloudinary = require('multer-storage-cloudinary');
const CloudinaryStorage = multerStorageCloudinary.CloudinaryStorage || multerStorageCloudinary;
const cloudinary = require('../config/cloudinary');
const { protect, requireAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'beautify-africa/products', // Cloudinary folder name
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }], // Enforce automatic optimization
  },
});

const upload = multer({ storage: storage });

/**
 * @route   POST /api/upload
 * @desc    Upload an image to Cloudinary (Admin only)
 * @access  Private/Admin
 */
router.post('/', protect, requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'No image uploaded' });
  }

  // Cloudinary returns the secure URL in req.file.path
  res.status(200).json({
    status: 'success',
    url: req.file.path,
    message: 'Image uploaded successfully to Cloudinary',
  });
});

module.exports = router;
