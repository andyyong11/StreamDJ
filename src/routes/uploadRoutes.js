const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../db/models/userModel');

const router = express.Router();

// Set storage engine for multer to save images on disk
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/avatars';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const suffix = req.originalUrl.includes('upload-avatar') ? 'avatar' : 'banner';
    cb(null, `user-${req.params.id}-${suffix}${fileExtension}`);
  }  
});

// Validate file type (only images)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Upload Avatar
router.post('/users/:id/upload-avatar', upload.single('file'), async (req, res) => {
    try {
      const fileExtension = path.extname(req.file.originalname);
      const filePath = `uploads/avatars/user-${req.params.id}-avatar${fileExtension}`;
      const imageUrl = `http://localhost:5001/${filePath}`;
  
      // Save the image URL to the database, NOT the binary data
      await User.updateAvatar(req.params.id, imageUrl); // Update the database with the URL
  
      // Return the URL in the response
      res.json({ ProfilePicture: imageUrl });
    } catch (err) {
      console.error('Upload avatar error:', err);
      res.status(500).json({ error: 'Failed to upload avatar' });
    }
  });  

// Upload Banner
// Upload Banner
router.post('/users/:id/upload-banner', upload.single('file'), async (req, res) => {
    try {
      const fileExtension = path.extname(req.file.originalname);
      const filePath = `uploads/avatars/user-${req.params.id}-banner${fileExtension}`;
      const imageUrl = `http://localhost:5001/${filePath}`;
  
      // Save the image URL to the database, not binary data
      await User.updateBanner(req.params.id, imageUrl);  // Update the database with the URL
  
      // Return the image URL in the response
      res.json({ Banner: imageUrl });
    } catch (err) {
      console.error('Upload banner error:', err);
      res.status(500).json({ error: 'Failed to upload banner' });
    }
  });  

module.exports = router;