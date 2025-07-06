/**
 * AI Model Metrics Repository
 * Handles database operations for AI model performance metrics using Knex
 */

import { Knex } from 'knex';
import {
  AIModelMetric,
  CreateAIModelMetricRequest,
  UpdateAIModelMetricRequest,
  AIModelMetricFilters,
  ModelPerformanceAnalytics,
  AIModelMetricError
} from '../types/aiRecommendation.types';

export class AIModelMetricRepository {
  constructor(private db: Knex) {}

  /**
   * Create a new AI model metric
   */
  async create(metric: CreateAIModelMetricRequest): Promise<AIModelMetric> {
    try {
      const [created] = await this.db('ai_model_metrics')
        .insert({
          model_name: metric.modelName,
          model_version: metric.modelVersion,
          metric_name: metric.metricName,
          metric_value: metric.metricValue,
          data_date: metric.dataDate
        })
        .returning('*');

      return this.mapRowToAIModelMetric(created);
    } catch (error) {
      console.error('Error creating AI model metric:', error);
      throw new AIModelMetricError('Failed to create AI model metric');
    }
  }

  /**
   * Get AI model metric by ID
   */
  async findById(id: string): Promise<AIModelMetric | null> {
    try {
      const result = await this.db('ai_model_metrics')
        .where('id', id)
        .first();

      return result ? this.mapRowToAIModelMetric(result) : null;
    } catch (error) {
      console.error('Error finding AI model metric by ID:', error);
      throw new AIModelMetricError('Failed to find AI model metric');
    }
  }

  /**
   * Get AI model metrics with filters
   */
  async findMany(filters: AIModelMetricFilters = {}): Promise<{
    metrics: AIModelMetric[];
    total: number;
  }> {
    try {
      let query = this.db('ai_model_metrics');

      // Apply filters
      if (filters.modelName) {
        query = query.where('model_name', filters.modelName);
      }

      if (filters.modelVersion) {
        query = query.where('model_version', filters.modelVersion);
      }

      if (filters.metricName) {
        query = query.where('metric_name', filters.metricName);
      }

      if (filters.minValue !== undefined) {
        query = query.where('metric_value', '>=', filters.minValue);
      }

      if (filters.maxValue !== undefined) {
        query = query.where('metric_value', '<=', filters.maxValue);
      }

      if (filters.dataDateAfter) {
        query = query.where('data_date', '>=', filters.dataDateAfter);
      }

      if (filters.dataDateBefore) {
        query = query.where('data_date', '<=', filters.dataDateBefore);
      }

      if (filters.createdAfter) {
        query = query.where('created_at', '>=', filters.createdAfter);
      }

      if (filters.createdBefore) {
        query = query.where('created_at', '<=', filters.createdBefore);
      }

      // Get total count
      const countQuery = query.clone();
      const [{ count }] = await countQuery.count('* as count');
      const total = parseInt(count as string);

      // Apply sorting and pagination
      const sortBy = filters.sortBy || 'created_at';
      const sortOrder = filters.sortOrder || 'desc';
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;

      const results = await query
        .orderBy(sortBy, sortOrder)
        .limit(limit)
        .offset(offset);

      const metrics = results.map(row => this.mapRowToAIModelMetric(row));

      return { metrics, total };
    } catch (error) {
      console.error('Error finding AI model metrics:', error);
      throw new AIModelMetricError('Failed to find AI model metrics');
    }
  }

  /**
   * Update AI model metric
   */
  async update(id: string, updates: UpdateAIModelMetricRequest): Promise<AIModelMetric | null> {
    try {
      const updateData: any = {};

      if (updates.metricValue !== undefined) {
        updateData.metric_value = updates.metricValue;
      }

      if (updates.dataDate !== undefined) {
        updateData.data_date = updates.dataDate;
      }

      if (Object.keys(updateData).length === 0) {
        throw new AIModelMetricError('No valid fields to update');
      }

      updateData.updated_at = new Date();

      const [updated] = await this.db('ai_model_metrics')
        .where('id', id)
        .update(updateData)
        .returning('*');

      return updated ? this.mapRowToAIModelMetric(updated) : null;
    } catch (error) {
      console.error('Error updating AI model metric:', error);
      throw new AIModelMetricError('Failed to update AI model metric');
    }
  }

