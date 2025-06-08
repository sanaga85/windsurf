const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const config = require('../config/config');
const { ValidationError } = require('./errorHandler');
const { sanitizeFilename, getFileExtension } = require('../utils/helpers');

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Create upload directories
const uploadDirs = {
  avatars: path.join(config.upload.uploadPath, 'avatars'),
  content: path.join(config.upload.uploadPath, 'content'),
  library: path.join(config.upload.uploadPath, 'library'),
  temp: path.join(config.upload.uploadPath, 'temp')
};

Object.values(uploadDirs).forEach(ensureDirectoryExists);

// File filter function
const fileFilter = (allowedTypes) => {
  return (req, file, cb) => {
    const fileExtension = getFileExtension(file.originalname);
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new ValidationError(`File type .${fileExtension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
  };
};

// Storage configuration for avatars
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs.avatars);
  },
  filename: (req, file, cb) => {
    const userId = req.params.id || req.user?.id || 'unknown';
    const extension = getFileExtension(file.originalname);
    const filename = `avatar_${userId}_${Date.now()}.${extension}`;
    cb(null, filename);
  }
});

// Storage configuration for content files
const contentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs.content);
  },
  filename: (req, file, cb) => {
    const originalName = sanitizeFilename(file.originalname);
    const extension = getFileExtension(originalName);
    const baseName = path.basename(originalName, `.${extension}`);
    const filename = `${baseName}_${Date.now()}.${extension}`;
    cb(null, filename);
  }
});

// Storage configuration for library files
const libraryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs.library);
  },
  filename: (req, file, cb) => {
    const originalName = sanitizeFilename(file.originalname);
    const extension = getFileExtension(originalName);
    const baseName = path.basename(originalName, `.${extension}`);
    const filename = `library_${baseName}_${Date.now()}.${extension}`;
    cb(null, filename);
  }
});

// Storage configuration for temporary files
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs.temp);
  },
  filename: (req, file, cb) => {
    const originalName = sanitizeFilename(file.originalname);
    const extension = getFileExtension(originalName);
    const baseName = path.basename(originalName, `.${extension}`);
    const filename = `temp_${baseName}_${Date.now()}.${extension}`;
    cb(null, filename);
  }
});

// Parse file size limit
const parseFileSize = (sizeStr) => {
  const units = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
  const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
  
  if (!match) {
    return 10 * 1024 * 1024; // Default 10MB
  }
  
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  
  return value * units[unit];
};

// Avatar upload middleware
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: fileFilter(['jpg', 'jpeg', 'png', 'gif', 'webp'])
});

// Content upload middleware
const uploadContent = multer({
  storage: contentStorage,
  limits: {
    fileSize: parseFileSize(config.upload.maxFileSize),
    files: config.upload.maxFiles
  },
  fileFilter: fileFilter(config.upload.allowedFileTypes)
});

// Library upload middleware
const uploadLibrary = multer({
  storage: libraryStorage,
  limits: {
    fileSize: parseFileSize(config.upload.maxFileSize),
    files: config.upload.maxFiles
  },
  fileFilter: fileFilter(config.upload.allowedFileTypes)
});

// CSV upload middleware
const uploadCSV = multer({
  storage: tempStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  },
  fileFilter: fileFilter(['csv'])
});

// General upload middleware
const upload = multer({
  storage: tempStorage,
  limits: {
    fileSize: parseFileSize(config.upload.maxFileSize),
    files: config.upload.maxFiles
  },
  fileFilter: fileFilter(config.upload.allowedFileTypes)
});

// Image processing middleware
const processImage = async (req, res, next) => {
  if (!req.file || !req.file.mimetype.startsWith('image/')) {
    return next();
  }

  try {
    const inputPath = req.file.path;
    const outputPath = inputPath.replace(/\.[^/.]+$/, '_processed.jpg');

    // Process image with Sharp
    await sharp(inputPath)
      .resize(800, 600, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality: 85,
        progressive: true
      })
      .toFile(outputPath);

    // Replace original file with processed version
    fs.unlinkSync(inputPath);
    fs.renameSync(outputPath, inputPath);

    // Update file info
    req.file.mimetype = 'image/jpeg';
    req.file.size = fs.statSync(inputPath).size;

    next();
  } catch (error) {
    next(error);
  }
};

// Avatar processing middleware
const processAvatar = async (req, res, next) => {
  if (!req.file || !req.file.mimetype.startsWith('image/')) {
    return next();
  }

  try {
    const inputPath = req.file.path;
    const outputPath = inputPath.replace(/\.[^/.]+$/, '_avatar.jpg');

    // Process avatar with Sharp
    await sharp(inputPath)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: 90,
        progressive: true
      })
      .toFile(outputPath);

    // Replace original file with processed version
    fs.unlinkSync(inputPath);
    fs.renameSync(outputPath, inputPath);

    // Update file info
    req.file.mimetype = 'image/jpeg';
    req.file.size = fs.statSync(inputPath).size;

    next();
  } catch (error) {
    next(error);
  }
};

// File validation middleware
const validateFile = (req, res, next) => {
  if (!req.file && !req.files) {
    return next(new ValidationError('No file uploaded'));
  }

  const files = req.files || [req.file];
  
  for (const file of files) {
    // Check file size
    if (file.size > parseFileSize(config.upload.maxFileSize)) {
      return next(new ValidationError(`File ${file.originalname} is too large`));
    }

    // Check file type
    const extension = getFileExtension(file.originalname);
    if (!config.upload.allowedFileTypes.includes(extension)) {
      return next(new ValidationError(`File type .${extension} is not allowed`));
    }
  }

  next();
};

// Cleanup temporary files middleware
const cleanupTempFiles = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Clean up temporary files after response is sent
    if (req.file) {
      setTimeout(() => {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      }, 1000);
    }
    
    if (req.files) {
      setTimeout(() => {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }, 1000);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return next(new ValidationError('File too large'));
      case 'LIMIT_FILE_COUNT':
        return next(new ValidationError('Too many files'));
      case 'LIMIT_UNEXPECTED_FILE':
        return next(new ValidationError('Unexpected file field'));
      default:
        return next(new ValidationError('File upload error'));
    }
  }
  next(error);
};

// Export configured upload instances
module.exports = {
  // Single file uploads
  single: upload.single.bind(upload),
  
  // Multiple file uploads
  array: upload.array.bind(upload),
  fields: upload.fields.bind(upload),
  
  // Specific upload types
  avatar: uploadAvatar.single('avatar'),
  content: uploadContent.array('content', 10),
  library: uploadLibrary.single('library'),
  csv: uploadCSV.single('csvFile'),
  
  // Processing middleware
  processImage,
  processAvatar,
  validateFile,
  cleanupTempFiles,
  handleMulterError,
  
  // Storage configurations
  avatarStorage,
  contentStorage,
  libraryStorage,
  tempStorage,
  
  // Upload directories
  uploadDirs
};