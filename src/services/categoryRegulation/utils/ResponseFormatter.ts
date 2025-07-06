import logger from '../../../utils/logger';
import { ServiceResponse, PaginatedResponse } from '../../../types/categoryRegulation.types';

/**
 * Utility for formatting consistent service responses
 */
export class ResponseFormatter {
  /**
   * Format a successful response with data
   */
  static success<T>(
    data: T,
    message: string,
    operation?: string
  ): ServiceResponse<T> {
    if (operation) {
      logger.info(`${operation} completed successfully`);
    }

    return {
      success: true,
      data,
      message,
    };
  }

  /**
   * Format a successful response without data
   */
  static successNoData(
    message: string,
    operation?: string
  ): ServiceResponse<void> {
    if (operation) {
      logger.info(`${operation} completed successfully`);
    }

    return {
      success: true,
      message,
    };
  }

  /**
   * Format a paginated response
   */
  static paginatedSuccess<T>(
    data: T[],
    totalCount: number,
    page: number,
    limit: number,
    message: string
  ): ServiceResponse<PaginatedResponse<T>> {
    const totalPages = Math.ceil(totalCount / limit);
    
    const paginatedData: PaginatedResponse<T> = {
      data,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
    };

    return {
      success: true,
      data: paginatedData,
      message,
    };
  }

  /**
   * Format bulk operation results
   */
  static bulkOperationSuccess<T extends {
    created?: number;
    updated?: number;
    deleted?: number;
    errors?: Array<{ index: number; error: string }>;
  }>(
    results: T,
    message: string
  ): ServiceResponse<T> {
    const summary = [
      results.created && `${results.created} created`,
      results.updated && `${results.updated} updated`, 
      results.deleted && `${results.deleted} deleted`,
    ].filter(Boolean).join(', ');

    const fullMessage = summary ? `${message}: ${summary}` : message;

    logger.info(fullMessage, { results });

    return {
      success: true,
      data: results,
      message: fullMessage,
    };
  }
}

export default ResponseFormatter;
