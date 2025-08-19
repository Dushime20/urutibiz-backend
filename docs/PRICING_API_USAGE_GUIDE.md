# 🏷️ Pricing API Usage Guide

This guide shows you how to use the UrutiBiz Pricing API step by step with practical examples.

## 📋 API Base URL
```
http://localhost:3000/api/v1/product-prices
```

## 🚀 Step-by-Step Usage

### **Step 1: Create a Product Price**

**Endpoint:** `POST /api/v1/product-prices`

**Purpose:** Set up pricing for a product in a specific country/currency

```bash
curl -X POST http://localhost:3000/api/v1/product-prices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "product_id": "550e8400-e29b-41d4-a716-446655440000",
    "country_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "currency": "USD",
    "price_per_hour": 5.00,
    "price_per_day": 30.00,
    "price_per_week": 150.00,
    "price_per_month": 500.00,
    "security_deposit": 100.00,
    "market_adjustment_factor": 1.15,
    "auto_convert": true,
    "base_price": 30.00,
    "base_currency": "USD",
    "min_rental_duration_hours": 2,
    "max_rental_duration_days": 30,
    "early_return_fee_percentage": 0.10,
    "late_return_fee_per_hour": 2.50,
    "weekly_discount_percentage": 0.10,
    "monthly_discount_percentage": 0.20,
    "bulk_discount_threshold": 3,
    "bulk_discount_percentage": 0.15,
    "dynamic_pricing_enabled": true,
    "peak_season_multiplier": 1.25,
    "off_season_multiplier": 0.85,
    "seasonal_adjustments": {
      "6": 1.20,
      "7": 1.30,
      "8": 1.25,
      "12": 1.15
    },
    "is_active": true,
    "effective_from": "2024-01-01T00:00:00Z",
    "notes": "Power tool rental pricing for construction projects"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Product price created successfully",
  "data": {
    "id": "new-price-id",
    "product_id": "550e8400-e29b-41d4-a716-446655440000",
    "country_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "currency": "USD",
    "price_per_hour": 5.00,
    "price_per_day": 30.00,
    "price_per_week": 150.00,
    "price_per_month": 500.00,
    "security_deposit": 100.00,
    "market_adjustment_factor": 1.15,
    "auto_convert": true,
    "base_price": 30.00,
    "base_currency": "USD",
    "exchange_rate": 1.00,
    "exchange_rate_updated_at": "2024-01-01T00:00:00Z",
    "min_rental_duration_hours": 2,
    "max_rental_duration_days": 30,
    "early_return_fee_percentage": 0.10,
    "late_return_fee_per_hour": 2.50,
    "weekly_discount_percentage": 0.10,
    "monthly_discount_percentage": 0.20,
    "bulk_discount_threshold": 3,
    "bulk_discount_percentage": 0.15,
    "dynamic_pricing_enabled": true,
    "peak_season_multiplier": 1.25,
    "off_season_multiplier": 0.85,
    "seasonal_adjustments": {
      "6": 1.20,
      "7": 1.30,
      "8": 1.25,
      "12": 1.15
    },
    "is_active": true,
    "effective_from": "2024-01-01T00:00:00Z",
    "notes": "Power tool rental pricing for construction projects",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### **Step 2: Calculate Rental Price**

**Endpoint:** `POST /api/v1/product-prices/calculate`

**Purpose:** Calculate the total price for a rental including all adjustments and discounts

```bash
curl -X POST http://localhost:3000/api/v1/product-prices/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "product_id": "550e8400-e29b-41d4-a716-446655440000",
    "country_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "currency": "USD",
    "rental_duration_hours": 48,
    "quantity": 2,
    "rental_start_date": "2024-06-15T08:00:00Z",
    "include_security_deposit": true,
    "apply_discounts": true
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Price calculation completed successfully",
  "data": {
    "product_id": "550e8400-e29b-41d4-a716-446655440000",
    "country_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "currency": "USD",
    "rental_duration_hours": 48,
    "rental_duration_days": 2,
    "quantity": 2,
    "base_rate_type": "daily",
    "base_rate": 30.00,
    "base_amount": 60.00,
    "market_adjustment_factor": 1.15,
    "seasonal_multiplier": 1.20,
    "peak_season_adjustment": 0.00,
    "weekly_discount": 0.00,
    "monthly_discount": 0.00,
    "bulk_discount": 9.00,
    "total_discount": 9.00,
    "subtotal": 69.00,
    "security_deposit": 200.00,
    "total_amount": 269.00,
    "breakdown": {
      "base_rental": 60.00,
      "market_adjustment": 9.00,
      "seasonal_adjustment": 0.00,
      "bulk_discount": -9.00,
      "security_deposit": 200.00
    },
    "price_per_unit": 134.50,
    "savings": 9.00,
    "effective_daily_rate": 34.50
  }
}
```

### **Step 3: Get Product Prices**

**Endpoint:** `GET /api/v1/product-prices`

**Purpose:** Retrieve pricing information with filters

```bash
# Get all prices for a specific product
curl -X GET "http://localhost:3000/api/v1/product-prices?product_id=550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get prices for a specific country
curl -X GET "http://localhost:3000/api/v1/product-prices?country_id=7c9e6679-7425-40de-944b-e07fc1f90ae7" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get active prices in USD
curl -X GET "http://localhost:3000/api/v1/product-prices?currency=USD&is_active=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Search prices with pagination
curl -X GET "http://localhost:3000/api/v1/product-prices?page=1&limit=10&sort_by=price_per_day&sort_order=asc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Step 4: Compare Prices Across Countries**

