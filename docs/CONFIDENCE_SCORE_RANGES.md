# Confidence Score Ranges - Complete Reference

This document outlines all confidence/similarity score ranges used throughout the verification system.

---

## 1. Face-API Similarity Score (Face Comparison)

**Location**: `src/services/faceApiComparison.service.ts`

### Similarity Score Range
- **Minimum**: `0.0` (0%)
- **Maximum**: `1.0` (100%)
- **Calculation**: `similarity = 1 - distance`
- **Clamped**: `Math.max(0, Math.min(1, similarity))`

### Distance Range
- **Minimum**: `0.0` (perfect match)
- **Maximum**: `2.0` (completely different)
- **Valid Range Check**: `distance >= 0 && distance <= 2`

### Match Thresholds
- **Is Match**: `distance < 0.6` (similarity > 0.4 or 40%)
- **Auto-Verify**: `similarity > 0.75` (75%) AND `isMatch = true`
- **Auto-Reject**: `similarity < 0.55` (55%)
- **Pending Review**: `0.55 <= similarity <= 0.75` (55% - 75%)

**Code Reference**:
```typescript
// Line 116-119 in faceApiComparison.service.ts
const isMatch = distance < 0.6;
let similarity = 1 - distance;
similarity = Math.max(0, Math.min(1, similarity)); // Clamp to [0, 1]
```

**Code Reference**:
```typescript
// Lines 566-575 in userVerification.service.ts
if (aiComparisonResult.isMatch && aiComparisonResult.similarity > 0.75) {
  verificationStatus = 'verified';  // > 75%
} else if (aiComparisonResult.similarity < 0.55) {
  verificationStatus = 'rejected'; // < 55%
} else {
  verificationStatus = 'pending';   // 55% - 75%
}
```

---

## 2. Liveness Score

**Location**: `src/services/userVerification.service.ts`

### Score Range
- **Minimum**: `0.0` (0%)
- **Maximum**: `1.0` (100%) or `100` (depending on implementation)
- **Documentation mentions**: `0-100` scale

### Thresholds
- **Minimum for Auto-Verify**: `> 0.7` (70%)
- **Below Threshold**: `<= 0.7` (70%) → Requires manual review

**Code Reference**:
```typescript
// Line 425 in userVerification.service.ts
(!aiResults.livenessScore || aiResults.livenessScore > 0.7)
```

**Documentation Reference** (USER_VERIFICATION_FLOW.md):
- Minimum threshold: **70**
- Ensures real person, not photo

---

## 3. AI Profile Score (Face Matching)

**Location**: `src/services/userVerification.service.ts`

### Score Range
- **Minimum**: `0.0` (0%)
- **Maximum**: `1.0` (100%)

### Thresholds
- **Minimum for Auto-Verify**: `> 0.8` (80%)
- **Below Threshold**: `<= 0.8` (80%) → Requires manual review

**Code Reference**:
```typescript
// Line 426 in userVerification.service.ts
(!aiResults.profileScore || aiResults.profileScore > 0.8)
```

**Documentation Reference** (USER_VERIFICATION_FLOW.md):
- Minimum threshold: **80**
- Face in document matches selfie

---

## 4. OCR Confidence Score

**Location**: `src/services/userVerification.service.ts`

### Score Range
- **Minimum**: `0.0` (0%)
- **Maximum**: `1.0` (100%)

### Thresholds
- **Minimum for Auto-Verify**: `> 0.85` (85%)
- **Below Threshold**: `<= 0.85` (85%) → Requires manual review

**Code Reference**:
```typescript
// Line 427 in userVerification.service.ts
(!aiResults.ocrData || aiResults.ocrData.confidence > 0.85)
```

**Configuration Reference** (docs/VERIFICATION_UPDATE_WITH_OCR_AND_AI.md):
- OCR Confidence Threshold: `0.85` (85%)

---

## 5. Trust Score Levels

**Location**: `src/types/verification.types.ts` and `src/services/verification.service.ts`

### Score Range
- **Minimum**: `0`
- **Maximum**: `100`

### Level Thresholds
| Level | Range | Score |
|-------|-------|-------|
| **LOW** | 0-30 | `0 <= score < 31` |
| **MEDIUM** | 31-60 | `31 <= score < 61` |
| **HIGH** | 61-80 | `61 <= score < 81` |
| **VERY_HIGH** | 81-95 | `81 <= score < 96` |
| **EXCELLENT** | 96-100 | `96 <= score <= 100` |

**Code Reference**:
```typescript
// Lines 823-829 in verification.service.ts
private getTrustScoreLevel(score: number): TrustScoreLevel {
  if (score >= 96) return TrustScoreLevel.EXCELLENT;    // 96-100
  if (score >= 81) return TrustScoreLevel.VERY_HIGH;    // 81-95
  if (score >= 61) return TrustScoreLevel.HIGH;        // 61-80
  if (score >= 31) return TrustScoreLevel.MEDIUM;       // 31-60
  return TrustScoreLevel.LOW;                            // 0-30
}
```

### Badge Thresholds
- **Premium Badge**: `score >= 90`
- **Verified Badge**: `score >= 80`

