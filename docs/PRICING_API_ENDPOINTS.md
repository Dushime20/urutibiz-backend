# 🏷️ Complete Pricing API Endpoints List

This document lists all available pricing API endpoints in the UrutiBiz system.

## 📋 Base URL
```
http://localhost:3000/api/v1/product-prices
```

## 🔗 Complete API Endpoints

### **1. Create Product Price**
- **Endpoint:** `POST /api/v1/product-prices`
- **Purpose:** Create a new product pricing configuration
- **Authentication:** Required (Bearer Token)
- **Body:** ProductPrice object with all pricing details
- **Response:** Created product price with ID

### **2. Get All Product Prices**
- **Endpoint:** `GET /api/v1/product-prices`
- **Purpose:** Retrieve product prices with filtering and pagination
- **Authentication:** Required (Bearer Token)
- **Query Parameters:**
  - `product_id` - Filter by product ID
  - `country_id` - Filter by country ID
  - `currency` - Filter by currency
  - `is_active` - Filter by active status
  - `auto_convert` - Filter by auto-convert setting
  - `dynamic_pricing_enabled` - Filter by dynamic pricing
  - `min_price` - Minimum daily price filter
  - `max_price` - Maximum daily price filter
  - `has_hourly_pricing` - Filter by hourly pricing availability
  - `has_weekly_pricing` - Filter by weekly pricing availability
  - `has_monthly_pricing` - Filter by monthly pricing availability
  - `effective_on` - Filter by effective date
  - `search` - Search in currency, base currency, and notes
  - `page` - Page number (default: 1)
  - `limit` - Items per page (default: 10, max: 100)
  - `sort_by` - Sort field
  - `sort_order` - Sort order (asc/desc)

### **3. Get Product Price Statistics**
- **Endpoint:** `GET /api/v1/product-prices/stats`
- **Purpose:** Get analytics and statistics about pricing
- **Authentication:** Required (Bearer Token)
- **Query Parameters:**
  - `country_id` - Filter by country ID
  - `currency` - Filter by currency
  - `is_active` - Filter by active status
- **Response:** Pricing statistics including totals, averages, ranges, and discount stats

### **4. Search Product Prices**
- **Endpoint:** `GET /api/v1/product-prices/search`
- **Purpose:** Advanced search with full-text capabilities
- **Authentication:** Required (Bearer Token)
- **Query Parameters:**
  - `q` - Search query
  - `product_id` - Filter by product ID
  - `country_id` - Filter by country ID
  - `currency` - Filter by currency
  - `is_active` - Filter by active status
  - `page` - Page number
  - `limit` - Items per page
  - `sort_by` - Sort field
  - `sort_order` - Sort order

### **5. Calculate Rental Price (POST)**
- **Endpoint:** `POST /api/v1/product-prices/calculate`
- **Purpose:** Calculate rental price with complex logic
- **Authentication:** Required (Bearer Token)
- **Body:** PriceCalculationRequest object
- **Response:** Detailed price calculation with breakdown

### **6. Calculate Rental Price (GET)**
- **Endpoint:** `GET /api/v1/product-prices/calculate`
- **Purpose:** Calculate rental price using query parameters
- **Authentication:** Required (Bearer Token)
- **Query Parameters:**
  - `product_id` - Product ID (required)
  - `country_id` - Country ID (required)
  - `rental_duration_hours` - Duration in hours (required)
  - `currency` - Preferred currency
  - `quantity` - Quantity to rent (default: 1)
  - `rental_start_date` - Rental start date
  - `include_security_deposit` - Include security deposit (default: true)
  - `apply_discounts` - Apply available discounts (default: true)
- **Response:** Detailed price calculation with breakdown

### **7. Bulk Update Product Prices**
- **Endpoint:** `PATCH /api/v1/product-prices/bulk`
- **Purpose:** Update multiple prices at once
- **Authentication:** Required (Bearer Token)
- **Body:** BulkPriceUpdateOperation object
- **Operations:**
  - `update_prices` - Update pricing tiers
  - `update_discounts` - Update discount percentages
  - `update_market_factors` - Update market adjustment factors
  - `activate` - Activate prices
  - `deactivate` - Deactivate prices
  - `update_exchange_rates` - Update exchange rates

### **8. Get Product Prices by Product**
- **Endpoint:** `GET /api/v1/product-prices/product/:productId`
- **Purpose:** Get all prices for a specific product
- **Authentication:** Required (Bearer Token)
- **Path Parameters:**
  - `productId` - Product ID
