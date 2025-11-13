// =====================================================
// THIRD-PARTY PROFESSIONAL INSPECTION TYPES
// =====================================================

export enum OverallRating {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  VERY_POOR = 'very_poor'
}

export enum CertificationLevel {
  CERTIFIED = 'certified',
  EXPERT = 'expert',
  MASTER = 'master'
}

export enum CertificationType {
  AUTOMOTIVE = 'automotive',
  ELECTRONICS = 'electronics',
  FURNITURE = 'furniture',
  GENERAL = 'general',
  MACHINERY = 'machinery',
  TOOLS = 'tools'
}

// =====================================================
// INSPECTION TIERS (Dubizzle's Model)
// =====================================================

export enum InspectionTier {
  STANDARD = 'standard', // 120-point comprehensive check (Dubizzle's standard)
  ADVANCED = 'advanced'  // 240-point detailed assessment (Dubizzle's advanced)
}

// =====================================================
// INSPECTION CRITERIA TEMPLATE
// =====================================================

export interface InspectionCriterion {
  id: string;
  name: string;
  description?: string;
  maxPoints: number;
  weight?: number; // Relative weight for scoring
  category?: string; // Grouping criteria
  required?: boolean;
  subCriteria?: InspectionCriterion[]; // Nested criteria
}

export interface InspectionCriteriaTemplate {
  id: string;
  categoryId: string;
  categoryName: string;
  templateName: string;
  description?: string;
  criteria: InspectionCriterion[];
  inspectionTier?: InspectionTier; // 'standard' (120-point) or 'advanced' (240-point) - Dubizzle's model
  totalPoints: number; // 120 for standard, 240 for advanced (Dubizzle)
  
  // International/Global Support
  countryId?: string; // NULL = global template, specific UUID = country-specific
  region?: string; // e.g., "EU", "NA", "APAC", "MEA"
  locale?: string; // e.g., "en-US", "ar-AE", "fr-FR"
  translations?: { [languageCode: string]: { templateName?: string; description?: string; criteria?: any[] } };
  regulatoryCompliance?: { [key: string]: any }; // Country/region-specific compliance requirements
  
