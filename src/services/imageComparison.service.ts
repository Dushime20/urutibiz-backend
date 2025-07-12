import { GoogleAuth } from 'google-auth-library';
import vision from '@google-cloud/vision';
import axios from 'axios';
import sharp from 'sharp';
import * as AWS from 'aws-sdk';

// AI Image Comparison Service
export class ImageComparisonService {
  private visionClient: any;
  private rekognitionClient: any;
  
  constructor() {
    // Initialize Google Vision client if credentials are available
    console.log(process.env.GOOGLE_APPLICATION_CREDENTIALS,'jason of google')
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      try {
        this.visionClient = new vision.ImageAnnotatorClient({
          keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        });
        console.log('✅ Google Vision client initialized');
      } catch (error: any) {
        console.warn('⚠️ Google Vision client initialization failed:', error?.message || 'Unknown error');
        this.visionClient = null;
      }
    } else {
      console.log('ℹ️ Google Vision credentials not configured');
      this.visionClient = null;
    }

    // Initialize AWS Rekognition client if credentials are available
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      try {
        this.rekognitionClient = new AWS.Rekognition({
          region: process.env.AWS_REGION || 'us-east-1',
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        });
        console.log('✅ AWS Rekognition client initialized');
      } catch (error: any) {
        console.warn('⚠️ AWS Rekognition client initialization failed:', error?.message || 'Unknown error');
        this.rekognitionClient = null;
      }
    } else {
      console.log('ℹ️ AWS Rekognition credentials not configured');
      this.rekognitionClient = null;
    }
  }

  // Method 1: Using Google Vision API for face comparison
  async compareImagesWithGoogleVision(imageUrl1: string, imageUrl2: string): Promise<{
    similarity: number;
    confidence: number;
    isMatch: boolean;
  }> {
    if (!this.visionClient) {
      throw new Error('Google Vision client not available');
    }

    try {
      console.log('🔍 Starting Google Vision face comparison...');
      
      // Download images as buffers
      const [image1Buffer, image2Buffer] = await Promise.all([
        this.downloadImageAsBuffer(imageUrl1),
        this.downloadImageAsBuffer(imageUrl2)
      ]);

      // Detect faces in both images
      const [result1] = await this.visionClient.faceDetection({
        image: { content: image1Buffer.toString('base64') }
      });
      const [result2] = await this.visionClient.faceDetection({
        image: { content: image2Buffer.toString('base64') }
      });
      
      const faces1 = result1.faceAnnotations;
      const faces2 = result2.faceAnnotations;
      
      if (!faces1 || faces1.length === 0 || !faces2 || faces2.length === 0) {
        console.log('⚠️ No faces detected in one or both images');
        return { similarity: 0, confidence: 0, isMatch: false };
      }
      
      // Compare face landmarks and features
      const face1 = faces1[0];
      const face2 = faces2[0];
      
      // Calculate similarity based on facial landmarks
      const similarity = this.calculateFaceSimilarity(face1, face2);
      const confidence = Math.min(face1.detectionConfidence, face2.detectionConfidence);
      
      console.log(`📊 Google Vision - Similarity: ${similarity.toFixed(3)}, Confidence: ${confidence.toFixed(3)}`);
      
      return {
        similarity,
        confidence,
        isMatch: similarity > 0.7 && confidence > 0.8
      };
    } catch (error: any) {
      console.error('Google Vision comparison error:', error?.message || error);
      throw new Error('Failed to compare images with Google Vision');
    }
  }

  // Method 2: Using AWS Rekognition (alternative)
  async compareImagesWithAWSRekognition(imageUrl1: string, imageUrl2: string): Promise<{
    similarity: number;
    confidence: number;
    isMatch: boolean;
  }> {
    if (!this.rekognitionClient) {
      throw new Error('AWS Rekognition client not available');
    }

    try {
      console.log('🔍 Starting AWS Rekognition face comparison...');
      
      // Download images as buffers
      const [image1Buffer, image2Buffer] = await Promise.all([
        this.downloadImageAsBuffer(imageUrl1),
        this.downloadImageAsBuffer(imageUrl2)
      ]);

      const params = {
        SourceImage: { Bytes: image1Buffer },
        TargetImage: { Bytes: image2Buffer },
        SimilarityThreshold: 70
      };

      const result = await this.rekognitionClient.compareFaces(params).promise();
      
      if (result.FaceMatches && result.FaceMatches.length > 0) {
        const match = result.FaceMatches[0];
        const similarity = match.Similarity / 100;
        const confidence = match.Face.Confidence / 100;
        
        console.log(`📊 AWS Rekognition - Similarity: ${similarity.toFixed(3)}, Confidence: ${confidence.toFixed(3)}`);
        
        return {
          similarity,
          confidence,
          isMatch: match.Similarity > 70
        };
      }
      
      console.log('⚠️ No matching faces found in AWS Rekognition');
      return { similarity: 0, confidence: 0, isMatch: false };
    } catch (error: any) {
      console.error('AWS Rekognition comparison error:', error?.message || error);
      throw new Error('Failed to compare images with AWS Rekognition');
    }
  }

  // Method 3: Using OpenCV-like comparison (simpler approach)
  async compareImagesBasic(imageUrl1: string, imageUrl2: string): Promise<{
    similarity: number;
    confidence: number;
    isMatch: boolean;
  }> {
    try {
      console.log('🔍 Starting basic image comparison...');
      
      // Download images as buffers
      const [buffer1, buffer2] = await Promise.all([
        this.downloadImageAsBuffer(imageUrl1),
        this.downloadImageAsBuffer(imageUrl2)
      ]);

      // Resize images to same dimensions for comparison
      const resizedImage1 = await sharp(buffer1).resize(256, 256).raw().toBuffer();
      const resizedImage2 = await sharp(buffer2).resize(256, 256).raw().toBuffer();

      // Simple pixel-based comparison (not ideal for faces, but works as fallback)
      const similarity = this.calculatePixelSimilarity(resizedImage1, resizedImage2);
      
      console.log(`📊 Basic comparison - Similarity: ${similarity.toFixed(3)}`);
      
      return {
        similarity,
        confidence: 0.8, // Static confidence for basic method
        isMatch: similarity > 0.6
      };
    } catch (error: any) {
      console.error('Basic comparison error:', error?.message || error);
      throw new Error('Failed to compare images with basic method');
    }
  }

  private calculateFaceSimilarity(face1: any, face2: any): number {
    // Compare facial landmarks
    const landmarks1 = face1.landmarks || [];
    const landmarks2 = face2.landmarks || [];
    
    if (landmarks1.length === 0 || landmarks2.length === 0) {
      return 0;
    }
    
    // Calculate distance between corresponding landmarks
    let totalDistance = 0;
    let comparedPoints = 0;
    
    for (let i = 0; i < Math.min(landmarks1.length, landmarks2.length); i++) {
      const point1 = landmarks1[i].position;
      const point2 = landmarks2[i].position;
      
      if (point1 && point2) {
        const distance = Math.sqrt(
          Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2)
        );
        totalDistance += distance;
        comparedPoints++;
      }
    }
    
    if (comparedPoints === 0) return 0;
    
    const avgDistance = totalDistance / comparedPoints;
    // Convert distance to similarity (inverse relationship)
    return Math.max(0, 1 - (avgDistance / 1000));
  }

  private calculatePixelSimilarity(buffer1: Buffer, buffer2: Buffer): number {
    if (buffer1.length !== buffer2.length) return 0;
    
    let differences = 0;
    for (let i = 0; i < buffer1.length; i++) {
      differences += Math.abs(buffer1[i] - buffer2[i]);
    }
    
    const maxDifference = buffer1.length * 255;
    return 1 - (differences / maxDifference);
  }

  private async downloadImageAsBuffer(url: string): Promise<Buffer> {
    try {
      const response = await axios.get(url, { 
        responseType: 'arraybuffer',
        timeout: 10000 // 10 second timeout
      });
      return Buffer.from(response.data);
    } catch (error: any) {
      console.error(`Failed to download image from ${url}:`, error?.message || 'Unknown error');
      throw new Error(`Failed to download image: ${error?.message || 'Unknown error'}`);
    }
  }

  // Main comparison method that tries multiple approaches
  async compareImages(documentImageUrl: string, selfieImageUrl: string): Promise<{
    similarity: number;
    confidence: number;
    isMatch: boolean;
    method: string;
    details: any;
  }> {
    const results = [];
    
    // Try Google Vision first (most accurate for faces)
    if (this.visionClient) {
      try {
        const googleResult = await this.compareImagesWithGoogleVision(documentImageUrl, selfieImageUrl);
        results.push({ ...googleResult, method: 'google_vision' });
      } catch (error) {
        console.log('Google Vision not available, trying alternatives');
      }
    }
    
    // Try AWS Rekognition as fallback
    if (this.rekognitionClient) {
      try {
        const awsResult = await this.compareImagesWithAWSRekognition(documentImageUrl, selfieImageUrl);
        results.push({ ...awsResult, method: 'aws_rekognition' });
      } catch (error) {
        console.log('AWS Rekognition not available, trying basic method');
      }
    }
    
    // Basic comparison as last resort
    try {
      const basicResult = await this.compareImagesBasic(documentImageUrl, selfieImageUrl);
      results.push({ ...basicResult, method: 'basic_comparison' });
    } catch (error) {
      console.error('All comparison methods failed:', error);
      throw new Error('Unable to compare images with any available method');
    }
    
    // Return the best result (highest confidence)
    const bestResult = results.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
    
    console.log(`🏆 Best comparison result: ${bestResult.method} - Similarity: ${bestResult.similarity.toFixed(3)}, Confidence: ${bestResult.confidence.toFixed(3)}`);
    
    return {
      ...bestResult,
      details: results
    };
  }
}

// Export singleton instance
export const imageComparisonService = new ImageComparisonService(); 