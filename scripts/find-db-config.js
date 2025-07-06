/**
 * Alternative Database Connection Test
 * This script will help you identify the correct database parameters
 */

require('dotenv').config();
const { Client } = require('pg');

// Test different common PostgreSQL configurations
const configurations = [
  {
    name: 'Current .env settings',
    config: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'urutibiz_dev',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '12345',
    }
  },
  {
    name: 'Default postgres database',
    config: {
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: '12345',
    }
  },
  {
    name: 'Empty password',
    config: {
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: '',
    }
  },
  {
    name: 'Password: postgres',
    config: {
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: 'postgres',
    }
  },
  {
    name: 'Password: password',
    config: {
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: 'password',
    }
  }
];

async function testConfiguration(name, config) {
  console.log(`\n🔧 Testing: ${name}`);
  console.log(`   Host: ${config.host}:${config.port}`);
  console.log(`   Database: ${config.database}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Password: ${config.password ? '***' : '(empty)'}`);

  const client = new Client(config);

  try {
    await client.connect();
    console.log(`✅ SUCCESS: Connected to PostgreSQL!`);
    
    // Test basic query
    const result = await client.query('SELECT current_database(), current_user, version()');
    console.log(`   📊 Database: ${result.rows[0].current_database}`);
    console.log(`   👤 User: ${result.rows[0].current_user}`);
    
    // Test if our target database exists
    const dbCheck = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'urutibiz_dev'"
    );
    
    if (dbCheck.rows.length > 0) {
      console.log(`   🗃️  Database 'urutibiz_dev' exists`);
    } else {
      console.log(`   ⚠️  Database 'urutibiz_dev' does not exist - needs to be created`);
    }
    
    await client.end();
    return config;
  } catch (err) {
    console.log(`❌ FAILED: ${err.message}`);
    if (err.code === 'ECONNREFUSED') {
      console.log(`   💡 PostgreSQL is not running on ${config.host}:${config.port}`);
    } else if (err.code === '28P01') {
      console.log(`   💡 Authentication failed - wrong password`);
    } else if (err.code === '3D000') {
      console.log(`   💡 Database '${config.database}' does not exist`);
    }
    try {
      await client.end();
    } catch {}
    return null;
  }
}

async function main() {
  console.log('🔍 Testing PostgreSQL Connection Configurations...');
  console.log('===============================================');

  let workingConfig = null;

  for (const { name, config } of configurations) {
    const result = await testConfiguration(name, config);
    if (result && !workingConfig) {
      workingConfig = result;
    }
  }

  console.log('\n===============================================');
  
  if (workingConfig) {
    console.log('🎉 FOUND WORKING CONFIGURATION!');
    console.log('\nUpdate your .env file with these settings:');
    console.log(`DB_HOST=${workingConfig.host}`);
    console.log(`DB_PORT=${workingConfig.port}`);
    console.log(`DB_NAME=${workingConfig.database}`);
    console.log(`DB_USER=${workingConfig.user}`);
    console.log(`DB_PASSWORD=${workingConfig.password}`);
    
    // Test creating the target database if needed
    if (workingConfig.database !== 'urutibiz_dev') {
      console.log('\n🏗️  Attempting to create urutibiz_dev database...');
      const client = new Client(workingConfig);
      try {
        await client.connect();
        await client.query('CREATE DATABASE urutibiz_dev');
        console.log('✅ Created urutibiz_dev database successfully!');
        console.log('\nNow update your .env file to use:');
        console.log(`DB_NAME=urutibiz_dev`);
      } catch (err) {
        if (err.code === '42P04') {
          console.log('✅ Database urutibiz_dev already exists!');
        } else {
          console.log(`❌ Failed to create database: ${err.message}`);
        }
      } finally {
        await client.end();
      }
    }
  } else {
    console.log('❌ NO WORKING CONFIGURATION FOUND');
    console.log('\n💡 Possible solutions:');
    console.log('1. Install PostgreSQL locally');
    console.log('2. Start Docker Desktop and run: docker run --name postgres -e POSTGRES_PASSWORD=12345 -p 5432:5432 -d postgres');
    console.log('3. Use a cloud database (Render, Railway, etc.)');
    console.log('4. Check if PostgreSQL is running: services.msc (Windows)');
  }
}

main().catch(console.error);
