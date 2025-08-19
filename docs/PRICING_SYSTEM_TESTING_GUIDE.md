# 💰 Pricing System Testing Guide

This guide covers comprehensive testing of the UrutiBiz pricing system, including all features and edge cases.

## 📋 Overview

The pricing system includes:
- **Multi-currency pricing** with real-time exchange rates
- **Dynamic pricing** based on demand and seasonality
- **Flexible rental periods** (hourly, daily, weekly, monthly)
- **Advanced discount systems** (weekly, monthly, bulk discounts)
- **Market-specific adjustments** for different countries
- **Security deposits** and fee calculations
- **Price comparison** across countries

## 🚀 Quick Start Testing

### **Step 1: Create Product Price**

```bash
curl -X POST http://localhost:3000/api/v1/product-prices \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "314aa77c-b69e-4d9b-83e5-2ad9209b547b",
    "country_id": "1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6",
    "currency": "USD",
    "price_per_day": 50.00,
    "price_per_week": 300.00,
    "price_per_month": 1200.00,
    "security_deposit": 100.00,
    "market_adjustment_factor": 1.2,
    "weekly_discount_percentage": 0.1,
    "monthly_discount_percentage": 0.15,
    "bulk_discount_threshold": 3,
    "bulk_discount_percentage": 0.05
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "price-uuid-here",
    "product_id": "314aa77c-b69e-4d9b-83e5-2ad9209b547b",
    "country_id": "1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6",
    "currency": "USD",
    "price_per_day": 50.00,
    "price_per_week": 300.00,
    "price_per_month": 1200.00,
    "security_deposit": 100.00,
    "market_adjustment_factor": 1.2,
    "is_active": true,
    "created_at": "2025-01-27T10:00:00.000Z"
  },
  "message": "Product price created successfully"
}
```

### **Step 2: Calculate Rental Price**

```bash
curl -X POST http://localhost:3000/api/v1/product-prices/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "314aa77c-b69e-4d9b-83e5-2ad9209b547b",
    "country_id": "1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6",
    "currency": "USD",
    "rental_duration_hours": 72,
    "quantity": 1,
    "rental_start_date": "2025-02-01T00:00:00.000Z",
    "include_security_deposit": true,
    "apply_discounts": true
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "product_id": "314aa77c-b69e-4d9b-83e5-2ad9209b547b",
    "country_id": "1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6",
    "currency": "USD",
    "rental_duration_hours": 72,
    "rental_duration_days": 3,
    "quantity": 1,
    "base_rate_type": "daily",
    "base_rate": 50.00,
    "base_amount": 150.00,
    "market_adjustment_factor": 1.2,
    "seasonal_multiplier": 1.0,
    "weekly_discount": 0,
    "monthly_discount": 0,
    "bulk_discount": 0,
    "total_discount": 0,
    "subtotal": 180.00,
    "security_deposit": 100.00,
    "total_amount": 280.00,
    "calculation_date": "2025-01-27T10:00:00.000Z",
    "pricing_tier_used": "daily",
    "discounts_applied": [],
    "notes": ["Applied market adjustment factor: 1.2"]
  }
}
```

## 📱 Postman Testing

### **Postman Collection Setup**

1. **Create Environment Variables:**
   - `base_url`: `http://localhost:3000/api/v1`
   - `product_id`: `314aa77c-b69e-4d9b-83e5-2ad9209b547b`
   - `country_id`: `1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6`
   - `price_id`: (will be set after creating price)

2. **Create Product Price:**
   ```
   Method: POST
   URL: {{base_url}}/product-prices
   Body (JSON):
   {
     "product_id": "{{product_id}}",
     "country_id": "{{country_id}}",
     "currency": "USD",
     "price_per_day": 50.00,
     "price_per_week": 300.00,
     "price_per_month": 1200.00,
     "security_deposit": 100.00,
     "market_adjustment_factor": 1.2,
     "weekly_discount_percentage": 0.1,
     "monthly_discount_percentage": 0.15
   }
   ```

3. **Calculate Price:**
   ```
   Method: POST
   URL: {{base_url}}/product-prices/calculate
   Body (JSON):
   {
     "product_id": "{{product_id}}",
     "country_id": "{{country_id}}",
     "currency": "USD",
     "rental_duration_hours": 72,
     "quantity": 1,
     "include_security_deposit": true,
     "apply_discounts": true
   }
   ```

## 🔍 Detailed Test Scenarios

