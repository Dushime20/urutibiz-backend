# Cloudinary Profile Image Upload

## Overview
User profile images are now uploaded to Cloudinary for optimized storage, delivery, and transformation. This provides better performance, automatic optimization, and CDN benefits.

## Features

### ✅ **Automatic Image Optimization**
- **Size**: Automatically resized to 400x400px
- **Crop**: Face-focused cropping for profile images
- **Quality**: Auto-optimized quality settings
- **Format**: Automatic format selection (WebP, JPEG, PNG)

### ✅ **Cloudinary Integration**
- **Folder Structure**: `users/{userId}/profile/`
- **Public ID**: `profile_{timestamp}` for unique identification
- **Secure URLs**: HTTPS URLs with automatic CDN delivery
- **Transformations**: Real-time image transformations

### ✅ **Database Storage**
- **profile_image_url**: Cloudinary secure URL
- **profile_image_public_id**: Cloudinary public ID for management

## API Endpoints

### **Upload Profile Image**
```
POST /api/v1/users/:id/avatar
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**Request Body:**
- `file`: Image file (jpg, jpeg, png, gif, webp)

**Response:**
```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "user": { /* user data */ },
    "imageUrl": "https://res.cloudinary.com/...",
    "publicId": "users/123/profile/profile_1234567890"
  }
}
```

### **Update Profile with Image URL**
```
PUT /api/v1/users/:id
Content-Type: application/json
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "profileImage": "https://res.cloudinary.com/...",
  "profileImagePublicId": "users/123/profile/profile_1234567890"
}
```

## Image Transformations

### **Default Profile Image**
- **Size**: 400x400px
- **Crop**: Fill with face gravity
- **Quality**: Auto-optimized
- **Format**: Auto-selected best format

### **Custom Transformations**
```typescript
// Get optimized URL with custom size
const url = CloudinaryService.getOptimizedProfileImageUrl(
  publicId, 
  200,  // width
  200   // height
);
```

## File Requirements

### **Supported Formats**
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

### **Size Limits**
- **Recommended**: 400x400px or larger
- **Maximum**: 10MB (configurable)
- **Minimum**: 100x100px

## Error Handling

### **Upload Failures**
- Invalid file format
- File size too large
- Cloudinary service unavailable
- Network connectivity issues

### **Response Codes**
- `200`: Upload successful
- `400`: Invalid file or request
- `401`: Unauthorized
- `500`: Server/Cloudinary error

## Security Features

### **Authorization**
- Users can only upload to their own profile
- Admin users can upload to any profile
- JWT token required for all uploads

### **File Validation**
- File type validation
- Size limit enforcement
- Malware scanning (Cloudinary)
- Secure URL generation

## Performance Benefits

### **CDN Delivery**
- Global edge locations
- Automatic caching
- Bandwidth optimization
- Reduced server load

### **Image Optimization**
- Automatic format selection
- Quality optimization
- Responsive images
- Lazy loading support

## Usage Examples

### **Frontend Upload**
```javascript
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch(`/api/v1/users/${userId}/avatar`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log('Image URL:', result.data.imageUrl);
console.log('Public ID:', result.data.publicId);
```

### **Update Profile with Image**
```javascript
const updateData = {
  firstName: 'John',
  lastName: 'Doe',
  profileImage: 'https://res.cloudinary.com/...',
  profileImagePublicId: 'users/123/profile/profile_1234567890'
};

const response = await fetch(`/api/v1/users/${userId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(updateData)
});
```

## Configuration

### **Environment Variables**
```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### **Cloudinary Settings**
- **Folder**: `users/{userId}/profile/`
- **Transformation**: 400x400, face crop, auto quality
- **Format**: Auto-selection
- **Overwrite**: Enabled for profile updates

## Migration Notes

### **Database Changes**
- Added `profile_image_public_id` column to users table
- Existing `profile_image_url` field preserved
- Backward compatibility maintained

### **API Changes**
- New avatar upload endpoint with Cloudinary
- Enhanced profile update with image fields
- Improved error handling and validation

## Troubleshooting

### **Common Issues**
1. **Upload Fails**: Check Cloudinary credentials
2. **Image Not Displaying**: Verify URL format and accessibility
3. **Large File Rejected**: Check file size limits
4. **Format Not Supported**: Ensure file type is in allowed list

### **Debug Information**
- Check server logs for Cloudinary errors
- Verify environment variables
- Test Cloudinary connection separately
- Monitor file upload limits and validation
