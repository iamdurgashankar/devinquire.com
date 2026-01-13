/**
 * Firebase Storage Service
 * Handles file upload, deletion, image processing, and storage management
 */

import * as admin from 'firebase-admin';
import { Request, Response } from 'express';
import { ApplicationError } from '../utils/errors';
import Joi from 'joi';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        role?: string;
        email?: string;
      };
      file?: {
        buffer: Buffer;
        originalname: string;
        mimetype: string;
        size: number;
      };
    }
  }
}

// Initialize Firebase services
const storage = admin.storage();
const bucket = storage.bucket();

// Validation schemas
const uploadSchema = Joi.object({
  fileName: Joi.string().required(),
  contentType: Joi.string().required(),
  folder: Joi.string().valid('avatars', 'posts/images', 'pages/assets', 'documents', 'media', 'temp', 'public').required(),
  isPublic: Joi.boolean().default(false),
  generateThumbnail: Joi.boolean().default(false),
  maxWidth: Joi.number().integer().min(100).max(4000).optional(),
  maxHeight: Joi.number().integer().min(100).max(4000).optional(),
  quality: Joi.number().integer().min(10).max(100).default(85)
});

const deleteSchema = Joi.object({
  filePath: Joi.string().required(),
  deleteThumbnails: Joi.boolean().default(true)
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
function validateFile(contentType: string, size: number, folder: string): void {
  // Check file size
  const maxSize = SIZE_LIMITS[folder as keyof typeof SIZE_LIMITS];
  if (size > maxSize) {
    throw new ApplicationError(`File size exceeds limit of ${maxSize / (1024 * 1024)}MB for ${folder}`, 'FILE_TOO_LARGE', 400);
  }

  // Check file type
  const isImage = ALLOWED_IMAGE_TYPES.includes(contentType);
  const isDocument = ALLOWED_DOCUMENT_TYPES.includes(contentType);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(contentType);
  const isAudio = ALLOWED_AUDIO_TYPES.includes(contentType);

  if (!isImage && !isDocument && !isVideo && !isAudio) {
    throw new ApplicationError(`File type ${contentType} is not allowed`, 'INVALID_FILE_TYPE', 400);
  }

  // Folder-specific type validation
  if (folder === 'avatars' && !isImage) {
    throw new ApplicationError('Only images are allowed for avatars', 'INVALID_FILE_TYPE', 400);
  }
  if (folder === 'posts/images' && !isImage) {
    throw new ApplicationError('Only images are allowed for post images', 'INVALID_FILE_TYPE', 400);
  }
}

/**
 * Generate unique file path
 */
function generateFilePath(folder: string, fileName: string, userId: string): string {
  const timestamp = Date.now();
  const uuid = uuidv4().substring(0, 8);
  const extension = fileName.split('.').pop();
  const baseName = fileName.split('.').slice(0, -1).join('.');
  const sanitizedName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
  
  return `${folder}/${userId}/${timestamp}_${uuid}_${sanitizedName}.${extension}`;
}

/**
 * Process image (resize, optimize)
 */
async function processImage(
  buffer: Buffer,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    generateThumbnail?: boolean;
  }
): Promise<{ processed: Buffer; thumbnail?: Buffer }> {
  let processed = sharp(buffer);

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
  let thumbnailBuffer: Buffer | undefined;

  // Generate thumbnail if requested
  if (options.generateThumbnail) {
    thumbnailBuffer = await sharp(buffer)
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
export async function uploadFile(req: Request, res: Response): Promise<void> {
  try {
    const validatedData = uploadSchema.validate(req.body, { abortEarly: false });
    if (validatedData.error) {
      throw new ApplicationError(validatedData.error.details[0].message, 'VALIDATION_ERROR', 400);
    }

    const { fileName, contentType, folder, isPublic, generateThumbnail, maxWidth, maxHeight, quality } = validatedData.value;
    const userId = req.user?.uid;

    if (!userId) {
      throw new ApplicationError('User authentication required', 'AUTHENTICATION_ERROR', 401);
    }

    // Check if file data is provided
    if (!req.file && !req.body.fileData) {
      throw new ApplicationError('File data is required', 'VALIDATION_ERROR', 400);
    }

    const fileBuffer = req.file ? req.file.buffer : Buffer.from(req.body.fileData, 'base64');
    const fileSize = fileBuffer.length;

    // Validate file
    validateFile(contentType, fileSize, folder);

    // Generate file path
    const filePath = generateFilePath(folder, fileName, userId);
    const file = bucket.file(filePath);

    let uploadBuffer = fileBuffer;
    let thumbnailPath: string | undefined;

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

    let thumbnailURL: string | undefined;
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
  } catch (error) {
      console.error('Upload file error:', error);
      if (error instanceof ApplicationError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      } else {
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
export async function deleteFile(req: Request, res: Response): Promise<void> {
  try {
    const validatedData = deleteSchema.validate(req.body, { abortEarly: false });
    if (validatedData.error) {
      throw new ApplicationError(validatedData.error.details[0].message, 'VALIDATION_ERROR', 400);
    }

    const { filePath, deleteThumbnails } = validatedData.value;
    const userId = req.user?.uid;

    if (!userId) {
      throw new ApplicationError('User authentication required', 'AUTHENTICATION_ERROR', 401);
    }

    // Get file metadata from Firestore
    const db = admin.firestore();
    const mediaQuery = await db.collection('media')
      .where('filePath', '==', filePath)
      .limit(1)
      .get();

    if (mediaQuery.empty) {
      throw new ApplicationError('File not found', 'NOT_FOUND', 404);
    }

    const mediaDoc = mediaQuery.docs[0];
    const mediaData = mediaDoc.data();

    // Check if user owns the file or is admin
    if (mediaData.uploadedBy !== userId && req.user?.role !== 'admin') {
      throw new ApplicationError('Unauthorized to delete this file', 'AUTHORIZATION_ERROR', 403);
    }

    // Delete main file
    const file = bucket.file(filePath);
    await file.delete();

    // Delete thumbnail if exists and requested
    if (deleteThumbnails && mediaData.thumbnailPath) {
      const thumbnailFile = bucket.file(mediaData.thumbnailPath);
      try {
        await thumbnailFile.delete();
      } catch (error) {
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
  } catch (error) {
      console.error('Delete file error:', error);
      if (error instanceof ApplicationError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      } else {
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
export async function getFile(req: Request, res: Response): Promise<void> {
  try {
    const { filePath } = req.params;
    const userId = req.user?.uid;

    if (!filePath) {
      throw new ApplicationError('File path is required', 'VALIDATION_ERROR', 400);
    }

    // Get file metadata from Firestore
    const db = admin.firestore();
    const mediaQuery = await db.collection('media')
      .where('filePath', '==', filePath)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (mediaQuery.empty) {
      throw new ApplicationError('File not found', 'NOT_FOUND', 404);
    }

    const mediaData = mediaQuery.docs[0].data();

    // Check access permissions
    if (!mediaData.isPublic && mediaData.uploadedBy !== userId && req.user?.role !== 'admin') {
      throw new ApplicationError('Unauthorized to access this file', 'AUTHORIZATION_ERROR', 403);
    }

    // Generate signed URL
    const file = bucket.file(filePath);
    const [downloadURL] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000 // 1 hour
    });

    res.status(200).json({
      success: true,
      data: {
        ...mediaData,
        downloadURL
      }
    });
  } catch (error) {
      console.error('Get file error:', error);
      if (error instanceof ApplicationError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      } else {
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
export async function listFiles(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.uid;
    const { folder, page = 1, limit = 20 } = req.query;

    if (!userId) {
      throw new ApplicationError('User authentication required', 'AUTHENTICATION_ERROR', 401);
    }

    const db = admin.firestore();
    let query = db.collection('media')
      .where('uploadedBy', '==', userId)
      .where('status', '==', 'active')
      .orderBy('uploadedAt', 'desc');

    if (folder) {
      query = query.where('folder', '==', folder);
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const snapshot = await query.limit(limitNum).offset(offset).get();
    const files = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

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
  } catch (error) {
      console.error('List files error:', error);
      if (error instanceof ApplicationError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      } else {
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
export async function cleanupTempFiles(): Promise<void> {
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
    const deletePromises: Promise<void>[] = [];

    for (const doc of tempFilesQuery.docs) {
      const data = doc.data();
      
      // Delete from storage
      const file = bucket.file(data.filePath);
      deletePromises.push(
        file.delete().catch((err) => {
          console.error('Failed to delete file:', err);
          return undefined;
        }).then(() => undefined)
      );
      
      if (data.thumbnailPath) {
        const thumbnailFile = bucket.file(data.thumbnailPath);
        deletePromises.push(
          thumbnailFile.delete().catch((err) => {
            console.error('Failed to delete thumbnail:', err);
            return undefined;
          }).then(() => undefined)
        );
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
  } catch (error) {
    console.error('Cleanup temp files error:', error);
  }
}