### **Scenario 1: Basic Pricing Operations**

1. **Create price for different currencies**
   ```bash
   # USD pricing
   curl -X POST http://localhost:3000/api/v1/product-prices \
     -H "Content-Type: application/json" \
     -d '{
       "product_id": "314aa77c-b69e-4d9b-83e5-2ad9209b547b",
       "country_id": "1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6",
       "currency": "USD",
       "price_per_day": 50.00
     }'
   
   # RWF pricing
   curl -X POST http://localhost:3000/api/v1/product-prices \
     -H "Content-Type: application/json" \
     -d '{
       "product_id": "314aa77c-b69e-4d9b-83e5-2ad9209b547b",
       "country_id": "1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6",
       "currency": "RWF",
       "price_per_day": 50000.00
     }'
   ```

2. **Get all prices for a product**
   ```bash
   curl -X GET "http://localhost:3000/api/v1/product-prices?product_id=314aa77c-b69e-4d9b-83e5-2ad9209b547b"
   ```

3. **Update existing price**
   ```bash
   curl -X PUT http://localhost:3000/api/v1/product-prices/price-id-here \
     -H "Content-Type: application/json" \
     -d '{
       "price_per_day": 55.00,
       "market_adjustment_factor": 1.3
     }'
   ```

### **Scenario 2: Price Calculation Testing**

1. **Hourly pricing**
   ```bash
   curl -X POST http://localhost:3000/api/v1/product-prices/calculate \
     -H "Content-Type: application/json" \
     -d '{
       "product_id": "314aa77c-b69e-4d9b-83e5-2ad9209b547b",
       "country_id": "1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6",
       "rental_duration_hours": 4,
       "quantity": 1
     }'
   ```

2. **Daily pricing (most economical)**
   ```bash
   curl -X POST http://localhost:3000/api/v1/product-prices/calculate \
     -H "Content-Type: application/json" \
     -d '{
       "product_id": "314aa77c-b69e-4d9b-83e5-2ad9209b547b",
       "country_id": "1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6",
       "rental_duration_hours": 24,
       "quantity": 1
     }'
   ```

3. **Weekly pricing with discount**
   ```bash
   curl -X POST http://localhost:3000/api/v1/product-prices/calculate \
     -H "Content-Type: application/json" \
     -d '{
       "product_id": "314aa77c-b69e-4d9b-83e5-2ad9209b547b",
       "country_id": "1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6",
       "rental_duration_hours": 168,
       "quantity": 1
     }'
   ```

4. **Monthly pricing with discount**
   ```bash
   curl -X POST http://localhost:3000/api/v1/product-prices/calculate \
     -H "Content-Type: application/json" \
     -d '{
       "product_id": "314aa77c-b69e-4d9b-83e5-2ad9209b547b",
       "country_id": "1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6",
       "rental_duration_hours": 720,
       "quantity": 1
     }'
   ```

### **Scenario 3: Discount Testing**

1. **Bulk discount**
   ```bash
   curl -X POST http://localhost:3000/api/v1/product-prices/calculate \
     -H "Content-Type: application/json" \
     -d '{
       "product_id": "314aa77c-b69e-4d9b-83e5-2ad9209b547b",
       "country_id": "1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6",
       "rental_duration_hours": 24,
       "quantity": 5
     }'
   ```

2. **No discounts**
   ```bash
   curl -X POST http://localhost:3000/api/v1/product-prices/calculate \
     -H "Content-Type: application/json" \
     -d '{
       "product_id": "314aa77c-b69e-4d9b-83e5-2ad9209b547b",
       "country_id": "1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6",
       "rental_duration_hours": 24,
       "quantity": 1,
       "apply_discounts": false
     }'
   ```

### **Scenario 4: Market Adjustments**

1. **High market adjustment**
   ```bash
   # Create price with high market adjustment
   curl -X POST http://localhost:3000/api/v1/product-prices \
     -H "Content-Type: application/json" \
     -d '{
       "product_id": "314aa77c-b69e-4d9b-83e5-2ad9209b547b",
       "country_id": "1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6",
       "currency": "USD",
       "price_per_day": 50.00,
       "market_adjustment_factor": 2.0
     }'
   ```

2. **Low market adjustment**
   ```bash
   # Create price with low market adjustment
   curl -X POST http://localhost:3000/api/v1/product-prices \
     -H "Content-Type: application/json" \
     -d '{
       "product_id": "314aa77c-b69e-4d9b-83e5-2ad9209b547b",
       "country_id": "1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6",
       "currency": "USD",
       "price_per_day": 50.00,
       "market_adjustment_factor": 0.5
     }'
   ```

