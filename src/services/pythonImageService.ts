/**
 * Python Image Service Client
 * Calls the Python microservice for CLIP-based feature extraction
 * Industry-standard approach used by major e-commerce platforms
 * 
 * Features:
 * - Retry logic with exponential backoff
 * - Circuit breaker pattern
 * - Periodic health checks
 * - Automatic reconnection
 * - Request/response logging
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import FormData from 'form-data';
import http from 'http';
import https from 'https';
import logger from '../utils/logger';

interface PythonServiceConfig {
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  healthCheckInterval: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
}

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
}

class PythonImageService {
  private client: AxiosInstance;
  private config: PythonServiceConfig;
  private isAvailable: boolean = false;
  private circuitBreaker: CircuitBreakerState;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Get Python service URL from environment or use default
    const pythonServiceUrl = process.env.PYTHON_IMAGE_SERVICE_URL || 'http://localhost:8001';
    this.config = {
      baseUrl: pythonServiceUrl,
      timeout: 30000, // 30 seconds timeout
      maxRetries: 3,
      retryDelay: 1000, // Start with 1 second
      healthCheckInterval: 60000, // Check health every 60 seconds
      circuitBreakerThreshold: 5, // Open circuit after 5 failures
      circuitBreakerTimeout: 30000 // Try again after 30 seconds
    };

    this.circuitBreaker = {
      failures: 0,
      lastFailureTime: 0,
      state: 'closed'
    };

    // Optimize: Use HTTP keep-alive and connection pooling for better performance
    // Create keep-alive agents for connection pooling
    const httpAgent = new http.Agent({
      keepAlive: true,
      keepAliveMsecs: 30000,
      maxSockets: 50, // Max concurrent connections
      maxFreeSockets: 10 // Keep connections alive for reuse
    });
    
    const httpsAgent = new https.Agent({
      keepAlive: true,
      keepAliveMsecs: 30000,
      maxSockets: 50,
      maxFreeSockets: 10
    });

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'multipart/form-data',
        'Connection': 'keep-alive' // Enable HTTP keep-alive
      },
      httpAgent: this.config.baseUrl.startsWith('https') ? httpsAgent : httpAgent,
      httpsAgent: httpsAgent,
      maxRedirects: 3,
      validateStatus: (status) => status < 500 // Don't throw on 4xx errors
    });

    // Test connection on initialization
    this.testConnection();

    // Start periodic health checks
    this.startHealthChecks();
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      if (this.circuitBreaker.state === 'open') {
        // Try to recover from open state
        await this.testConnection();
      } else if (!this.isAvailable) {
        // Try to reconnect if service was unavailable
        await this.testConnection();
      }
    }, this.config.healthCheckInterval);

    // Cleanup on process exit
    process.on('SIGTERM', () => {
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }
    });
  }

  /**
   * Check circuit breaker state
   */
  private checkCircuitBreaker(): boolean {
    const now = Date.now();

    if (this.circuitBreaker.state === 'open') {
      // Check if timeout has passed
      if (now - this.circuitBreaker.lastFailureTime > this.config.circuitBreakerTimeout) {
        this.circuitBreaker.state = 'half-open';
        logger.info('🔄 Circuit breaker: Moving to half-open state (testing recovery)');
        return true;
      }
      return false; // Circuit is open, reject request
    }

    return true; // Circuit is closed or half-open, allow request
  }

  /**
   * Record success - reset circuit breaker
   */
  private recordSuccess(): void {
    if (this.circuitBreaker.state === 'half-open') {
      logger.info('✅ Circuit breaker: Service recovered, closing circuit');
    }
    this.circuitBreaker.state = 'closed';
    this.circuitBreaker.failures = 0;
  }

  /**
   * Record failure - update circuit breaker
   */
  private recordFailure(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();

    if (this.circuitBreaker.failures >= this.config.circuitBreakerThreshold) {
      this.circuitBreaker.state = 'open';
      logger.warn(`⚠️ Circuit breaker: Opening circuit after ${this.circuitBreaker.failures} failures`);
    }
  }

  /**
   * Retry with exponential backoff
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    retries: number = this.config.maxRetries
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on certain errors
        if (error instanceof AxiosError) {
          if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
            // Client errors (4xx) - don't retry
            throw error;
          }
        }

        if (attempt < retries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          logger.warn(`⚠️ Retry attempt ${attempt + 1}/${retries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Operation failed after retries');
  }

  /**
   * Test if Python service is available
   */
  private async testConnection(): Promise<void> {
    if (!this.checkCircuitBreaker()) {
      this.isAvailable = false;
      logger.debug('Circuit breaker is open, skipping health check');
      return;
    }

    try {
      const response = await this.client.get('/health', { timeout: 5000 });
      if (response.data?.status === 'healthy' || response.data?.status === 'ok') {
        this.isAvailable = true;
        this.recordSuccess();
        logger.info('✅ Python image service is available');
        logger.info(`   - URL: ${this.config.baseUrl}`);
        logger.info(`   - Model loaded: ${response.data.model_loaded || false}`);
        logger.info(`   - Device: ${response.data.device || 'unknown'}`);
      } else {
        this.isAvailable = false;
        this.recordFailure();
        logger.warn('⚠️ Python image service health check failed');
        logger.warn(`   - Response status: ${response.data?.status || 'unknown'}`);
      }
    } catch (error) {
      this.isAvailable = false;
      this.recordFailure();
      
      // Extract detailed error information
      let errorMsg = 'Unknown error';
      let errorCode = '';
      let errorDetails = '';
      
      if (error instanceof AxiosError) {
        if (error.code === 'ECONNREFUSED') {
          errorMsg = 'Connection refused';
          errorDetails = `The Python service at ${this.config.baseUrl} is not running. Start it with: npm run python:service`;
        } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
          errorMsg = 'Connection timeout';
          errorDetails = 'The Python service did not respond within 5 seconds';
        } else if (error.code === 'ENOTFOUND') {
          errorMsg = 'Host not found';
          errorDetails = `Cannot resolve hostname: ${this.config.baseUrl}`;
        } else {
          errorMsg = error.message || String(error);
          errorCode = error.code || '';
          errorDetails = error.response?.data ? JSON.stringify(error.response.data) : '';
        }
      } else if (error instanceof Error) {
        errorMsg = error.message;
        errorDetails = error.stack || '';
      } else {
        errorMsg = String(error);
      }
      
      logger.warn(`⚠️ Python image service not available: ${errorMsg}`);
      if (errorCode) {
        logger.warn(`   - Error code: ${errorCode}`);
      }
      if (errorDetails && errorDetails.length < 200) {
        logger.warn(`   - Details: ${errorDetails}`);
      }
      
      // Provide helpful instructions
      if (errorMsg.includes('Connection refused') || errorCode === 'ECONNREFUSED') {
        logger.warn('   💡 To start the Python service:');
        logger.warn('      1. cd python-service');
        logger.warn('      2. python main.py');
        logger.warn('      Or use: npm run python:service');
      }
      
      if (this.circuitBreaker.state === 'closed') {
        logger.warn('   - Image search will fall back to alternative methods (TensorFlow.js/ONNX)');
      }
    }
  }

  /**
   * Extract features from image buffer using Python CLIP service
   * Implements retry logic and circuit breaker
   */
  async extractFeaturesFromBuffer(imageBuffer: Buffer): Promise<number[]> {
    // Check circuit breaker
    if (!this.checkCircuitBreaker()) {
      throw new Error('Python image service circuit breaker is open. Service unavailable.');
    }

    // If service was marked unavailable, try to reconnect
    if (!this.isAvailable) {
      logger.info('🔄 Attempting to reconnect to Python service...');
      await this.testConnection();
      if (!this.isAvailable) {
        throw new Error('Python image service is not available');
      }
    }

    return await this.retryWithBackoff(async () => {
      const requestStartTime = Date.now();
      
      try {
        const formData = new FormData();
        formData.append('file', imageBuffer, {
          filename: 'image.jpg',
          contentType: 'image/jpeg'
        });

        logger.debug(`📤 Sending image to Python service (${imageBuffer.length} bytes)`);
        
        const response = await this.client.post('/extract-features', formData, {
          headers: formData.getHeaders()
        });

        const requestTime = Date.now() - requestStartTime;
        logger.debug(`📥 Python service response received in ${requestTime}ms`);

        // Validate response format
        if (!response.data) {
          throw new Error('Empty response from Python service');
        }

        // Handle both response formats: {success: true, embedding: [...]} and {embedding: [...]}
        let embedding: number[] | undefined;
        
        if (response.data.success && response.data.embedding) {
          embedding = response.data.embedding;
        } else if (response.data.embedding && Array.isArray(response.data.embedding)) {
          embedding = response.data.embedding;
        } else if (response.data.features && Array.isArray(response.data.features)) {
          // Alternative format: {features: [...]}
          embedding = response.data.features;
        }

        if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
          throw new Error('Invalid response format: embedding array missing or empty');
        }

        // Validate embedding dimensions (CLIP should return 512 dimensions)
        if (embedding.length !== 512) {
          logger.warn(`⚠️ Unexpected embedding dimension: ${embedding.length} (expected 512)`);
        }

        this.recordSuccess();
        logger.info(`✅ CLIP feature extraction: ${embedding.length} dimensions (${requestTime}ms)`);
        
        return embedding;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error(`❌ Python service feature extraction failed: ${errorMsg}`);
        
        // Record failure for circuit breaker
        this.recordFailure();
        
        // Mark service as unavailable if it's a connection error
        if (errorMsg.includes('ECONNREFUSED') || 
            errorMsg.includes('timeout') || 
            errorMsg.includes('ECONNRESET') ||
            (error instanceof AxiosError && !error.response)) {
          this.isAvailable = false;
        }
        
        throw new Error(`Python service feature extraction failed: ${errorMsg}`);
      }
    });
  }

  /**
   * Extract features from image URL
   */
  async extractFeaturesFromUrl(imageUrl: string): Promise<number[]> {
    try {
      // Download image first
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
        maxContentLength: 10 * 1024 * 1024
      });
      
      const imageBuffer = Buffer.from(imageResponse.data);
      return await this.extractFeaturesFromBuffer(imageBuffer);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to extract features from URL: ${errorMsg}`);
    }
  }

  /**
   * Check if Python service is available
   */
  isServiceAvailable(): boolean {
    return this.isAvailable && this.circuitBreaker.state !== 'open';
  }

  /**
   * Re-test connection to Python service
   */
  async reconnect(): Promise<boolean> {
    await this.testConnection();
    return this.isAvailable;
  }

  /**
   * Public health check method (can be called from other services)
   */
  async checkHealth(): Promise<boolean> {
    await this.testConnection();
    return this.isAvailable;
  }

  /**
   * Get service status for monitoring
   */
  getStatus(): {
    available: boolean;
    circuitBreakerState: string;
    failures: number;
    url: string;
  } {
    return {
      available: this.isAvailable,
      circuitBreakerState: this.circuitBreaker.state,
      failures: this.circuitBreaker.failures,
      url: this.config.baseUrl
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

export default new PythonImageService();

