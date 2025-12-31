# Global Third-Party Inspection System

## Overview

The third-party inspection system has been enhanced to support international and global operations, following **Dubizzle's QualityAssist** model ([dubai.dubizzle.com](https://dubai.dubizzle.com/)). The system now supports:

**Reference**: [Dubizzle QualityAssist Documentation](https://support.dubizzle.com/hc/en-us/articles/4408110804241-QualityAssist-Pre-purchase-car-inspections)

- **Multi-Country Operations**: Country-specific templates, certifications, and regulations
- **Regional Support**: Regional templates and certifications (EU, GCC, APAC, MEA, etc.)
- **Location-Based Inspector Assignment**: GPS-based matching of inspectors to inspection locations
- **Multi-Language Support**: Reports and templates can be translated into multiple languages
- **International Certifications**: Support for internationally recognized certifications (ISO 17020, IAC, NABL, etc.)
- **Currency Support**: Inspection costs in local currencies
- **Timezone Handling**: Proper timezone support for scheduling and reporting
- **Regulatory Compliance**: Country/region-specific regulatory compliance tracking

## Key Features (Aligned with Dubizzle's Model)

### 1. Location-Based Inspector Assignment

**Dubizzle Approach**: Inspectors are assigned based on location to ensure timely and efficient inspections. The system matches inspectors with vehicles/products based on proximity and availability.

The system uses GPS coordinates (latitude/longitude) to find nearby inspectors:

- **Haversine Formula**: Calculates distance between inspection location and inspector locations
- **Service Radius**: Each inspector can define their service radius (default: 50km)
- **Fallback Logic**: If no nearby inspector is found, the system falls back to internationally recognized inspectors
- **Priority Ranking**: 
  1. Internationally recognized certifications
  2. Distance (closer is better)
  3. Inspector rating
  4. Total inspections completed

### 2. Country & Region-Specific Templates

**Dubizzle Model**: Templates adapt to local regulations and standards. For example, Dubai/UAE inspections follow GCC standards, while maintaining international quality benchmarks.

Inspection criteria templates can be:
- **Global**: Available everywhere (`isGlobal = true` or `countryId = null`)
- **Country-Specific**: Valid only for a specific country (e.g., UAE-specific templates for Dubai)
- **Region-Specific**: Valid for a region (EU, GCC, APAC, MEA, etc.)

Template selection priority:
1. Country-specific template (e.g., UAE/Dubai)
2. Region-specific template (e.g., GCC)
3. Global template

### 3. International Certifications (Dubizzle's Professional Standards)

**Dubizzle Reference**: QualityAssist uses certified inspectors who adhere to international standards, ensuring independence, impartiality, and integrity.

Inspector certifications support:
- **Country Validity**: Certifications valid in specific countries (e.g., UAE certifications for Dubai operations)
- **Regional Validity**: Certifications valid in regions (EU, GCC, etc.)
- **International Recognition**: Certifications recognized globally (ISO 17020, IAC, NABL)
- **Valid Countries List**: Array of country IDs where certification is valid
- **International Standards**: Support for international standards (ISO 17020, IAC, NABL)
- **Professional Requirements**: Inspectors must maintain confidentiality, independence, impartiality, and integrity (as per ISO 17020)

### 4. Multi-Language Support (Dubizzle's Multi-Lingual Approach)

**Dubizzle Model**: Reports and interfaces support multiple languages to serve diverse markets (English, Arabic, etc.).

- **Report Translations**: Public inspection reports can be translated into multiple languages
- **Template Translations**: Criteria templates support multi-language descriptions
- **Primary Language**: Each report has a primary language (default: "en")
- **Translation Structure**: `{ "en": {...}, "ar": {...}, "fr": {...} }`
- **Dubizzle Reference**: Supports English and Arabic for UAE/Dubai market

### 5. Currency & Pricing (Dubizzle's Pricing Model)

**Dubizzle Reference**: QualityAssist offers different inspection packages (Standard 120-point, Advanced 240-point) with transparent pricing in local currency.

- **Local Currency**: Each inspection can specify a currency code (USD, EUR, AED, etc.)
- **Inspection Cost**: Cost stored in local currency (AED for Dubai/UAE)
- **Currency Field**: ISO 4217 currency codes (3 letters)
- **Inspection Packages**: Support for standard and advanced inspection tiers (similar to Dubizzle's 120-point and 240-point inspections)

### 6. Timezone Support

- **Inspection Timezone**: Each inspection can specify its timezone
- **Scheduling**: Proper timezone handling for scheduled inspections
- **Reports**: Timezone information stored in public reports

### 7. Regulatory Compliance

- **Country-Specific Rules**: Templates can include country/region-specific compliance requirements
- **Regulatory Notes**: Inspections can include regulatory compliance notes
- **Compliance Tracking**: JSONB field for storing compliance data

## Database Schema

### New Tables

#### `inspector_locations`
Stores inspector location information for location-based matching:
- `inspector_id`: Inspector user ID
- `country_id`: Country where inspector operates
- `city`, `state_province`, `postal_code`: Address details
- `latitude`, `longitude`: GPS coordinates
- `service_radius_km`: Service radius in kilometers (default: 50km)
- `is_primary`: Primary location flag
- `is_active`: Active status

### Enhanced Tables

#### `product_inspections`
Added international fields:
- `country_id`: Country where inspection is performed
- `region`: Region (EU, GCC, APAC, MEA)
- `timezone`: Timezone of inspection location
- `latitude`, `longitude`: GPS coordinates
- `currency`: Currency code (ISO 4217)
- `inspection_cost`: Cost in local currency
- `regulatory_notes`: JSONB for compliance notes

#### `inspection_criteria_templates`
Added international fields:
- `country_id`: NULL = global, specific UUID = country-specific
- `region`: Regional template (EU, NA, APAC, MEA)
- `locale`: Locale code (en-US, ar-AE, fr-FR)
- `translations`: JSONB for multi-language support
- `regulatory_compliance`: JSONB for compliance requirements
- `is_global`: Global template flag

#### `inspector_certifications`
Added international fields:
- `country_id`: Country where certification is valid
- `region`: Regional validity (EU, GCC)
- `valid_countries`: JSONB array of country IDs
- `international_standard`: Standard name (ISO 17020, IAC, NABL)
- `internationally_recognized`: Boolean flag

#### `public_inspection_reports`
Added international fields:
- `translations`: JSONB for multi-language content
- `primary_language`: Primary language code (default: "en")
- `country_id`: Country where inspection was performed
- `region`: Region where inspection was performed
- `timezone`: Timezone of inspection location
- `regulatory_compliance`: JSONB for compliance data

## API Usage Examples

### Create Inspection with Location

```typescript
POST /api/v1/third-party-inspections
{
  "productId": "uuid",
  "categoryId": "uuid",
  "scheduledAt": "2025-02-01T10:00:00Z",
  "location": "Dubai, UAE",
  "countryId": "uae-uuid",
  "region": "GCC",
  "timezone": "Asia/Dubai",
  "latitude": 25.2048,
  "longitude": 55.2708,
  "currency": "AED",
  "inspectionCost": 500.00,
  "preferredLanguage": "en"
}
```

### Get Template with Country/Region

```typescript
GET /api/v1/third-party-inspections/criteria/:categoryId?countryId=uae-uuid&region=GCC&locale=en
```

### Find Nearby Inspectors

The system automatically finds nearby inspectors when creating an inspection. The assignment algorithm:
1. Finds inspectors with matching certification type
2. Filters by country/region validity
3. Finds inspectors within service radius
4. Ranks by: international recognition > distance > rating > experience

## Implementation Notes

### Location-Based Matching

The system uses the Haversine formula to calculate distances:

```typescript
distance = 6371 * acos(
  cos(radians(lat1)) * 
  cos(radians(lat2)) * 
  cos(radians(lon2) - radians(lon1)) + 
  sin(radians(lat1)) * 
  sin(radians(lat2))
)
```

For production, consider using PostGIS extension for better performance with spatial indexes.

### Template Selection Logic

1. Try country-specific template
2. Try region-specific template
3. Fallback to global template (`isGlobal = true` or `countryId = null`)

### Inspector Assignment Priority

1. **Internationally Recognized**: Certifications recognized globally
2. **Distance**: Closer inspectors preferred (if within service radius)
3. **Rating**: Higher average rating preferred
4. **Experience**: More total inspections preferred

## Future Enhancements

1. **PostGIS Integration**: Use PostGIS for better spatial queries
2. **Language Detection**: Auto-detect user language for reports
3. **Currency Conversion**: Real-time currency conversion for cost display
4. **Regional Pricing**: Different pricing tiers by region
5. **Inspector Networks**: Support for inspector networks/agencies
6. **Cross-Border Inspections**: Support for inspections across country borders
7. **Regulatory API**: Integration with regulatory compliance APIs
8. **Multi-Currency Reports**: Display costs in multiple currencies

## Migration

Run the migration to add international support:

```bash
npm run migrate
```

The migration adds:
- New columns to existing tables
- New `inspector_locations` table
- Indexes for performance

## Testing

Test the global features:

1. **Location-Based Assignment**: Create inspection with coordinates, verify nearby inspector is assigned
2. **Country Templates**: Create country-specific template, verify it's selected
3. **International Certifications**: Create internationally recognized certification, verify it's prioritized
4. **Multi-Language**: Create report with translations, verify language switching works
5. **Currency**: Create inspection with currency, verify cost is stored correctly

## Support

For questions or issues with the global inspection system, refer to:
- `THIRD_PARTY_INSPECTION_SYSTEM.md`: Base system documentation
- `THIRD_PARTY_INSPECTION_IMPLEMENTATION.md`: Implementation details
- `DUBIZZLE_INSPECTION_REFERENCE.md`: Detailed reference to Dubizzle's QualityAssist model

## References

- **Dubizzle QualityAssist**: [QualityAssist Pre-purchase Car Inspections](https://support.dubizzle.com/hc/en-us/articles/4408110804241-QualityAssist-Pre-purchase-car-inspections)
- **Dubizzle Dubai**: [dubai.dubizzle.com](https://dubai.dubizzle.com/)
- **ISO 17020 Standards**: International standards for inspection bodies ensuring confidentiality, independence, impartiality, and integrity

