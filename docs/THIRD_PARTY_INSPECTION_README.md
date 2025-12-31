# Third-Party Professional Inspection System - Complete Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Complete Workflow](#complete-workflow)
4. [Database Structure](#database-structure)
5. [Core Logic Explained](#core-logic-explained)
6. [API Endpoints](#api-endpoints)
7. [Usage Examples](#usage-examples)
8. [Integration Points](#integration-points)
9. [Configuration](#configuration)

---

## Overview

### What is This System?

The Third-Party Professional Inspection System is a comprehensive solution that allows **certified, independent inspectors** to evaluate products and provide standardized reports with ratings. This system is based on **Dubizzle's QualityAssist** model, ensuring professional, impartial, and trustworthy inspections.

### Key Concepts

- **Third-Party Inspectors**: Certified professionals (not owners or renters) who conduct inspections
- **Inspection Tiers**: 
  - **Standard (120-point)**: Comprehensive check for most products
  - **Advanced (240-point)**: Detailed assessment with extended diagnostics
- **Category-Based Criteria**: Each product category has specific inspection checklists
- **Location-Based Assignment**: Inspectors are matched based on proximity and availability
- **Public Reports**: Inspection results are publicly visible to build trust

### Why Use This System?

1. **Trust Building**: Buyers/renters gain confidence from professional assessments
2. **Standardization**: Consistent evaluation across all products
3. **Transparency**: Clear, detailed reports reduce disputes
4. **Quality Assurance**: Ensures products meet minimum standards
5. **Market Differentiation**: Inspected products stand out

---

## System Architecture

### Component Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/Next.js)                  │
│  - Inspection Request Form                                   │
│  - Inspector Dashboard                                       │
│  - Public Report Display                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP/REST API
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    Backend (Node.js/Express)                 │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Controllers (Request Handling)                │  │
│  │  - thirdPartyInspection.controller.ts                 │  │
│  └──────────────┬───────────────────────────────────────┘  │
│                 │                                          │
│  ┌──────────────▼───────────────────────────────────────┐  │
│  │         Services (Business Logic)                     │  │
│  │  - thirdPartyInspection.service.ts                    │  │
│  └──────────────┬───────────────────────────────────────┘  │
│                 │                                          │
│  ┌──────────────▼───────────────────────────────────────┐  │
│  │         Repositories (Data Access)                   │  │
│  │  - InspectionCriteriaTemplateRepository               │  │
│  │  - InspectionScoreRepository                         │  │
│  │  - InspectorCertificationRepository                  │  │
│  │  - PublicInspectionReportRepository                  │  │
│  │  - InspectorLocationRepository                       │  │
│  └──────────────┬───────────────────────────────────────┘  │
└─────────────────┼──────────────────────────────────────────┘
                  │
                  │ Knex.js ORM
                  │
┌─────────────────▼──────────────────────────────────────────┐
│              PostgreSQL Database                           │
│                                                             │
│  - product_inspections (enhanced)                          │
│  - inspection_criteria_templates                           │
│  - inspection_scores                                       │
│  - inspector_certifications                                │
│  - public_inspection_reports                               │
│  - inspector_locations                                     │
└────────────────────────────────────────────────────────────┘
```

### File Structure

```
urutibiz-backend/
├── src/
│   ├── controllers/
│   │   └── thirdPartyInspection.controller.ts    # API request handlers
│   ├── services/
│   │   └── thirdPartyInspection.service.ts        # Business logic
│   ├── repositories/
│   │   ├── InspectionCriteriaTemplateRepository.ts
│   │   ├── InspectionScoreRepository.ts
│   │   ├── InspectorCertificationRepository.ts
│   │   ├── PublicInspectionReportRepository.ts
│   │   └── InspectorLocationRepository.ts
│   ├── types/
│   │   └── thirdPartyInspection.types.ts           # TypeScript interfaces
│   └── routes/
│       └── thirdPartyInspection.routes.ts           # API route definitions
├── database/
│   ├── migrations/
│   │   └── 20250131_create_third_party_inspection_tables.ts
│   └── seeds/
│       └── seed_inspection_criteria_templates.ts
└── docs/
    └── THIRD_PARTY_INSPECTION_README.md (this file)
```

---

## Complete Workflow

### 1. Inspection Request Flow

```
┌─────────────┐
│   Owner     │
│  Requests   │
│ Inspection  │
└──────┬──────┘
       │
       │ POST /api/v1/third-party-inspections
       │ {
       │   productId, categoryId, inspectionTier,
       │   scheduledAt, location, countryId, etc.
       │ }
       │
       ▼
┌─────────────────────────────────────┐
│  ThirdPartyInspectionService        │
│  .createThirdPartyInspection()      │
└──────┬──────────────────────────────┘
       │
       │ 1. Validate product exists
       │ 2. Get product category
       │
       ▼
┌─────────────────────────────────────┐
│  assignInspector()                   │
│  - Find inspectors by category      │
│  - Filter by location (GPS)          │
│  - Filter by country/region          │
│  - Rank by:                          │
│    • International recognition      │
│    • Distance                        │
│    • Rating                          │
│    • Experience                      │
└──────┬──────────────────────────────┘
       │
       │ 3. Assign inspector (or use provided)
       │ 4. Get criteria template
       │    - By category
       │    - By tier (standard/advanced)
       │    - By country/region
       │
       ▼
┌─────────────────────────────────────┐
│  Create Inspection Record            │
│  - Set status: 'pending'             │
│  - Set inspectionTier                │
│  - Set totalPoints (120 or 240)      │
│  - Store location, currency, etc.    │
└──────┬──────────────────────────────┘
       │
       │ Return inspection ID
       │
       ▼
┌─────────────┐
│  Inspector  │
│  Notified   │
└─────────────┘
```

### 2. Inspection Completion Flow

```
┌─────────────┐
│  Inspector  │
│  Completes  │
│ Inspection  │
└──────┬──────┘
       │
       │ POST /api/v1/third-party-inspections/:id/complete
       │ {
       │   scores: [
       │     { criterionId, score, maxScore, notes, evidence }
       │   ],
       │   inspectorNotes, recommendations, photos, isPassed
       │ }
       │
       ▼
┌─────────────────────────────────────┐
│  ThirdPartyInspectionService        │
│  .completeThirdPartyInspection()     │
└──────┬──────────────────────────────┘
       │
       │ 1. Get inspection record
       │ 2. Verify it's third-party inspection
       │ 3. Get criteria template
       │
       ▼
┌─────────────────────────────────────┐
│  calculateScores()                   │
│  - Sum all criterion scores          │
│  - Calculate percentage              │
│  - Map to overall rating             │
│  - Determine category scores         │
└──────┬──────────────────────────────┘
       │
       │ 4. Save individual scores
       │ 5. Update inspection with:
       │    - inspectionScore (0-100)
       │    - overallRating
       │    - status: 'completed'
       │
       ▼
┌─────────────────────────────────────┐
│  createPublicReport()                │
│  - Generate public report            │
│  - Include highlights/concerns       │
│  - Add translations (if multi-lang)  │
│  - Link to inspection                │
└──────┬──────────────────────────────┘
       │
       │ 6. Create public report
       │ 7. Update inspection with publicReportId
       │
       ▼
┌─────────────┐
│   Owner &   │
│  Public     │
│  Can View   │
│   Report    │
└─────────────┘
```

### 3. Inspector Assignment Logic

```
START: assignInspector()
│
├─► Get all inspectors with matching certification type
│   └─► Filter by category (automotive, electronics, etc.)
│
├─► Filter by location (if GPS provided)
│   ├─► Calculate distance using Haversine formula
│   ├─► Check if within service radius (default 50km)
│   └─► Sort by distance (closest first)
│
├─► Filter by country/region (if provided)
│   ├─► Check inspector certifications valid in country
│   └─► Check inspector locations in country
│
├─► Rank inspectors by priority:
│   ├─► 1. Internationally recognized certifications
│   ├─► 2. Distance (closer is better)
│   ├─► 3. Average rating (higher is better)
│   └─► 4. Total inspections (more experience)
│
└─► Return top-ranked inspector
```

### 4. Score Calculation Logic

```
START: calculateScores()
│
├─► For each criterion score:
│   ├─► Validate score ≤ maxScore
│   ├─► Calculate percentage: (score / maxScore) * 100
│   └─► Store in scores array
│
├─► Calculate total score:
│   ├─► Sum all criterion scores
│   └─► Calculate percentage: (totalScore / totalPoints) * 100
│
├─► Map to overall rating:
│   ├─► 90-100: Excellent ⭐⭐⭐⭐⭐
│   ├─► 75-89:  Good ⭐⭐⭐⭐
│   ├─► 60-74:  Fair ⭐⭐⭐
│   ├─► 45-59:  Poor ⭐⭐
│   └─► 0-44:   Very Poor ⭐
│
├─► Calculate category scores:
│   ├─► Group criteria by category
│   ├─► Sum scores per category
│   └─► Calculate category percentages
│
└─► Return ScoreCalculation object
```

---

## Database Structure

### Enhanced Tables

#### `product_inspections` (Enhanced)

```sql
-- Third-party inspection fields
is_third_party_inspection BOOLEAN DEFAULT FALSE
inspection_tier VARCHAR(20)           -- 'standard' or 'advanced'
inspection_score DECIMAL(5,2)        -- 0-100
total_points INTEGER                  -- 120 or 240
overall_rating VARCHAR(20)            -- excellent, good, fair, poor, very_poor
public_report_id UUID

-- International fields
country_id UUID
region VARCHAR(100)                   -- 'EAC', 'GCC', etc.
timezone VARCHAR(50)                  -- 'Africa/Kigali'
latitude DECIMAL(10,8)
longitude DECIMAL(11,8)
currency VARCHAR(3)                   -- 'RWF', 'USD', etc.
inspection_cost DECIMAL(10,2)
regulatory_notes JSONB
```

### New Tables

#### `inspection_criteria_templates`

Stores category-based inspection checklists:

```sql
id UUID PRIMARY KEY
category_id UUID NOT NULL
category_name VARCHAR(100)
template_name VARCHAR(200)
description TEXT
criteria JSONB NOT NULL              -- Array of criteria
inspection_tier VARCHAR(20)          -- 'standard' or 'advanced'
total_points INTEGER DEFAULT 100     -- 120 or 240

-- International support
country_id UUID                      -- NULL = global
region VARCHAR(100)
locale VARCHAR(10)                   -- 'en-US', 'rw-RW', etc.
translations JSONB                   -- Multi-language support
regulatory_compliance JSONB
is_active BOOLEAN
is_global BOOLEAN
```

**Criteria Structure (JSONB)**:
```json
[
  {
    "id": "mechanical_engine",
    "name": "Mechanical - Engine",
    "description": "Engine performance and condition",
    "maxPoints": 30,
    "category": "Mechanical",
    "required": true,
    "subCriteria": [
      {
        "id": "engine_performance",
        "name": "Engine Performance",
        "maxPoints": 20
      }
    ]
  }
]
```

#### `inspection_scores`

Stores detailed scores for each criterion:

```sql
id UUID PRIMARY KEY
inspection_id UUID NOT NULL
criterion_id VARCHAR(100)
criterion_name VARCHAR(200)
score DECIMAL(10,2)                  -- Actual score given
max_score DECIMAL(10,2)              -- Maximum possible score
percentage DECIMAL(5,2)               -- (score / max_score) * 100
notes TEXT
evidence JSONB                        -- Photos, documents
category VARCHAR(100)
```

#### `inspector_certifications`

Stores inspector qualifications:

```sql
id UUID PRIMARY KEY
inspector_id UUID NOT NULL
certification_type VARCHAR(100)      -- 'automotive', 'electronics', etc.
certification_level VARCHAR(50)      -- 'certified', 'expert', 'master'
certifying_body VARCHAR(200)
certificate_number VARCHAR(100)
issued_date DATE
expiry_date DATE
specializations JSONB

-- International support
country_id UUID
region VARCHAR(100)
valid_countries JSONB                 -- Array of country IDs
international_standard VARCHAR(100)    -- 'ISO 17020', etc.
internationally_recognized BOOLEAN

total_inspections INTEGER
average_rating DECIMAL(3,2)           -- 0-5 stars
is_active BOOLEAN
```

#### `public_inspection_reports`

Stores public-facing inspection summaries:

```sql
id UUID PRIMARY KEY
inspection_id UUID NOT NULL
product_id UUID NOT NULL
overall_score DECIMAL(5,2)
overall_rating VARCHAR(20)
category_scores JSONB                 -- Scores by category
highlights JSONB                      -- Array of highlights
concerns JSONB                        -- Array of concerns
summary TEXT
recommendations TEXT
is_passed BOOLEAN
inspection_date TIMESTAMP
expiry_date TIMESTAMP

-- International support
translations JSONB
primary_language VARCHAR(10)         -- 'en', 'rw', 'fr'
country_id UUID
region VARCHAR(100)
timezone VARCHAR(50)
regulatory_compliance JSONB

view_count INTEGER
is_public BOOLEAN
```

#### `inspector_locations`

Stores inspector location data for GPS-based matching:

```sql
id UUID PRIMARY KEY
inspector_id UUID NOT NULL
country_id UUID
city VARCHAR(100)
state_province VARCHAR(100)
postal_code VARCHAR(20)
latitude DECIMAL(10,8)
longitude DECIMAL(11,8)
service_radius_km DECIMAL(8,2) DEFAULT 50
is_primary BOOLEAN
is_active BOOLEAN
```

---

## Core Logic Explained

### 1. Inspector Assignment Algorithm

**Purpose**: Find the best inspector for a given inspection request.

**Steps**:

1. **Get Matching Inspectors**
   ```typescript
   // Find inspectors with matching certification type
   const inspectors = await getInspectorsByCategory(categoryId);
   ```

2. **Location-Based Filtering** (if GPS provided)
   ```typescript
   // Calculate distance using Haversine formula
   const distance = calculateDistance(
     inspectionLat, inspectionLon,
     inspectorLat, inspectorLon
   );
   
   // Filter by service radius
   if (distance <= inspector.serviceRadius) {
     // Inspector is available
   }
   ```

3. **Country/Region Filtering**
   ```typescript
   // Check if inspector certification is valid in country
   if (inspector.certification.validCountries.includes(countryId)) {
     // Valid in this country
   }
   
   // Or check if internationally recognized
   if (inspector.certification.internationallyRecognized) {
     // Valid everywhere
   }
   ```

4. **Ranking**
   ```typescript
   // Priority order:
   // 1. Internationally recognized (highest priority)
   // 2. Distance (closer = better)
   // 3. Average rating (higher = better)
   // 4. Total inspections (more = better)
   
   inspectors.sort((a, b) => {
     if (a.internationallyRecognized !== b.internationallyRecognized) {
       return a.internationallyRecognized ? -1 : 1;
     }
     if (a.distance !== b.distance) {
       return a.distance - b.distance;
     }
     if (a.rating !== b.rating) {
       return b.rating - a.rating;
     }
     return b.totalInspections - a.totalInspections;
   });
   ```

### 2. Template Selection Logic

**Purpose**: Get the right inspection criteria template for a category and location.

**Priority Order**:

1. **Country-Specific Template**
   ```typescript
   // Try to find template for specific country
   template = await getTemplateByCountry(categoryId, countryId);
   ```

2. **Region-Specific Template**
   ```typescript
   // If no country template, try region
   if (!template) {
     template = await getTemplateByRegion(categoryId, region);
   }
   ```

3. **Tier-Specific Template**
   ```typescript
   // Filter by inspection tier (standard/advanced)
   templates = templates.filter(t => t.inspectionTier === requestedTier);
   ```

4. **Global Template** (fallback)
   ```typescript
   // If no specific template, use global
   if (!template) {
     template = await getGlobalTemplate(categoryId);
   }
   ```

### 3. Score Calculation Logic

**Purpose**: Convert individual criterion scores into overall rating.

**Process**:

```typescript
// 1. Sum all scores
const totalScore = scores.reduce((sum, score) => sum + score.score, 0);

// 2. Calculate percentage
const percentage = (totalScore / template.totalPoints) * 100;

// 3. Map to rating
let rating: OverallRating;
if (percentage >= 90) rating = OverallRating.EXCELLENT;
else if (percentage >= 75) rating = OverallRating.GOOD;
else if (percentage >= 60) rating = OverallRating.FAIR;
else if (percentage >= 45) rating = OverallRating.POOR;
else rating = OverallRating.VERY_POOR;

// 4. Calculate category scores
const categoryScores = {};
scores.forEach(score => {
  if (!categoryScores[score.category]) {
    categoryScores[score.category] = { score: 0, maxScore: 0 };
  }
  categoryScores[score.category].score += score.score;
  categoryScores[score.category].maxScore += score.maxScore;
});
```

### 4. Distance Calculation (Haversine Formula)

**Purpose**: Calculate distance between two GPS coordinates.

```typescript
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  
  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
```

---

## API Endpoints

### Base URL
```
/api/v1/third-party-inspections
```

### 1. Create Inspection Request

**POST** `/`

**Authentication**: Required (Owner)

**Request Body**:
```json
{
  "productId": "uuid",
  "categoryId": "uuid",
  "inspectionTier": "standard",  // or "advanced"
  "scheduledAt": "2025-02-01T10:00:00Z",
  "location": "Kigali, Rwanda",
  "countryId": "rwanda-uuid",
  "region": "EAC",
  "timezone": "Africa/Kigali",
  "latitude": -1.9441,
  "longitude": 30.0619,
  "currency": "RWF",
  "inspectionCost": 20000.00,
  "preferredLanguage": "rw",
  "inspectorId": "uuid",  // Optional - auto-assigned if not provided
  "notes": "Please check engine thoroughly",
  "priority": "normal"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Third-party inspection created successfully",
  "data": {
    "id": "inspection-uuid",
    "productId": "uuid",
    "inspectorId": "uuid",
    "status": "pending",
    "inspectionTier": "standard",
    "totalPoints": 120,
    "scheduledAt": "2025-02-01T10:00:00Z",
    "createdAt": "2025-01-15T08:00:00Z"
  }
}
```

### 2. Complete Inspection

**POST** `/:id/complete`

**Authentication**: Required (Inspector, Admin)

**Request Body**:
```json
{
  "scores": [
    {
      "criterionId": "mechanical_engine",
      "criterionName": "Mechanical - Engine",
      "score": 28,
      "maxScore": 30,
      "notes": "Engine runs smoothly, no leaks detected",
      "evidence": {
        "photos": ["url1", "url2"]
      },
      "category": "Mechanical"
    }
  ],
  "inspectorNotes": "Overall condition is excellent",
  "recommendations": "Regular maintenance recommended",
  "photos": ["url1", "url2", "url3"],
  "isPassed": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "Inspection completed successfully",
  "data": {
    "inspection": {
      "id": "uuid",
      "inspectionScore": 92.5,
      "overallRating": "excellent",
      "status": "completed"
    },
    "publicReport": {
      "id": "report-uuid",
      "overallScore": 92.5,
      "overallRating": "excellent"
    }
  }
}
```

### 3. Get Criteria Template

**GET** `/criteria/:categoryId`

**Query Parameters**:
- `countryId` (optional): Filter by country
- `region` (optional): Filter by region
- `locale` (optional): Language preference
- `inspectionTier` (optional): "standard" or "advanced"

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "template-uuid",
    "categoryId": "uuid",
    "templateName": "Standard Vehicle Inspection (120-Point)",
    "inspectionTier": "standard",
    "totalPoints": 120,
    "criteria": [
      {
        "id": "mechanical_engine",
        "name": "Mechanical - Engine",
        "maxPoints": 30,
        "category": "Mechanical"
      }
    ]
  }
}
```

### 4. Get Public Report

**GET** `/public-reports/:productId`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "report-uuid",
    "productId": "uuid",
    "overallScore": 92.5,
    "overallRating": "excellent",
    "highlights": ["Engine in excellent condition", "No visible damage"],
    "concerns": [],
    "isPassed": true,
    "inspectionDate": "2025-02-01T10:00:00Z"
  }
}
```

---

## Usage Examples

### Example 1: Create Standard Inspection in Rwanda

```typescript
// Frontend code
const createInspection = async () => {
  const response = await fetch('/api/v1/third-party-inspections', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      productId: 'product-uuid',
      categoryId: 'car-category-uuid',
      inspectionTier: 'standard',
      scheduledAt: '2025-02-01T10:00:00Z',
      location: 'Kigali, Rwanda',
      countryId: 'rwanda-uuid',
      region: 'EAC',
      timezone: 'Africa/Kigali',
      latitude: -1.9441,
      longitude: 30.0619,
      currency: 'RWF',
      inspectionCost: 20000,
      preferredLanguage: 'rw'
    })
  });
  
  const result = await response.json();
  console.log('Inspection created:', result.data);
};
```

### Example 2: Inspector Completes Inspection

```typescript
// Inspector dashboard code
const completeInspection = async (inspectionId: string) => {
  const scores = [
    {
      criterionId: 'mechanical_engine',
      criterionName: 'Mechanical - Engine',
      score: 28,
      maxScore: 30,
      notes: 'Engine runs smoothly',
      category: 'Mechanical'
    },
    {
      criterionId: 'electrical_systems',
      criterionName: 'Electrical Systems',
      score: 24,
      maxScore: 25,
      notes: 'All electrical components working',
      category: 'Electrical'
    }
    // ... more scores
  ];
  
  const response = await fetch(`/api/v1/third-party-inspections/${inspectionId}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${inspectorToken}`
    },
    body: JSON.stringify({
      scores,
      inspectorNotes: 'Overall excellent condition',
      recommendations: 'Regular maintenance recommended',
      isPassed: true
    })
  });
  
  const result = await response.json();
  console.log('Inspection completed:', result.data);
};
```

### Example 3: Display Public Report

```typescript
// Product listing page
const getPublicReport = async (productId: string) => {
  const response = await fetch(`/api/v1/third-party-inspections/public-reports/${productId}`);
  const result = await response.json();
  
  if (result.success && result.data) {
    const report = result.data;
    console.log(`Product Rating: ${report.overallRating} (${report.overallScore}/100)`);
    console.log('Highlights:', report.highlights);
    console.log('Concerns:', report.concerns);
  }
};
```

---

## Integration Points

### 1. Product Listings

Display inspection badge and rating:

```typescript
// Product card component
{product.publicReportId && (
  <div className="inspection-badge">
    <span>✅ Professionally Inspected</span>
    <span>{report.overallRating} ⭐⭐⭐⭐⭐</span>
    <Link to={`/inspections/${product.publicReportId}`}>
      View Report
    </Link>
  </div>
)}
```

### 2. Booking Flow

Show inspection report before booking:

```typescript
// Booking page
{product.inspectionReport && (
  <div className="inspection-summary">
    <h3>Professional Inspection Report</h3>
    <p>Rating: {report.overallRating}</p>
    <p>Score: {report.overallScore}/100</p>
    <button onClick={() => viewFullReport(report.id)}>
      View Full Report
    </button>
  </div>
)}
```

### 3. Risk Management

Use inspection scores in risk assessment:

```typescript
// Risk management service
const calculateProductRisk = (product) => {
  let riskScore = baseRiskScore;
  
  if (product.inspectionReport) {
    // Lower risk if professionally inspected
    if (product.inspectionReport.overallRating === 'excellent') {
      riskScore -= 20;
    } else if (product.inspectionReport.overallRating === 'good') {
      riskScore -= 10;
    }
  }
  
  return riskScore;
};
```

### 4. Dispute Resolution

Reference professional inspection in disputes:

```typescript
// Dispute resolution
if (dispute.inspectionReportId) {
  const report = await getPublicReport(dispute.productId);
  // Use report as evidence in dispute resolution
}
```

---

## Configuration

### Environment Variables

```env
# Inspection settings
INSPECTION_DEFAULT_TIER=standard
INSPECTION_DEFAULT_COST=20000
INSPECTION_DEFAULT_CURRENCY=RWF
INSPECTION_DEFAULT_TIMEZONE=Africa/Kigali

