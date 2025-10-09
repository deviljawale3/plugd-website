const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sharp = require('sharp');

// Ensure upload directories exist
const ensureUploadDirs = () => {
    const dirs = [
        path.join(__dirname, '../uploads'),
        path.join(__dirname, '../uploads/products'),
        path.join(__dirname, '../uploads/categories'),
        path.join(__dirname, '../uploads/users'),
        path.join(__dirname, '../uploads/temp')
    ];
    
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

// Initialize upload directories
ensureUploadDirs();

// File type configurations
const fileConfigs = {
    images: {
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
        maxSize: 5 * 1024 * 1024, // 5MB
        quality: 85,
        formats: ['webp', 'jpeg']
    },
    documents: {
        allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        maxSize: 10 * 1024 * 1024 // 10MB
    },
    archives: {
        allowedTypes: ['application/zip', 'application/x-rar-compressed'],
        maxSize: 50 * 1024 * 1024 // 50MB
    }
};

// Generate unique filename
const generateFileName = (originalName, prefix = '') => {
    const timestamp = Date.now();
    const random = crypto.randomBytes(6).toString('hex');
    const ext = path.extname(originalName).toLowerCase();
    return `${prefix}${timestamp}-${random}${ext}`;
};

// Create storage configuration
const createStorage = (destination, prefix = '') => {
    return multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadPath = path.join(__dirname, `../uploads/${destination}`);
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
            }
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            const fileName = generateFileName(file.originalname, prefix);
            cb(null, fileName);
        }
    });
};

// File filter function
const createFileFilter = (allowedTypes) => {
    return (req, file, cb) => {
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
        }
    };
};

// Image processing middleware
const processImages = async (files, options = {}) => {
    const {
        resize = { width: 800, height: 600 },
        quality = 85,
        format = 'webp',
        generateThumbnails = true,
        thumbnailSize = { width: 200, height: 200 }
    } = options;
    
    if (!files || files.length === 0) {
        return [];
    }
    
    const processedFiles = [];
    
    for (const file of files) {
        try {
            const originalPath = file.path;
            const dir = path.dirname(originalPath);
            const baseName = path.basename(originalPath, path.extname(originalPath));
            
            // Process main image
            const mainImagePath = path.join(dir, `${baseName}.${format}`);
            await sharp(originalPath)
                .resize(resize.width, resize.height, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .toFormat(format, { quality })
                .toFile(mainImagePath);
            
            const processedFile = {
                original: file,
                main: {
                    path: mainImagePath,
                    url: `/uploads/${path.relative(path.join(__dirname, '../uploads'), mainImagePath)}`,
                    filename: path.basename(mainImagePath),
                    size: fs.statSync(mainImagePath).size
                }
            };
            
            // Generate thumbnail if requested
            if (generateThumbnails) {
                const thumbnailPath = path.join(dir, `${baseName}_thumb.${format}`);
                await sharp(originalPath)
                    .resize(thumbnailSize.width, thumbnailSize.height, {
                        fit: 'cover',
                        position: 'center'
                    })
                    .toFormat(format, { quality: 80 })
                    .toFile(thumbnailPath);
                
                processedFile.thumbnail = {
                    path: thumbnailPath,
                    url: `/uploads/${path.relative(path.join(__dirname, '../uploads'), thumbnailPath)}`,
                    filename: path.basename(thumbnailPath),
                    size: fs.statSync(thumbnailPath).size
                };
            }
            
            // Remove original file if processing was successful
            if (fs.existsSync(originalPath) && originalPath !== mainImagePath) {
                fs.unlinkSync(originalPath);
            }
            
            processedFiles.push(processedFile);
        } catch (error) {
            console.error('Image processing error:', error);
            // Keep original file if processing fails
            processedFiles.push({
                original: file,
                main: {
                    path: file.path,
                    url: `/uploads/${path.relative(path.join(__dirname, '../uploads'), file.path)}`,
                    filename: file.filename,
                    size: file.size
                }
            });
        }
    }
    
    return processedFiles;
};

// Upload configurations for different types
const uploadConfigs = {
    // Product images
    productImages: multer({
        storage: createStorage('products', 'product_'),
        fileFilter: createFileFilter(fileConfigs.images.allowedTypes),
        limits: {
            fileSize: fileConfigs.images.maxSize,
            files: 10
        }
    }),
    
    // Category images
    categoryImage: multer({
        storage: createStorage('categories', 'category_'),
        fileFilter: createFileFilter(fileConfigs.images.allowedTypes),
        limits: {
            fileSize: fileConfigs.images.maxSize,
            files: 1
        }
    }),
    
    // User avatars
    userAvatar: multer({
        storage: createStorage('users', 'avatar_'),
        fileFilter: createFileFilter(fileConfigs.images.allowedTypes),
        limits: {
            fileSize: 2 * 1024 * 1024, // 2MB for avatars
            files: 1
        }
    }),
    
    // General file upload
    general: multer({
        storage: createStorage('temp'),
        limits: {
            fileSize: 10 * 1024 * 1024 // 10MB
        }
    })
};

// File cleanup utility
const cleanupFiles = (files) => {
    if (!files) return;
    
    const fileArray = Array.isArray(files) ? files : [files];
    
    fileArray.forEach(file => {
        if (file && file.path && fs.existsSync(file.path)) {
            try {
                fs.unlinkSync(file.path);
            } catch (error) {
                console.error('File cleanup error:', error);
            }
        }
    });
};

// Delete files by URL or path
const deleteFiles = (files) => {
    if (!files) return;
    
    const fileArray = Array.isArray(files) ? files : [files];
    
    fileArray.forEach(file => {
        let filePath;
        
        if (typeof file === 'string') {
            // Handle URL or relative path
            if (file.startsWith('/uploads/')) {
                filePath = path.join(__dirname, '..', file);
            } else if (file.startsWith('uploads/')) {
                filePath = path.join(__dirname, '..', file);
            } else {
                filePath = file;
            }
        } else if (file && file.path) {
            filePath = file.path;
        } else if (file && file.filename) {
            // Try to construct path from filename
            filePath = path.join(__dirname, '../uploads', file.filename);
        }
        
        if (filePath && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                console.log('Deleted file:', filePath);
            } catch (error) {
                console.error('File deletion error:', error);
            }
        }
    });
};