**Endpoint:** `GET /api/v1/product-prices/product/{productId}/compare`

**Purpose:** Compare pricing for the same product across different countries

```bash
curl -X GET "http://localhost:3000/api/v1/product-prices/product/550e8400-e29b-41d4-a716-446655440000/compare" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Price comparison retrieved successfully",
  "data": {
    "product_id": "550e8400-e29b-41d4-a716-446655440000",
    "comparisons": [
      {
        "country_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "country_name": "United States",
        "currency": "USD",
        "price_per_day": 30.00,
        "price_per_week": 150.00,
        "price_per_month": 500.00,
        "security_deposit": 100.00,
        "market_adjustment_factor": 1.15,
        "is_active": true
      },
      {
        "country_id": "another-country-id",
        "country_name": "Rwanda",
        "currency": "RWF",
        "price_per_day": 30000.00,
        "price_per_week": 150000.00,
        "price_per_month": 500000.00,
        "security_deposit": 100000.00,
        "market_adjustment_factor": 1.05,
        "is_active": true
      }
    ]
  }
}
```

### **Step 5: Update Product Price**

**Endpoint:** `PUT /api/v1/product-prices/{id}`

**Purpose:** Update existing pricing information

```bash
curl -X PUT http://localhost:3000/api/v1/product-prices/price-id-here \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "price_per_day": 35.00,
    "weekly_discount_percentage": 0.15,
    "peak_season_multiplier": 1.30,
    "notes": "Updated pricing for summer season"
  }'
```

### **Step 6: Bulk Update Prices**

**Endpoint:** `PATCH /api/v1/product-prices/bulk`

**Purpose:** Update multiple prices at once

```bash
# Update market factors for multiple products
curl -X PATCH http://localhost:3000/api/v1/product-prices/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "operation": "update_market_factors",
    "product_ids": [
      "550e8400-e29b-41d4-a716-446655440000",
      "another-product-id"
    ],
    "data": {
      "market_adjustment_factor": 1.20
    }
  }'

# Activate multiple prices
curl -X PATCH http://localhost:3000/api/v1/product-prices/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "operation": "activate",
    "product_ids": [
      "550e8400-e29b-41d4-a716-446655440000"
    ]
  }'
```

### **Step 7: Get Pricing Statistics**

**Endpoint:** `GET /api/v1/product-prices/stats`

**Purpose:** Get analytics and statistics about pricing