### **Scenario 5: Dynamic Pricing**

1. **Seasonal adjustments**
   ```bash
   curl -X POST http://localhost:3000/api/v1/product-prices \
     -H "Content-Type: application/json" \
     -d '{
       "product_id": "314aa77c-b69e-4d9b-83e5-2ad9209b547b",
       "country_id": "1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6",
       "currency": "USD",
       "price_per_day": 50.00,
       "dynamic_pricing_enabled": true,
       "peak_season_multiplier": 1.5,
       "off_season_multiplier": 0.8,
       "seasonal_adjustments": {
         "1": 1.2,
         "2": 1.1,
         "3": 1.0,
         "4": 0.9,
         "5": 0.8,
         "6": 0.7,
         "7": 0.8,
         "8": 0.9,
         "9": 1.0,
         "10": 1.1,
         "11": 1.2,
         "12": 1.3
       }
     }'
   ```

### **Scenario 6: Price Comparison**

1. **Compare prices across countries**
   ```bash
   curl -X GET "http://localhost:3000/api/v1/product-prices/product/314aa77c-b69e-4d9b-83e5-2ad9209b547b/compare?rental_duration_hours=72&quantity=1"
   ```

2. **Get price statistics**
   ```bash
   curl -X GET "http://localhost:3000/api/v1/product-prices/stats"
   ```

### **Scenario 7: Bulk Operations**

1. **Bulk update prices**
   ```bash
   curl -X PATCH http://localhost:3000/api/v1/product-prices/bulk \
     -H "Content-Type: application/json" \
     -d '{
       "operation": "update_market_factors",
       "data": {
         "country_id": "1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6",
         "market_adjustment_factor": 1.3
       }
     }'
   ```

2. **Bulk activate/deactivate**
   ```bash
   curl -X PATCH http://localhost:3000/api/v1/product-prices/bulk \
     -H "Content-Type: application/json" \
     -d '{
       "operation": "deactivate",
       "data": {
         "product_id": "314aa77c-b69e-4d9b-83e5-2ad9209b547b"
       }
     }'
   ```

## 🔧 API Endpoints Reference

### **Price Management**
```http
POST   /api/v1/product-prices              # Create new pricing
GET    /api/v1/product-prices              # List all prices with filters
GET    /api/v1/product-prices/:id          # Get specific price by ID
PUT    /api/v1/product-prices/:id          # Update existing price
DELETE /api/v1/product-prices/:id          # Delete price
```

### **Price Calculation**
```http
POST   /api/v1/product-prices/calculate    # Calculate rental price (POST)
GET    /api/v1/product-prices/calculate    # Calculate rental price (GET)
```

### **Product-Specific Prices**
```http
GET    /api/v1/product-prices/product/:productId         # Get all prices for product
GET    /api/v1/product-prices/product/:productId/compare # Compare prices across countries
```

### **Country-Specific Prices**
```http
GET    /api/v1/product-prices/country/:countryId         # Get all prices for country
```

### **Bulk Operations**
```http
PATCH  /api/v1/product-prices/bulk         # Bulk update operations
```

### **Statistics & Search**
```http
GET    /api/v1/product-prices/stats        # Get pricing statistics
GET    /api/v1/product-prices/search       # Search product prices
```

## 🔒 Validation Rules

### **Price Creation Validation**
- ✅ Product ID must exist
- ✅ Country ID must exist
- ✅ Currency must be 3 characters (ISO 4217)
- ✅ Daily price must be > 0
- ✅ Market adjustment factor must be between 0.01 and 10.0
- ✅ Discount percentages must be between 0 and 1
- ✅ No duplicate prices for same product/country/currency

### **Price Calculation Validation**
- ✅ Product must have active pricing
- ✅ Rental duration must be > 0
- ✅ Quantity must be >= 1
- ✅ Duration must be within min/max limits
- ✅ Effective date must be within price validity period

### **Bulk Operation Validation**
- ✅ Operation must be one of: update_prices, update_discounts, update_market_factors, activate, deactivate, update_exchange_rates
- ✅ Required data fields must be provided
- ✅ At least one filter must be specified

## 🐛 Troubleshooting

### **Common Issues**