// Validate file upload
const validateFileUpload = (file, config) => {
    const errors = [];
    
    if (!file) {
        errors.push('No file provided');
        return errors;
    }
    
    // Check file type
    if (config.allowedTypes && !config.allowedTypes.includes(file.mimetype)) {
        errors.push(`Invalid file type. Allowed: ${config.allowedTypes.join(', ')}`);
    }
    
    // Check file size
    if (config.maxSize && file.size > config.maxSize) {
        errors.push(`File too large. Maximum size: ${(config.maxSize / 1024 / 1024).toFixed(2)}MB`);
    }
    
    return errors;
};

// Get file info
const getFileInfo = (filePath) => {
    try {
        const stats = fs.statSync(filePath);
        const ext = path.extname(filePath).toLowerCase();
        
        return {
            exists: true,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            extension: ext,
            type: getFileType(ext)
        };
    } catch (error) {
        return {
            exists: false,
            error: error.message
        };
    }
};

// Get file type from extension
const getFileType = (extension) => {
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const documentExts = ['.pdf', '.doc', '.docx', '.txt', '.rtf'];
    const archiveExts = ['.zip', '.rar', '.7z', '.tar', '.gz'];
    
    if (imageExts.includes(extension)) return 'image';
    if (documentExts.includes(extension)) return 'document';
    if (archiveExts.includes(extension)) return 'archive';
    
    return 'other';
};

// Create upload middleware with error handling
const createUploadMiddleware = (uploadConfig, options = {}) => {
    return (req, res, next) => {
        uploadConfig(req, res, (err) => {
            if (err) {
                console.error('Upload error:', err);
                
                // Clean up any uploaded files on error
                if (req.files) {
                    cleanupFiles(req.files);
                }
                if (req.file) {
                    cleanupFiles(req.file);
                }
                
                if (err instanceof multer.MulterError) {
                    switch (err.code) {
                        case 'LIMIT_FILE_SIZE':
                            return res.status(400).json({
                                success: false,
                                message: 'File too large',
                                error: err.message
                            });
                        case 'LIMIT_FILE_COUNT':
                            return res.status(400).json({
                                success: false,
                                message: 'Too many files',
                                error: err.message
                            });
                        case 'LIMIT_UNEXPECTED_FILE':
                            return res.status(400).json({
                                success: false,
                                message: 'Unexpected field',
                                error: err.message
                            });
                        default:
                            return res.status(400).json({
                                success: false,
                                message: 'Upload error',
                                error: err.message
                            });
                    }
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'File upload failed',
                        error: err.message
                    });
                }
            }
            next();
        });
    };
};

module.exports = {
    uploadConfigs,
    processImages,
    cleanupFiles,
    deleteFiles,
    validateFileUpload,
    getFileInfo,
    createUploadMiddleware,
    fileConfigs,
    generateFileName
};
