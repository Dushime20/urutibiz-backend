import { ServiceResponse } from '@/types';
import { ProductInspectionRepository } from '@/repositories/ProductInspectionRepository';
import { InspectionCriteriaTemplateRepository } from '@/repositories/InspectionCriteriaTemplateRepository';
import { InspectionScoreRepository } from '@/repositories/InspectionScoreRepository';
import { InspectorCertificationRepository } from '@/repositories/InspectorCertificationRepository';
import { PublicInspectionReportRepository } from '@/repositories/PublicInspectionReportRepository';
import { InspectorLocationRepository } from '@/repositories/InspectorLocationRepository';
import { getDatabase } from '@/config/database';
import {
  ThirdPartyInspectionRequest,
  CompleteThirdPartyInspectionRequest,
  ThirdPartyInspectionResponse,
  InspectionCriteriaTemplate,
  InspectionScore,
  PublicInspectionReport,
  ScoreCalculation,
  OverallRating,
  InspectorAssignment,
  CreatePublicReportRequest,
  InspectionTier
} from '@/types/thirdPartyInspection.types';
import { InspectionType } from '@/types/productInspection.types';
import { v4 as uuidv4 } from 'uuid';

export class ThirdPartyInspectionService {
  private inspectionRepo: ProductInspectionRepository;
  private criteriaTemplateRepo: InspectionCriteriaTemplateRepository;
  private scoreRepo: InspectionScoreRepository;
  private certificationRepo: InspectorCertificationRepository;
  private publicReportRepo: PublicInspectionReportRepository;
  private locationRepo: InspectorLocationRepository;

  constructor() {
    this.inspectionRepo = new ProductInspectionRepository();
    this.criteriaTemplateRepo = new InspectionCriteriaTemplateRepository();
    this.scoreRepo = new InspectionScoreRepository();
    this.certificationRepo = new InspectorCertificationRepository();
    this.publicReportRepo = new PublicInspectionReportRepository();
    this.locationRepo = new InspectorLocationRepository();
  }

