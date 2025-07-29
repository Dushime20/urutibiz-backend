# 🏷️ Product Prices API - Complete Guide

## 🎯 **Purpose & Overview**

The Product Prices API is a **sophisticated pricing engine** for rental products that handles:

- **Multi-country, multi-currency pricing**
- **Dynamic pricing based on demand, season, and location**
- **Flexible rental periods** (hourly, daily, weekly, monthly)
- **Advanced discount systems and bulk pricing**
- **Real-time price calculations with currency conversion**

---

## 🔧 **Core Features**

### 💰 **Pricing Capabilities:**
- Multiple rate types (hourly/daily/weekly/monthly)
- Security deposits and market adjustments
- Currency conversion with real-time exchange rates
- Dynamic pricing based on demand and seasonality

### 🌍 **Global Support:**
- Country-specific pricing strategies
- Multi-currency support (USD, RWF, EUR, etc.)
- Market adjustment factors for local economics
- Localized pricing rules and regulations

### 📊 **Advanced Logic:**
- Smart rate selection (automatically choose best rate)
- Seasonal multipliers (peak/off-season pricing)
- Discount systems (weekly, monthly, bulk discounts)
- Time-based pricing with effective dates

---

## 🔗 **API Endpoints**

### **1. Price Management**
```http
POST   /api/v1/product-prices              # Create new pricing
GET    /api/v1/product-prices              # List all prices with filters
GET    /api/v1/product-prices/:id          # Get specific price by ID
PUT    /api/v1/product-prices/:id          # Update existing price
DELETE /api/v1/product-prices/:id          # Delete price
```

### **2. Price Calculation**
```http
POST   /api/v1/product-prices/calculate    # Calculate rental price (POST)
GET    /api/v1/product-prices/calculate    # Calculate rental price (GET)
```

### **3. Product-Specific Prices**
```http
GET    /api/v1/product-prices/product/:productId         # Get all prices for product
GET    /api/v1/product-prices/product/:productId/compare # Compare prices across countries
```

### **4. Country-Specific Prices**
```http
GET    /api/v1/product-prices/country/:countryId         # Get prices by country
```

### **5. Bulk Operations**
```http
PATCH  /api/v1/product-prices/bulk        # Bulk update prices
```

### **6. Analytics & Search**
```http
GET    /api/v1/product-prices/stats       # Get pricing statistics
GET    /api/v1/product-prices/search      # Search prices with filters
```

---

## 💡 **Use Cases**

### **1. E-Commerce Rental Platform:**
```javascript
// Calculate rental price for user
const priceCalculation = await fetch('/api/v1/product-prices/calculate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    product_id: 'laptop-123',
    country_id: 'rwanda-uuid',
    rental_duration_hours: 72, // 3 days
    currency: 'RWF',
    quantity: 1,
    apply_discounts: true
  })
});

const pricing = await priceCalculation.json();
// Returns: subtotal, discounts, security deposit, total cost
```

### **2. Multi-Country Product Comparison:**
```javascript
// Compare laptop prices across countries
const comparison = await fetch('/api/v1/product-prices/product/laptop-123/compare?rental_duration_hours=24');
const prices = await comparison.json();
// Returns: prices in different countries/currencies
```

### **3. Admin Bulk Price Updates:**
```javascript
// Update all electronics prices by 10%
const bulkUpdate = await fetch('/api/v1/product-prices/bulk', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    operation: 'update_prices',
    filters: { category: 'electronics' },
    data: { price_adjustment_percentage: 0.10 }
  })
});
```

---

## 📋 **Price Calculation Example**

### **Request:**
```json
{
  "product_id": "camera-uuid",
  "country_id": "rwanda-uuid", 
  "rental_duration_hours": 168,
  "currency": "RWF",
  "quantity": 2,
  "rental_start_date": "2025-08-15T10:00:00Z",
  "include_security_deposit": true,
  "apply_discounts": true
}
```

