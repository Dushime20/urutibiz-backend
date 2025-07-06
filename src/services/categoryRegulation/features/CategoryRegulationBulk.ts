import {
  BulkCategoryRegulationOperation,
  CreateCategoryRegulationData,
  UpdateCategoryRegulationData,
  ServiceResponse,
} from '../../../types/categoryRegulation.types';
import CategoryRegulationRepository from '../core/CategoryRegulationRepository';
import CategoryRegulationValidator from '../utils/CategoryRegulationValidator';
import CategoryRegulationErrorHandler from '../utils/ErrorHandler';
import ResponseFormatter from '../utils/ResponseFormatter';
import QueryBuilder from '../utils/QueryBuilder';

/**
 * Handles bulk operations for Category Regulations
 * Separated from CRUD operations for better maintainability and performance
 */
export class CategoryRegulationBulk {
  /**
   * Execute bulk operations for category regulations
   */
  static async bulkOperations(
    operations: BulkCategoryRegulationOperation
  ): Promise<ServiceResponse<{
    created: number;
    updated: number;
    deleted: number;
    errors: Array<{ index: number; error: string }>;
  }>> {
    try {
      const results = {
        created: 0,
        updated: 0,
        deleted: 0,
        errors: [] as Array<{ index: number; error: string }>,
      };

      // Execute bulk create operations
      if (operations.regulations && operations.regulations.length > 0) {
        const createResults = await this.bulkCreate(operations.regulations);
        results.created += createResults.created;
        results.errors.push(...createResults.errors);
      }

      // Execute bulk update operations
      if (operations.updates) {
        try {
          const whereConditions = QueryBuilder.buildWhereConditions(operations.updates.filters);
          const updatedCount = await CategoryRegulationRepository.bulkUpdate(
            whereConditions,
            operations.updates.data
          );
          results.updated = updatedCount;
        } catch (error: any) {
          results.errors.push({
            index: -1,
            error: `Bulk update failed: ${error.message}`,
          });
        }
      }

      // Execute bulk delete operations
      if (operations.deletes) {
        try {
          if (operations.deletes.ids && operations.deletes.ids.length > 0) {
            // Delete by IDs
            const deleteResults = await this.bulkDeleteByIds(operations.deletes.ids);
            results.deleted += deleteResults.deleted;
            results.errors.push(...deleteResults.errors);
          } else if (operations.deletes.filters) {
            // Delete by filters
            const whereConditions = QueryBuilder.buildWhereConditions(operations.deletes.filters);
            const deletedCount = await CategoryRegulationRepository.bulkDelete(whereConditions);
            results.deleted += deletedCount;
          }
        } catch (error: any) {
          results.errors.push({
            index: -1,
            error: `Bulk delete failed: ${error.message}`,
          });
        }
      }

      return ResponseFormatter.bulkOperationSuccess(
        {
          created: results.created,
          updated: results.updated,
          deleted: results.deleted,
          errors: results.errors
        } as {
          created: number;
          updated: number;
          deleted: number;
          errors: Array<{ index: number; error: string }>;
        },
        'Bulk operations completed'
      );
    } catch (error: any) {
      return CategoryRegulationErrorHandler.handleError(
        error,
        'execute bulk operations',
        { operations }
      );
    }
  }