  /**
   * Create a third-party professional inspection request
   */
  async createThirdPartyInspection(
    request: ThirdPartyInspectionRequest,
    ownerId: string
  ): Promise<ServiceResponse<any>> {
    try {
      // Get product to find category
      const db = getDatabase();
      const product = await db('products')
        .where('id', request.productId)
        .first();

      if (!product) {
        return { success: false, error: 'Product not found' };
      }

      // Get or assign inspector with location-based matching
      let inspectorId = request.inspectorId;
      if (!inspectorId) {
        const assignment = await this.assignInspector(
          request.categoryId,
          product.category_id,
          {
            countryId: request.countryId,
            region: request.region,
            latitude: request.latitude,
            longitude: request.longitude,
            preferredLanguage: request.preferredLanguage
          }
        );
        if (!assignment) {
          return { success: false, error: 'No available inspector found for this category and location' };
        }
        inspectorId = assignment.inspectorId;
      }

      // Create inspection with international fields
      const inspectionData: any = {
        id: uuidv4(),
        productId: request.productId,
        bookingId: null, // Third-party inspections don't require booking
        inspectorId: inspectorId,
        ownerId: ownerId,
        renterId: null,
        inspectionType: InspectionType.THIRD_PARTY_PROFESSIONAL,
        status: 'pending',
        scheduledAt: request.scheduledAt,
        inspectionLocation: request.location,
        generalNotes: request.notes,
        isThirdPartyInspection: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add Dubizzle inspection tier (standard 120-point or advanced 240-point)
      if (request.inspectionTier) {
        inspectionData.inspectionTier = request.inspectionTier;
        // Set total points based on tier (Dubizzle model)
        inspectionData.totalPoints = request.inspectionTier === InspectionTier.ADVANCED ? 240 : 120;
      } else {
        // Default to standard if not specified
        inspectionData.inspectionTier = InspectionTier.STANDARD;
        inspectionData.totalPoints = 120;
      }

      // Add international/global fields
      if (request.countryId) inspectionData.countryId = request.countryId;
      if (request.region) inspectionData.region = request.region;
      if (request.timezone) inspectionData.timezone = request.timezone;
      if (request.latitude !== undefined) inspectionData.latitude = request.latitude;
      if (request.longitude !== undefined) inspectionData.longitude = request.longitude;
      if (request.currency) inspectionData.currency = request.currency;
      if (request.inspectionCost !== undefined) inspectionData.inspectionCost = request.inspectionCost;

      const result = await this.inspectionRepo.create(inspectionData);

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to create inspection' };
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('[ThirdPartyInspectionService] Create inspection error:', error);
      return {
        success: false,
        error: (error as Error).message || 'Internal server error'
      };
    }
  }

  /**
   * Assign an inspector based on category, location, and international availability
   */
  async assignInspector(
    categoryId: string,
    productCategoryId?: string,
    locationParams?: {
      countryId?: string;
      region?: string;
      latitude?: number;
      longitude?: number;
      preferredLanguage?: string;
    }
  ): Promise<InspectorAssignment | null> {
    try {
      // Get category name to match certification type
      const db = getDatabase();
      const category = await db('categories')
        .where('id', categoryId || productCategoryId)
        .first();

      if (!category) {
        return null;
      }

      // Map category to certification type
      const certificationType = this.mapCategoryToCertificationType(category.name || category.title);

      // Step 1: Find certified inspectors for this type
      let certsResult = await this.certificationRepo.getByCertificationType(
        certificationType,
        undefined,
        true
      );

      // If no specific certification found, fallback to general
      if (!certsResult.success || !certsResult.data || certsResult.data.length === 0) {
        const generalCerts = await this.certificationRepo.getByCertificationType('general', undefined, true);
        if (!generalCerts.success || !generalCerts.data || generalCerts.data.length === 0) {
          return null;
        }
        certsResult = generalCerts;
      }

      if (!certsResult.data || certsResult.data.length === 0) {
        return null;
      }

      // Step 2: Filter by location if provided
      let candidateInspectors = certsResult.data;
      
      if (locationParams) {
        const locationFiltered: any[] = [];

        for (const cert of candidateInspectors) {
          // Check country/region match
          if (locationParams.countryId) {
            // Check if inspector has certification valid for this country
            const isValidForCountry = 
              !cert.countryId || // Global certification
              cert.countryId === locationParams.countryId || // Same country
              (cert.validCountries && cert.validCountries.includes(locationParams.countryId)) || // Valid countries list
              cert.internationallyRecognized; // Internationally recognized

            if (!isValidForCountry) {
              continue;
            }
          }

          // Check region match
          if (locationParams.region && cert.region && cert.region !== locationParams.region) {
            // Allow if internationally recognized
            if (!cert.internationallyRecognized) {
              continue;
            }
          }

          // If coordinates provided, find nearby inspectors
          if (locationParams.latitude && locationParams.longitude) {
            const locationsResult = await this.locationRepo.findNearbyInspectors(
              locationParams.latitude,
              locationParams.longitude,
              100, // 100km radius
              locationParams.countryId,
              5 // Limit to 5 nearby inspectors
            );

            if (locationsResult.success && locationsResult.data) {
              const nearbyInspectorIds = locationsResult.data.map(loc => loc.inspectorId);
              if (!nearbyInspectorIds.includes(cert.inspectorId)) {
                // Inspector not nearby, but allow if internationally recognized
                if (!cert.internationallyRecognized) {
                  continue;
                }
              }
            }
          }

          locationFiltered.push(cert);
        }

        candidateInspectors = locationFiltered.length > 0 ? locationFiltered : candidateInspectors;
      }

      if (candidateInspectors.length === 0) {
        return null;
      }

      // Step 3: Get user data and location info for scoring
      const inspectorAssignments: InspectorAssignment[] = [];

      for (const cert of candidateInspectors) {
        // Get user data
        const user = await db('users').where('id', cert.inspectorId).first();
        
        // Get inspector location
        const locationResult = await this.locationRepo.getPrimaryLocation(cert.inspectorId);
        const location = locationResult.success ? locationResult.data : null;

        // Calculate distance if coordinates provided
        let distance: number | undefined;
        if (locationParams?.latitude && locationParams?.longitude && location?.latitude && location?.longitude) {
          distance = this.calculateDistance(
            locationParams.latitude,
            locationParams.longitude,
            location.latitude,
            location.longitude
          );
        }

        inspectorAssignments.push({
          inspectorId: cert.inspectorId,
          inspectorName: user?.name || user?.full_name || '',
          certificationLevel: cert.certificationLevel as any,
          certificationType: cert.certificationType as any,
          averageRating: cert.averageRating,
          totalInspections: cert.totalInspections,
          specializations: cert.specializations,
          distance,
          countryId: location?.countryId || cert.countryId,
          region: location?.stateProvince || cert.region,
          city: location?.city,
          latitude: location?.latitude,
          longitude: location?.longitude,
          internationallyRecognized: cert.internationallyRecognized
        });
      }

      // Step 4: Score and rank inspectors
      // Priority: 1) Internationally recognized, 2) Distance (closer is better), 3) Rating, 4) Experience
      inspectorAssignments.sort((a, b) => {
        // Prioritize internationally recognized
        if (a.internationallyRecognized !== b.internationallyRecognized) {
          return a.internationallyRecognized ? -1 : 1;
        }

        // Prioritize closer inspectors (if distance available)
        if (a.distance !== undefined && b.distance !== undefined) {
          if (Math.abs(a.distance - b.distance) > 5) { // More than 5km difference
            return a.distance - b.distance;
          }
        }

        // Prioritize higher rating
        if (b.averageRating !== a.averageRating) {
          return b.averageRating - a.averageRating;
        }

        // Prioritize more experience
        return b.totalInspections - a.totalInspections;
      });

      return inspectorAssignments[0] || null;
    } catch (error) {
      console.error('[ThirdPartyInspectionService] Assign inspector error:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in kilometers
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Map product category to certification type
   */
  private mapCategoryToCertificationType(categoryName: string): string {
    const name = categoryName.toLowerCase();
    if (name.includes('car') || name.includes('vehicle') || name.includes('auto')) {
      return 'automotive';
    }
    if (name.includes('electronic') || name.includes('phone') || name.includes('laptop')) {
      return 'electronics';
    }
    if (name.includes('furniture') || name.includes('chair') || name.includes('table')) {
      return 'furniture';
    }
    if (name.includes('tool') || name.includes('equipment')) {
      return 'tools';
    }
    if (name.includes('machine') || name.includes('industrial')) {
      return 'machinery';
    }
    return 'general';
  }

  /**
   * Get inspection criteria template for a category (with country/region/tier support - Dubizzle model)
   */
  async getCriteriaTemplate(
    categoryId: string,
    countryId?: string,
    region?: string,
    locale?: string,
    inspectionTier?: InspectionTier
  ): Promise<ServiceResponse<InspectionCriteriaTemplate | null>> {
    try {
      // Get all templates for this category
      let templatesResult = await this.criteriaTemplateRepo.getByCategoryId(categoryId, true);
      
      if (!templatesResult.success || !templatesResult.data || templatesResult.data.length === 0) {
        return { success: true, data: null };
      }

      let templates = templatesResult.data;

      // Filter by tier if specified (Dubizzle: standard 120-point or advanced 240-point)
      if (inspectionTier) {
        templates = templates.filter(t => t.inspectionTier === inspectionTier);
      }

      // Filter by country if specified
      if (countryId && templates.length > 0) {
        const countryTemplates = templates.filter(t => t.countryId === countryId);
        if (countryTemplates.length > 0) {
          templates = countryTemplates;
        }
      }

      // Filter by region if specified
      if (region && templates.length > 0) {
        const regionTemplates = templates.filter(t => t.region === region);
        if (regionTemplates.length > 0) {
          templates = regionTemplates;
        }
      }

      // If no specific match, try global templates
      if (templates.length === 0) {
        templates = templatesResult.data.filter(t => t.isGlobal || !t.countryId);
        if (inspectionTier) {
          templates = templates.filter(t => !t.inspectionTier || t.inspectionTier === inspectionTier);
        }
      }

      // Return the first matching template
      if (templates.length > 0) {
        return { success: true, data: templates[0] };
      }

      return { success: true, data: null };
    } catch (error) {
      console.error('[ThirdPartyInspectionService] Get criteria template error:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Complete a third-party inspection with scores
   */
  async completeThirdPartyInspection(
    request: CompleteThirdPartyInspectionRequest
  ): Promise<ServiceResponse<ThirdPartyInspectionResponse>> {
    try {
      // Get inspection
      const inspectionResult = await this.inspectionRepo.getById(request.inspectionId);
      if (!inspectionResult.success || !inspectionResult.data) {
        return { success: false, error: 'Inspection not found' };
      }

      const inspection = inspectionResult.data;

      // Verify it's a third-party inspection
      if (!inspection.isThirdPartyInspection) {
        return { success: false, error: 'This is not a third-party inspection' };
      }

      // Get criteria template
      const product = await getDatabase()('products')
        .where('id', inspection.productId)
        .first();
      
      if (!product) {
        return { success: false, error: 'Product not found' };
      }

      // Get template based on inspection tier (Dubizzle: standard 120-point or advanced 240-point)
      const inspectionTier = (inspection as any).inspectionTier || InspectionTier.STANDARD;
      const templateResult = await this.getCriteriaTemplate(
        product.category_id,
        (inspection as any).countryId,
        (inspection as any).region,
        undefined,
        inspectionTier
      );
      if (!templateResult.success || !templateResult.data) {
        return { success: false, error: `No inspection criteria template found for this category and tier (${inspectionTier}). Please ensure templates are seeded for Standard (120-point) or Advanced (240-point) inspections.` };
      }

      const template = templateResult.data;

      // Calculate scores
      const scoreCalculation = this.calculateScores(request.scores, template);

      // Save scores
      const scoresResult = await this.scoreRepo.createMultiple(request.scores, request.inspectionId);
      if (!scoresResult.success) {
        return { success: false, error: 'Failed to save inspection scores' };
      }

      // Update inspection
      const updateData: any = {
        status: 'completed',
        completedAt: new Date(),
        inspectorNotes: request.inspectorNotes,
        inspectionScore: scoreCalculation.totalScore,
        overallRating: scoreCalculation.rating,
        categoryCriteria: scoreCalculation.categoryBreakdown,
        updatedAt: new Date()
      };

      const updateResult = await this.inspectionRepo.update(request.inspectionId, updateData);
      if (!updateResult.success) {
        return { success: false, error: 'Failed to update inspection' };
      }

      // Create public report
      const publicReportData: CreatePublicReportRequest = {
        inspectionId: request.inspectionId,
        productId: inspection.productId,
        overallScore: scoreCalculation.totalScore,
        overallRating: scoreCalculation.rating,
        categoryScores: scoreCalculation.categoryBreakdown,
        isPassed: request.isPassed,
        inspectionDate: new Date(),
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // 6 months
      };

      // Extract highlights and concerns from scores
      const highlights: string[] = [];
      const concerns: string[] = [];

      request.scores.forEach(score => {
        const percentage = (score.score / score.maxScore) * 100;
        if (percentage >= 80) {
          highlights.push(`${score.criterionName}: Excellent condition`);
        } else if (percentage < 50) {
          concerns.push(`${score.criterionName}: Needs attention (${percentage.toFixed(0)}%)`);
        }
      });

      if (highlights.length > 0) {
        publicReportData.highlights = highlights;
      }
      if (concerns.length > 0) {
        publicReportData.concerns = concerns;
      }

      publicReportData.summary = this.generateSummary(scoreCalculation, request.isPassed);
      publicReportData.recommendations = request.recommendations;

      const reportResult = await this.publicReportRepo.create(publicReportData);
      if (reportResult.success && reportResult.data) {
        // Update inspection with public report ID
        await this.inspectionRepo.update(request.inspectionId, {
          publicReportId: reportResult.data.id
        });
      }

      // Update inspector statistics
      const rating = this.ratingToStars(scoreCalculation.rating);
      await this.certificationRepo.updateInspectorStats(inspection.inspectorId, rating);

      return {
        success: true,
        data: {
          inspection: updateResult.data,
          scores: scoresResult.data,
          publicReport: reportResult.success ? reportResult.data : undefined,
          template: template
        }
      };
    } catch (error) {
      console.error('[ThirdPartyInspectionService] Complete inspection error:', error);
      return {
        success: false,
        error: (error as Error).message || 'Internal server error'
      };
    }
  }

  /**
   * Calculate scores and overall rating
   */
  private calculateScores(
    scores: any[],
    template: InspectionCriteriaTemplate
  ): ScoreCalculation {
    let totalScore = 0;
    let maxScore = 0;
    const categoryBreakdown: { [key: string]: { score: number; maxScore: number; percentage: number } } = {};

    scores.forEach(score => {
      totalScore += score.score;
      maxScore += score.maxScore;

      // Group by category if available
      const criterion = template.criteria.find((c: any) => c.id === score.criterionId);
      if (criterion && criterion.category) {
        if (!categoryBreakdown[criterion.category]) {
          categoryBreakdown[criterion.category] = { score: 0, maxScore: 0, percentage: 0 };
        }
        categoryBreakdown[criterion.category].score += score.score;
        categoryBreakdown[criterion.category].maxScore += score.maxScore;
      }
    });

    // Calculate percentages for categories
    Object.keys(categoryBreakdown).forEach(category => {
      const cat = categoryBreakdown[category];
      cat.percentage = cat.maxScore > 0 ? (cat.score / cat.maxScore) * 100 : 0;
    });

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const rating = this.scoreToRating(percentage);

    return {
      totalScore: percentage,
      maxScore: 100,
      percentage: percentage,
      rating: rating,
      categoryBreakdown: categoryBreakdown
    };
  }

  /**
   * Convert score percentage to rating
   */
  private scoreToRating(percentage: number): OverallRating {
    if (percentage >= 90) return OverallRating.EXCELLENT;
    if (percentage >= 75) return OverallRating.GOOD;
    if (percentage >= 60) return OverallRating.FAIR;
    if (percentage >= 45) return OverallRating.POOR;
    return OverallRating.VERY_POOR;
  }

  /**
   * Convert rating to star rating (0-5)
   */
  private ratingToStars(rating: OverallRating): number {
    switch (rating) {
      case OverallRating.EXCELLENT: return 5;
      case OverallRating.GOOD: return 4;
      case OverallRating.FAIR: return 3;
      case OverallRating.POOR: return 2;
      case OverallRating.VERY_POOR: return 1;
      default: return 0;
    }
  }

  /**
   * Generate summary text for public report
   */
  private generateSummary(calculation: ScoreCalculation, isPassed: boolean): string {
    const ratingText = calculation.rating.replace('_', ' ').toUpperCase();
    const status = isPassed ? 'PASSED' : 'FAILED';
    
    return `This product received a ${ratingText} rating (${calculation.percentage.toFixed(1)}%) and ${status} the professional inspection. ` +
           `The inspection evaluated multiple criteria and provides a comprehensive assessment of the product's condition.`;
  }

  /**
   * Get public inspection report for a product
   */
  async getPublicReport(productId: string): Promise<ServiceResponse<PublicInspectionReport | null>> {
    try {
      const result = await this.publicReportRepo.getLatestByProductId(productId);
      return result;
    } catch (error) {
      console.error('[ThirdPartyInspectionService] Get public report error:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get all public reports for a product
   */
  async getPublicReports(productId: string): Promise<ServiceResponse<PublicInspectionReport[]>> {
    try {
      const result = await this.publicReportRepo.getByProductId(productId, true);
      return result;
    } catch (error) {
      console.error('[ThirdPartyInspectionService] Get public reports error:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

}

export default new ThirdPartyInspectionService();