1. **"No active pricing found"**
   - Check if price exists for product/country/currency
   - Verify price is active (is_active = true)
   - Check effective date range

2. **"Minimum rental duration not met"**
   - Check min_rental_duration_hours setting
   - Ensure rental_duration_hours >= minimum

3. **"Maximum rental duration exceeded"**
   - Check max_rental_duration_days setting
   - Ensure rental_duration_hours <= maximum

4. **"Price already exists"**
   - Only one price per product/country/currency combination
   - Update existing price instead of creating new one

5. **"Invalid currency code"**
   - Currency must be exactly 3 characters
   - Use ISO 4217 currency codes (USD, RWF, EUR, etc.)

### **Database Queries for Debugging**

```sql
-- Check all prices for a product
SELECT * FROM product_prices 
WHERE product_id = 'your_product_id' 
ORDER BY created_at DESC;

-- Check active prices
SELECT * FROM product_prices 
WHERE is_active = true 
AND effective_from <= NOW() 
AND (effective_until IS NULL OR effective_until >= NOW());

-- Check price calculations
SELECT 
  product_id,
  country_id,
  currency,
  price_per_day,
  market_adjustment_factor,
  weekly_discount_percentage,
  monthly_discount_percentage
FROM product_prices 
WHERE product_id = 'your_product_id';
```

## 📊 Testing Checklist

### **Basic Operations**
- [ ] Create product price (USD)
- [ ] Create product price (RWF)
- [ ] Get price by ID
- [ ] Update existing price
- [ ] Delete price
- [ ] List all prices with filters

### **Price Calculations**
- [ ] Calculate hourly pricing
- [ ] Calculate daily pricing
- [ ] Calculate weekly pricing (with discount)
- [ ] Calculate monthly pricing (with discount)
- [ ] Calculate with bulk discount
- [ ] Calculate without discounts
- [ ] Calculate with market adjustments
- [ ] Calculate with seasonal adjustments

### **Advanced Features**
- [ ] Compare prices across countries
- [ ] Get price statistics
- [ ] Search product prices
- [ ] Bulk update operations
- [ ] Dynamic pricing with seasonal adjustments

### **Validation & Error Handling**
- [ ] Invalid product ID
- [ ] Invalid country ID
- [ ] Invalid currency code
- [ ] Negative prices
- [ ] Invalid discount percentages
- [ ] Duplicate price creation
- [ ] Duration limits
- [ ] Missing required fields

### **Edge Cases**
- [ ] Zero duration
- [ ] Very large quantities
- [ ] Extreme market adjustments
- [ ] Expired prices
- [ ] Future effective dates
- [ ] Currency conversion scenarios

## 🎯 Success Criteria

✅ **All CRUD operations work correctly**
✅ **Price calculations are accurate**
✅ **Discounts are applied correctly**
✅ **Market adjustments work**
✅ **Dynamic pricing functions**
✅ **Bulk operations succeed**
✅ **Validation prevents invalid data**
✅ **Error handling is robust**
✅ **Performance is acceptable**
✅ **API responses are consistent**

## 🚀 Performance Testing

### **Load Testing Scenarios**

1. **Concurrent price calculations**
   ```bash
   # Test with multiple simultaneous requests
   for i in {1..10}; do
     curl -X POST http://localhost:3000/api/v1/product-prices/calculate \
       -H "Content-Type: application/json" \
       -d '{
         "product_id": "314aa77c-b69e-4d9b-83e5-2ad9209b547b",
         "country_id": "1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6",
         "rental_duration_hours": 24,
         "quantity": 1
       }' &
   done
   wait
   ```

2. **Bulk operations performance**
   ```bash
   # Test bulk update with large dataset
   curl -X PATCH http://localhost:3000/api/v1/product-prices/bulk \
     -H "Content-Type: application/json" \
     -d '{
       "operation": "update_market_factors",
       "data": {
         "market_adjustment_factor": 1.1
       }
     }'
   ```

## 📈 Monitoring & Analytics

### **Key Metrics to Track**
- Price calculation response time
- Bulk operation completion time
- Error rates by operation type
- Most used pricing tiers
- Popular discount combinations
- Currency conversion accuracy

### **Log Analysis**
```bash
# Monitor pricing-related logs
grep "pricing\|price" /var/log/urutibiz/app.log

# Check for calculation errors
grep "calculation\|error" /var/log/urutibiz/app.log
```

This comprehensive testing guide ensures your pricing system is robust, accurate, and performant! 🎯 