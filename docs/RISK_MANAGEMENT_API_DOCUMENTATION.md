# Risk Management API Documentation

## 🎯 Overview

The Risk Management API provides comprehensive risk assessment, compliance checking, and policy enforcement capabilities for the UrutiBiz platform. This system ensures platform safety by implementing mandatory insurance and inspection requirements for high-risk items.

## 🔗 Base URL

```
http://localhost:5000/api/v1/risk-management
```

## 🔐 Authentication

All endpoints require authentication via JWT Bearer token:

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

## 📋 API Endpoints

### 1. **Risk Profile Management**

#### **Create Risk Profile**
```http
POST /api/v1/risk-management/profiles
```

**Description**: Create a new risk profile for a product

**Authorization**: Admin, Super Admin

**Request Body**:
```json
{
  "productId": "uuid",
  "categoryId": "uuid", 
  "riskLevel": "low|medium|high|critical",
  "mandatoryRequirements": {
    "insurance": true,
    "inspection": true,
    "minCoverage": 10000,
    "inspectionTypes": ["pre_rental", "post_return"],
    "complianceDeadlineHours": 24
  },
  "riskFactors": ["High value item", "Expensive to replace"],
  "mitigationStrategies": ["Insurance coverage", "Pre-rental inspection"],
  "enforcementLevel": "moderate|strict|very_strict",
  "autoEnforcement": true,
  "gracePeriodHours": 2
}
```

**Response**:
```json
{
  "success": true,
  "message": "Risk profile created successfully",
  "data": {
    "id": "uuid",
    "productId": "uuid",
    "riskLevel": "critical",
    "mandatoryRequirements": { ... },
    "riskFactors": [ ... ],
    "mitigationStrategies": [ ... ],
    "enforcementLevel": "very_strict",
    "createdAt": "2025-01-05T10:00:00Z"
  }
}
```

#### **Get Risk Profile by Product**
```http
GET /api/v1/risk-management/profiles/product/{productId}
```

**Description**: Retrieve the risk profile for a specific product

**Authorization**: Authenticated users

**Response**:
```json
{
  "success": true,
  "message": "Risk profile retrieved successfully",
  "data": {
    "id": "uuid",
    "productId": "uuid",
    "riskLevel": "critical",
    "mandatoryRequirements": {
      "insurance": true,
      "inspection": true,
      "minCoverage": 200000,
      "inspectionTypes": ["pre_rental", "post_return", "damage_assessment"],
      "complianceDeadlineHours": 4
    },
    "riskFactors": ["Vehicle/Heavy equipment", "Extremely high liability"],
    "mitigationStrategies": ["Comprehensive insurance", "Professional inspections"],
    "enforcementLevel": "very_strict",
    "autoEnforcement": true,
    "gracePeriodHours": 1
  }
}
```

#### **Bulk Create Risk Profiles**
```http
POST /api/v1/risk-management/profiles/bulk
```

**Description**: Create multiple risk profiles in a single operation

**Authorization**: Admin, Super Admin

**Request Body**:
```json
{
  "profiles": [
    {
      "productId": "uuid",
      "categoryId": "uuid",
      "riskLevel": "critical",
      "mandatoryRequirements": { ... }
    },
    {
      "productId": "uuid2", 
      "categoryId": "uuid",
      "riskLevel": "medium",
      "mandatoryRequirements": { ... }
    }
  ]
}
```

### 2. **Risk Assessment**

#### **Perform Risk Assessment**
```http
POST /api/v1/risk-management/assess
```

**Description**: Assess the risk level for a product-renter combination

**Authorization**: Authenticated users

**Request Body**:
```json
{
  "productId": "uuid",
  "renterId": "uuid",
  "bookingId": "uuid",
  "includeRecommendations": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "Risk assessment completed successfully",
  "data": {
    "productId": "uuid",
    "renterId": "uuid",
    "bookingId": "uuid",
    "overallRiskScore": 85,
    "riskFactors": {
      "productRisk": 90,
      "renterRisk": 30,
      "bookingRisk": 20,
      "seasonalRisk": 15
    },
    "recommendations": [
      "Mandatory insurance coverage required",
      "Pre-rental inspection mandatory",
      "Consider additional security deposit"
    ],
    "mandatoryRequirements": {
      "insurance": true,
      "inspection": true,
      "minCoverage": 200000,
      "inspectionTypes": ["pre_rental", "post_return", "damage_assessment"]
    },
    "complianceStatus": "pending",
    "assessmentDate": "2025-01-05T10:00:00Z",
    "expiresAt": "2025-01-06T10:00:00Z"
  }
}
```

#### **Bulk Risk Assessment**
```http
POST /api/v1/risk-management/assess/bulk
```

**Description**: Perform risk assessment for multiple product-renter combinations

**Authorization**: Authenticated users

### 3. **Compliance Checking**

#### **Check Compliance**
```http
POST /api/v1/risk-management/compliance/check
```

**Description**: Check if a booking meets all mandatory requirements

**Authorization**: Authenticated users

**Request Body**:
```json
{
  "bookingId": "uuid",
  "productId": "uuid",
  "renterId": "uuid",
  "forceCheck": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "Compliance check completed successfully",
  "data": {
    "bookingId": "uuid",
    "productId": "uuid",
    "renterId": "uuid",
    "isCompliant": false,
    "missingRequirements": ["MISSING_INSURANCE", "MISSING_INSPECTION"],
    "complianceScore": 50,
    "status": "non_compliant",
    "enforcementActions": [
      {
        "id": "uuid",
        "type": "REQUIRE_INSURANCE",
        "severity": "HIGH",
        "message": "Insurance is mandatory for this product",
        "requiredAction": "Purchase insurance coverage",
        "deadline": "2025-01-05T16:00:00Z",
        "status": "PENDING"
      }
    ],
    "lastCheckedAt": "2025-01-05T10:00:00Z"
  }
}
```