### **Response:**
```json
{
  "success": true,
  "data": {
    "product_id": "camera-uuid",
    "country_id": "rwanda-uuid",
    "currency": "RWF",
    "rental_duration_hours": 168,
    "rental_duration_days": 7,
    "quantity": 2,
    "base_rate_type": "weekly",
    "base_rate": 50000,
    "base_amount": 100000,
    "market_adjustment_factor": 1.1,
    "seasonal_multiplier": 1.0,
    "weekly_discount": 5000,
    "bulk_discount": 2000,
    "total_discount": 7000,
    "subtotal": 93000,
    "security_deposit": 20000,
    "total_amount": 113000,
    "exchange_rate_used": 1.0,
    "discounts_applied": ["weekly_discount", "bulk_discount"]
  }
}
```

---

## 🎨 **Frontend Integration Examples**

### **React Price Calculator Component:**
```jsx
import { useState, useEffect } from 'react';

function PriceCalculator({ productId, countryId }) {
  const [pricing, setPricing] = useState(null);
  const [duration, setDuration] = useState(24);

  const calculatePrice = async () => {
    const response = await fetch('/api/v1/product-prices/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: productId,
        country_id: countryId,
        rental_duration_hours: duration,
        currency: 'RWF'
      })
    });
    
    const result = await response.json();
    setPricing(result.data);
  };

  return (
    <div className="price-calculator">
      <input 
        type="number" 
        value={duration} 
        onChange={(e) => setDuration(e.target.value)}
        placeholder="Duration (hours)"
      />
      <button onClick={calculatePrice}>Calculate Price</button>
      
      {pricing && (
        <div className="pricing-breakdown">
          <h3>Price Breakdown</h3>
          <p>Base Amount: {pricing.base_amount} {pricing.currency}</p>
          <p>Discounts: -{pricing.total_discount} {pricing.currency}</p>
          <p>Security Deposit: {pricing.security_deposit} {pricing.currency}</p>
          <h4>Total: {pricing.total_amount} {pricing.currency}</h4>
        </div>
      )}
    </div>
  );
}
```

### **Vue.js Price Comparison:**
```vue
<template>
  <div class="price-comparison">
    <h3>Price Comparison Across Countries</h3>
    <div v-for="price in prices" :key="price.country_id" class="price-card">
      <h4>{{ price.country_name }}</h4>
      <p>{{ price.total_amount }} {{ price.currency }}</p>
      <small>{{ price.rental_duration_days }} days</small>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      prices: []
    };
  },
  async mounted() {
    const response = await fetch(`/api/v1/product-prices/product/${this.productId}/compare?rental_duration_hours=72`);
    const result = await response.json();
    this.prices = result.data;
  }
};
</script>
```

---

## 🔍 **Key Benefits**

### **For Business Owners:**
- **Dynamic Pricing**: Maximize revenue with smart pricing
- **Multi-Market Support**: Expand globally with localized pricing
- **Flexible Discounts**: Attract customers with strategic discounts
- **Analytics**: Understand pricing performance across markets

### **For Developers:**
- **Easy Integration**: RESTful API with comprehensive documentation
- **Flexible Calculations**: Complex pricing logic handled automatically
- **Real-Time Pricing**: Instant price calculations for user experience
- **Bulk Operations**: Efficient management of large product catalogs

### **For Users:**
- **Transparent Pricing**: Clear breakdown of costs and discounts
- **Local Currency**: Prices displayed in familiar currency
- **Fair Pricing**: Market-appropriate rates for each location
- **Discount Visibility**: See savings from longer rentals

---

## 🚀 **Getting Started**

1. **Set Up Product Prices:**
   ```bash
   POST /api/v1/product-prices
   # Create pricing for your products in different countries
   ```

2. **Calculate Prices:**
   ```bash
   GET /api/v1/product-prices/calculate?product_id=...&country_id=...&rental_duration_hours=24
   # Get real-time pricing for user requests
   ```

3. **Monitor Performance:**
   ```bash
   GET /api/v1/product-prices/stats
   # Track pricing analytics and optimization opportunities
   ```

The Product Prices API provides enterprise-grade pricing management for global rental platforms! 🌍💰 