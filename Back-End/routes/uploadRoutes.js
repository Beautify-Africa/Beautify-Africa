const express = require('express');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const multerStorageCloudinary = require('multer-storage-cloudinary');
const CloudinaryStorage = multerStorageCloudinary.CloudinaryStorage || multerStorageCloudinary;
const cloudinary = require('../config/cloudinary');
if (!cloudinary.v2) {
  cloudinary.v2 = cloudinary;
}
const { protect, requireAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const DANGEROUS_EXTENSIONS = new Set([
  '.php', '.phtml', '.php3', '.php4', '.php5', '.phps',
  '.exe', '.dll', '.bin', '.cmd', '.bat', '.sh', '.py',
  '.js', '.mjs', '.cjs', '.ts', '.html', '.htm', '.xhtml',
  '.svg', '.xml', '.jar', '.vbs', '.scr', '.msi',
]);

/**
 * Inspects binary magic numbers to ensure genuine image signatures:
 * - JPEG: FF D8 FF
 * - PNG: 89 50 4E 47 0D 0A 1A 0A
 * - WebP: RIFF .... WEBP
 */
function validateImageMagicBytes(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 12) {
    return { valid: false, message: 'File buffer too short or empty' };
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detectedType: 'image/jpeg' };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, detectedType: 'image/png' };
  }

  // 3. WebP: RIFF .... WEBP
  const isRiff =
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
  const isWebp =
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
  if (isRiff && isWebp) {
    return { valid: true, detectedType: 'image/webp' };
  }

  return {
    valid: false,
    message: 'File content does not match genuine image binary signatures (JPEG, PNG, or WebP).',
  };
}

/**
 * Validate upload file security properties:
 * - Null-byte injection defense
 * - Path traversal defense
 * - Double extension / executable polyglot defense
 * - MIME type whitelist
 * - Extension whitelist
 * - Binary magic byte validation (when buffer is available)
 */
function validateUploadFile(file) {
  if (!file || !file.originalname) {
    return { valid: false, message: 'Missing file or filename' };
  }

  const rawFilename = file.originalname;

  // 1. Null-byte injection defense
  if (rawFilename.includes('\0') || rawFilename.includes('%00')) {
    return { valid: false, message: 'Null byte injection detected in filename.' };
  }

  // 2. Path traversal defense
  if (rawFilename.includes('..') || rawFilename.includes('/') || rawFilename.includes('\\')) {
    return { valid: false, message: 'Path traversal characters detected in filename.' };
  }

  // 3. Extension check
  const ext = path.extname(rawFilename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { valid: false, message: 'Only JPG, JPEG, PNG, and WebP file extensions are allowed.' };
  }

  // 4. Double-extension / executable masking check
  const parts = rawFilename.split('.').filter(Boolean);
  if (parts.length > 2) {
    for (let i = 0; i < parts.length - 1; i++) {
      const partExt = `.${parts[i].toLowerCase()}`;
      if (DANGEROUS_EXTENSIONS.has(partExt)) {
        return { valid: false, message: `Executable or script extension "${partExt}" forbidden in filename.` };
      }
    }
  }

  // 5. MIME type check
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return { valid: false, message: 'Invalid file MIME type. Only image/jpeg, image/png, and image/webp are allowed.' };
  }

  // 6. Binary magic byte inspection (when buffer is supplied)
  if (file.buffer && Buffer.isBuffer(file.buffer)) {
    const magicCheck = validateImageMagicBytes(file.buffer);
    if (!magicCheck.valid) {
      return magicCheck;
    }
  }

  return { valid: true };
}

// Configure Multer Storage for Cloudinary with randomized filenames
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'beautify-africa/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    public_id: (req, file) => {
      const safeId = crypto.randomUUID();
      return `prod_${safeId}`;
    },
    transformation: [{ width: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const check = validateUploadFile(file);
    if (check.valid) {
      cb(null, true);
    } else {
      cb(new Error(check.message));
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
          return res
            .status(400)
            .json({ status: 'error', message: 'Image size exceeds maximum 5MB limit.' });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res
            .status(400)
            .json({ status: 'error', message: 'Unexpected file field. Upload must use "image".' });
        }
        return res
          .status(400)
          .json({ status: 'error', message: err.message || 'File upload error' });
      }
      next();
    });
  },
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No image uploaded' });
    }

    const uploadedUrl = req.file.secure_url || req.file.path || req.file.url;
    res.status(200).json({
      status: 'success',
      url: uploadedUrl,
      message: 'Image uploaded successfully to Cloudinary',
    });
  }
);

module.exports = router;
module.exports.validateUploadFile = validateUploadFile;
module.exports.validateImageMagicBytes = validateImageMagicBytes;