  /**
   * Bulk create multiple category regulations
   */
  private static async bulkCreate(
    createData: CreateCategoryRegulationData[]
  ): Promise<{
    created: number;
    errors: Array<{ index: number; error: string }>;
  }> {
    const results = {
      created: 0,
      errors: [] as Array<{ index: number; error: string }>,
    };

    // Process each create operation individually for better error handling
    for (let i = 0; i < createData.length; i++) {
      const data = createData[i];
      
      try {
        // Validate the data
        const validation = CategoryRegulationValidator.validateCreateData(data);
        if (!validation.isValid) {
          results.errors.push({
            index: i,
            error: `Validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
          });
          continue;
        }

        // Check for existing regulation
        const existingRegulation = await CategoryRegulationRepository.existsByCategoryAndCountry(
          data.category_id,
          data.country_id
        );

        if (existingRegulation) {
          results.errors.push({
            index: i,
            error: 'Regulation already exists for this category-country combination',
          });
          continue;
        }

        // Create the regulation
        await CategoryRegulationRepository.create(data);
        results.created++;
      } catch (error: any) {
        results.errors.push({
          index: i,
          error: `Creation failed: ${error.message}`,
        });
      }
    }

    return results;
  }

  /**
   * Bulk delete regulations by IDs
   */
  private static async bulkDeleteByIds(
    ids: string[]
  ): Promise<{
    deleted: number;
    errors: Array<{ index: number; error: string }>;
  }> {
    const results = {
      deleted: 0,
      errors: [] as Array<{ index: number; error: string }>,
    };

    // Process each delete operation individually for better error handling
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      
      try {
        // Validate ID format
        const idValidation = CategoryRegulationValidator.validateId(id);
        if (idValidation) {
          results.errors.push({
            index: i,
            error: `Invalid ID: ${idValidation.message}`,
          });
          continue;
        }

        // Delete the regulation
        const deletedRegulation = await CategoryRegulationRepository.deleteById(id);
        
        if (deletedRegulation) {
          results.deleted++;
        } else {
          results.errors.push({
            index: i,
            error: 'Regulation not found',
          });
        }
      } catch (error: any) {
        results.errors.push({
          index: i,
          error: `Deletion failed: ${error.message}`,
        });
      }
    }

    return results;
  }

  /**
   * Bulk update multiple regulations by ID
   */
  static async bulkUpdateByIds(
    updates: Array<{ id: string; data: UpdateCategoryRegulationData }>
  ): Promise<ServiceResponse<{
    updated: number;
    errors: Array<{ index: number; error: string }>;
  }>> {
    try {
      const results = {
        updated: 0,
        errors: [] as Array<{ index: number; error: string }>,
      };

      // Process each update operation individually
      for (let i = 0; i < updates.length; i++) {
        const { id, data } = updates[i];
        
        try {
          // Validate ID format
          const idValidation = CategoryRegulationValidator.validateId(id);
          if (idValidation) {
            results.errors.push({
              index: i,
              error: `Invalid ID: ${idValidation.message}`,
            });
            continue;
          }

          // Validate update data
          const validation = CategoryRegulationValidator.validateUpdateData(data);
          if (!validation.isValid) {
            results.errors.push({
              index: i,
              error: `Validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
            });
            continue;
          }

          // Update the regulation
          const updatedRegulation = await CategoryRegulationRepository.updateById(id, data);
          
          if (updatedRegulation) {
            results.updated++;
          } else {
            results.errors.push({
              index: i,
              error: 'Regulation not found',
            });
          }
        } catch (error: any) {
          results.errors.push({
            index: i,
            error: `Update failed: ${error.message}`,
          });
        }
      }

      return ResponseFormatter.bulkOperationSuccess(
        {
          updated: results.updated,
          errors: results.errors
        } as {
          updated: number;
          errors: Array<{ index: number; error: string }>;
        },
        'Bulk updates completed'
      );
    } catch (error: any) {
      return CategoryRegulationErrorHandler.handleError(
        error,
        'execute bulk updates',
        { updates }
      );
    }
  }

  /**
   * Import regulations from CSV or JSON data
   */
  static async importRegulations(
    data: CreateCategoryRegulationData[],
    options: {
      skipDuplicates?: boolean;
      updateOnConflict?: boolean;
      validateOnly?: boolean;
    } = {}
  ): Promise<ServiceResponse<{
    imported: number;
    skipped: number;
    updated: number;
    errors: Array<{ index: number; error: string; data: any }>;
  }>> {
    try {
      const results = {
        imported: 0,
        skipped: 0,
        updated: 0,
        errors: [] as Array<{ index: number; error: string; data: any }>,
      };

      // If validation only, just validate and return
      if (options.validateOnly) {
        for (let i = 0; i < data.length; i++) {
          const validation = CategoryRegulationValidator.validateCreateData(data[i]);
          if (!validation.isValid) {
            results.errors.push({
              index: i,
              error: `Validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
              data: data[i],
            });
          }
        }

        return ResponseFormatter.success(
          results,
          'Validation completed'
        );
      }

      // Process each import item
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        
        try {
          // Validate the data
          const validation = CategoryRegulationValidator.validateCreateData(item);
          if (!validation.isValid) {
            results.errors.push({
              index: i,
              error: `Validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
              data: item,
            });
            continue;
          }

          // Check for existing regulation
          const existingRegulation = await CategoryRegulationRepository.existsByCategoryAndCountry(
            item.category_id,
            item.country_id
          );

          if (existingRegulation) {
            if (options.skipDuplicates) {
              results.skipped++;
              continue;
            } else if (options.updateOnConflict) {
              // Update existing regulation
              await CategoryRegulationRepository.updateById(existingRegulation.id, item);
              results.updated++;
              continue;
            } else {
              results.errors.push({
                index: i,
                error: 'Regulation already exists for this category-country combination',
                data: item,
              });
              continue;
            }
          }

          // Create new regulation
          await CategoryRegulationRepository.create(item);
          results.imported++;
        } catch (error: any) {
          results.errors.push({
            index: i,
            error: `Import failed: ${error.message}`,
            data: item,
          });
        }
      }

      return ResponseFormatter.success(
        results,
        'Import completed'
      );
    } catch (error: any) {
      return CategoryRegulationErrorHandler.handleError(
        error,
        'import regulations',
        { data, options }
      );
    }
  }

  /**
   * Export regulations with filtering options
   */
  static async exportRegulations(
    filters: any = {},
    format: 'json' | 'csv' = 'json'
  ): Promise<ServiceResponse<{
    data: any[];
    format: string;
    total_exported: number;
  }>> {
    try {
      // Get regulations with filters
      const { rows: regulations } = await CategoryRegulationRepository.findWithFilters(filters);

      // Convert to JSON format
      const exportData = regulations.map(regulation => {
        const data = regulation.toJSON();
        
        // Add computed fields for export
        return {
          ...data,
          compliance_score: (regulation as any).getComplianceScore(),
          has_age_restrictions: !!data.min_age_requirement,
          has_rental_limit: !!data.max_rental_days,
          total_requirements: [
            data.requires_license,
            data.mandatory_insurance,
            data.requires_background_check,
            data.min_age_requirement,
          ].filter(Boolean).length,
        };
      });

      // Format according to requested format
      let formattedData: any[] = exportData;
      if (format === 'csv') {
        // For CSV, flatten nested objects
        formattedData = exportData.map(item => ({
          ...item,
          // Flatten arrays and objects for CSV compatibility
          documentation_required: Array.isArray(item.documentation_required) ? 
            item.documentation_required.join(';') : item.documentation_required,
          seasonal_restrictions: typeof item.seasonal_restrictions === 'object' ? 
            JSON.stringify(item.seasonal_restrictions) : item.seasonal_restrictions,
        }));
      }

      return ResponseFormatter.success(
        {
          data: formattedData,
          format,
          total_exported: exportData.length,
        },
        `Exported ${exportData.length} regulations in ${format} format`
      );
    } catch (error: any) {
      return CategoryRegulationErrorHandler.handleError(
        error,
        'export regulations',
        { filters, format }
      );
    }
  }

  /**
   * Duplicate regulations from one country to another
   */
  static async duplicateCountryRegulations(
    sourceCountryId: string,
    targetCountryId: string,
    options: {
      skipExisting?: boolean;
      updateExisting?: boolean;
    } = {}
  ): Promise<ServiceResponse<{
    duplicated: number;
    skipped: number;
    updated: number;
    errors: Array<{ category_id: string; error: string }>;
  }>> {
    try {
      // Validate country IDs
      const sourceValidation = CategoryRegulationValidator.validateId(sourceCountryId, 'source_country_id');
      const targetValidation = CategoryRegulationValidator.validateId(targetCountryId, 'target_country_id');
      
      if (sourceValidation || targetValidation) {
        const errors = [sourceValidation, targetValidation].filter(Boolean);
        return CategoryRegulationErrorHandler.handleValidationError(
          errors as any[],
          'duplicate country regulations'
        );
      }

      // Get source regulations
      const sourceRegulations = await CategoryRegulationRepository.findByCountryId(sourceCountryId);
      
      if (sourceRegulations.length === 0) {
        return CategoryRegulationErrorHandler.handleNotFoundError(
          'Source country regulations'
        );
      }

      const results = {
        duplicated: 0,
        skipped: 0,
        updated: 0,
        errors: [] as Array<{ category_id: string; error: string }>,
      };

      // Process each source regulation
      for (const sourceRegulation of sourceRegulations) {
        try {
          // Check if regulation already exists in target country
          const existingRegulation = await CategoryRegulationRepository.existsByCategoryAndCountry(
            sourceRegulation.category_id,
            targetCountryId
          );

          // Prepare new regulation data
          const newRegulationData = {
            ...sourceRegulation.toJSON(),
            country_id: targetCountryId,
          };
          
          // Remove fields that shouldn't be duplicated
          delete (newRegulationData as any).id;
          delete (newRegulationData as any).created_at;
          delete (newRegulationData as any).updated_at;

          if (existingRegulation) {
            if (options.skipExisting) {
              results.skipped++;
              continue;
            } else if (options.updateExisting) {
              await CategoryRegulationRepository.updateById(existingRegulation.id, newRegulationData);
              results.updated++;
              continue;
            } else {
              results.errors.push({
                category_id: sourceRegulation.category_id,
                error: 'Regulation already exists in target country',
              });
              continue;
            }
          }

          // Create new regulation
          await CategoryRegulationRepository.create(newRegulationData);
          results.duplicated++;
        } catch (error: any) {
          results.errors.push({
            category_id: sourceRegulation.category_id,
            error: `Duplication failed: ${error.message}`,
          });
        }
      }

      return ResponseFormatter.success(
        results,
        `Duplicated ${results.duplicated} regulations from ${sourceCountryId} to ${targetCountryId}`
      );
    } catch (error: any) {
      return CategoryRegulationErrorHandler.handleError(
        error,
        'duplicate country regulations',
        { sourceCountryId, targetCountryId, options }
      );
    }
  }
}

export default CategoryRegulationBulk;
