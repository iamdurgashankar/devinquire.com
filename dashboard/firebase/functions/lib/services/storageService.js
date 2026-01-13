"use strict";
/**
 * Firebase Storage Service
 * Handles file upload, deletion, image processing, and storage management
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = uploadFile;
exports.deleteFile = deleteFile;
exports.getFile = getFile;
exports.listFiles = listFiles;
exports.cleanupTempFiles = cleanupTempFiles;
const admin = __importStar(require("firebase-admin"));
const errors_1 = require("../utils/errors");
const joi_1 = __importDefault(require("joi"));
const sharp_1 = __importDefault(require("sharp"));
const uuid_1 = require("uuid");
// Initialize Firebase services
const storage = admin.storage();
const bucket = storage.bucket();
// Validation schemas
const uploadSchema = joi_1.default.object({
    fileName: joi_1.default.string().required(),
    contentType: joi_1.default.string().required(),
    folder: joi_1.default.string().valid('avatars', 'posts/images', 'pages/assets', 'documents', 'media', 'temp', 'public').required(),
    isPublic: joi_1.default.boolean().default(false),
    generateThumbnail: joi_1.default.boolean().default(false),
    maxWidth: joi_1.default.number().integer().min(100).max(4000).optional(),
    maxHeight: joi_1.default.number().integer().min(100).max(4000).optional(),
    quality: joi_1.default.number().integer().min(10).max(100).default(85)
});
const deleteSchema = joi_1.default.object({
    filePath: joi_1.default.string().required(),
    deleteThumbnails: joi_1.default.boolean().default(true)
});
// File type validation
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const ALLOWED_AUDIO_TYPES = ['audio/mp3', 'audio/wav', 'audio/ogg'];
// File size limits (in bytes)
const SIZE_LIMITS = {
    avatars: 5 * 1024 * 1024, // 5MB
    'posts/images': 10 * 1024 * 1024, // 10MB
    'pages/assets': 20 * 1024 * 1024, // 20MB
    documents: 50 * 1024 * 1024, // 50MB
    media: 100 * 1024 * 1024, // 100MB
    temp: 10 * 1024 * 1024, // 10MB
    public: 100 * 1024 * 1024 // 100MB
};
/**
 * Validate file type and size
 */
function validateFile(contentType, size, folder) {
    // Check file size
    const maxSize = SIZE_LIMITS[folder];
    if (size > maxSize) {
        throw new errors_1.ApplicationError(`File size exceeds limit of ${maxSize / (1024 * 1024)}MB for ${folder}`, 'FILE_TOO_LARGE', 400);
    }
    // Check file type
    const isImage = ALLOWED_IMAGE_TYPES.includes(contentType);
    const isDocument = ALLOWED_DOCUMENT_TYPES.includes(contentType);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(contentType);
    const isAudio = ALLOWED_AUDIO_TYPES.includes(contentType);
    if (!isImage && !isDocument && !isVideo && !isAudio) {
        throw new errors_1.ApplicationError(`File type ${contentType} is not allowed`, 'INVALID_FILE_TYPE', 400);
    }
    // Folder-specific type validation
    if (folder === 'avatars' && !isImage) {
        throw new errors_1.ApplicationError('Only images are allowed for avatars', 'INVALID_FILE_TYPE', 400);
    }
    if (folder === 'posts/images' && !isImage) {
        throw new errors_1.ApplicationError('Only images are allowed for post images', 'INVALID_FILE_TYPE', 400);
    }
}
/**
 * Generate unique file path
 */
function generateFilePath(folder, fileName, userId) {
    const timestamp = Date.now();
    const uuid = (0, uuid_1.v4)().substring(0, 8);
    const extension = fileName.split('.').pop();
    const baseName = fileName.split('.').slice(0, -1).join('.');
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
    return `${folder}/${userId}/${timestamp}_${uuid}_${sanitizedName}.${extension}`;
}
/**
 * Process image (resize, optimize)
 */