  isActive: boolean;
  isGlobal: boolean; // Global template available everywhere
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCriteriaTemplateRequest {
  categoryId: string;
  categoryName: string;
  templateName: string;
  description?: string;
  criteria: InspectionCriterion[];
  totalPoints?: number;
}

export interface UpdateCriteriaTemplateRequest {
  templateName?: string;
  description?: string;
  criteria?: InspectionCriterion[];
  totalPoints?: number;
  isActive?: boolean;
}

// =====================================================
// INSPECTION SCORES
// =====================================================

export interface InspectionScore {
  id: string;
  inspectionId: string;
  criterionId: string;
  criterionName: string;
  score: number;
  maxScore: number;
  notes?: string;
  evidence?: {
    photos?: string[];
    documents?: string[];
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInspectionScoreRequest {
  criterionId: string;
  criterionName: string;
  score: number;
  maxScore: number;
  notes?: string;
  evidence?: {
    photos?: string[];
    documents?: string[];
    notes?: string;
  };
}

// =====================================================
// INSPECTOR CERTIFICATIONS
// =====================================================

export interface InspectorCertification {
  id: string;
  inspectorId: string;
  certificationType: CertificationType;
  certificationLevel: CertificationLevel;
  certifyingBody?: string;
  certificateNumber?: string;
  issuedDate?: Date;
  expiryDate?: Date;
  specializations?: string[];
  
  // International/Global Support
  countryId?: string; // Country where certification is valid
  region?: string; // Regional validity (e.g., "EU", "GCC")
  validCountries?: string[]; // Array of country IDs where certification is valid
  internationalStandard?: string; // e.g., "ISO 17020", "IAC", "NABL"
  internationallyRecognized: boolean; // Whether certification is recognized internationally
  
  totalInspections: number;
  averageRating: number; // 0-5 stars
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInspectorCertificationRequest {
  inspectorId: string;
  certificationType: CertificationType;
  certificationLevel: CertificationLevel;
  certifyingBody?: string;
  certificateNumber?: string;
  issuedDate?: Date;
  expiryDate?: Date;
  specializations?: string[];
}

export interface UpdateInspectorCertificationRequest {
  certificationLevel?: CertificationLevel;
  certifyingBody?: string;
  certificateNumber?: string;
  issuedDate?: Date;
  expiryDate?: Date;
  specializations?: string[];
  isActive?: boolean;
}

// =====================================================
// PUBLIC INSPECTION REPORTS
// =====================================================

export interface PublicInspectionReport {
  id: string;
  inspectionId: string;
  productId: string;
  overallScore: number; // 0-100
  overallRating: OverallRating;
  categoryScores?: {
    [category: string]: {
      score: number;
      maxScore: number;
      percentage: number;
    };
  };
  highlights?: string[]; // Key positive points
  concerns?: string[]; // Key concerns/issues
  summary?: string;
  recommendations?: string;
  
  // International/Global Support
  translations?: { [languageCode: string]: { summary?: string; highlights?: string[]; concerns?: string[]; recommendations?: string } };
  primaryLanguage: string; // Primary language of report (e.g., "en", "ar")
  countryId?: string; // Country where inspection was performed
  region?: string; // Region where inspection was performed
  timezone?: string; // Timezone of inspection location
  regulatoryCompliance?: { [key: string]: any }; // Compliance with local regulations
  
  isPassed: boolean;
  inspectionDate: Date;
  expiryDate?: Date;
  isPublic: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePublicReportRequest {
  inspectionId: string;
  productId: string;
  overallScore: number;
  overallRating: OverallRating;
  categoryScores?: {
    [category: string]: {
      score: number;
      maxScore: number;
      percentage: number;
    };
  };
  highlights?: string[];
  concerns?: string[];
  summary?: string;
  recommendations?: string;
  isPassed: boolean;
  inspectionDate: Date;
  expiryDate?: Date;
}

// =====================================================
// THIRD-PARTY INSPECTION WORKFLOW
// =====================================================

export interface ThirdPartyInspectionRequest {
  productId: string;
  categoryId: string;
  inspectorId?: string; // Optional - can be auto-assigned
  scheduledAt: Date;
  location?: string;
  notes?: string;
  priority?: 'low' | 'normal' | 'high';
  
  // Dubizzle's Inspection Tiers
  inspectionTier?: InspectionTier; // 'standard' (120-point) or 'advanced' (240-point)
  
  // International/Global Support
  countryId?: string; // Country where inspection is performed
  region?: string; // Region (e.g., "EU", "GCC", "APAC")
  timezone?: string; // Timezone of inspection location
  latitude?: number; // GPS latitude for location-based matching
  longitude?: number; // GPS longitude for location-based matching
  currency?: string; // Currency code (e.g., "USD", "EUR", "AED")
  inspectionCost?: number; // Cost of inspection in local currency
  preferredLanguage?: string; // Preferred language for report (e.g., "en", "ar")
}

export interface CompleteThirdPartyInspectionRequest {
  inspectionId: string;
  scores: CreateInspectionScoreRequest[];
  inspectorNotes?: string;
  recommendations?: string;
  photos?: string[];
  isPassed: boolean;
}

export interface ThirdPartyInspectionResponse {
  inspection: any; // ProductInspection with third-party fields
  scores: InspectionScore[];
  publicReport?: PublicInspectionReport;
  template: InspectionCriteriaTemplate;
}

// =====================================================
// SCORING CALCULATION
// =====================================================

export interface ScoreCalculation {
  totalScore: number;
  maxScore: number;
  percentage: number;
  rating: OverallRating;
  categoryBreakdown: {
    [category: string]: {
      score: number;
      maxScore: number;
      percentage: number;
    };
  };
}

// =====================================================
// INSPECTOR ASSIGNMENT
// =====================================================

export interface InspectorAssignment {
  inspectorId: string;
  inspectorName: string;
  certificationLevel: CertificationLevel;
  certificationType: CertificationType;
  averageRating: number;
  totalInspections: number;
  specializations?: string[];
  distance?: number; // Distance from inspection location (km)
  availability?: Date[]; // Available time slots
  estimatedCost?: number;
  
  // International/Global Support
  countryId?: string; // Inspector's country
  region?: string; // Inspector's region
  city?: string; // Inspector's city
  latitude?: number; // Inspector's location latitude
  longitude?: number; // Inspector's location longitude
  currency?: string; // Currency for estimated cost
  languages?: string[]; // Languages the inspector speaks
  internationallyRecognized?: boolean; // Whether inspector has international certification
}

export interface AssignInspectorRequest {
  inspectionId: string;
  inspectorId: string;
  scheduledAt: Date;
}

// =====================================================
// INSPECTOR LOCATIONS (for location-based assignment)
// =====================================================

export interface InspectorLocation {
  id: string;
  inspectorId: string;
  countryId?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  serviceRadiusKm: number; // Service radius in kilometers
  isPrimary: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInspectorLocationRequest {
  inspectorId: string;
  countryId?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  serviceRadiusKm?: number;
  isPrimary?: boolean;
}

