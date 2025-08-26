import cloudinary from '@/config/cloudinary';
import { Readable } from 'stream';

export interface CloudinaryUploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

export class CloudinaryService {
  /**
   * Upload user profile image to Cloudinary
   */
  static async uploadProfileImage(
    file: Express.Multer.File,
    userId: string
  ): Promise<CloudinaryUploadResult> {
    try {
      // Fallback: If Cloudinary is not configured or running in demo/dev, return local file URL
      const isDemo = process.env.NODE_ENV === 'demo' || process.env.DEMO === 'true';
      const isCloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
      if (!isCloudinaryConfigured || isDemo) {
        const normalized = file.path.replace(/\\/g, '/');
        const url = normalized.startsWith('/') ? normalized : `/${normalized}`;
        return {
          success: true,
          url,
          publicId: undefined
        };
      }

      // Create a unique folder for user profile images
      const folder = `users/${userId}/profile`;
      
      // Upload to Cloudinary with optimization settings
      const result = await cloudinary.uploader.upload(file.path, {
        folder,
        public_id: `profile_${Date.now()}`,
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ],
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        overwrite: true,
        invalidate: true
      });

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id
      };
    } catch (error) {
      console.error('[CloudinaryService] Upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Upload profile image from buffer (for testing or direct uploads)
   */
  static async uploadProfileImageFromBuffer(
    buffer: Buffer,
    userId: string,
    filename: string
  ): Promise<CloudinaryUploadResult> {
    try {
      const folder = `users/${userId}/profile`;
      
      // Convert buffer to stream for Cloudinary
      const stream = cloudinary.uploader.upload_stream({
        folder,
        public_id: `profile_${Date.now()}`,
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ],
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        overwrite: true,
        invalidate: true
      }, (error, result) => {
        if (error) {
          console.error('[CloudinaryService] Stream upload error:', error);
        }
      });

      // Create readable stream from buffer
      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);
      
      readableStream.pipe(stream);

      return new Promise((resolve) => {
        stream.on('end', () => {
          resolve({
            success: true,
            url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${folder}/profile_${Date.now()}`,
            publicId: `profile_${Date.now()}`
          });
        });
        
        stream.on('error', (error) => {
          resolve({
            success: false,
            error: error.message
          });
        });
      });
    } catch (error) {
      console.error('[CloudinaryService] Buffer upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Delete profile image from Cloudinary
   */
  static async deleteProfileImage(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error('[CloudinaryService] Delete error:', error);
      return false;
    }
  }

  /**
   * Get optimized profile image URL with transformations
   */
  static getOptimizedProfileImageUrl(publicId: string, width = 400, height = 400): string {
    return cloudinary.url(publicId, {
      transformation: [
        { width, height, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });
  }
}

export default CloudinaryService;