  /**
   * Delete AI model metric
   */
  async delete(id: string): Promise<boolean> {
    try {
      const deletedCount = await this.db('ai_model_metrics')
        .where('id', id)
        .del();

      return deletedCount > 0;
    } catch (error) {
      console.error('Error deleting AI model metric:', error);
      throw new AIModelMetricError('Failed to delete AI model metric');
    }
  }

  /**
   * Get latest metrics for a model
   */
  async getLatestMetrics(modelName: string, modelVersion?: string): Promise<AIModelMetric[]> {
    try {
      // Use window function to get the latest metric for each metric_name
      const subquery = this.db('ai_model_metrics')
        .select('*')
        .select(this.db.raw('ROW_NUMBER() OVER (PARTITION BY metric_name ORDER BY data_date DESC, created_at DESC) as rn'))
        .where('model_name', modelName);

      if (modelVersion) {
        subquery.where('model_version', modelVersion);
      }

      const results = await this.db
        .with('ranked_metrics', subquery)
        .select('*')
        .from('ranked_metrics')
        .where('rn', 1);

      return results.map(row => this.mapRowToAIModelMetric(row));
    } catch (error) {
      console.error('Error getting latest metrics:', error);
      throw new AIModelMetricError('Failed to get latest metrics');
    }
  }

  /**
   * Get metric trends over time
   */
  async getMetricTrends(
    modelName: string,
    metricName: string,
    modelVersion?: string,
    daysBack: number = 30
  ): Promise<Array<{ date: Date; value: number }>> {
    try {
      const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
      
      let query = this.db('ai_model_metrics')
        .select('data_date as date', 'metric_value as value')
        .where('model_name', modelName)
        .where('metric_name', metricName)
        .where('data_date', '>=', cutoffDate);

      if (modelVersion) {
        query = query.where('model_version', modelVersion);
      }

      const results = await query.orderBy('data_date', 'asc');

      return results.map(row => ({
        date: new Date(row.date),
        value: parseFloat(row.value)
      }));
    } catch (error) {
      console.error('Error getting metric trends:', error);
      throw new AIModelMetricError('Failed to get metric trends');
    }
  }

  /**
   * Get performance comparison between models
   */
  async getModelComparison(
    metricName: string,
    modelNames: string[],
    dataDate?: Date
  ): Promise<Array<{ modelName: string; modelVersion: string; value: number; date: Date }>> {
    try {
      let query = this.db('ai_model_metrics')
        .select('model_name', 'model_version', 'metric_value as value', 'data_date as date')
        .where('metric_name', metricName)
        .whereIn('model_name', modelNames);

      if (dataDate) {
        query = query.where('data_date', dataDate);
      } else {
        // Get latest metrics for each model using window function
        const subquery = this.db('ai_model_metrics')
          .select('*')
          .select(this.db.raw('ROW_NUMBER() OVER (PARTITION BY model_name ORDER BY data_date DESC) as rn'))
          .where('metric_name', metricName)
          .whereIn('model_name', modelNames);

        const results = await this.db
          .with('ranked_metrics', subquery)
          .select('model_name', 'model_version', 'metric_value as value', 'data_date as date')
          .from('ranked_metrics')
          .where('rn', 1)
          .orderBy('model_name')
          .orderBy('model_version');

        return results.map(row => ({
          modelName: row.model_name,
          modelVersion: row.model_version,
          value: parseFloat(row.value),
          date: new Date(row.date)
        }));
      }

      const results = await query
        .orderBy('model_name')
        .orderBy('model_version');

      return results.map(row => ({
        modelName: row.model_name,
        modelVersion: row.model_version,
        value: parseFloat(row.value),
        date: new Date(row.date)
      }));
    } catch (error) {
      console.error('Error getting model comparison:', error);
      throw new AIModelMetricError('Failed to get model comparison');
    }
  }

