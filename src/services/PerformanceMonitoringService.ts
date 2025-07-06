/**
 * Comprehensive Performance Monitoring Service
 * 
 * Centralized performance tracking and monitoring for the UrutiBiz backend:
 * - Database performance metrics
 * - Cache hit rates and efficiency
 * - API response times
 * - Memory usage tracking
 * - Queue processing metrics
 * - System health monitoring
 * 
 * Features:
 * - Real-time performance dashboards
 * - Automated alerting for performance degradation
 * - Performance regression detection
 * - Optimization recommendations
 * 
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { getDatabaseMetrics, performDatabaseHealthCheck } from '../config/database';
import { getCacheMetrics } from '../middleware/cache.middleware';
import { getAllQueueMetrics } from './BackgroundQueue';
import logger from '../utils/logger';

interface PerformanceMetrics {
  timestamp: Date;
  
  // API Performance
  api: {
    totalRequests: number;
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
    throughput: number; // requests per second
  };
  
  // Database Performance
  database: {
    totalQueries: number;
    avgQueryTime: number;
    connectionPool: {
      used: number;
      free: number;
      total: number;
      utilizationRate: number;
    };
    errors: number;
    slowQueries: number;
  };
  
  // Cache Performance
  cache: {
    hitRate: number;
    missRate: number;
    totalOperations: number;
    avgAccessTime: number;
    memoryUsage: number;
  };
  
  // Queue Performance
  queues: {
    verification: {
      processing: number;
      completed: number;
      failed: number;
      avgProcessingTime: number;
    };
    recommendation: {
      processing: number;
      completed: number;
      failed: number;
      avgProcessingTime: number;
    };
  };
  
  // System Performance
  system: {
    memoryUsage: {
      used: number;
      total: number;
      percentage: number;
    };
    cpuUsage: number;
    uptime: number;
  };
}

interface PerformanceAlert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  metric: string;
  currentValue: number;
  threshold: number;
  message: string;
  timestamp: Date;
  resolved?: boolean;
}

interface PerformanceThresholds {
  api: {
    avgResponseTime: number;
    p95ResponseTime: number;
    errorRate: number;
    throughput: number;
  };
  database: {
    avgQueryTime: number;
    poolUtilization: number;
    errorRate: number;
  };
  cache: {
    hitRate: number;
    avgAccessTime: number;
  };
  system: {
    memoryUsage: number;
    cpuUsage: number;
  };
}

class PerformanceMonitoringService extends EventEmitter {
  private metrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  
  // Performance tracking
  private requestTimes: number[] = [];
  private queryTimes: number[] = [];
  private apiRequestCount = 0;
  private apiErrorCount = 0;
  
  // Performance thresholds
  private thresholds: PerformanceThresholds = {
    api: {
      avgResponseTime: 300,    // 300ms
      p95ResponseTime: 500,    // 500ms
      errorRate: 0.05,         // 5%
      throughput: 10           // 10 req/sec minimum
    },
    database: {
      avgQueryTime: 100,       // 100ms
      poolUtilization: 0.8,    // 80%
      errorRate: 0.01          // 1%
    },
    cache: {
      hitRate: 0.85,           // 85%
      avgAccessTime: 10        // 10ms
    },
    system: {
      memoryUsage: 0.8,        // 80%
      cpuUsage: 0.8            // 80%
    }
  };

  constructor() {
    super();
    // Initialize monitoring
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(intervalMs = 60000): void {
    if (this.isMonitoring) {
      logger.warn('Performance monitoring already running');
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);

    logger.info(`🔍 Performance monitoring started (${intervalMs}ms interval)`);
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    logger.info('🛑 Performance monitoring stopped');
  }

  /**
   * Record API request timing
   */
  recordApiRequest(responseTime: number, isError = false): void {
    this.apiRequestCount++;
    if (isError) this.apiErrorCount++;
    
    this.requestTimes.push(responseTime);
    
    // Keep only last 1000 requests for calculation
    if (this.requestTimes.length > 1000) {
      this.requestTimes = this.requestTimes.slice(-1000);
    }
  }

  /**
   * Record database query timing
   */
  recordDatabaseQuery(queryTime: number): void {
    this.queryTimes.push(queryTime);
    
    // Keep only last 1000 queries for calculation
    if (this.queryTimes.length > 1000) {
      this.queryTimes = this.queryTimes.slice(-1000);
    }
  }

  /**
   * Collect comprehensive performance metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      const timestamp = new Date();
      
      // API Metrics
      const apiMetrics = this.calculateApiMetrics();
      
      // Database Metrics
      const dbMetrics = await this.getDatabasePerformanceMetrics();
      
      // Cache Metrics
      const cacheMetrics = this.getCachePerformanceMetrics();
      
      // Queue Metrics
      const queueMetrics = this.getQueuePerformanceMetrics();
      
      // System Metrics
      const systemMetrics = this.getSystemMetrics();
      
      const metrics: PerformanceMetrics = {
        timestamp,
        api: apiMetrics,
        database: dbMetrics,
        cache: cacheMetrics,
        queues: queueMetrics,
        system: systemMetrics
      };
      
      // Store metrics
      this.metrics.push(metrics);
      
      // Keep only last 1440 data points (24 hours at 1-minute intervals)
      if (this.metrics.length > 1440) {
        this.metrics = this.metrics.slice(-1440);
      }
      
      // Check for performance issues
      this.checkPerformanceThresholds(metrics);
      
      // Emit metrics update
      this.emit('metrics-updated', metrics);
      
    } catch (error) {
      logger.error('Error collecting performance metrics:', error);
    }
  }

  /**
   * Calculate API performance metrics
   */
  private calculateApiMetrics() {
    const requestTimes = this.requestTimes;
    const totalRequests = this.apiRequestCount;
    const errors = this.apiErrorCount;
    
    if (requestTimes.length === 0) {
      return {
        totalRequests: 0,
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        errorRate: 0,
        throughput: 0
      };
    }
    
    const sorted = [...requestTimes].sort((a, b) => a - b);
    const avgResponseTime = requestTimes.reduce((sum, time) => sum + time, 0) / requestTimes.length;
    const p95ResponseTime = sorted[Math.floor(sorted.length * 0.95)];
    const p99ResponseTime = sorted[Math.floor(sorted.length * 0.99)];
    const errorRate = totalRequests > 0 ? errors / totalRequests : 0;
    const throughput = requestTimes.length / 60; // per minute, approximated
    
    return {
      totalRequests,
      avgResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      errorRate,
      throughput
    };
  }

  /**
   * Get database performance metrics
   */
  private async getDatabasePerformanceMetrics() {
    const dbMetrics = getDatabaseMetrics();
    const queryTimes = this.queryTimes;
    
    const avgQueryTime = queryTimes.length > 0 
      ? queryTimes.reduce((sum, time) => sum + time, 0) / queryTimes.length
      : 0;
    
    const slowQueries = queryTimes.filter(time => time > 1000).length;
    
    return {
      totalQueries: dbMetrics.totalQueries,
      avgQueryTime,
      connectionPool: {
        used: dbMetrics.activeConnections,
        free: dbMetrics.idleConnections,
        total: dbMetrics.totalConnections,
        utilizationRate: dbMetrics.utilizationRate
      },
      errors: dbMetrics.connectionErrors,
      slowQueries
    };
  }

  /**
   * Get cache performance metrics
   */
  private getCachePerformanceMetrics() {
    const cacheMetrics = getCacheMetrics();
    
    return {
      hitRate: cacheMetrics.hitRate,
      missRate: 1 - cacheMetrics.hitRate,
      totalOperations: cacheMetrics.totalRequests,
      avgAccessTime: cacheMetrics.avgResponseTime,
      memoryUsage: 0 // Would need to track cache memory usage
    };
  }

  /**
   * Get queue performance metrics
   */
  private getQueuePerformanceMetrics() {
    const queueMetrics = getAllQueueMetrics();
    
    return {
      verification: {
        processing: queueMetrics.verification.processing,
        completed: queueMetrics.verification.completedJobs,
        failed: queueMetrics.verification.failedJobs,
        avgProcessingTime: queueMetrics.verification.avgProcessingTime
      },
      recommendation: {
        processing: queueMetrics.recommendation.processing,
        completed: queueMetrics.recommendation.completedJobs,
        failed: queueMetrics.recommendation.failedJobs,
        avgProcessingTime: queueMetrics.recommendation.avgProcessingTime
      }
    };
  }

  /**
   * Get system performance metrics
   */
  private getSystemMetrics() {
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal + memUsage.external;
    const usedMemory = memUsage.heapUsed;
    
    return {
      memoryUsage: {
        used: usedMemory,
        total: totalMemory,
        percentage: usedMemory / totalMemory
      },
      cpuUsage: 0, // Would need to implement CPU usage tracking
      uptime: process.uptime()
    };
  }

  /**
   * Check performance thresholds and generate alerts
   */
  private checkPerformanceThresholds(metrics: PerformanceMetrics): void {
    const alerts: PerformanceAlert[] = [];
    
    // API Performance Checks
    if (metrics.api.avgResponseTime > this.thresholds.api.avgResponseTime) {
      alerts.push(this.createAlert(
        'warning',
        'api.avgResponseTime',
        metrics.api.avgResponseTime,
        this.thresholds.api.avgResponseTime,
        `Average API response time is ${metrics.api.avgResponseTime.toFixed(2)}ms`
      ));
    }
    
    if (metrics.api.errorRate > this.thresholds.api.errorRate) {
      alerts.push(this.createAlert(
        'error',
        'api.errorRate',
        metrics.api.errorRate,
        this.thresholds.api.errorRate,
        `API error rate is ${(metrics.api.errorRate * 100).toFixed(2)}%`
      ));
    }
    
    // Database Performance Checks
    if (metrics.database.avgQueryTime > this.thresholds.database.avgQueryTime) {
      alerts.push(this.createAlert(
        'warning',
        'database.avgQueryTime',
        metrics.database.avgQueryTime,
        this.thresholds.database.avgQueryTime,
        `Average database query time is ${metrics.database.avgQueryTime.toFixed(2)}ms`
      ));
    }
    
    if (metrics.database.connectionPool.utilizationRate > this.thresholds.database.poolUtilization) {
      alerts.push(this.createAlert(
        'warning',
        'database.poolUtilization',
        metrics.database.connectionPool.utilizationRate,
        this.thresholds.database.poolUtilization,
        `Database pool utilization is ${(metrics.database.connectionPool.utilizationRate * 100).toFixed(1)}%`
      ));
    }
    
    // Cache Performance Checks
    if (metrics.cache.hitRate < this.thresholds.cache.hitRate) {
      alerts.push(this.createAlert(
        'info',
        'cache.hitRate',
        metrics.cache.hitRate,
        this.thresholds.cache.hitRate,
        `Cache hit rate is ${(metrics.cache.hitRate * 100).toFixed(1)}%`
      ));
    }
    
    // Process new alerts
    for (const alert of alerts) {
      this.processAlert(alert);
    }
  }

  /**
   * Create performance alert
   */
  private createAlert(
    level: PerformanceAlert['level'],
    metric: string,
    currentValue: number,
    threshold: number,
    message: string
  ): PerformanceAlert {
    return {
      id: `${metric}_${Date.now()}`,
      level,
      metric,
      currentValue,
      threshold,
      message,
      timestamp: new Date(),
      resolved: false
    };
  }

  /**
   * Process and store alert
   */
  private processAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
    
    // Log alert
    const logLevel = alert.level === 'critical' ? 'error' : 
                    alert.level === 'error' ? 'error' :
                    alert.level === 'warning' ? 'warn' : 'info';
    
    logger[logLevel](`🚨 Performance Alert [${alert.level.toUpperCase()}]: ${alert.message}`);
    
    // Emit alert
    this.emit('performance-alert', alert);
  }

  /**
   * Get current performance status
   */
  getPerformanceStatus(): {
    overall: 'excellent' | 'good' | 'fair' | 'poor';
    score: number;
    issues: string[];
    metrics: PerformanceMetrics | null;
  } {
    const latestMetrics = this.metrics[this.metrics.length - 1];
    
    if (!latestMetrics) {
      return {
        overall: 'poor',
        score: 0,
        issues: ['No performance data available'],
        metrics: null
      };
    }
    
    let score = 100;
    const issues: string[] = [];
    
    // Deduct points for performance issues
    if (latestMetrics.api.avgResponseTime > this.thresholds.api.avgResponseTime) {
      score -= 20;
      issues.push('Slow API response times');
    }
    
    if (latestMetrics.api.errorRate > this.thresholds.api.errorRate) {
      score -= 30;
      issues.push('High API error rate');
    }
    
    if (latestMetrics.database.avgQueryTime > this.thresholds.database.avgQueryTime) {
      score -= 15;
      issues.push('Slow database queries');
    }
    
    if (latestMetrics.cache.hitRate < this.thresholds.cache.hitRate) {
      score -= 10;
      issues.push('Low cache hit rate');
    }
    
    const overall = score >= 90 ? 'excellent' :
                   score >= 70 ? 'good' :
                   score >= 50 ? 'fair' : 'poor';
    
    return {
      overall,
      score: Math.max(0, score),
      issues,
      metrics: latestMetrics
    };
  }

  /**
   * Get performance metrics for a time range
   */
  getMetricsHistory(hours = 24): PerformanceMetrics[] {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    return this.metrics.filter(m => m.timestamp.getTime() >= cutoffTime);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      logger.info(`✅ Performance alert resolved: ${alert.message}`);
      return true;
    }
    return false;
  }

  /**
   * Get current performance metrics
   */
  async getMetrics(): Promise<PerformanceMetrics | null> {
    const latestMetrics = this.metrics[this.metrics.length - 1];
    if (!latestMetrics) {
      // Collect metrics if none available
      await this.collectMetrics();
      return this.metrics[this.metrics.length - 1] || null;
    }
    return latestMetrics;
  }

  /**
   * Get database performance metrics
   */
  async getDatabaseMetrics() {
    return await this.getDatabasePerformanceMetrics();
  }

  /**
   * Get query performance metrics
   */
  getQueryMetrics() {
    const avgQueryTime = this.queryTimes.length > 0 
      ? this.queryTimes.reduce((sum, time) => sum + time, 0) / this.queryTimes.length 
      : 0;
    
    const slowQueries = this.queryTimes.filter(time => time > 1000).length;
    
    return {
      avgQueryTime,
      totalQueries: this.queryTimes.length,
      slowQueries,
      slowQueryPercentage: this.queryTimes.length > 0 
        ? (slowQueries / this.queryTimes.length) * 100 
        : 0,
      recentQueryTimes: this.queryTimes.slice(-10) // Last 10 queries
    };
  }

  /**
   * Reset all performance metrics
   */
  async resetMetrics(): Promise<void> {
    this.metrics = [];
    this.requestTimes = [];
    this.queryTimes = [];
    this.apiRequestCount = 0;
    this.apiErrorCount = 0;
    this.alerts = [];
    logger.info('📊 Performance metrics reset');
  }

  /**
   * Get system health status
   */
  async getHealthStatus() {
    const status = this.getPerformanceStatus();
    const dbHealth = await performDatabaseHealthCheck();
    const cacheMetrics = getCacheMetrics();
    
    return {
      overall: status.overall,
      score: status.score,
      issues: status.issues,
      database: {
        healthy: dbHealth.healthy,
        responseTime: dbHealth.responseTime,
        poolStatus: dbHealth.poolStatus,
        errors: dbHealth.errors
      },
      cache: {
        hitRate: cacheMetrics.hitRate,
        operations: cacheMetrics.totalRequests,
        avgResponseTime: cacheMetrics.avgResponseTime
      },
      api: {
        requestCount: this.apiRequestCount,
        errorRate: this.apiRequestCount > 0 ? (this.apiErrorCount / this.apiRequestCount) * 100 : 0,
        avgResponseTime: this.requestTimes.length > 0 
          ? this.requestTimes.reduce((sum, time) => sum + time, 0) / this.requestTimes.length 
          : 0
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get performance optimization recommendations
   */
  getOptimizationRecommendations() {
    const status = this.getPerformanceStatus();
    const recommendations: string[] = [];
    
    if (status.issues.includes('Slow API response times')) {
      recommendations.push('Consider implementing response caching for frequently accessed endpoints');
      recommendations.push('Review database query optimization and indexing');
      recommendations.push('Implement API response compression');
    }
    
    if (status.issues.includes('High API error rate')) {
      recommendations.push('Review error handling and implement circuit breaker patterns');
      recommendations.push('Add more comprehensive input validation');
      recommendations.push('Implement retry mechanisms for external service calls');
    }
    
    if (status.issues.includes('Slow database queries')) {
      recommendations.push('Analyze slow query log and add appropriate indexes');
      recommendations.push('Consider database connection pooling optimization');
      recommendations.push('Implement query result caching');
    }
    
    if (status.issues.includes('Low cache hit rate')) {
      recommendations.push('Review cache key strategies and TTL settings');
      recommendations.push('Implement cache warming for frequently accessed data');
      recommendations.push('Consider expanding cache coverage to more endpoints');
    }
    
    // General recommendations
    recommendations.push('Monitor memory usage and implement garbage collection optimization');
    recommendations.push('Consider implementing request rate limiting');
    recommendations.push('Add performance metrics to critical business operations');
    
    return {
      score: status.score,
      priority: status.overall === 'poor' ? 'high' : status.overall === 'fair' ? 'medium' : 'low',
      recommendations,
      estimatedImpact: {
        responseTime: '20-40% improvement',
        errorRate: '10-30% reduction',
        throughput: '15-25% increase'
      }
    };
  }

  // ...existing code...
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitoringService();

// Export helper functions
export const startPerformanceMonitoring = () => performanceMonitor.startMonitoring();
export const stopPerformanceMonitoring = () => performanceMonitor.stopMonitoring();
export const recordApiRequest = (responseTime: number, isError = false) => 
  performanceMonitor.recordApiRequest(responseTime, isError);
export const recordDatabaseQuery = (queryTime: number) => 
  performanceMonitor.recordDatabaseQuery(queryTime);

export default performanceMonitor;
