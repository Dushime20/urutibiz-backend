#!/usr/bin/env node

const axios = require('axios');

class PricingSystemEnhancer {
  constructor() {
    this.baseUrl = 'http://localhost:3000/api/v1';
    this.enhancements = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async logEnhancement(name, success, message) {
    const enhancement = { name, success, message, timestamp: new Date().toISOString() };
    this.enhancements.push(enhancement);
    
    if (success) {
      this.log(`✅ ${name}: ${message}`, 'success');
    } else {
      this.log(`❌ ${name}: ${message}`, 'error');
    }
  }

  async testCurrencyConversion() {
    try {
      // Test USD pricing
      const usdPrice = {
        product_id: '314aa77c-b69e-4d9b-83e5-2ad9209b547b',
        country_id: '1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6',
        currency: 'USD',
        price_per_day: 50.00,
        base_currency: 'USD',
        exchange_rate: 1.0,
        auto_convert: true
      };

      const usdResponse = await axios.post(`${this.baseUrl}/product-prices`, usdPrice, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      if (usdResponse.data.success) {
        // Test RWF pricing with conversion
        const rwfPrice = {
          product_id: '314aa77c-b69e-4d9b-83e5-2ad9209b547b',
          country_id: '1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6',
          currency: 'RWF',
          price_per_day: 50000.00,
          base_currency: 'USD',
          exchange_rate: 1000.0, // 1 USD = 1000 RWF
          auto_convert: true
        };

        const rwfResponse = await axios.post(`${this.baseUrl}/product-prices`, rwfPrice, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        });

        if (rwfResponse.data.success) {
          await this.logEnhancement('Currency Conversion', true, 'USD and RWF pricing with conversion rates created');
          return true;
        }
      }
      
      await this.logEnhancement('Currency Conversion', false, 'Failed to create currency conversion pricing');
      return false;
    } catch (error) {
      await this.logEnhancement('Currency Conversion', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  async testDynamicPricing() {
    try {
      const dynamicPrice = {
        product_id: '314aa77c-b69e-4d9b-83e5-2ad9209b547b',
        country_id: '1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6',
        currency: 'USD',
        price_per_day: 50.00,
        dynamic_pricing_enabled: true,
        peak_season_multiplier: 1.5,
        off_season_multiplier: 0.8,
        seasonal_adjustments: {
          "1": 1.2, "2": 1.1, "3": 1.0, "4": 0.9,
          "5": 0.8, "6": 0.7, "7": 0.8, "8": 0.9,
          "9": 1.0, "10": 1.1, "11": 1.2, "12": 1.3
        }
      };

      const response = await axios.post(`${this.baseUrl}/product-prices`, dynamicPrice, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      if (response.data.success) {
        // Test calculation with seasonal adjustment
        const calculationData = {
          product_id: '314aa77c-b69e-4d9b-83e5-2ad9209b547b',
          country_id: '1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6',
          currency: 'USD',
          rental_duration_hours: 24,
          quantity: 1,
          rental_start_date: new Date('2025-01-15').toISOString() // January (month 1)
        };

        const calcResponse = await axios.post(`${this.baseUrl}/product-prices/calculate`, calculationData, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        });

        if (calcResponse.data.success) {
          const result = calcResponse.data.data;
          if (result.seasonal_multiplier === 1.2) { // January adjustment
            await this.logEnhancement('Dynamic Pricing', true, 'Seasonal adjustments working correctly');
            return true;
          } else {
            await this.logEnhancement('Dynamic Pricing', false, `Expected seasonal multiplier 1.2, got ${result.seasonal_multiplier}`);
            return false;
          }
        }
      }
      
      await this.logEnhancement('Dynamic Pricing', false, 'Failed to test dynamic pricing');
      return false;
    } catch (error) {
      await this.logEnhancement('Dynamic Pricing', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  async testBulkOperations() {
    try {
      // Test bulk market factor update
      const bulkData = {
        operation: 'update_market_factors',
        data: {
          market_adjustment_factor: 1.25,
          country_id: '1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6'
        }
      };

      const response = await axios.patch(`${this.baseUrl}/product-prices/bulk`, bulkData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      if (response.data.success && response.data.data.affected_count > 0) {
        await this.logEnhancement('Bulk Operations', true, `Updated ${response.data.data.affected_count} prices`);
        return true;
      } else {
        await this.logEnhancement('Bulk Operations', false, 'No prices were updated');
        return false;
      }
    } catch (error) {
      await this.logEnhancement('Bulk Operations', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  async testPerformanceOptimization() {
    try {
      // Test concurrent price calculations
      const promises = [];
      const testData = {
        product_id: '314aa77c-b69e-4d9b-83e5-2ad9209b547b',
        country_id: '1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6',
        currency: 'USD',
        rental_duration_hours: 24,
        quantity: 1
      };

      // Create 10 concurrent requests
      for (let i = 0; i < 10; i++) {
        promises.push(
          axios.post(`${this.baseUrl}/product-prices/calculate`, testData, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
          })
        );
      }

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      const successCount = results.filter(r => r.data.success).length;
      
      if (successCount === 10 && duration < 5000) { // All successful and under 5 seconds
        await this.logEnhancement('Performance Optimization', true, `All ${successCount} concurrent requests successful in ${duration}ms`);
        return true;
      } else {
        await this.logEnhancement('Performance Optimization', false, `${successCount}/10 requests successful in ${duration}ms`);
        return false;
      }
    } catch (error) {
      await this.logEnhancement('Performance Optimization', false, error.message);
      return false;
    }
  }

  async testErrorHandling() {
    const testCases = [
      {
        name: 'Invalid Duration',
        data: { rental_duration_hours: 0 },
        expectedError: 'Rental duration must be greater than 0'
      },
      {
        name: 'Invalid Quantity',
        data: { quantity: 0 },
        expectedError: 'Quantity must be at least 1'
      },
      {
        name: 'Missing Product ID',
        data: { country_id: '1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6' },
        expectedError: 'Missing required fields'
      }
    ];

    let successCount = 0;

    for (const testCase of testCases) {
      try {
        await axios.post(`${this.baseUrl}/product-prices/calculate`, testCase.data, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        });
        // Should not reach here
        await this.logEnhancement(`Error Handling: ${testCase.name}`, false, 'Should have failed but succeeded');
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;
        if (errorMessage.includes(testCase.expectedError) || error.response?.status === 400) {
          await this.logEnhancement(`Error Handling: ${testCase.name}`, true, 'Validation working correctly');
          successCount++;
        } else {
          await this.logEnhancement(`Error Handling: ${testCase.name}`, false, `Expected "${testCase.expectedError}", got "${errorMessage}"`);
        }
      }
    }

    return successCount === testCases.length;
  }

  async testAdvancedFeatures() {
    try {
      // Test price comparison across countries
      const comparisonResponse = await axios.get(`${this.baseUrl}/product-prices/product/314aa77c-b69e-4d9b-83e5-2ad9209b547b/compare?rental_duration_hours=72&quantity=1`, {
        timeout: 10000
      });

      if (comparisonResponse.data.success) {
        await this.logEnhancement('Advanced Features', true, 'Price comparison working');
        return true;
      } else {
        await this.logEnhancement('Advanced Features', false, 'Price comparison failed');
        return false;
      }
    } catch (error) {
      await this.logEnhancement('Advanced Features', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  async runEnhancements() {
    console.log('🚀 Starting Pricing System Enhancements');
    console.log('=====================================\n');

    await this.testCurrencyConversion();
    await this.testDynamicPricing();
    await this.testBulkOperations();
    await this.testPerformanceOptimization();
    await this.testErrorHandling();
    await this.testAdvancedFeatures();

    this.printEnhancementSummary();
  }

  printEnhancementSummary() {
    console.log('\n📊 Enhancement Summary');
    console.log('======================');
    
    const totalEnhancements = this.enhancements.length;
    const successfulEnhancements = this.enhancements.filter(e => e.success).length;
    const failedEnhancements = totalEnhancements - successfulEnhancements;
    
    console.log(`Total Enhancements: ${totalEnhancements}`);
    console.log(`✅ Successful: ${successfulEnhancements}`);
    console.log(`❌ Failed: ${failedEnhancements}`);
    console.log(`Success Rate: ${((successfulEnhancements / totalEnhancements) * 100).toFixed(1)}%`);
    
    if (failedEnhancements > 0) {
      console.log('\n❌ Failed Enhancements:');
      this.enhancements.filter(e => !e.success).forEach(enhancement => {
        console.log(`   - ${enhancement.name}: ${enhancement.message}`);
      });
    }
    
    console.log('\n🎯 Pricing System Enhancement Status:');
    if (failedEnhancements === 0) {
      console.log('✅ All enhancements successful! Pricing system is fully optimized.');
    } else if (failedEnhancements <= 2) {
      console.log('⚠️  Most enhancements successful. Minor optimizations needed.');
    } else {
      console.log('❌ Multiple enhancement failures. System needs optimization.');
    }
  }
}

// Run the enhancements
async function main() {
  const enhancer = new PricingSystemEnhancer();
  await enhancer.runEnhancements();
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Enhancement runner failed:', error.message);
    process.exit(1);
  });
}

module.exports = PricingSystemEnhancer; 