```bash
curl -X GET "http://localhost:3000/api/v1/product-prices/stats?country_id=7c9e6679-7425-40de-944b-e07fc1f90ae7" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Pricing statistics retrieved successfully",
  "data": {
    "total_prices": 150,
    "active_prices": 142,
    "currencies": ["USD", "RWF", "EUR"],
    "average_daily_price": 45.50,
    "price_range": {
      "min": 5.00,
      "max": 500.00
    },
    "discount_stats": {
      "with_weekly_discount": 120,
      "with_monthly_discount": 95,
      "with_bulk_discount": 80
    },
    "dynamic_pricing": {
      "enabled": 45,
      "disabled": 105
    }
  }
}
```

## 🔧 JavaScript/TypeScript Examples

### **Using Fetch API**

```javascript
// Calculate rental price
async function calculatePrice(rentalData) {
  try {
    const response = await fetch('http://localhost:3000/api/v1/product-prices/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(rentalData)
    });
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Price calculation failed:', error);
    throw error;
  }
}

// Usage
const priceData = {
  product_id: "550e8400-e29b-41d4-a716-446655440000",
  country_id: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  rental_duration_hours: 48,
  quantity: 2,
  rental_start_date: "2024-06-15T08:00:00Z"
};

calculatePrice(priceData).then(result => {
  console.log('Total price:', result.total_amount);
  console.log('Breakdown:', result.breakdown);
});
```

### **Using Axios**

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Get product prices
async function getProductPrices(filters = {}) {
  try {
    const response = await api.get('/product-prices', { params: filters });
    return response.data.data;
  } catch (error) {
    console.error('Failed to get prices:', error);
    throw error;
  }
}

// Create new price
async function createProductPrice(priceData) {
  try {
    const response = await api.post('/product-prices', priceData);
    return response.data.data;
  } catch (error) {
    console.error('Failed to create price:', error);
    throw error;
  }
}

// Compare prices across countries
async function comparePrices(productId) {
  try {
    const response = await api.get(`/product-prices/product/${productId}/compare`);
    return response.data.data;
  } catch (error) {
    console.error('Failed to compare prices:', error);
    throw error;
  }
}
```

## 📱 React Hook Example

```javascript
import { useState, useEffect } from 'react';

function usePricing(productId, countryId) {
  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPrices() {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:3000/api/v1/product-prices?product_id=${productId}&country_id=${countryId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        const data = await response.json();
        setPrices(data.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    if (productId && countryId) {
      fetchPrices();
    }
  }, [productId, countryId]);

  return { prices, loading, error };
}

// Usage in component
function ProductPricing({ productId, countryId }) {
  const { prices, loading, error } = usePricing(productId, countryId);

  if (loading) return <div>Loading prices...</div>;
  if (error) return <div>Error loading prices</div>;
  if (!prices) return <div>No pricing available</div>;

  return (
    <div>
      <h3>Pricing</h3>
      <p>Daily: ${prices.price_per_day}</p>
      <p>Weekly: ${prices.price_per_week}</p>
      <p>Monthly: ${prices.price_per_month}</p>
      <p>Security Deposit: ${prices.security_deposit}</p>
    </div>
  );
}
```

## 🎯 Common Use Cases

### **1. Product Listing Page**
- Get prices for products in user's country
- Show daily/weekly/monthly rates
- Display security deposit

### **2. Rental Calculator**
- Calculate price for specific duration
- Show breakdown of costs
- Apply discounts automatically

### **3. Price Comparison**
- Compare same product across countries
- Show currency conversions
- Highlight best deals

### **4. Admin Dashboard**
- Manage pricing for multiple products
- Bulk update market factors
- View pricing statistics

## 🔒 Authentication

All API endpoints require authentication. Include your JWT token in the Authorization header:

```javascript
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

## 📊 Error Handling

The API returns structured error responses:

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "price_per_day",
      "message": "Price must be greater than 0"
    }
  ]
}
```

## 🚀 Next Steps

1. **Test the API** using the examples above
2. **Integrate with your frontend** using the JavaScript examples
3. **Implement error handling** for production use
4. **Add caching** for frequently accessed pricing data
5. **Monitor API usage** and performance

This comprehensive guide covers all the essential pricing API operations you'll need for your UrutiBiz application! 