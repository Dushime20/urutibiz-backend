# User Verification Update API Documentation

## Overview

The User Verification Update API allows users to update their existing verification data. This endpoint supports both JSON data updates and file uploads, with automatic AI processing for document verification, OCR extraction, and liveness detection.

## Endpoint

```
PUT /api/v1/user-verification/{verificationId}
```

## Authentication

Requires a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Parameters

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `verificationId` | string | Yes | The ID of the verification record to update |

### Request Body

The API accepts two content types:

#### 1. JSON (application/json)

```json
{
  "verificationType": "national_id",
  "documentNumber": "ID123456789",
  "documentImageUrl": "https://example.com/document.jpg",
  "addressLine": "123 Main Street",
  "city": "Nairobi",
  "district": "Central",
  "country": "Kenya",
  "selfieImageUrl": "https://example.com/selfie.jpg"
}
```

#### 2. Multipart Form Data (multipart/form-data)

```
verificationType: national_id
documentNumber: ID123456789
addressLine: 123 Main Street
city: Nairobi
district: Central
country: Kenya
documentImage: [file upload]
selfieImage: [file upload]
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `verificationType` | string | No | Type of verification: `national_id`, `passport`, `driving_license`, `address`, `selfie` |
| `documentNumber` | string | No | Document identification number |
| `documentImageUrl` | string | No | Direct URL to document image |
| `documentImage` | file | No | Document image file upload |
| `addressLine` | string | No | Street address |
| `city` | string | No | City name |
| `district` | string | No | District/region name |
| `country` | string | No | Country name |
| `selfieImageUrl` | string | No | Direct URL to selfie image |
| `selfieImage` | file | No | Selfie image file upload |

## Response

### Success Response (200)

```json
{
  "success": true,
  "message": "Verification updated successfully",
  "data": {
    "verification": {
      "id": "uuid-here",
      "userId": "user-uuid",
      "verificationType": "national_id",
      "documentNumber": "ID123456789",
      "documentImageUrl": "https://res.cloudinary.com/...",
      "verificationStatus": "pending",
      "addressLine": "123 Main Street",
      "city": "Nairobi",
      "district": "Central",
      "country": "Kenya",
      "selfieImageUrl": "https://res.cloudinary.com/...",
      "livenessScore": 0.85,
      "aiProfileScore": 0.92,
      "ocrData": {
        "documentType": "national_id",
        "confidence": 0.95,
        "extractedData": {
          "name": "John Doe",
          "idNumber": "ID123456789",
          "dateOfBirth": "1990-01-01"
        }
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    },
    "message": "Verification data updated. Status reset to pending for review."
  }
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid request data"
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token required"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "message": "Not authorized to update this verification"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Verification not found"
}
```

#### 409 Conflict
```json
{
  "success": false,
  "message": "Cannot update already verified documents"
}
```

## Features

### 1. Authorization
- Users can only update their own verification records
- Admin users can update any verification record

### 2. File Upload Support
- Supports both direct file uploads and URL references
- Automatic Cloudinary integration for image storage
- Supports multiple image formats (JPEG, PNG, etc.)

### 3. AI Processing
- **OCR Processing**: Automatically extracts text from document images
- **Liveness Detection**: Analyzes selfie images for authenticity
- **Profile Verification**: Compares document and selfie for identity matching

### 4. Status Management
- Automatically resets verification status to "pending" when updated
- Clears previous verification results (verified_by, verified_at, notes)
- Triggers new AI processing for updated images

### 5. Validation
- Validates verification type against allowed values
- Ensures user ownership of verification record
- Prevents updates to already verified documents

## Usage Examples

### JavaScript/Node.js

```javascript
const fetch = require('node-fetch');
const FormData = require('form-data');

// JSON Update
async function updateWithJson() {
  const response = await fetch('http://localhost:3000/api/v1/user-verification/verification-id', {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer your-jwt-token',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      verificationType: 'national_id',
      documentNumber: 'ID123456789',
      addressLine: '123 Main Street',
      city: 'Nairobi'
    })
  });
  
  const result = await response.json();
  console.log(result);
}

// File Upload Update
async function updateWithFiles() {
  const formData = new FormData();
  formData.append('verificationType', 'passport');
  formData.append('documentNumber', 'PASSPORT987654');
  formData.append('documentImage', fs.createReadStream('./document.jpg'));
  formData.append('selfieImage', fs.createReadStream('./selfie.jpg'));
  
  const response = await fetch('http://localhost:3000/api/v1/user-verification/verification-id', {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer your-jwt-token',
      ...formData.getHeaders()
    },
    body: formData
  });
  
  const result = await response.json();
  console.log(result);
}
```

### cURL

```bash
# JSON Update
curl -X PUT \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "verificationType": "national_id",
    "documentNumber": "ID123456789",
    "addressLine": "123 Main Street",
    "city": "Nairobi"
  }' \
  http://localhost:3000/api/v1/user-verification/verification-id

# File Upload
curl -X PUT \
  -H "Authorization: Bearer your-jwt-token" \
  -F "verificationType=national_id" \
  -F "documentNumber=ID123456789" \
  -F "documentImage=@./document.jpg" \
  -F "selfieImage=@./selfie.jpg" \
  http://localhost:3000/api/v1/user-verification/verification-id
```

### Python

```python
import requests

# JSON Update
def update_with_json():
    url = "http://localhost:3000/api/v1/user-verification/verification-id"
    headers = {
        "Authorization": "Bearer your-jwt-token",
        "Content-Type": "application/json"
    }
    data = {
        "verificationType": "national_id",
        "documentNumber": "ID123456789",
        "addressLine": "123 Main Street",
        "city": "Nairobi"
    }
    
    response = requests.put(url, headers=headers, json=data)
    print(response.json())

# File Upload
def update_with_files():
    url = "http://localhost:3000/api/v1/user-verification/verification-id"
    headers = {"Authorization": "Bearer your-jwt-token"}
    files = {
        "documentImage": open("document.jpg", "rb"),
        "selfieImage": open("selfie.jpg", "rb")
    }
    data = {
        "verificationType": "national_id",
        "documentNumber": "ID123456789"
    }
    
    response = requests.put(url, headers=headers, data=data, files=files)
    print(response.json())
```

## Testing

Run the test script to verify the API functionality:

```bash
node test-update-verification-api.js
```

Make sure to:
1. Replace `your-jwt-token-here` with a valid JWT token
2. Replace `your-verification-id-here` with an actual verification ID
3. Ensure the server is running on `http://localhost:3000`

## Related Endpoints

- `POST /api/v1/user-verification/submit-documents` - Submit new verification
- `GET /api/v1/user-verification/status` - Get verification status
- `GET /api/v1/user-verification/documents` - Get verification documents
- `GET /api/v1/user-verification/history` - Get verification history

## Security Considerations

1. **Authentication**: All requests require valid JWT tokens
2. **Authorization**: Users can only update their own verifications
3. **File Validation**: Uploaded files are validated for type and size
4. **Data Sanitization**: All input data is sanitized and validated
5. **Rate Limiting**: Consider implementing rate limiting for file uploads

## Performance Notes

- File uploads are processed asynchronously
- AI processing runs in background queues
- Response times vary based on file size and AI processing requirements
- Large files may take longer to process

## Error Handling

The API provides detailed error messages for common issues:
- Missing authentication
- Invalid verification ID
- Unauthorized access
- Already verified documents
- Invalid file formats
- Processing failures 