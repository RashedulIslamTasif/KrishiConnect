const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// cloudinary v1 config syntax (compatible with multer-storage-cloudinary@4)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Product image storage ─────────────────────────────────────
const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'krishiconnect/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation:  [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
  },
});

// ── Avatar / profile photo storage ───────────────────────────
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'krishiconnect/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation:  [{ width: 300, height: 300, crop: 'fill', gravity: 'face', quality: 'auto' }],
  },
});

const upload       = multer({ storage: productStorage });
const uploadAvatar = multer({ storage: avatarStorage });

module.exports = { cloudinary, upload, uploadAvatar };