  /**
   * Get model performance analytics
   */
  async getAnalytics(filters: AIModelMetricFilters = {}): Promise<ModelPerformanceAnalytics> {
    try {
      let baseQuery = this.db('ai_model_metrics');

      // Apply filters
      if (filters.modelName) {
        baseQuery = baseQuery.where('model_name', filters.modelName);
      }

      if (filters.dataDateAfter) {
        baseQuery = baseQuery.where('data_date', '>=', filters.dataDateAfter);
      }

      if (filters.dataDateBefore) {
        baseQuery = baseQuery.where('data_date', '<=', filters.dataDateBefore);
      }

      // Models summary - get latest 5 metrics for each model/version
      const modelsWithLatestMetrics = await this.db
        .with('ranked_metrics', 
          baseQuery.clone()
            .select('*')
            .select(this.db.raw('ROW_NUMBER() OVER (PARTITION BY model_name, model_version, metric_name ORDER BY data_date DESC) as rn'))
        )
        .select(
          'model_name',
          'model_version',
          this.db.raw('COUNT(*) as metrics_count'),
          this.db.raw(`ARRAY_AGG(
            JSON_BUILD_OBJECT(
              'metricName', metric_name,
              'metricValue', metric_value,
              'dataDate', data_date
            ) ORDER BY data_date DESC
          ) FILTER (WHERE rn <= 5) as latest_metrics`)
        )
        .from('ranked_metrics')
        .where('rn', '<=', 5)
        .groupBy('model_name', 'model_version')
        .orderBy('model_name')
        .orderBy('model_version');

      // Trend data
      const trendData = await baseQuery.clone()
        .select(
          this.db.raw('DATE(data_date) as date'),
          'model_name',
          'metric_name',
          this.db.raw('AVG(metric_value) as value')
        )
        .groupBy(this.db.raw('DATE(data_date)'), 'model_name', 'metric_name')
        .orderBy('date', 'desc')
        .orderBy('model_name')
        .orderBy('metric_name')
        .limit(1000);

      return {
        models: modelsWithLatestMetrics.map(row => ({
          modelName: row.model_name,
          modelVersion: row.model_version,
          metricsCount: parseInt(row.metrics_count),
          latestMetrics: (row.latest_metrics || []).map((metric: any) => ({
            metricName: metric.metricName,
            metricValue: parseFloat(metric.metricValue),
            dataDate: new Date(metric.dataDate)
          }))
        })),
        trendData: trendData.map(row => ({
          date: row.date,
          modelName: row.model_name,
          metricName: row.metric_name,
          value: parseFloat(row.value)
        }))
      };
    } catch (error) {
      console.error('Error getting model performance analytics:', error);
      throw new AIModelMetricError('Failed to get model performance analytics');
    }
  }

  /**
   * Bulk create metrics
   */
  async bulkCreate(metrics: CreateAIModelMetricRequest[]): Promise<AIModelMetric[]> {
    if (metrics.length === 0) {
      return [];
    }

    try {
      const insertData = metrics.map(metric => ({
        model_name: metric.modelName,
        model_version: metric.modelVersion,
        metric_name: metric.metricName,
        metric_value: metric.metricValue,
        data_date: metric.dataDate
      }));

      const results = await this.db('ai_model_metrics')
        .insert(insertData)
        .returning('*');

      return results.map(row => this.mapRowToAIModelMetric(row));
    } catch (error) {
      console.error('Error bulk creating AI model metrics:', error);
      throw new AIModelMetricError('Failed to bulk create AI model metrics');
    }
  }

  /**
   * Cleanup old metrics (older than specified days)
   */
  async cleanupOldMetrics(olderThanDays: number = 365): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
      
      const deletedCount = await this.db('ai_model_metrics')
        .where('data_date', '<', cutoffDate)
        .del();

      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old metrics:', error);
      throw new AIModelMetricError('Failed to cleanup old metrics');
    }
  }

  /**
   * Map database row to AIModelMetric object
   */
  private mapRowToAIModelMetric(row: any): AIModelMetric {
    return {
      id: row.id,
      modelName: row.model_name,
      modelVersion: row.model_version,
      metricName: row.metric_name,
      metricValue: parseFloat(row.metric_value),
      dataDate: new Date(row.data_date),
      createdAt: new Date(row.created_at)
    };
  }
}