async function processImage(buffer, options) {
    let processed = (0, sharp_1.default)(buffer);
    // Resize if dimensions specified
    if (options.maxWidth || options.maxHeight) {
        processed = processed.resize(options.maxWidth, options.maxHeight, {
            fit: 'inside',
            withoutEnlargement: true
        });
    }
    // Set quality and format
    processed = processed.jpeg({ quality: options.quality || 85 });
    const processedBuffer = await processed.toBuffer();
    let thumbnailBuffer;
    // Generate thumbnail if requested
    if (options.generateThumbnail) {
        thumbnailBuffer = await (0, sharp_1.default)(buffer)
            .resize(300, 300, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toBuffer();
    }
    return {
        processed: processedBuffer,
        thumbnail: thumbnailBuffer
    };
}
/**
 * Upload file to Firebase Storage
 */
async function uploadFile(req, res) {
    var _a;
    try {
        const validatedData = uploadSchema.validate(req.body, { abortEarly: false });
        if (validatedData.error) {
            throw new errors_1.ApplicationError(validatedData.error.details[0].message, 'VALIDATION_ERROR', 400);
        }
        const { fileName, contentType, folder, isPublic, generateThumbnail, maxWidth, maxHeight, quality } = validatedData.value;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        if (!userId) {
            throw new errors_1.ApplicationError('User authentication required', 'AUTHENTICATION_ERROR', 401);
        }
        // Check if file data is provided
        if (!req.file && !req.body.fileData) {
            throw new errors_1.ApplicationError('File data is required', 'VALIDATION_ERROR', 400);
        }
        const fileBuffer = req.file ? req.file.buffer : Buffer.from(req.body.fileData, 'base64');
        const fileSize = fileBuffer.length;
        // Validate file
        validateFile(contentType, fileSize, folder);
        // Generate file path
        const filePath = generateFilePath(folder, fileName, userId);
        const file = bucket.file(filePath);
        let uploadBuffer = fileBuffer;
        let thumbnailPath;
        // Process image if it's an image file
        if (ALLOWED_IMAGE_TYPES.includes(contentType)) {
            const processed = await processImage(fileBuffer, {
                maxWidth,
                maxHeight,
                quality,
                generateThumbnail
            });
            uploadBuffer = processed.processed;
            // Upload thumbnail if generated
            if (processed.thumbnail) {
                thumbnailPath = filePath.replace(/\.[^.]+$/, '_thumb.jpg');
                const thumbnailFile = bucket.file(thumbnailPath);
                await thumbnailFile.save(processed.thumbnail, {
                    metadata: {
                        contentType: 'image/jpeg',
                        metadata: {
                            originalName: `thumb_${fileName}`,
                            uploadedBy: userId,
                            uploadedAt: new Date().toISOString(),
                            isThumnail: 'true'
                        }
                    },
                    public: isPublic
                });
            }
        }
        // Upload main file
        await file.save(uploadBuffer, {
            metadata: {
                contentType,
                metadata: {
                    originalName: fileName,
                    uploadedBy: userId,
                    uploadedAt: new Date().toISOString(),
                    folder,
                    fileSize: uploadBuffer.length.toString()
                }
            },
            public: isPublic
        });
        // Get download URLs
        const [downloadURL] = await file.getSignedUrl({
            action: 'read',
            expires: '03-01-2500' // Far future date
        });
        let thumbnailURL;
        if (thumbnailPath) {
            const thumbnailFile = bucket.file(thumbnailPath);
            const [thumbURL] = await thumbnailFile.getSignedUrl({
                action: 'read',
                expires: '03-01-2500'
            });
            thumbnailURL = thumbURL;
        }
        // Save file metadata to Firestore
        const db = admin.firestore();
        await db.collection('media').add({
            fileName,
            filePath,
            thumbnailPath,
            contentType,
            fileSize: uploadBuffer.length,
            folder,
            uploadedBy: userId,
            uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
            downloadURL,
            thumbnailURL,
            isPublic,
            status: 'active'
        });
        res.status(200).json({
            success: true,
            data: {
                fileName,
                filePath,
                downloadURL,
                thumbnailURL,
                fileSize: uploadBuffer.length,
                contentType
            }
        });
    }
    catch (error) {
        console.error('Upload file error:', error);
        if (error instanceof errors_1.ApplicationError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Internal server error during file upload'
            });
        }
    }
}
/**
 * Delete file from Firebase Storage
 */
async function deleteFile(req, res) {
    var _a, _b;
    try {
        const validatedData = deleteSchema.validate(req.body, { abortEarly: false });
        if (validatedData.error) {
            throw new errors_1.ApplicationError(validatedData.error.details[0].message, 'VALIDATION_ERROR', 400);
        }
        const { filePath, deleteThumbnails } = validatedData.value;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        if (!userId) {
            throw new errors_1.ApplicationError('User authentication required', 'AUTHENTICATION_ERROR', 401);
        }
        // Get file metadata from Firestore
        const db = admin.firestore();
        const mediaQuery = await db.collection('media')
            .where('filePath', '==', filePath)
            .limit(1)
            .get();
        if (mediaQuery.empty) {
            throw new errors_1.ApplicationError('File not found', 'NOT_FOUND', 404);
        }
        const mediaDoc = mediaQuery.docs[0];
        const mediaData = mediaDoc.data();
        // Check if user owns the file or is admin
        if (mediaData.uploadedBy !== userId && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'admin') {
            throw new errors_1.ApplicationError('Unauthorized to delete this file', 'AUTHORIZATION_ERROR', 403);
        }
        // Delete main file
        const file = bucket.file(filePath);
        await file.delete();
        // Delete thumbnail if exists and requested
        if (deleteThumbnails && mediaData.thumbnailPath) {
            const thumbnailFile = bucket.file(mediaData.thumbnailPath);
            try {
                await thumbnailFile.delete();
            }
            catch (error) {
                console.warn('Failed to delete thumbnail:', error);
            }
        }
        // Update Firestore record
        await mediaDoc.ref.update({
            status: 'deleted',
            deletedAt: admin.firestore.FieldValue.serverTimestamp(),
            deletedBy: userId
        });
        res.status(200).json({
            success: true,
            message: 'File deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete file error:', error);
        if (error instanceof errors_1.ApplicationError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Internal server error during file deletion'
            });
        }
    }
}
/**
 * Get file metadata and signed URL
 */
