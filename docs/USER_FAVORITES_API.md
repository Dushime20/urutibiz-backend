# 🌟 User Favorites API - Complete Implementation Guide

## 📋 Overview

The User Favorites API allows users to save products to their personal favorites list, providing a wishlist-like functionality for the UrutiBiz platform. This implementation includes:

- ✅ Complete database schema with optimized indexing
- ✅ Full CRUD operations for favorites management
- ✅ Authentication and authorization
- ✅ Bulk operations support
- ✅ Real-time favorite status in product responses
- ✅ Performance optimizations with intelligent caching
- ✅ Comprehensive error handling
- ✅ Frontend integration examples

## 🚀 Features

### **Core Functionality**
- Add/remove products from favorites
- Toggle favorite status
- Get user's favorites list with filtering
- Check if a product is favorited
- Bulk operations (add/remove multiple products)
- Clear all favorites
- Get favorites count and statistics

### **Enhanced Features**
- Automatic `is_favorited` field in product API responses
- Metadata support for favorites (tags, notes, source tracking)
- Advanced filtering (category, price range, location, search)
- Pagination and sorting
- Real-time favorite counts for products
- Caching for optimal performance

## 🔗 API Endpoints

### **Base URL**
```
http://localhost:3000/api/v1/users/favorites
```

### **Authentication Required**
All endpoints require a valid JWT token in the Authorization header:
```javascript
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

### **Complete Endpoint List**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/` | Add product to favorites |
| `GET` | `/` | Get user's favorites with filtering |
| `GET` | `/count` | Get user's favorites count |
| `GET` | `/stats` | Get detailed favorite statistics |
| `POST` | `/bulk` | Bulk add/remove operations |
| `GET` | `/:productId/status` | Check if product is favorited |
| `POST` | `/:productId/toggle` | Toggle favorite status |
| `DELETE` | `/:productId` | Remove product from favorites |
| `DELETE` | `/` | Clear all favorites |

## 📡 API Usage Examples

