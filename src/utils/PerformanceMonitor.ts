/**
 * Performance Monitoring Utility
 * Tracks repository operations for performance analysis
 */

interface PerformanceMetrics {
  operation: string;
  duration: number;
  memoryDelta: number;
  success: boolean;
  error?: string;
  timestamp: Date;
  query?: string;
  recordCount?: number;
}

interface OperationStats {
  totalCalls: number;
  totalDuration: number;
  averageDuration: number;
  successRate: number;
  memoryUsage: number;
  slowestCall: number;
  fastestCall: number;
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetrics[] = [];
  private static readonly MAX_METRICS = 10000; // Prevent memory leaks
  
  /**
   * Track a repository operation with performance metrics
   */
  static async trackOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: { query?: string; recordCount?: number }
  ): Promise<T> {
    const start = Date.now();
    const startMemory = process.memoryUsage();
    
    try {
      const result = await fn();
      const duration = Date.now() - start;
      const endMemory = process.memoryUsage();
      const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
      
      this.logMetric({
        operation,
        duration,
        memoryDelta,
        success: true,
        timestamp: new Date(),
        query: context?.query,
        recordCount: context?.recordCount
      });
      
      // Log slow operations (> 1 second)
      if (duration > 1000) {
        console.warn(`⚠️  Slow operation detected: ${operation} took ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      const endMemory = process.memoryUsage();
      const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
      
      this.logMetric({
        operation,
        duration,
        memoryDelta,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      });
      
      throw error;
    }
  }
  
  /**
   * Log performance metric
   */
  private static logMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Prevent memory leaks by maintaining max metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS / 2);
    }
    
    // Log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ${metric.operation}: ${metric.duration}ms, ` +
                 `Memory: ${(metric.memoryDelta / 1024 / 1024).toFixed(2)}MB, ` +
                 `Success: ${metric.success}`);
    }
  }
  
  /**
   * Get performance statistics for an operation
   */
  static getOperationStats(operation: string): OperationStats | null {
    const operationMetrics = this.metrics.filter(m => m.operation === operation);
    
    if (operationMetrics.length === 0) {
      return null;
    }
    
    const durations = operationMetrics.map(m => m.duration);
    const successCount = operationMetrics.filter(m => m.success).length;
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const totalMemory = operationMetrics.reduce((sum, m) => sum + m.memoryDelta, 0);
    
    return {
      totalCalls: operationMetrics.length,
      totalDuration,
      averageDuration: totalDuration / operationMetrics.length,
      successRate: (successCount / operationMetrics.length) * 100,
      memoryUsage: totalMemory / operationMetrics.length,
      slowestCall: Math.max(...durations),
      fastestCall: Math.min(...durations)
    };
  }
  
  /**
   * Get all performance statistics
   */
  static getAllStats(): Record<string, OperationStats> {
    const operations = [...new Set(this.metrics.map(m => m.operation))];
    const stats: Record<string, OperationStats> = {};
    
    operations.forEach(operation => {
      const operationStats = this.getOperationStats(operation);
      if (operationStats) {
        stats[operation] = operationStats;
      }
    });
    
    return stats;
  }
  
  /**
   * Get slow operations (> threshold ms)
   */
  static getSlowOperations(threshold = 1000): PerformanceMetrics[] {
    return this.metrics
      .filter(m => m.duration > threshold)
      .sort((a, b) => b.duration - a.duration);
  }
  
  /**
   * Get operations with high memory usage
   */
  static getHighMemoryOperations(thresholdMB = 10): PerformanceMetrics[] {
    const thresholdBytes = thresholdMB * 1024 * 1024;
    return this.metrics
      .filter(m => m.memoryDelta > thresholdBytes)
      .sort((a, b) => b.memoryDelta - a.memoryDelta);
  }
  
  /**
   * Generate performance report
   */
  static generateReport(): string {
    const stats = this.getAllStats();
    const slowOps = this.getSlowOperations();
    const highMemoryOps = this.getHighMemoryOperations();
    
    let report = '\n📊 PERFORMANCE REPORT\n';
    report += '='.repeat(50) + '\n\n';
    
    // Operation statistics
    report += '📈 OPERATION STATISTICS:\n';
    Object.entries(stats).forEach(([operation, stat]) => {
      report += `  ${operation}:\n`;
      report += `    Calls: ${stat.totalCalls}\n`;
      report += `    Avg Duration: ${stat.averageDuration.toFixed(2)}ms\n`;
      report += `    Success Rate: ${stat.successRate.toFixed(1)}%\n`;
      report += `    Avg Memory: ${(stat.memoryUsage / 1024 / 1024).toFixed(2)}MB\n`;
      report += `    Range: ${stat.fastestCall}ms - ${stat.slowestCall}ms\n\n`;
    });
    
    // Slow operations
    if (slowOps.length > 0) {
      report += '🐌 SLOW OPERATIONS (>1s):\n';
      slowOps.slice(0, 10).forEach(op => {
        report += `  ${op.operation}: ${op.duration}ms at ${op.timestamp.toISOString()}\n`;
      });
      report += '\n';
    }
    
    // High memory operations
    if (highMemoryOps.length > 0) {
      report += '💾 HIGH MEMORY OPERATIONS (>10MB):\n';
      highMemoryOps.slice(0, 10).forEach(op => {
        report += `  ${op.operation}: ${(op.memoryDelta / 1024 / 1024).toFixed(2)}MB at ${op.timestamp.toISOString()}\n`;
      });
      report += '\n';
    }
    
    return report;
  }
  
  /**
   * Clear all metrics
   */
  static clear(): void {
    this.metrics = [];
  }
  
  /**
   * Export metrics for external analysis
   */
  static exportMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }
}

// Decorator for automatic performance tracking
export function performanceTrack(operation?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const operationName = operation || `${target.constructor.name}.${propertyName}`;
    
    descriptor.value = async function (...args: any[]) {
      return PerformanceMonitor.trackOperation(
        operationName,
        () => method.apply(this, args)
      );
    };
  };
}

export default PerformanceMonitor;
