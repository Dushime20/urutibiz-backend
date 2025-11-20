# Document Number Uniqueness Enforcement

## Overview

This document describes the implementation of document number uniqueness validation to ensure that each document (national ID, passport, driving license) can only be used for verification by one user.

## Problem Statement

Previously, multiple users could submit the same document number for verification, which could lead to:
- Identity fraud
- Duplicate account creation
- Security vulnerabilities
- Data integrity issues

## Solution

We've implemented a validation system that checks if a document number is already in use by another user before allowing a new verification submission.

## Implementation Details

### 1. Core Validation Function

**Location**: `src/services/userVerification.service.ts`

**Function**: `isDocumentNumberAlreadyUsed()`

```typescript
static async isDocumentNumberAlreadyUsed(
  documentNumber: string | undefined,
  verificationType: string,
  excludeUserId?: string
): Promise<boolean>
```

**Features**:
- **Case-insensitive comparison**: Normalizes document numbers to uppercase
- **Whitespace trimming**: Removes leading/trailing spaces
- **Type-specific checking**: Only validates document types that have numbers (national_id, passport, driving_license)
- **Status filtering**: Only checks pending and verified statuses (ignores rejected)
- **User exclusion**: Allows same user to resubmit their own document (for resubmissions)

**Validation Logic**:
1. Returns `false` if no document number provided
2. Returns `false` for verification types without document numbers (address, selfie)
3. Normalizes document number: `trim().toUpperCase()`
4. Queries database for existing verifications with:
   - Same verification type
   - Same normalized document number
   - Status in ['pending', 'verified']
   - Different user ID (if excludeUserId provided)
5. Returns `true` if duplicate found, `false` otherwise

### 2. Integration Point

The validation is integrated into the **face comparison step** in `updateVerification()`:

#### Face Comparison Step (Primary Check Point)
- **When**: User submits both document image and selfie for face comparison
- **Location**: `updateVerification()` method, right before `compareFacesFaceApi()`
- **Check**: Document number must not be used by another user
- **Error**: "This [document_type] number has already been used for verification by another user. Each document can only be verified once."
- **Why here?**: This is the actual submission point where the user provides both document and selfie, making it the ideal place to validate document uniqueness

**Code Location**:
```typescript
// Lines 600-628 in userVerification.service.ts
// CRITICAL: Check document number uniqueness BEFORE face comparison
// This prevents wasting resources on face comparison if document is already used
if (docUrl && selfieUrl) {
  // This is the actual submission point - both document and selfie are present
  const documentNumberToCheck = data.documentNumber || existing.document_number;
  const verificationTypeToCheck = data.verificationType || existing.verification_type;
  
  if (documentNumberToCheck && ['national_id', 'passport', 'driving_license'].includes(verificationTypeToCheck)) {
    console.log(`🔍 Checking document number uniqueness before face comparison: ${documentNumberToCheck}`);
    
    const isUsed = await UserVerificationService.isDocumentNumberAlreadyUsed(...);
    
    if (isUsed) {
      // STOP PROCESS - Don't proceed with face comparison
      console.error(`❌ Document number ${documentNumberToCheck} is already used - STOPPING face comparison process`);
      throw new Error(
        `This ${documentTypeName} number (${documentNumberToCheck}) has already been used for verification by another user. ` +
        `Each document can only be verified once. Please upload a different document to continue the verification process.`
      );
    }
    
    console.log(`✅ Document number ${documentNumberToCheck} is unique - proceeding with face comparison`);
  }
}
// Only proceed with face comparison if document number check passed (or not applicable)
if (docUrl && selfieUrl) {
  // Face comparison happens here...
}
```

**Process Flow**:
1. ✅ User submits document image → Creates pending record
2. ✅ User submits selfie image → `updateVerification()` called
3. ✅ **Document number check happens HERE** (before any face comparison)
4. ❌ **If duplicate found** → Throw error, STOP process, return error to user
5. ✅ **If unique** → Proceed with face comparison
6. ✅ Face comparison executes only if document number is valid

**Note**: 
- Initial submission methods (`submitVerification()`, `submitVerificationInitial()`) don't check here because they only create a pending record
- The actual validation happens when the user completes the verification by submitting both document and selfie
- This ensures we only validate when the user is actually submitting their complete verification

### 3. Database Optimization

**Migration**: `database/migrations/20251120_add_document_number_unique_index.ts`

**Index Created**:
```sql
CREATE INDEX idx_user_verifications_document_number_type 
ON user_verifications(verification_type, UPPER(TRIM(document_number)))
WHERE document_number IS NOT NULL 
AND verification_type IN ('national_id', 'passport', 'driving_license')
AND verification_status IN ('pending', 'verified')
```

**Benefits**:
- Faster duplicate lookups
- Partial index (only indexes relevant rows)
- Normalized comparison (UPPER, TRIM) in index

