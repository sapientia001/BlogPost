const express = require('express');
const multer = require('multer');
const { uploadImage, uploadDocument, deleteFile } = require('../controllers/uploadController');
const { validateImageUpload, validateDocumentUpload } = require('../middleware/validation');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Apply auth middleware to all upload routes
router.use(auth);

// Image upload route
router.post('/image', upload.single('image'), validateImageUpload, uploadImage);

// Document upload route  
router.post('/document', upload.single('document'), validateDocumentUpload, uploadDocument);

// Delete file route
router.delete('/:publicId', deleteFile);

module.exports = router;