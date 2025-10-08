const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;

class MediaManager {
    constructor() {
        this.uploadPath = process.env.UPLOAD_PATH || './uploads';
        this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB
        this.allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        this.allowedDocumentTypes = ['application/pdf', 'text/plain', 'application/msword'];
        
        this.initializeStorage();
        this.initializeCloudinary();
    }
    
    // Initialize storage directories
    async initializeStorage() {
        try {
            const directories = [
                path.join(this.uploadPath, 'images'),
                path.join(this.uploadPath, 'thumbnails'),
                path.join(this.uploadPath, 'documents'),
                path.join(this.uploadPath, 'temp')
            ];
            
            for (const dir of directories) {
                await fs.mkdir(dir, { recursive: true });
            }
            
            console.log('✅ Media storage directories initialized');
        } catch (error) {
            console.error('❌ Failed to initialize storage directories:', error);
        }
    }
    
    // Initialize Cloudinary
    initializeCloudinary() {
        if (process.env.CLOUDINARY_CLOUD_NAME) {
            cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET
            });
            console.log('✅ Cloudinary configured');
        }
    }
    
    // Generate unique filename
    generateFilename(originalname, prefix = '') {
        const ext = path.extname(originalname).toLowerCase();
        const timestamp = Date.now();
        const random = crypto.randomBytes(6).toString('hex');
        const sanitizedName = path.basename(originalname, ext)
            .replace(/[^a-zA-Z0-9]/g, '_')
            .substring(0, 20);
        
        return `${prefix}${sanitizedName}_${timestamp}_${random}${ext}`;
    }
    
    // File filter function
    fileFilter(allowedTypes) {
        return (req, file, cb) => {
            if (allowedTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error(`File type ${file.mimetype} not allowed`), false);
            }
        };
    }
    
    // Create multer storage configuration
    createMulterStorage(destination = 'images') {
        return multer.diskStorage({
            destination: async (req, file, cb) => {
                const dir = path.join(this.uploadPath, destination);
                cb(null, dir);
            },
            filename: (req, file, cb) => {
                const filename = this.generateFilename(file.originalname, `${destination}_`);
                cb(null, filename);
            }
        });
    }
    
    // Image upload middleware
    createImageUpload(options = {}) {
        const {
            maxFiles = 5,
            destination = 'images',
            fieldName = 'images'
        } = options;
        
        const upload = multer({
            storage: this.createMulterStorage(destination),
            limits: {
                fileSize: this.maxFileSize,
                files: maxFiles
            },
            fileFilter: this.fileFilter(this.allowedImageTypes)
        });
        
        return upload.array(fieldName, maxFiles);
    }
    
    // Single image upload middleware
    createSingleImageUpload(fieldName = 'image', destination = 'images') {
        const upload = multer({
            storage: this.createMulterStorage(destination),
            limits: {
                fileSize: this.maxFileSize
            },
            fileFilter: this.fileFilter(this.allowedImageTypes)
        });
        
        return upload.single(fieldName);
    }
    
    // Document upload middleware
    createDocumentUpload(fieldName = 'document', destination = 'documents') {
        const upload = multer({
            storage: this.createMulterStorage(destination),
            limits: {
                fileSize: this.maxFileSize * 2 // 20MB for documents
            },
            fileFilter: this.fileFilter(this.allowedDocumentTypes)
        });
        
        return upload.single(fieldName);
    }
    
    // Process uploaded images
    async processImages(files, options = {}) {
        const {
            createThumbnails = true,
            thumbnailSize = { width: 300, height: 300 },
            quality = 80,
            format = 'jpeg'
        } = options;
        
        const processedFiles = [];
        
        for (const file of files) {
            try {
                const processedFile = {
                    original: {
                        filename: file.filename,
                        path: file.path,
                        size: file.size,
                        mimetype: file.mimetype,
                        url: `/uploads/images/${file.filename}`
                    }
                };
                
                // Create optimized version
                const optimizedFilename = `opt_${file.filename.replace(path.extname(file.filename), `.${format}`)}`;
                const optimizedPath = path.join(this.uploadPath, 'images', optimizedFilename);
                
                await sharp(file.path)
                    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality })
                    .toFile(optimizedPath);
                
                processedFile.optimized = {
                    filename: optimizedFilename,
                    path: optimizedPath,
                    url: `/uploads/images/${optimizedFilename}`
                };
                
                // Create thumbnail
                if (createThumbnails) {
                    const thumbnailFilename = `thumb_${file.filename.replace(path.extname(file.filename), `.${format}`)}`;
                    const thumbnailPath = path.join(this.uploadPath, 'thumbnails', thumbnailFilename);
                    
                    await sharp(file.path)
                        .resize(thumbnailSize.width, thumbnailSize.height, { fit: 'cover' })
                        .jpeg({ quality: 90 })
                        .toFile(thumbnailPath);
                    
                    processedFile.thumbnail = {
                        filename: thumbnailFilename,
                        path: thumbnailPath,
                        url: `/uploads/thumbnails/${thumbnailFilename}`
                    };
                }
                
                // Get image metadata
                const metadata = await sharp(file.path).metadata();
                processedFile.metadata = {
                    width: metadata.width,
                    height: metadata.height,
                    format: metadata.format,
                    space: metadata.space,
                    channels: metadata.channels,
                    density: metadata.density
                };
                
                processedFiles.push(processedFile);
                
            } catch (error) {
                console.error(`Error processing image ${file.filename}:`, error);
                // Keep original file info even if processing fails
                processedFiles.push({
                    original: {
                        filename: file.filename,
                        path: file.path,
                        size: file.size,
                        mimetype: file.mimetype,
                        url: `/uploads/images/${file.filename}`
                    },
                    error: error.message
                });
            }
        }
        
        return processedFiles;
    }
    
    // Upload to Cloudinary
    async uploadToCloudinary(filePath, options = {}) {
        try {
            if (!process.env.CLOUDINARY_CLOUD_NAME) {
                throw new Error('Cloudinary not configured');
            }
            
            const {
                folder = process.env.CLOUDINARY_FOLDER || 'plugd-marketplace',
                resource_type = 'auto',
                transformation = []
            } = options;
            
            const result = await cloudinary.uploader.upload(filePath, {
                folder,
                resource_type,
                transformation,
                use_filename: true,
                unique_filename: true
            });
            
            return {
                public_id: result.public_id,
                url: result.secure_url,
                width: result.width,
                height: result.height,
                format: result.format,
                bytes: result.bytes,
                created_at: result.created_at
            };
            
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            throw error;
        }
    }
    
    // Delete file from local storage
    async deleteLocalFile(filePath) {
        try {
            await fs.unlink(filePath);
            console.log(`✅ Deleted local file: ${filePath}`);
        } catch (error) {
            console.error(`❌ Failed to delete local file: ${filePath}`, error);
        }
    }
    
    // Delete file from Cloudinary
    async deleteFromCloudinary(publicId) {
        try {
            if (!process.env.CLOUDINARY_CLOUD_NAME) {
                throw new Error('Cloudinary not configured');
            }
            
            const result = await cloudinary.uploader.destroy(publicId);
            console.log(`✅ Deleted from Cloudinary: ${publicId}`);
            return result;
        } catch (error) {
            console.error(`❌ Failed to delete from Cloudinary: ${publicId}`, error);
            throw error;
        }
    }
    
    // Clean up temporary files
    async cleanupTempFiles(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
        try {
            const tempDir = path.join(this.uploadPath, 'temp');
            const files = await fs.readdir(tempDir);
            
            let deletedCount = 0;
            for (const file of files) {
                const filePath = path.join(tempDir, file);
                const stats = await fs.stat(filePath);
                
                if (Date.now() - stats.mtime.getTime() > maxAge) {
                    await fs.unlink(filePath);
                    deletedCount++;
                }
            }
            
            if (deletedCount > 0) {
                console.log(`✅ Cleaned up ${deletedCount} temporary files`);
            }
        } catch (error) {
            console.error('❌ Temp file cleanup failed:', error);
        }
    }
    
    // Get file information
    async getFileInfo(filePath) {
        try {
            const stats = await fs.stat(filePath);
            const ext = path.extname(filePath).toLowerCase();
            
            const info = {
                filename: path.basename(filePath),
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                extension: ext,
                isImage: this.allowedImageTypes.some(type => type.includes(ext.substring(1)))
            };
            
            // Get image metadata if it's an image
            if (info.isImage) {
                try {
                    const metadata = await sharp(filePath).metadata();
                    info.width = metadata.width;
                    info.height = metadata.height;
                    info.format = metadata.format;
                } catch (sharpError) {
                    // Not a valid image file
                    info.isImage = false;
                }
            }
            
            return info;
        } catch (error) {
            throw new Error(`Failed to get file info: ${error.message}`);
        }
    }
    
    // Create responsive image versions
    async createResponsiveVersions(originalPath, sizes = [400, 800, 1200]) {
        const versions = [];
        const ext = path.extname(originalPath);
        const basename = path.basename(originalPath, ext);
        const directory = path.dirname(originalPath);
        
        for (const size of sizes) {
            try {
                const filename = `${basename}_${size}w${ext}`;
                const outputPath = path.join(directory, filename);
                
                await sharp(originalPath)
                    .resize(size, null, { withoutEnlargement: true })
                    .jpeg({ quality: 80 })
                    .toFile(outputPath);
                
                versions.push({
                    width: size,
                    filename,
                    path: outputPath,
                    url: `/uploads/images/${filename}`
                });
            } catch (error) {
                console.error(`Failed to create ${size}w version:`, error);
            }
        }
        
        return versions;
    }
    
    // Image optimization middleware
    createOptimizationMiddleware() {
        return async (req, res, next) => {
            if (req.files && req.files.length > 0) {
                try {
                    req.processedFiles = await this.processImages(req.files);
                } catch (error) {
                    console.error('Image processing error:', error);
                    req.processingError = error.message;
                }
            } else if (req.file) {
                try {
                    req.processedFiles = await this.processImages([req.file]);
                } catch (error) {
                    console.error('Image processing error:', error);
                    req.processingError = error.message;
                }
            }
            
            next();
        };
    }
    
    // Get storage statistics
    async getStorageStats() {
        try {
            const stats = {
                images: { count: 0, size: 0 },
                thumbnails: { count: 0, size: 0 },
                documents: { count: 0, size: 0 },
                temp: { count: 0, size: 0 },
                total: { count: 0, size: 0 }
            };
            
            const directories = ['images', 'thumbnails', 'documents', 'temp'];
            
            for (const dir of directories) {
                const dirPath = path.join(this.uploadPath, dir);
                try {
                    const files = await fs.readdir(dirPath);
                    
                    for (const file of files) {
                        const filePath = path.join(dirPath, file);
                        const fileStat = await fs.stat(filePath);
                        
                        if (fileStat.isFile()) {
                            stats[dir].count++;
                            stats[dir].size += fileStat.size;
                        }
                    }
                } catch (error) {
                    // Directory might not exist
                    console.warn(`Directory ${dir} not accessible:`, error.message);
                }
            }
            
            // Calculate totals
            Object.keys(stats).forEach(key => {
                if (key !== 'total') {
                    stats.total.count += stats[key].count;
                    stats.total.size += stats[key].size;
                }
            });
            
            // Format sizes
            Object.keys(stats).forEach(key => {
                stats[key].sizeFormatted = this.formatBytes(stats[key].size);
            });
            
            return stats;
        } catch (error) {
            console.error('Failed to get storage stats:', error);
            throw error;
        }
    }
    
    // Format bytes to human readable
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}

// Export singleton instance
module.exports = new MediaManager();
