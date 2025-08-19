#!/usr/bin/env node

const axios = require('axios');

class PricingSystemTester {
  constructor() {
    this.baseUrl = 'http://localhost:3000/api/v1';
    this.testResults = [];
    this.testData = {
      productId: '314aa77c-b69e-4d9b-83e5-2ad9209b547b',
      countryId: '1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6',
      createdPriceId: null
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async logTest(name, success, message) {
    const result = { name, success, message, timestamp: new Date().toISOString() };
    this.testResults.push(result);
    
    if (success) {
      this.log(`✅ ${name}: ${message}`, 'success');
    } else {
      this.log(`❌ ${name}: ${message}`, 'error');
    }
  }

  async testCreateProductPrice() {
    try {
      const priceData = {
        product_id: this.testData.productId,
        country_id: this.testData.countryId,
        currency: 'USD',
        price_per_day: 50.00,
        price_per_week: 300.00,
        price_per_month: 1200.00,
        security_deposit: 100.00,
        market_adjustment_factor: 1.2,
        weekly_discount_percentage: 0.1,
        monthly_discount_percentage: 0.15,
        bulk_discount_threshold: 3,
        bulk_discount_percentage: 0.05,
        min_rental_duration_hours: 1.0,
        max_rental_duration_days: 30,
        early_return_fee_percentage: 0.1,
        late_return_fee_per_hour: 5.00,
        dynamic_pricing_enabled: true,
        peak_season_multiplier: 1.5,
        off_season_multiplier: 0.8,
        seasonal_adjustments: {
          "1": 1.2, "2": 1.1, "3": 1.0, "4": 0.9,
          "5": 0.8, "6": 0.7, "7": 0.8, "8": 0.9,
          "9": 1.0, "10": 1.1, "11": 1.2, "12": 1.3
        },
        is_active: true,
        effective_from: new Date().toISOString(),
        notes: 'Test pricing for comprehensive testing'
      };

      const response = await axios.post(`${this.baseUrl}/product-prices`, priceData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      if (response.data.success && response.data.data.id) {
        this.testData.createdPriceId = response.data.data.id;
        await this.logTest('Create Product Price', true, 'Price created successfully');
        return response.data.data;
      } else {
        await this.logTest('Create Product Price', false, 'Unexpected response format');
        return null;
      }
    } catch (error) {
      await this.logTest('Create Product Price', false, error.response?.data?.message || error.message);
      return null;
    }
  }

  async testGetProductPriceById() {
    if (!this.testData.createdPriceId) {
      await this.logTest('Get Product Price by ID', false, 'No price ID available');
      return null;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/product-prices/${this.testData.createdPriceId}`, {
        timeout: 10000
      });

      if (response.data.success && response.data.data) {
        await this.logTest('Get Product Price by ID', true, 'Price retrieved successfully');
        return response.data.data;
      } else {
        await this.logTest('Get Product Price by ID', false, 'Unexpected response format');
        return null;
      }
    } catch (error) {
      await this.logTest('Get Product Price by ID', false, error.response?.data?.message || error.message);
      return null;
    }
  }

  async testUpdateProductPrice() {
    if (!this.testData.createdPriceId) {
      await this.logTest('Update Product Price', false, 'No price ID available');
      return null;
    }

    try {
      const updateData = {
        price_per_day: 55.00,
        market_adjustment_factor: 1.3,
        weekly_discount_percentage: 0.12,
        notes: 'Updated pricing for testing'
      };

      const response = await axios.put(`${this.baseUrl}/product-prices/${this.testData.createdPriceId}`, updateData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      if (response.data.success && response.data.data) {
        await this.logTest('Update Product Price', true, 'Price updated successfully');
        return response.data.data;
      } else {
        await this.logTest('Update Product Price', false, 'Unexpected response format');
        return null;
      }
    } catch (error) {
      await this.logTest('Update Product Price', false, error.response?.data?.message || error.message);
      return null;
    }
  }

  async testCalculateRentalPrice() {
    try {
      const calculationData = {
        product_id: this.testData.productId,
        country_id: this.testData.countryId,
        currency: 'USD',
        rental_duration_hours: 72, // 3 days
        quantity: 1,
        rental_start_date: new Date().toISOString(),
        include_security_deposit: true,
        apply_discounts: true
      };

      const response = await axios.post(`${this.baseUrl}/product-prices/calculate`, calculationData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      if (response.data.success && response.data.data) {
        const result = response.data.data;
        const expectedSubtotal = 55 * 3 * 1.3; // price_per_day * days * market_adjustment
        
        if (Math.abs(result.subtotal - expectedSubtotal) < 1) {
          await this.logTest('Calculate Rental Price', true, 'Calculation accurate');
        } else {
          await this.logTest('Calculate Rental Price', false, `Expected ~${expectedSubtotal}, got ${result.subtotal}`);
        }
        return result;
      } else {
        await this.logTest('Calculate Rental Price', false, 'Unexpected response format');
        return null;
      }
    } catch (error) {
      await this.logTest('Calculate Rental Price', false, error.response?.data?.message || error.message);
      return null;
    }
  }

  async testCalculateWithDifferentDurations() {
    const testCases = [
      { name: 'Hourly (4 hours)', hours: 4, expectedType: 'hourly' },
      { name: 'Daily (24 hours)', hours: 24, expectedType: 'daily' },
      { name: 'Weekly (168 hours)', hours: 168, expectedType: 'weekly' },
      { name: 'Monthly (720 hours)', hours: 720, expectedType: 'monthly' }
    ];

    for (const testCase of testCases) {
      try {
        const calculationData = {
          product_id: this.testData.productId,
          country_id: this.testData.countryId,
          currency: 'USD',
          rental_duration_hours: testCase.hours,
          quantity: 1,
          apply_discounts: true
        };

        const response = await axios.post(`${this.baseUrl}/product-prices/calculate`, calculationData, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        });

        if (response.data.success && response.data.data) {
          const result = response.data.data;
          if (result.base_rate_type === testCase.expectedType) {
            await this.logTest(`Calculate ${testCase.name}`, true, `Used ${testCase.expectedType} pricing`);
          } else {
            await this.logTest(`Calculate ${testCase.name}`, false, `Expected ${testCase.expectedType}, got ${result.base_rate_type}`);
          }
        } else {
          await this.logTest(`Calculate ${testCase.name}`, false, 'Unexpected response format');
        }
      } catch (error) {
        await this.logTest(`Calculate ${testCase.name}`, false, error.response?.data?.message || error.message);
      }
    }
  }

  async testCalculateWithBulkDiscount() {
    try {
      const calculationData = {
        product_id: this.testData.productId,
        country_id: this.testData.countryId,
        currency: 'USD',
        rental_duration_hours: 24,
        quantity: 5, // Above bulk threshold
        apply_discounts: true
      };

      const response = await axios.post(`${this.baseUrl}/product-prices/calculate`, calculationData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      if (response.data.success && response.data.data) {
        const result = response.data.data;
        if (result.bulk_discount > 0) {
          await this.logTest('Calculate with Bulk Discount', true, `Applied ${result.bulk_discount} discount`);
        } else {
          await this.logTest('Calculate with Bulk Discount', false, 'No bulk discount applied');
        }
        return result;
      } else {
        await this.logTest('Calculate with Bulk Discount', false, 'Unexpected response format');
        return null;
      }
    } catch (error) {
      await this.logTest('Calculate with Bulk Discount', false, error.response?.data?.message || error.message);
      return null;
    }
  }

  async testCalculateWithoutDiscounts() {
    try {
      const calculationData = {
        product_id: this.testData.productId,
        country_id: this.testData.countryId,
        currency: 'USD',
        rental_duration_hours: 24,
        quantity: 1,
        apply_discounts: false
      };

      const response = await axios.post(`${this.baseUrl}/product-prices/calculate`, calculationData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      if (response.data.success && response.data.data) {
        const result = response.data.data;
        if (result.total_discount === 0) {
          await this.logTest('Calculate without Discounts', true, 'No discounts applied');
        } else {
          await this.logTest('Calculate without Discounts', false, `Discounts still applied: ${result.total_discount}`);
        }
        return result;
      } else {
        await this.logTest('Calculate without Discounts', false, 'Unexpected response format');
        return null;
      }
    } catch (error) {
      await this.logTest('Calculate without Discounts', false, error.response?.data?.message || error.message);
      return null;
    }
  }

  async testGetProductPrices() {
    try {
      const response = await axios.get(`${this.baseUrl}/product-prices?product_id=${this.testData.productId}&limit=10`, {
        timeout: 10000
      });

      if (response.data.success && Array.isArray(response.data.data)) {
        await this.logTest('Get Product Prices', true, `Found ${response.data.data.length} prices`);
        return response.data.data;
      } else {
        await this.logTest('Get Product Prices', false, 'Unexpected response format');
        return null;
      }
    } catch (error) {
      await this.logTest('Get Product Prices', false, error.response?.data?.message || error.message);
      return null;
    }
  }

  async testCompareProductPrices() {
    try {
      const response = await axios.get(`${this.baseUrl}/product-prices/product/${this.testData.productId}/compare?rental_duration_hours=72&quantity=1`, {
        timeout: 10000
      });

      if (response.data.success && response.data.data) {
        await this.logTest('Compare Product Prices', true, 'Price comparison successful');
        return response.data.data;
      } else {
        await this.logTest('Compare Product Prices', false, 'Unexpected response format');
        return null;
      }
    } catch (error) {
      await this.logTest('Compare Product Prices', false, error.response?.data?.message || error.message);
      return null;
    }
  }

  async testGetPriceStats() {
    try {
      const response = await axios.get(`${this.baseUrl}/product-prices/stats`, {
        timeout: 10000
      });

      if (response.data.success && response.data.data) {
        await this.logTest('Get Price Statistics', true, 'Statistics retrieved successfully');
        return response.data.data;
      } else {
        await this.logTest('Get Price Statistics', false, 'Unexpected response format');
        return null;
      }
    } catch (error) {
      await this.logTest('Get Price Statistics', false, error.response?.data?.message || error.message);
      return null;
    }
  }

  async testBulkUpdatePrices() {
    try {
      const bulkData = {
        operation: 'update_market_factors',
        data: {
          market_adjustment_factor: 1.25
        }
      };

      const response = await axios.patch(`${this.baseUrl}/product-prices/bulk`, bulkData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      if (response.data.success && response.data.data) {
        await this.logTest('Bulk Update Prices', true, `Updated ${response.data.data.affected_count} prices`);
        return response.data.data;
      } else {
        await this.logTest('Bulk Update Prices', false, 'Unexpected response format');
        return null;
      }
    } catch (error) {
      await this.logTest('Bulk Update Prices', false, error.response?.data?.message || error.message);
      return null;
    }
  }

  async testSearchProductPrices() {
    try {
      const response = await axios.get(`${this.baseUrl}/product-prices/search?query=USD&limit=5`, {
        timeout: 10000
      });

      if (response.data.success && Array.isArray(response.data.data)) {
        await this.logTest('Search Product Prices', true, `Found ${response.data.data.length} matching prices`);
        return response.data.data;
      } else {
        await this.logTest('Search Product Prices', false, 'Unexpected response format');
        return null;
      }
    } catch (error) {
      await this.logTest('Search Product Prices', false, error.response?.data?.message || error.message);
      return null;
    }
  }

  async testValidationErrors() {
    const testCases = [
      {
        name: 'Invalid Product ID',
        data: { country_id: this.testData.countryId, currency: 'USD', price_per_day: 50 },
        expectedError: 'Missing required fields'
      },
      {
        name: 'Invalid Currency',
        data: { product_id: this.testData.productId, country_id: this.testData.countryId, currency: 'US', price_per_day: 50 },
        expectedError: 'Currency code must be exactly 3 characters'
      },
      {
        name: 'Negative Price',
        data: { product_id: this.testData.productId, country_id: this.testData.countryId, currency: 'USD', price_per_day: -10 },
        expectedError: 'Daily price must be greater than 0'
      },
      {
        name: 'Invalid Market Adjustment',
        data: { product_id: this.testData.productId, country_id: this.testData.countryId, currency: 'USD', price_per_day: 50, market_adjustment_factor: 15 },
        expectedError: 'Market adjustment factor must be between 0.01 and 10.0'
      }
    ];

    for (const testCase of testCases) {
      try {
        await axios.post(`${this.baseUrl}/product-prices`, testCase.data, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        });
        await this.logTest(`Validation: ${testCase.name}`, false, 'Should have failed but succeeded');
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;
        if (errorMessage.includes(testCase.expectedError) || error.response?.status === 400) {
          await this.logTest(`Validation: ${testCase.name}`, true, 'Validation working correctly');
        } else {
          await this.logTest(`Validation: ${testCase.name}`, false, `Expected "${testCase.expectedError}", got "${errorMessage}"`);
        }
      }
    }
  }

  async testDeleteProductPrice() {
    if (!this.testData.createdPriceId) {
      await this.logTest('Delete Product Price', false, 'No price ID available');
      return false;
    }

    try {
      const response = await axios.delete(`${this.baseUrl}/product-prices/${this.testData.createdPriceId}`, {
        timeout: 10000
      });

      if (response.data.success) {
        await this.logTest('Delete Product Price', true, 'Price deleted successfully');
        return true;
      } else {
        await this.logTest('Delete Product Price', false, 'Unexpected response format');
        return false;
      }
    } catch (error) {
      await this.logTest('Delete Product Price', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  async runAllTests() {
    console.log('💰 Starting Comprehensive Pricing System Tests');
    console.log('==============================================\n');

    // Basic CRUD operations
    await this.testCreateProductPrice();
    await this.testGetProductPriceById();
    await this.testUpdateProductPrice();

    // Price calculations
    await this.testCalculateRentalPrice();
    await this.testCalculateWithDifferentDurations();
    await this.testCalculateWithBulkDiscount();
    await this.testCalculateWithoutDiscounts();

    // Advanced features
    await this.testGetProductPrices();
    await this.testCompareProductPrices();
    await this.testGetPriceStats();
    await this.testBulkUpdatePrices();
    await this.testSearchProductPrices();

    // Validation testing
    await this.testValidationErrors();

    // Cleanup
    await this.testDeleteProductPrice();

    // Summary
    this.printSummary();
  }

  printSummary() {
    console.log('\n📊 Test Summary');
    console.log('===============');
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.filter(r => !r.success).forEach(result => {
        console.log(`   - ${result.name}: ${result.message}`);
      });
    }
    
    console.log('\n🎯 Pricing System Status:');
    if (failedTests === 0) {
      console.log('✅ All tests passed! Pricing system is working correctly.');
    } else if (failedTests <= 2) {
      console.log('⚠️  Most tests passed. Minor issues detected.');
    } else {
      console.log('❌ Multiple test failures. System needs attention.');
    }
  }
}

// Run the tests
async function main() {
  const tester = new PricingSystemTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test runner failed:', error.message);
    process.exit(1);
  });
}

module.exports = PricingSystemTester; 