**Code Reference**:
```typescript
// Lines 834-849 in verification.service.ts
if (score >= 90) {
  // Premium badge
}
if (score >= 80) {
  // Verified badge
}
```

---

## 6. Risk Score Levels

**Location**: `src/services/riskManagement.service.ts`

### Score Range
- **Minimum**: `0`
- **Maximum**: `100`

### Level Thresholds
| Level | Range | Score |
|-------|-------|-------|
| **LOW** | 0-34 | `0 <= score < 35` |
| **MEDIUM** | 35-64 | `35 <= score < 65` |
| **HIGH** | 65-84 | `65 <= score < 85` |
| **CRITICAL** | 85-100 | `85 <= score <= 100` |

**Code Reference**:
```typescript
// Lines 2293-2298 in riskManagement.service.ts
private determineRiskLevel(score: number): RiskLevel {
  if (score >= 85) return RiskLevel.CRITICAL;  // 85-100
  if (score >= 65) return RiskLevel.HIGH;     // 65-84
  if (score >= 35) return RiskLevel.MEDIUM;    // 35-64
  return RiskLevel.LOW;                         // 0-34
}
```

### Default Risk Thresholds (Configurable)
- **Low Risk**: `<= 30`
- **Medium Risk**: `31-60`
- **High Risk**: `61-85`
- **Critical Risk**: `>= 85`

**Code Reference**:
```typescript
// Lines 1967-1970 in riskManagement.service.ts
low_risk_threshold: data.lowRiskThreshold ?? 30,
medium_risk_threshold: data.mediumRiskThreshold ?? 60,
high_risk_threshold: data.highRiskThreshold ?? 85,
critical_risk_threshold: data.criticalRiskThreshold ?? 95,
```

---

## 7. Auto-Verification Decision Matrix

**Location**: `src/services/userVerification.service.ts`

A verification is **auto-verified** when ALL of the following conditions are met:

| Score Type | Minimum Threshold | Range |
|------------|-------------------|-------|
| **Liveness Score** | `> 0.7` | `0.7 < score <= 1.0` |
| **Profile Score** | `> 0.8` | `0.8 < score <= 1.0` |
| **OCR Confidence** | `> 0.85` | `0.85 < score <= 1.0` |

**Code Reference**:
```typescript
// Lines 424-429 in userVerification.service.ts
const allScoresGood = 
  (!aiResults.livenessScore || aiResults.livenessScore > 0.7) &&
  (!aiResults.profileScore || aiResults.profileScore > 0.8) &&
  (!aiResults.ocrData || aiResults.ocrData.confidence > 0.85);

updateData.verification_status = allScoresGood ? 'verified' : 'pending';
```

---

## 8. Face-API Distance to Similarity Conversion

**Location**: `src/services/faceApiComparison.service.ts`

### Conversion Formula
```
similarity = 1 - distance
```

### Examples
| Distance | Similarity | Percentage | Status |
|----------|------------|------------|--------|
| `0.0` | `1.0` | 100% | Perfect Match |
| `0.2` | `0.8` | 80% | Very High Match |
| `0.4` | `0.6` | 60% | Good Match |
| `0.6` | `0.4` | 40% | Threshold (isMatch = false) |
| `0.8` | `0.2` | 20% | Low Match |
| `1.0` | `0.0` | 0% | No Match |
| `2.0` | `-1.0` → `0.0` | 0% | Clamped to 0 |

**Code Reference**:
```typescript
// Lines 107-119 in faceApiComparison.service.ts
const distance = faceapi.euclideanDistance(result1.descriptor, result2.descriptor);
// Distance range: 0.0 to 2.0

const isMatch = distance < 0.6;  // Match if distance < 0.6
let similarity = 1 - distance;    // Convert distance to similarity
similarity = Math.max(0, Math.min(1, similarity)); // Clamp to [0, 1]
```

---

## Summary Table

| Score Type | Min | Max | Auto-Verify Threshold | Unit |
|------------|-----|-----|----------------------|------|
| **Face Similarity** | 0.0 | 1.0 | > 0.75 (75%) | Decimal (0-1) |
| **Liveness Score** | 0.0 | 1.0 | > 0.7 (70%) | Decimal (0-1) |
| **Profile Score** | 0.0 | 1.0 | > 0.8 (80%) | Decimal (0-1) |
| **OCR Confidence** | 0.0 | 1.0 | > 0.85 (85%) | Decimal (0-1) |
| **Trust Score** | 0 | 100 | N/A (Levels) | Integer (0-100) |
| **Risk Score** | 0 | 100 | N/A (Levels) | Integer (0-100) |
| **Face Distance** | 0.0 | 2.0 | < 0.6 (for match) | Decimal (0-2) |

---

## Notes

1. **Similarity scores** are typically in decimal format (0.0 to 1.0), which can be converted to percentage by multiplying by 100.

2. **Distance scores** are inversely related to similarity - lower distance = higher similarity.

3. **Auto-verification** requires ALL applicable scores to meet their thresholds.

4. **Scores below thresholds** trigger manual review (pending status).

5. **Trust and Risk scores** use integer ranges (0-100) and are divided into levels.

6. All scores are **clamped** to their valid ranges to prevent invalid values.

