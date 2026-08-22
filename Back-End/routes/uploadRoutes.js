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

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed.'));
    }
  },
});

/**
 * @route   POST /api/upload
 * @desc    Upload an image to Cloudinary (Admin only)
 * @access  Private/Admin
 */
router.post(
  '/',
  protect,
  requireAdmin,
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ status: 'error', message: 'Image size exceeds maximum 5MB limit.' });
        }
        return res.status(400).json({ status: 'error', message: err.message || 'File upload error' });
      }
      next();
    });
  },
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No image uploaded' });
    }

    // Cloudinary returns the secure URL in req.file.path
    res.status(200).json({
      status: 'success',
      url: req.file.path,
      message: 'Image uploaded successfully to Cloudinary',
    });
  }
);

module.exports = router;
