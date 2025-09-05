# 🚀 Risk Management API Endpoints

## 📋 **Risk Profile Management**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/risk-management/profiles` | Create risk profile for product | Admin/Super Admin |
| `GET` | `/api/v1/risk-management/profiles/product/{productId}` | Get risk profile by product ID | Authenticated |
| `POST` | `/api/v1/risk-management/profiles/bulk` | Bulk create risk profiles | Admin/Super Admin |

## 🔍 **Risk Assessment**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/risk-management/assess` | Perform risk assessment | Authenticated |
| `POST` | `/api/v1/risk-management/assess/bulk` | Bulk risk assessment | Authenticated |

## ✅ **Compliance Checking**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/risk-management/compliance/check` | Check booking compliance | Authenticated |
| `GET` | `/api/v1/risk-management/compliance/booking/{bookingId}` | Get compliance status | Authenticated |

## ⚠️ **Policy Violation Management**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/risk-management/violations` | Record policy violation | Admin/Super Admin/Inspector |

## 🔧 **Automated Enforcement**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/risk-management/enforce` | Trigger enforcement actions | Admin/Super Admin |

## 📊 **Statistics and Analytics**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/risk-management/stats` | Get risk management statistics | Admin/Super Admin |

---

## 🧪 **Quick Test Examples**

### **1. Risk Assessment**
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

### **2. Compliance Check**
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

### **3. Get Risk Profile**
```bash
curl -X GET http://localhost:5000/api/v1/risk-management/profiles/product/PRODUCT_UUID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **4. Get Statistics**
```bash
curl -X GET http://localhost:5000/api/v1/risk-management/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📊 **Sample Data Available**

**8 High-Value Products** with risk profiles:

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

---

## 🚀 **Getting Started**

1. **Start Server**: `npm run dev`
2. **Get JWT Token**: Login via `/api/v1/auth/login`
3. **Test APIs**: Use curl examples above or Postman
4. **Run Test Script**: `node test-risk-assessment-api.js`

---

## 📝 **Key Features**

- ✅ **Intelligent Risk Assessment** (0-100 score)
- ✅ **Mandatory Insurance Requirements** 
- ✅ **Automated Compliance Checking**
- ✅ **Policy Violation Tracking**
- ✅ **Enforcement Actions**
- ✅ **Comprehensive Statistics**
- ✅ **Bulk Operations**
- ✅ **Role-Based Access Control**
