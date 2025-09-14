/**
 * Analytics Configuration Types
 * Comprehensive configuration for tracking and analytics settings
 */

export interface AnalyticsConfig {
  // Core Analytics Settings
  core: {
    enabled: boolean;
    trackingLevel: 'minimal' | 'standard' | 'detailed' | 'comprehensive';
    dataCollectionMode: 'real-time' | 'batch' | 'hybrid';
    sessionTracking: boolean;
    userJourneyTracking: boolean;
    conversionTracking: boolean;
    performanceMonitoring: boolean;
    errorTracking: boolean;
  };

  // Privacy & Compliance Settings
  privacy: {
    gdprCompliant: boolean;
    dataAnonymization: boolean;
    ipAddressMasking: boolean;
    userConsentRequired: boolean;
    cookieConsent: boolean;
    dataMinimization: boolean;
    rightToErasure: boolean;
    dataPortability: boolean;
  };

  // Data Retention Settings
  retention: {
    userSessions: number; // days
    pageViews: number; // days
    userInteractions: number; // days
    conversionEvents: number; // days
    performanceData: number; // days
    errorLogs: number; // days
    auditLogs: number; // days
    rawAnalyticsData: number; // days
    aggregatedData: number; // days
    archivedData: number; // days
  };

  // Real-time Analytics Settings
  realTime: {
    enabled: boolean;
    refreshInterval: number; // seconds
    webSocketEnabled: boolean;
    liveDashboard: boolean;
    alertThresholds: {
      highTraffic: number;
      lowConversion: number;
      highErrorRate: number;
      slowResponseTime: number;
    };
    maxConnections: number;
    dataBufferSize: number;
  };

  // Third-party Integrations
  integrations: {
    googleAnalytics: {
      enabled: boolean;
      trackingId: string;
      measurementId: string;
      enhancedEcommerce: boolean;
      customDimensions: string[];
      goals: Array<{
        id: string;
        name: string;
        type: string;
        value: number;
      }>;
    };
    facebookPixel: {
      enabled: boolean;
      pixelId: string;
      events: string[];
      customAudiences: boolean;
    };
    customAnalytics: {
      enabled: boolean;
      endpoints: Array<{
        name: string;
        url: string;
        method: string;
        headers: Record<string, string>;
        events: string[];
      }>;
    };
  };

  // Reporting & Export Configuration
  reporting: {
    automatedReports: {
      enabled: boolean;
      frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
      recipients: string[];
      format: 'pdf' | 'excel' | 'csv' | 'json';
    };
    dashboard: {
      defaultDateRange: '7d' | '30d' | '90d' | '1y' | 'custom';
      refreshInterval: number; // seconds
      maxWidgets: number;
    };
    export: {
      enabled: boolean;
      formats: ('csv' | 'excel' | 'pdf' | 'json')[];
      maxRecords: number;
      compression: boolean;
      encryption: boolean;
    };
  };

  // Performance & Storage Settings
  performance: {
    dataProcessing: {
      batchSize: number;
      processingInterval: number; // minutes
      parallelWorkers: number;
    };
    storage: {
      compressionEnabled: boolean;
      indexingStrategy: 'full' | 'partial' | 'none';
      archiveThreshold: number; // days
    };
    caching: {
      enabled: boolean;
      ttl: number; // seconds
      maxSize: number; // MB
      strategy: 'lru' | 'lfu' | 'fifo';
    };
  };

  // Security & Access Control
  security: {
    accessControl: {
      roleBasedAccess: boolean;
      allowedRoles: string[];
      ipWhitelist: string[];
      apiRateLimiting: {
        enabled: boolean;
        requestsPerMinute: number;
      };
    };
    dataProtection: {
      encryptionAtRest: boolean;
      encryptionInTransit: boolean;
      auditLogging: boolean;
      accessLogging: boolean;
    };
  };

  // Alerting & Notifications
  alerting: {
    enabled: boolean;
    channels: {
      email: {
        enabled: boolean;
        recipients: string[];
      };
      slack: {
        enabled: boolean;
        webhookUrl: string;
        channels: string[];
      };
    };
    rules: Array<{
      id: string;
      name: string;
      condition: string;
      threshold: number;
      operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
      metric: string;
      timeWindow: number; // minutes
      severity: 'low' | 'medium' | 'high' | 'critical';
      enabled: boolean;
    }>;
  };

  // System Configuration
  system: {
    timezone: string;
    currency: string;
    language: string;
    dateFormat: string;
    maintenanceMode: boolean;
    debugMode: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
  };
}

export interface AnalyticsSettingsUpdate {
  core?: Partial<AnalyticsConfig['core']>;
  privacy?: Partial<AnalyticsConfig['privacy']>;
  retention?: Partial<AnalyticsConfig['retention']>;
  realTime?: Partial<AnalyticsConfig['realTime']>;
  integrations?: Partial<AnalyticsConfig['integrations']>;
  reporting?: Partial<AnalyticsConfig['reporting']>;
  performance?: Partial<AnalyticsConfig['performance']>;
  security?: Partial<AnalyticsConfig['security']>;
  alerting?: Partial<AnalyticsConfig['alerting']>;
  system?: Partial<AnalyticsConfig['system']>;
}

export interface AnalyticsConfigResponse {
  success: boolean;
  message: string;
  data: {
    config: AnalyticsConfig;
    lastUpdated: Date;
    updatedBy: string;
    version: string;
  };
}

export interface AnalyticsHealthCheck {
  status: 'healthy' | 'warning' | 'error';
  checks: {
    dataCollection: boolean;
    realTimeProcessing: boolean;
    thirdPartyIntegrations: boolean;
    storage: boolean;
    caching: boolean;
    alerting: boolean;
  };
  metrics: {
    dataProcessingLatency: number;
    storageUtilization: number;
    cacheHitRate: number;
    errorRate: number;
    throughput: number;
  };
  lastChecked: Date;
}

export interface AnalyticsExportRequest {
  type: 'data' | 'report' | 'config';
  format: 'csv' | 'excel' | 'pdf' | 'json';
  dateRange: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, any>;
  metrics?: string[];
  compression?: boolean;
  encryption?: boolean;
}

export interface AnalyticsExportResponse {
  success: boolean;
  message: string;
  data: {
    exportId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    downloadUrl?: string;
    expiresAt: Date;
    fileSize?: number;
    recordCount?: number;
  };
}
