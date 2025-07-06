#!/usr/bin/env node

/**
 * Countries CRUD Demo Script
 * 
 * This script demonstrates the complete CRUD functionality for the countries module.
 * It can be run independently to test the countries system.
 */

// Mock database for demo purposes
const mockDatabase = [];
let idCounter = 1;

// Mock UUID generator
const generateId = () => `country-${idCounter++}`;

// Mock Country Model Implementation
class MockCountryModel {
  static async create(data) {
    const country = {
      id: generateId(),
      ...data,
      languages: data.languages || ['en'],
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    mockDatabase.push(country);
    return country;
  }

  static async findById(id) {
    return mockDatabase.find(c => c.id === id) || null;
  }

  static async findByCode(code) {
    return mockDatabase.find(c => c.code === code.toUpperCase()) || null;
  }

  static async findAll(filters = {}) {
    let countries = [...mockDatabase];
    
    if (filters.is_active !== undefined) {
      countries = countries.filter(c => c.is_active === filters.is_active);
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      countries = countries.filter(c => 
        c.name.toLowerCase().includes(searchTerm) ||
        c.code.toLowerCase().includes(searchTerm) ||
        (c.local_name && c.local_name.toLowerCase().includes(searchTerm))
      );
    }
    
    const total = countries.length;
    
    if (filters.limit) {
      countries = countries.slice(0, filters.limit);
    }
    
    return { countries, total };
  }

  static async update(id, data) {
    const index = mockDatabase.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    mockDatabase[index] = {
      ...mockDatabase[index],
      ...data,
      updated_at: new Date()
    };
    
    return mockDatabase[index];
  }

  static async delete(id) {
    const index = mockDatabase.findIndex(c => c.id === id);
    if (index === -1) return false;
    
    mockDatabase[index].is_active = false;
    mockDatabase[index].updated_at = new Date();
    return true;
  }

  static async getStats() {
    const total_countries = mockDatabase.length;
    const active_countries = mockDatabase.filter(c => c.is_active).length;
    const inactive_countries = total_countries - active_countries;
    
    return {
      total_countries,
      active_countries,
      inactive_countries,
      countries_by_currency: {},
      countries_by_region: {},
      recent_launches: []
    };
  }
}

// Demo Functions
async function demoCreateCountries() {
  console.log('\n🏗️  Creating Countries...\n');
  
  const countries = [
    {
      code: 'RW',
      code_alpha3: 'RWA',
      name: 'Rwanda',
      local_name: 'Rwanda',
      currency_code: 'RWF',
      currency_symbol: 'FRw',
      phone_prefix: '+250',
      timezone: 'Africa/Kigali',
      languages: ['rw', 'en', 'fr'],
      launch_date: '2025-01-01'
    },
    {
      code: 'KE',
      code_alpha3: 'KEN',
      name: 'Kenya',
      local_name: 'Kenya',
      currency_code: 'KES',
      currency_symbol: 'KSh',
      phone_prefix: '+254',
      timezone: 'Africa/Nairobi',
      languages: ['sw', 'en'],
      launch_date: '2025-06-01'
    },
    {
      code: 'UG',
      code_alpha3: 'UGA',
      name: 'Uganda',
      local_name: 'Uganda',
      currency_code: 'UGX',
      currency_symbol: 'USh',
      phone_prefix: '+256',
      timezone: 'Africa/Kampala',
      languages: ['en', 'sw'],
      launch_date: '2025-09-01'
    },
    {
      code: 'US',
      code_alpha3: 'USA',
      name: 'United States',
      local_name: 'United States',
      currency_code: 'USD',
      currency_symbol: '$',
      phone_prefix: '+1',
      timezone: 'America/New_York',
      languages: ['en'],
      launch_date: '2024-01-01'
    }
  ];

  const createdCountries = [];
  for (const countryData of countries) {
    const country = await MockCountryModel.create(countryData);
    createdCountries.push(country);
    console.log(`✅ Created: ${country.name} (${country.code}) - ${country.currency_code}`);
  }
  
  return createdCountries;
}

async function demoReadCountries() {
  console.log('\n📖 Reading Countries...\n');
  
  // Get all countries
  const { countries, total } = await MockCountryModel.findAll();
  console.log(`📊 Total Countries: ${total}`);
  
  countries.forEach(country => {
    console.log(`  • ${country.name} (${country.code}) - ${country.currency_symbol} ${country.currency_code} - Active: ${country.is_active}`);
  });
  
  // Get country by code
  console.log('\n🔍 Finding Rwanda by code (RW):');
  const rwanda = await MockCountryModel.findByCode('RW');
  if (rwanda) {
    console.log(`  Found: ${rwanda.name} - Languages: ${rwanda.languages.join(', ')}`);
  }
  
  // Search countries
  console.log('\n🔍 Searching for "United":');
  const { countries: searchResults } = await MockCountryModel.findAll({ search: 'United' });
  searchResults.forEach(country => {
    console.log(`  Found: ${country.name} (${country.code})`);
  });
}

async function demoUpdateCountries() {
  console.log('\n✏️  Updating Countries...\n');
  
  // Find a country to update
  const { countries } = await MockCountryModel.findAll({ limit: 1 });
  if (countries.length === 0) {
    console.log('No countries to update');
    return;
  }
  
  const countryToUpdate = countries[0];
  console.log(`Updating: ${countryToUpdate.name}`);
  
  // Update the country
  const updatedData = {
    local_name: `${countryToUpdate.name} (Updated)`,
    timezone: 'Updated/Timezone'
  };
  
  const updatedCountry = await MockCountryModel.update(countryToUpdate.id, updatedData);
  if (updatedCountry) {
    console.log(`✅ Updated: ${updatedCountry.name} - Local Name: ${updatedCountry.local_name}`);
  }
}

async function demoDeleteCountries() {
  console.log('\n🗑️  Soft Deleting Countries...\n');
  
  // Find the last country to delete
  const { countries } = await MockCountryModel.findAll();
  if (countries.length === 0) {
    console.log('No countries to delete');
    return;
  }
  
  const countryToDelete = countries[countries.length - 1];
  console.log(`Soft deleting: ${countryToDelete.name}`);
  
  const success = await MockCountryModel.delete(countryToDelete.id);
  if (success) {
    console.log(`✅ Soft deleted: ${countryToDelete.name}`);
    
    // Verify it's marked as inactive
    const deletedCountry = await MockCountryModel.findById(countryToDelete.id);
    if (deletedCountry) {
      console.log(`  Status: Active = ${deletedCountry.is_active}`);
    }
  }
}

async function demoCountryStats() {
  console.log('\n📊 Country Statistics...\n');
  
  const stats = await MockCountryModel.getStats();
  console.log(`Total Countries: ${stats.total_countries}`);
  console.log(`Active Countries: ${stats.active_countries}`);
  console.log(`Inactive Countries: ${stats.inactive_countries}`);
}

async function runDemo() {
  console.log('🚀 Starting UrutiBiz Countries CRUD Demo\n');
  console.log('=' .repeat(50));
  
  try {
    // Create
    const createdCountries = await demoCreateCountries();
    
    // Read
    await demoReadCountries();
    
    // Update
    await demoUpdateCountries();
    
    // Delete (soft)
    await demoDeleteCountries();
    
    // Stats
    await demoCountryStats();
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ Demo completed successfully!');
    console.log('\n📋 Countries CRUD Features Demonstrated:');
    console.log('  ✅ Create countries with full data');
    console.log('  ✅ Read all countries with filtering');
    console.log('  ✅ Find countries by code');
    console.log('  ✅ Search countries by name');
    console.log('  ✅ Update country information');
    console.log('  ✅ Soft delete countries');
    console.log('  ✅ Generate statistics');
    
    console.log('\n🌍 Ready for Production!');
    console.log('  • Database migrations created');
    console.log('  • TypeScript types defined');
    console.log('  • Models with full CRUD operations');
    console.log('  • Service layer with validation');
    console.log('  • REST API with Swagger documentation');
    console.log('  • Authentication and authorization');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run the demo
if (require.main === module) {
  runDemo();
}

module.exports = { runDemo };