# Inspector settings
INSPECTOR_DEFAULT_SERVICE_RADIUS=50  # kilometers
INSPECTOR_MIN_RATING=3.0
```

### Default Values

- **Default Tier**: `standard` (120-point)
- **Default Service Radius**: 50 km
- **Default Currency**: RWF (Rwandan Franc)
- **Default Timezone**: Africa/Kigali
- **Default Language**: Kinyarwanda (rw)

### Rwanda-Specific Configuration

```typescript
// config/rwanda.ts
export const RWANDA_CONFIG = {
  countryId: 'rwanda-uuid',
  currency: 'RWF',
  timezone: 'Africa/Kigali',
  region: 'EAC',
  languages: ['rw', 'en', 'fr'],
  defaultLanguage: 'rw',
  pricing: {
    standard: { min: 15000, max: 25000 },
    advanced: { min: 30000, max: 50000 }
  }
};
```

---

## Summary

This third-party inspection system provides:

1. **Professional Inspections**: Certified inspectors conduct impartial evaluations
2. **Standardized Criteria**: Category-based templates ensure consistency
3. **Flexible Tiers**: Standard (120-point) and Advanced (240-point) options
4. **Location-Based Assignment**: Inspectors matched by proximity and availability
5. **International Support**: Multi-country, multi-language, multi-currency
6. **Public Reports**: Transparent results build trust
7. **Integration Ready**: Works seamlessly with existing product and booking systems

The system follows Dubizzle's QualityAssist model while being fully adapted for Rwanda and global operations.

---

## References

- **Dubizzle QualityAssist**: https://support.dubizzle.com/hc/en-us/articles/4408110804241-QualityAssist-Pre-purchase-car-inspections
- **Dubizzle Dubai**: https://dubai.dubizzle.com/
- **ISO 17020 Standards**: International standards for inspection bodies
- **Rwanda Standards Board**: https://www.rsb.gov.rw/

---

**Last Updated**: January 2025
**Version**: 1.0.0

