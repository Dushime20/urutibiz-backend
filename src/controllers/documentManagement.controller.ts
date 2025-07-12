import { Request, Response } from 'express';
import { getDatabase } from '@/config/database';
import { ResponseHelper } from '@/utils/response';
import { v4 as uuidv4 } from 'uuid';

export default class DocumentManagementController {
  /**
   * Upload a document
   */
  static async uploadDocument(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { documentType, fileName, fileUrl, fileSize, mimeType } = req.body;
      console.log(documentType,fileName,fileUrl,'docement type,file name,file url')
      
      if (!documentType || !fileName || !fileUrl) {
        return ResponseHelper.error(res, 'Document type, file name, and file URL are required', 400);
      }
      
      const db = getDatabase();
      const documentId = uuidv4();
      
      const [document] = await db('documents').insert({
        id: documentId,
        user_id: userId,
        document_type: documentType,
        file_name: fileName,
        file_url: fileUrl,
        file_size: fileSize || null,
        mime_type: mimeType || null,
        upload_status: 'uploaded',
        created_at: new Date()
      }, '*');
      
      return ResponseHelper.success(res, 'Document uploaded successfully', document);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Get user documents
   */
  static async getUserDocuments(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { documentType } = req.query;
      
      const db = getDatabase();
      let query = db('documents').where('user_id', userId);
      
      if (documentType) {
        query = query.where('document_type', documentType);
      }
      
      const documents = await query.orderBy('created_at', 'desc');
      
      return ResponseHelper.success(res, 'Documents retrieved successfully', documents);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Get document by ID
   */
  static async getDocument(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      
      const db = getDatabase();
      const document = await db('documents')
        .where('id', id)
        .where('user_id', userId)
        .first();
      
      if (!document) {
        return ResponseHelper.error(res, 'Document not found', 404);
      }
      
      return ResponseHelper.success(res, 'Document retrieved successfully', document);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Delete document
   */
  static async deleteDocument(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      
      const db = getDatabase();
      const document = await db('documents')
        .where('id', id)
        .where('user_id', userId)
        .first();
      
      if (!document) {
        return ResponseHelper.error(res, 'Document not found', 404);
      }
      
      await db('documents')
        .where('id', id)
        .where('user_id', userId)
        .del();
      
      return ResponseHelper.success(res, 'Document deleted successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Admin: Get all documents with filters
   */
  static async adminListDocuments(req: Request, res: Response) {
    try {
      const { userId, documentType, uploadStatus, page = 1, limit = 50 } = req.query;
      
      const db = getDatabase();
      let query = db('documents')
        .select('documents.*', 'users.email', 'users.first_name', 'users.last_name')
        .leftJoin('users', 'documents.user_id', 'users.id');
      
      if (userId) query = query.where('documents.user_id', userId);
      if (documentType) query = query.where('documents.document_type', documentType);
      if (uploadStatus) query = query.where('documents.upload_status', uploadStatus);
      
      const offset = (Number(page) - 1) * Number(limit);
      const documents = await query
        .orderBy('documents.created_at', 'desc')
        .limit(Number(limit))
        .offset(offset);
      
      const total = await db('documents').count('* as count').first();
      const totalCount = total?.count || 0;
      
      return ResponseHelper.success(res, 'Documents retrieved successfully', {
        documents,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          totalPages: Math.ceil(Number(totalCount) / Number(limit))
        }
      });
    } catch (error: any) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Admin: Get document by ID
   */
  static async adminGetDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const db = getDatabase();
      const document = await db('documents')
        .select('documents.*', 'users.email', 'users.first_name', 'users.last_name')
        .leftJoin('users', 'documents.user_id', 'users.id')
        .where('documents.id', id)
        .first();
      
      if (!document) {
        return ResponseHelper.error(res, 'Document not found', 404);
      }
      
      return ResponseHelper.success(res, 'Document retrieved successfully', document);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Admin: Update document status
   */
  static async adminUpdateDocumentStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { uploadStatus, notes } = req.body;
      const adminId = (req as any).user.id;
      
      const validStatuses = ['uploaded', 'processing', 'verified', 'rejected', 'expired'];
      if (!validStatuses.includes(uploadStatus)) {
        return ResponseHelper.error(res, 'Invalid upload status', 400);
      }
      
      const db = getDatabase();
      const document = await db('documents').where('id', id).first();
      
      if (!document) {
        return ResponseHelper.error(res, 'Document not found', 404);
      }
      
      const [updatedDocument] = await db('documents')
        .where('id', id)
        .update({
          upload_status: uploadStatus,
          reviewed_by: adminId,
          reviewed_at: new Date(),
          notes: notes || null,
          updated_at: new Date()
        }, '*');
      
      return ResponseHelper.success(res, 'Document status updated successfully', updatedDocument);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Get document statistics
   */
  static async getDocumentStats(_req: Request, res: Response) {
    try {
      const db = getDatabase();
      
      const stats = await db('documents')
        .select('upload_status')
        .count('* as count')
        .groupBy('upload_status');
      
      const typeStats = await db('documents')
        .select('document_type')
        .count('* as count')
        .groupBy('document_type');
      
      const recentUploads = await db('documents')
        .where('created_at', '>=', db.raw("datetime('now', '-7 days')"))
        .count('* as count')
        .first();
      
      return ResponseHelper.success(res, 'Document statistics retrieved successfully', {
        statusBreakdown: stats.reduce((acc: any, stat: any) => {
          acc[stat.upload_status] = stat.count;
          return acc;
        }, {}),
        typeBreakdown: typeStats.reduce((acc: any, stat: any) => {
          acc[stat.document_type] = stat.count;
          return acc;
        }, {}),
        recentUploads: recentUploads?.count || 0
      });
    } catch (error: any) {
      return ResponseHelper.error(res, error.message);
    }
  }
}