### **1. Add to Favorites**
```javascript
POST /api/v1/users/favorites
Content-Type: application/json

{
  "product_id": "550e8400-e29b-41d4-a716-446655440000",
  "metadata": {
    "source": "product_page",
    "category": "electronics"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product added to favorites successfully",
  "data": {
    "id": "fav-uuid",
    "user_id": "user-uuid",
    "product_id": "product-uuid",
    "metadata": { "source": "product_page" },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### **2. Get User's Favorites**
```javascript
GET /api/v1/users/favorites?page=1&limit=10&search=electronics&category_id=cat-uuid
```

**Response:**
```json
{
  "success": true,
  "message": "User favorites retrieved successfully",
  "data": [
    {
      "id": "fav-uuid",
      "user_id": "user-uuid",
      "product_id": "product-uuid",
      "created_at": "2024-01-15T10:30:00Z",
      "product": {
        "id": "product-uuid",
        "name": "Professional Camera",
        "description": "High-quality DSLR camera",
        "price_per_day": 50,
        "currency": "USD",
        "status": "active",
        "images": ["image1.jpg", "image2.jpg"],
        "location": "Kigali, Rwanda"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### **3. Toggle Favorite Status**
```javascript
POST /api/v1/users/favorites/550e8400-e29b-41d4-a716-446655440000/toggle
Content-Type: application/json

{
  "metadata": {
    "source": "wishlist_page"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product added to favorites successfully",
  "data": {
    "action": "added",
    "favorite": {
      "id": "fav-uuid",
      "user_id": "user-uuid",
      "product_id": "product-uuid",
      "created_at": "2024-01-15T10:30:00Z"
    }
  }
}
```

### **4. Bulk Operations**
```javascript
POST /api/v1/users/favorites/bulk
Content-Type: application/json

{
  "product_ids": [
    "550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-a716-446655440001"
  ],
  "action": "add",
  "metadata": {
    "source": "wishlist_import"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk operation completed successfully",
  "data": {
    "added": 2,
    "removed": 0,
    "errors": []
  }
}
```

### **5. Check Favorite Status**
```javascript
GET /api/v1/users/favorites/550e8400-e29b-41d4-a716-446655440000/status
```

**Response:**
```json
{
  "success": true,
  "message": "Favorite status retrieved successfully",
  "data": {
    "is_favorited": true,
    "favorite_id": "fav-uuid",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

## 🛍️ Enhanced Product API

Products now automatically include favorite status for authenticated users:

### **Get Products**
```javascript
GET /api/v1/products
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "product-uuid",
      "name": "Professional Camera",
      "price_per_day": 50,
      "currency": "USD",
      "is_favorited": true,
      "favorite_id": "fav-uuid",
      "favorited_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### **Get Single Product**
```javascript
GET /api/v1/products/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "product-uuid",
    "name": "Professional Camera",
    "description": "High-quality DSLR camera",
    "price_per_day": 50,
    "currency": "USD",
    "is_favorited": true,
    "favorite_id": "fav-uuid",
    "favorited_at": "2024-01-15T10:30:00Z"
  }
}
```

## 💻 Frontend Integration

### **JavaScript/Fetch API**
```javascript
// Initialize favorites service
const favoritesService = new FavoritesService(authToken);

// Add to favorites
await favoritesService.addToFavorites('product-id', {
  source: 'product_page'
});

// Toggle favorite
const result = await favoritesService.toggleFavorite('product-id');
console.log(`Product ${result.action}`); // "added" or "removed"

// Get favorites
const { favorites, pagination } = await favoritesService.getFavorites({
  page: 1,
  limit: 10,
  search: 'camera'
});
```

### **React Hook**
```javascript
import { useFavorites } from './hooks/useFavorites';

function ProductPage({ productId }) {
  const {
    favorites,
    loading,
    error,
    toggleFavorite,
    isFavorited
  } = useFavorites(authToken);

  const handleToggle = async () => {
    try {
      await toggleFavorite(productId);
      alert('Favorite status updated!');
    } catch (error) {
      alert('Failed to update favorite');
    }
  };

  return (
    <button onClick={handleToggle} disabled={loading}>
      {loading ? '⟳' : (isFavorited ? '❤️' : '🤍')}
    </button>
  );
}
```

### **Vue.js Composition API**
```javascript
import { useFavorites } from '@/composables/useFavorites';

export default {
  setup() {
    const { favorites, loading, toggleFavorite } = useFavorites(authToken);

    const handleToggle = async (productId) => {
      await toggleFavorite(productId);
    };

    return {
      favorites,
      loading,
      handleToggle
    };
  }
};
```

## 🎨 Styling

The implementation includes comprehensive CSS styles for:

- Favorite heart buttons with hover effects
- Favorites list grid layout
- Product cards with favorite indicators
- Loading states and animations
- Responsive design for mobile devices
- Accessibility support

See `examples/favorites-styles.css` for complete styling.

## 🔧 Database Schema

### **user_favorites Table**
```sql
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  metadata JSONB NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Performance indexes
CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_product_id ON user_favorites(product_id);
CREATE INDEX idx_user_favorites_created_at ON user_favorites(created_at);
```

## 🚀 Performance Optimizations

### **Caching Strategy**
- User favorites list cached for 5 minutes
- Favorite status cached for 1 minute
- Product lists with favorite status cached per user
- Automatic cache invalidation on favorites changes

### **Database Optimizations**
- Optimized indexes for fast lookups
- Batch operations for checking multiple favorite statuses
- Efficient JOIN queries for favorites with product details
- Connection pooling and query optimization

### **API Optimizations**
- Batch favorite status checks for product lists
- Lazy loading of favorite counts
- Intelligent cache keys including user context
- Parallel processing where possible

## 📊 Statistics and Analytics

### **User Favorite Statistics**
```javascript
GET /api/v1/users/favorites/stats
```

Returns:
- Total favorites count
- Favorites by category
- Favorites by price range
- Recent favorites (last 30 days)
- Average favorite price
- Most favorited category

### **Product Favorite Analytics**
- Product favorite counts in product responses
- Trending products based on favorites
- Popular categories analysis

## 🔒 Security Features

### **Authentication & Authorization**
- JWT token required for all operations
- User can only access their own favorites
- Rate limiting on API endpoints
- Input validation and sanitization

### **Data Privacy**
- Personal favorite data is user-specific
- No cross-user favorite data exposure
- Secure metadata handling
- GDPR-compliant data handling

## 🧪 Testing

### **Test Coverage**
- Unit tests for all service methods
- Integration tests for API endpoints
- Performance tests for bulk operations
- Frontend component tests

### **Test Examples**
```javascript
// Test adding to favorites
describe('Add to Favorites', () => {
  it('should add product to user favorites', async () => {
    const result = await favoritesService.addToFavorites(
      'user-id', 
      { product_id: 'product-id' }
    );
    expect(result.success).toBe(true);
  });
});
```

## 🚧 Migration Guide

### **Database Migration**
```bash
# Run the migration
npm run migrate

# Or manually run:
knex migrate:latest
```

### **Update Existing Code**
1. Import the FavoriteEnhancer utility
2. Update product API responses to include favorite status
3. Add favorite buttons to product components
4. Implement favorites page/component

## 📈 Future Enhancements

### **Planned Features**
- [ ] Favorite collections/categories
- [ ] Public favorites sharing
- [ ] Favorite recommendations based on similar users
- [ ] Export favorites functionality
- [ ] Favorite notifications (price drops, availability)
- [ ] Collaborative favorites (family/team sharing)

### **Advanced Analytics**
- [ ] Favorite conversion tracking
- [ ] A/B testing for favorite button placement
- [ ] Favorite-based recommendation engine
- [ ] Cross-platform favorites sync

## 📞 Support

### **Common Issues**

**Q: Why am I getting 404 errors?**
A: Ensure you're using the correct base URL: `/api/v1/users/favorites`

**Q: Products don't show favorite status**
A: Make sure you're sending the Authorization header with your requests

**Q: Bulk operations are slow**
A: Limit bulk operations to 100 products maximum per request

### **Error Codes**
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found (product/favorite not found)
- `409` - Conflict (already favorited)
- `500` - Server Error

## 🎯 Quick Start

1. **Run Database Migration**
   ```bash
   npm run migrate
   ```

2. **Start the Server**
   ```bash
   npm run dev
   ```

3. **Test the API**
   ```bash
   curl -X GET "http://localhost:3000/api/v1/users/favorites" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

4. **Integrate in Frontend**
   ```javascript
   import { FavoritesService } from './favorites-api-usage.js';
   const favoritesService = new FavoritesService(authToken);
   ```

## 📝 Examples

Complete working examples are available in:
- `examples/favorites-api-usage.js` - JavaScript/React examples
- `examples/favorites-styles.css` - CSS styling
- `docs/USER_FAVORITES_API.md` - This documentation

---

**🎉 Congratulations! You now have a complete, production-ready favorites system!**

The implementation includes everything needed for a modern, scalable favorites feature with excellent performance, security, and user experience.