- **Query Parameters:**
  - `country_id` - Filter by country ID
  - `currency` - Filter by currency
  - `is_active` - Filter by active status
  - `page` - Page number
  - `limit` - Items per page
  - `sort_by` - Sort field
  - `sort_order` - Sort order

### **9. Compare Product Prices Across Countries**
- **Endpoint:** `GET /api/v1/product-prices/product/:productId/compare`
- **Purpose:** Compare pricing for the same product across different countries
- **Authentication:** Required (Bearer Token)
- **Path Parameters:**
  - `productId` - Product ID
- **Query Parameters:**
  - `currency` - Preferred currency for comparison
  - `include_inactive` - Include inactive prices (default: false)
- **Response:** Price comparison data with country details

### **10. Get Product Prices by Country**
- **Endpoint:** `GET /api/v1/product-prices/country/:countryId`
- **Purpose:** Get all prices for a specific country
- **Authentication:** Required (Bearer Token)
- **Path Parameters:**
  - `countryId` - Country ID
- **Query Parameters:**
  - `product_id` - Filter by product ID
  - `currency` - Filter by currency
  - `is_active` - Filter by active status
  - `page` - Page number
  - `limit` - Items per page
  - `sort_by` - Sort field
  - `sort_order` - Sort order

### **11. Get Product Price by ID**
- **Endpoint:** `GET /api/v1/product-prices/:id`
- **Purpose:** Get a specific product price by its ID
- **Authentication:** Required (Bearer Token)
- **Path Parameters:**
  - `id` - Product price ID
- **Response:** Complete product price object

### **12. Update Product Price**
- **Endpoint:** `PUT /api/v1/product-prices/:id`
- **Purpose:** Update an existing product price
- **Authentication:** Required (Bearer Token)
- **Path Parameters:**
  - `id` - Product price ID
- **Body:** Partial ProductPrice object (only fields to update)
- **Response:** Updated product price object

### **13. Delete Product Price**
- **Endpoint:** `DELETE /api/v1/product-prices/:id`
- **Purpose:** Delete a product price (soft delete)
- **Authentication:** Required (Bearer Token)
- **Path Parameters:**
  - `id` - Product price ID
- **Response:** Success message

## 📊 API Summary Table

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/product-prices` | Create product price | ✅ |
| GET | `/product-prices` | Get all prices with filters | ✅ |
| GET | `/product-prices/stats` | Get pricing statistics | ✅ |
| GET | `/product-prices/search` | Search prices | ✅ |
| POST | `/product-prices/calculate` | Calculate rental price | ✅ |
| GET | `/product-prices/calculate` | Calculate rental price (GET) | ✅ |
| PATCH | `/product-prices/bulk` | Bulk update prices | ✅ |
| GET | `/product-prices/product/:id` | Get prices by product | ✅ |
| GET | `/product-prices/product/:id/compare` | Compare prices across countries | ✅ |
| GET | `/product-prices/country/:id` | Get prices by country | ✅ |
| GET | `/product-prices/:id` | Get price by ID | ✅ |
| PUT | `/product-prices/:id` | Update product price | ✅ |
| DELETE | `/product-prices/:id` | Delete product price | ✅ |

## 🔧 Common Usage Patterns

### **Product Listing Page**
```javascript
// Get prices for products in user's country
GET /product-prices?country_id=user_country&is_active=true
```

### **Rental Calculator**
```javascript
// Calculate price for specific rental
POST /product-prices/calculate
{
  "product_id": "product-id",
  "country_id": "country-id",
  "rental_duration_hours": 48,
  "quantity": 2
}
```

### **Price Comparison**
```javascript
// Compare same product across countries
GET /product-prices/product/product-id/compare
```

### **Admin Dashboard**
```javascript
// Get pricing statistics
GET /product-prices/stats?country_id=country-id

// Bulk update market factors
PATCH /product-prices/bulk
{
  "operation": "update_market_factors",
  "product_ids": ["product1", "product2"],
  "data": { "market_adjustment_factor": 1.20 }
}
```

## 🔒 Authentication

All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## 📝 Response Format

All endpoints return responses in this format:
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

## 🚨 Error Handling

Error responses follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "field_name",
      "message": "Validation error message"
    }
  ]
}
```

This comprehensive list covers all pricing API endpoints available in the UrutiBiz system! 