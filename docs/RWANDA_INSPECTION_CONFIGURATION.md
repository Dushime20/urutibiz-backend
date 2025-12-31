# Rwanda Third-Party Inspection System Configuration

## Overview

This document outlines the Rwanda-specific configuration for the third-party inspection system, adapted from Dubizzle's QualityAssist model to work seamlessly in Rwanda.

## Rwanda Country Details

- **Country Code**: RW
- **Country Code (Alpha-3)**: RWA
- **Currency**: RWF (Rwandan Franc)
- **Currency Symbol**: FRw
- **Timezone**: Africa/Kigali (UTC+2)
- **Phone Prefix**: +250
- **Languages**: 
  - Kinyarwanda (rw) - Primary
  - English (en) - Secondary
  - French (fr) - Secondary

## Inspection System Configuration

### 1. Currency & Pricing

**Standard Inspection (120-point)**
- Cost: 15,000 - 25,000 RWF (approximately $15-25 USD)
- Suitable for most rental items

**Advanced Inspection (240-point)**
- Cost: 30,000 - 50,000 RWF (approximately $30-50 USD)
- For high-value items or detailed assessments

### 2. Language Support

Inspection reports and templates support:
- **Kinyarwanda (rw)**: Primary language for local users
- **English (en)**: For international users and business
- **French (fr)**: For French-speaking users

### 3. Location-Based Services

**Major Cities in Rwanda:**
- Kigali (Capital): -1.9441, 30.0619
- Butare: -2.5967, 29.7394
- Gisenyi: -1.7028, 29.2564
- Ruhengeri: -1.4997, 29.6344
- Byumba: -1.5781, 30.0681

**Service Radius**: Default 50km (can be adjusted per inspector)

### 4. Regional Classification

Rwanda is classified as:
- **Region**: EAC (East African Community)
- **Sub-region**: East Africa
- **Timezone**: Africa/Kigali (CAT - Central Africa Time)

### 5. Regulatory Compliance

**Rwanda-Specific Requirements:**
- All inspections must comply with Rwanda Standards Board (RSB) guidelines
- Inspectors should be certified by relevant professional bodies
- Reports must be in at least one official language (Kinyarwanda, English, or French)
- Vehicle inspections must comply with Rwanda Revenue Authority (RRA) requirements
- Electronics inspections should reference RSB standards

## Inspection Templates for Rwanda

### Standard Vehicle Inspection (120-point)
- Adapted for Rwanda road conditions
- Includes checks for:
  - Roadworthiness (Rwanda-specific requirements)
  - Import documentation (if applicable)
  - Insurance compliance (Rwanda Motor Vehicle Insurance)
  - Environmental compliance (emission standards)

### Advanced Vehicle Inspection (240-point)
- Extended diagnostic tests
- Detailed component analysis
- Full documentation review
- Compliance verification

### Electronics Inspection
- Voltage compatibility (220V, 50Hz - Rwanda standard)
- Power adapter requirements
- Warranty validation
- Import documentation (if applicable)

### General Product Inspection
- Condition assessment
- Functionality checks
- Documentation verification
- Safety compliance

## Inspector Requirements

### Certification
- Professional certification preferred
- Experience in relevant field
- Knowledge of Rwanda regulations
- Language proficiency (at least English or Kinyarwanda)

### Location
- Inspectors should be registered in major cities
- Service radius typically 50km
- Can expand to cover entire country

## API Usage for Rwanda

### Create Inspection in Rwanda

```typescript
POST /api/v1/third-party-inspections
{
  "productId": "uuid",
  "categoryId": "uuid",
  "inspectionTier": "standard", // or "advanced"
  "scheduledAt": "2025-02-01T10:00:00Z",
  "location": "Kigali, Rwanda",
  "countryId": "rwanda-uuid", // Get from countries table
  "region": "EAC",
  "timezone": "Africa/Kigali",
  "latitude": -1.9441,
  "longitude": 30.0619,
  "currency": "RWF",
  "inspectionCost": 20000.00,
  "preferredLanguage": "rw" // or "en" or "fr"
}
```

### Get Rwanda-Specific Template

```typescript
GET /api/v1/third-party-inspections/criteria/:categoryId?countryId=rwanda-uuid&locale=rw
```

## Pricing Recommendations

Based on Rwanda market conditions:

| Inspection Type | Price Range (RWF) | Price Range (USD) |
|----------------|-------------------|-------------------|
| Standard (120-point) | 15,000 - 25,000 | $15 - $25 |
| Advanced (240-point) | 30,000 - 50,000 | $30 - $50 |
| Electronics | 10,000 - 20,000 | $10 - $20 |
| Furniture | 10,000 - 15,000 | $10 - $15 |
| General Products | 8,000 - 15,000 | $8 - $15 |

*Note: Prices should be adjusted based on market conditions and inspector availability*

## Implementation Steps

1. **Get Rwanda Country ID**
   ```sql
   SELECT id FROM countries WHERE code = 'RW';
   ```

2. **Create Rwanda-Specific Templates**
   - Run seed file with Rwanda country ID
   - Templates will be created with Rwanda-specific translations

3. **Register Inspectors**
   - Add inspector locations in Rwanda
   - Set service radius (default 50km)
   - Specify certifications

4. **Test Inspection Flow**
   - Create test inspection with Rwanda country ID
   - Verify template selection
   - Check language support
   - Validate pricing in RWF

## Language Translations

### Template Names (Kinyarwanda)
- Standard Vehicle Inspection: "Gukemura Imodoka (120-Point)"
- Advanced Vehicle Inspection: "Gukemura Imodoka (240-Point)"
- Electronics Inspection: "Gukemura Ibyuma bya Elekitironiki"
- Furniture Inspection: "Gukemura Ibikoresho by'Inzu"

### Common Terms
- Inspection: "Gukemura"
- Inspector: "Umukemuzi"
- Report: "Raporo"
- Standard: "Risanzwe"
- Advanced: "Byihuse"

## Support

For Rwanda-specific questions:
- Check `GLOBAL_INSPECTION_SYSTEM.md` for international features
- Refer to `DUBIZZLE_INSPECTION_REFERENCE.md` for model reference
- Contact Rwanda Standards Board (RSB) for regulatory questions

## References

- **Rwanda Standards Board**: https://www.rsb.gov.rw/
- **Rwanda Revenue Authority**: https://www.rra.gov.rw/
- **East African Community**: https://www.eac.int/