async function getFile(req, res) {
    var _a, _b;
    try {
        const { filePath } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        if (!filePath) {
            throw new errors_1.ApplicationError('File path is required', 'VALIDATION_ERROR', 400);
        }
        // Get file metadata from Firestore
        const db = admin.firestore();
        const mediaQuery = await db.collection('media')
            .where('filePath', '==', filePath)
            .where('status', '==', 'active')
            .limit(1)
            .get();
        if (mediaQuery.empty) {
            throw new errors_1.ApplicationError('File not found', 'NOT_FOUND', 404);
        }
        const mediaData = mediaQuery.docs[0].data();
        // Check access permissions
        if (!mediaData.isPublic && mediaData.uploadedBy !== userId && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'admin') {
            throw new errors_1.ApplicationError('Unauthorized to access this file', 'AUTHORIZATION_ERROR', 403);
        }
        // Generate signed URL
        const file = bucket.file(filePath);
        const [downloadURL] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 60 * 60 * 1000 // 1 hour
        });
        res.status(200).json({
            success: true,
            data: Object.assign(Object.assign({}, mediaData), { downloadURL })
        });
    }
    catch (error) {
        console.error('Get file error:', error);
        if (error instanceof errors_1.ApplicationError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Internal server error during file retrieval'
            });
        }
    }
}
/**
 * List user files with pagination
 */
async function listFiles(req, res) {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        const { folder, page = 1, limit = 20 } = req.query;
        if (!userId) {
            throw new errors_1.ApplicationError('User authentication required', 'AUTHENTICATION_ERROR', 401);
        }
        const db = admin.firestore();
        let query = db.collection('media')
            .where('uploadedBy', '==', userId)
            .where('status', '==', 'active')
            .orderBy('uploadedAt', 'desc');
        if (folder) {
            query = query.where('folder', '==', folder);
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;
        const snapshot = await query.limit(limitNum).offset(offset).get();
        const files = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        // Get total count
        const countQuery = db.collection('media')
            .where('uploadedBy', '==', userId)
            .where('status', '==', 'active');
        const countSnapshot = await countQuery.count().get();
        const total = countSnapshot.data().count;
        res.status(200).json({
            success: true,
            data: {
                files,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum)
                }
            }
        });
    }
    catch (error) {
        console.error('List files error:', error);
        if (error instanceof errors_1.ApplicationError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Internal server error during file listing'
            });
        }
    }
}
/**
 * Clean up temporary files (scheduled function)
 */
async function cleanupTempFiles() {
    try {
        const db = admin.firestore();
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        // Find temp files older than 24 hours
        const tempFilesQuery = await db.collection('media')
            .where('folder', '==', 'temp')
            .where('status', '==', 'active')
            .where('uploadedAt', '<', oneDayAgo)
            .get();
        const batch = db.batch();
        const deletePromises = [];
        for (const doc of tempFilesQuery.docs) {
            const data = doc.data();
            // Delete from storage
            const file = bucket.file(data.filePath);
            deletePromises.push(file.delete().catch((err) => {
                console.error('Failed to delete file:', err);
                return undefined;
            }).then(() => undefined));
            if (data.thumbnailPath) {
                const thumbnailFile = bucket.file(data.thumbnailPath);
                deletePromises.push(thumbnailFile.delete().catch((err) => {
                    console.error('Failed to delete thumbnail:', err);
                    return undefined;
                }).then(() => undefined));
            }
            // Mark as deleted in Firestore
            batch.update(doc.ref, {
                status: 'deleted',
                deletedAt: admin.firestore.FieldValue.serverTimestamp(),
                deletedBy: 'system'
            });
        }
        await Promise.all(deletePromises);
        await batch.commit();
        console.log(`Cleaned up ${tempFilesQuery.docs.length} temporary files`);
    }
    catch (error) {
        console.error('Cleanup temp files error:', error);
    }
}
//# sourceMappingURL=storageService.js.map