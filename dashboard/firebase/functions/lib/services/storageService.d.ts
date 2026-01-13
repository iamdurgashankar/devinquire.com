/**
 * Firebase Storage Service
 * Handles file upload, deletion, image processing, and storage management
 */
import { Request, Response } from 'express';
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
/**
 * Upload file to Firebase Storage
 */
export declare function uploadFile(req: Request, res: Response): Promise<void>;
/**
 * Delete file from Firebase Storage
 */
export declare function deleteFile(req: Request, res: Response): Promise<void>;
/**
 * Get file metadata and signed URL
 */
export declare function getFile(req: Request, res: Response): Promise<void>;
/**
 * List user files with pagination
 */
export declare function listFiles(req: Request, res: Response): Promise<void>;
/**
 * Clean up temporary files (scheduled function)
 */
export declare function cleanupTempFiles(): Promise<void>;
//# sourceMappingURL=storageService.d.ts.map