#### **Get Compliance Status**
```http
GET /api/v1/risk-management/compliance/booking/{bookingId}
```

**Description**: Retrieve the current compliance status for a specific booking

**Authorization**: Authenticated users

### 4. **Policy Violation Management**

#### **Record Policy Violation**
```http
POST /api/v1/risk-management/violations
```

**Description**: Record a policy violation and determine appropriate enforcement actions

**Authorization**: Admin, Super Admin, Inspector

**Request Body**:
```json
{
  "bookingId": "uuid",
  "productId": "uuid",
  "renterId": "uuid",
  "violationType": "missing_insurance|missing_inspection|inadequate_coverage|expired_compliance",
  "severity": "low|medium|high|critical",
  "description": "Missing insurance coverage for high-value vehicle",
  "penaltyAmount": 100
}
```

**Response**:
```json
{
  "success": true,
  "message": "Policy violation recorded successfully",
  "data": {
    "id": "uuid",
    "bookingId": "uuid",
    "productId": "uuid",
    "renterId": "uuid",
    "violationType": "missing_insurance",
    "severity": "high",
    "description": "Missing insurance coverage for high-value vehicle",
    "detectedAt": "2025-01-05T10:00:00Z",
    "penaltyAmount": 100,
    "status": "active"
  }
}
```

### 5. **Automated Enforcement**

#### **Trigger Enforcement**
```http
POST /api/v1/risk-management/enforce
```

**Description**: Trigger automated enforcement actions for a booking

**Authorization**: Admin, Super Admin

**Request Body**:
```json
{
  "bookingId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Enforcement triggered successfully",
  "data": {
    "compliance": {
      "isCompliant": false,
      "missingRequirements": ["MISSING_INSURANCE"],
      "complianceScore": 75
    },
    "violationsRecorded": 1
  }
}
```

### 6. **Statistics and Analytics**

#### **Get Risk Management Statistics**
```http
GET /api/v1/risk-management/stats
```

**Description**: Retrieve comprehensive statistics about risk management

**Authorization**: Admin, Super Admin

**Response**:
```json
{
  "success": true,
  "message": "Risk management statistics retrieved successfully",
  "data": {
    "totalRiskProfiles": 28,
    "complianceRate": 85.5,
    "violationRate": 12.3,
    "averageRiskScore": 45.2,
    "enforcementActions": {
      "total": 150,
      "successful": 120,
      "failed": 20,
      "pending": 10
    },
    "riskDistribution": {
      "low": 20,
      "medium": 4,
      "high": 0,
      "critical": 4
    }
  }
}
```

## 🧪 **Testing Examples**

### **1. Test Risk Assessment**
```bash
curl -X POST http://localhost:5000/api/v1/risk-management/assess \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "productId": "PRODUCT_UUID",
    "renterId": "USER_UUID",
    "includeRecommendations": true
  }'
```

### **2. Test Compliance Check**
```bash
curl -X POST http://localhost:5000/api/v1/risk-management/compliance/check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "bookingId": "BOOKING_UUID",
    "productId": "PRODUCT_UUID", 
    "renterId": "USER_UUID",
    "forceCheck": true
  }'
```

### **3. Test Risk Profile Retrieval**
```bash
curl -X GET http://localhost:5000/api/v1/risk-management/profiles/product/PRODUCT_UUID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **4. Test Statistics**
```bash
curl -X GET http://localhost:5000/api/v1/risk-management/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📊 **Sample Data Available**

The system now includes **8 high-value products** with risk profiles:

| Product | Price/Day | Risk Level | Insurance Required | Min Coverage |
|---------|-----------|------------|-------------------|--------------|
| BMW X5 Luxury SUV | $500 | CRITICAL | ✅ YES | $200,000 |
| MacBook Pro M3 Max | $120 | CRITICAL | ✅ YES | $50,000 |
| Professional Camera Kit | $120 | CRITICAL | ✅ YES | $50,000 |
| Construction Excavator | $500 | CRITICAL | ✅ YES | $200,000 |
| Electric Bike Premium | $45 | MEDIUM | ✅ YES | $10,000 |
| Gaming Console Bundle | $35 | MEDIUM | ✅ YES | $10,000 |
| Designer Handbag | $35 | MEDIUM | ✅ YES | $10,000 |
| Power Tools Set | $35 | MEDIUM | ✅ YES | $10,000 |

## 🚀 **Getting Started**

1. **Start the server**: `npm run dev`
2. **Get a JWT token**: Login via `/api/v1/auth/login`
3. **Test the APIs**: Use the provided curl examples or Postman
4. **Run the test script**: `node test-risk-assessment-api.js`

## 🔧 **Error Handling**

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

**Common HTTP Status Codes**:
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## 📝 **Notes**

- All timestamps are in ISO 8601 format (UTC)
- UUIDs are used for all entity identifiers
- Risk scores range from 0-100
- Compliance scores range from 0-100
- All monetary amounts are in USD
- Risk levels: `low`, `medium`, `high`, `critical`
- Enforcement levels: `lenient`, `moderate`, `strict`, `very_strict`