**Note**: We don't use a UNIQUE constraint because:
1. Same document can be resubmitted by same user (rejected → pending)
2. Application logic handles user exclusion
3. Different verification types can have same number format

## Validation Rules

### Document Types Checked
- ✅ `national_id` - National ID card
- ✅ `passport` - Passport
- ✅ `driving_license` - Driver's license
- ❌ `address` - No document number
- ❌ `selfie` - No document number

### Status Filtering
- ✅ `pending` - Checked for duplicates
- ✅ `verified` - Checked for duplicates
- ❌ `rejected` - Ignored (can be reused)
- ❌ `expired` - Ignored (can be reused)
- ❌ `cancelled` - Ignored (can be reused)

### Normalization
- **Case**: Converted to uppercase
- **Whitespace**: Trimmed (leading/trailing spaces removed)
- **Comparison**: Uses `UPPER(TRIM(document_number))` for consistency

## Error Messages

**Standard Error Format**:
```
This [Document Type] number ([document_number]) has already been used for verification by another user. Each document can only be verified once. Please upload a different document to continue the verification process.
```

**Examples**:
- "This National Id number (123456789) has already been used for verification by another user. Each document can only be verified once. Please upload a different document to continue the verification process."
- "This Passport number (AB123456) has already been used for verification by another user. Each document can only be verified once. Please upload a different document to continue the verification process."
- "This Driving License number (DL789012) has already been used for verification by another user. Each document can only be verified once. Please upload a different document to continue the verification process."

**Key Points**:
- Error includes the actual document number for clarity
- Error explicitly tells user to upload a different document
- Error stops the face comparison process immediately
- No resources are wasted on face comparison for duplicate documents

## Use Cases

### ✅ Allowed Scenarios

1. **First-time submission**: User submits a new document number
2. **Same user resubmission**: User resubmits their own document after rejection
3. **Same user update**: User updates their verification without changing document number
4. **Different document types**: Same number can be used for different types (e.g., national_id vs passport)

### ❌ Blocked Scenarios

1. **Duplicate submission**: User A submits "123456", then User B tries to submit "123456"
2. **Case variations**: User A submits "ABC123", User B tries "abc123" (normalized to same)
3. **Whitespace variations**: User A submits "123 456", User B tries "123456" (normalized to same)
4. **Different user update**: User tries to update to a document number already used by another user

## Testing Recommendations

### Test Cases

1. **Basic duplicate check**
   - Submit document number "123456" for User A
   - Try to submit "123456" for User B → Should fail

2. **Case insensitivity**
   - Submit "ABC123" for User A
   - Try to submit "abc123" for User B → Should fail

3. **Whitespace handling**
   - Submit " 123456 " for User A
   - Try to submit "123456" for User B → Should fail

4. **Same user resubmission**
   - Submit "123456" for User A (rejected)
   - Resubmit "123456" for User A → Should succeed

5. **Different document types**
   - Submit "123456" as national_id for User A
   - Submit "123456" as passport for User B → Should succeed (different types)

6. **Rejected status**
   - Submit "123456" for User A (rejected)
   - Submit "123456" for User B → Should succeed (rejected not checked)

7. **Address/selfie types**
   - Submit address verification (no document number) → Should succeed
   - Submit selfie verification (no document number) → Should succeed

## Performance Considerations

- **Index usage**: Partial index on document_number + verification_type for fast lookups
- **Query optimization**: Only queries relevant rows (pending/verified status)
- **Normalization**: Done in application and database for consistency
- **Caching**: Consider caching recent checks if needed

## Security Considerations

1. **Prevents identity fraud**: Same document can't be used by multiple accounts
2. **Data integrity**: Ensures one-to-one relationship between document and user
3. **Audit trail**: Logs duplicate attempts for security monitoring
4. **User privacy**: Document numbers are normalized but not exposed in error messages

## Future Enhancements

1. **Rate limiting**: Limit duplicate check attempts per user
2. **Admin override**: Allow admins to manually approve duplicate cases (with justification)
3. **Document expiration**: Check if document is expired before allowing reuse
4. **Cross-country validation**: Different countries may allow same number format
5. **Soft delete handling**: Handle soft-deleted verifications appropriately

## Migration

To apply the database index:

```bash
npm run migrate:latest
```

Or manually:

```bash
npx knex migrate:latest
```

## Related Files

- `src/services/userVerification.service.ts` - Main service with validation logic
- `database/migrations/20251120_add_document_number_unique_index.ts` - Database index migration
- `src/types/userVerification.types.ts` - Type definitions

## Summary

The document number uniqueness validation ensures that:
- ✅ Each document can only be verified by one user
- ✅ Same user can resubmit their own document
- ✅ Case and whitespace variations are handled
- ✅ Only relevant document types are checked
- ✅ Performance is optimized with database indexes
- ✅ Clear error messages guide users

This implementation provides a robust security layer preventing document number duplication while maintaining flexibility for legitimate use cases.

