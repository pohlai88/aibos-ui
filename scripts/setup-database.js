#!/usr/bin/env node
import { safeJoin } from '@aibos/utils';
const BASE_DIR = process.cwd();

/**
 * Database Setup Script for AI-BOS ERP
 *
 * This script helps set up the PostgreSQL database for development.
 * Run this before starting the application for the first time.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 AI-BOS ERP Database Setup');
console.log('============================\n');

// Check if PostgreSQL is installed
function checkPostgreSQL() {
  try {
    execSync('psql --version', { stdio: 'pipe' });
    console.log('✅ PostgreSQL is installed');
    return true;
  } catch (error) {
    console.log('❌ PostgreSQL is not installed or not in PATH');
    console.log('   Please install PostgreSQL: https://www.postgresql.org/download/');
    return false;
  }
}

// Check if database exists
function checkDatabase() {
  try {
    execSync('psql -h localhost -U postgres -d aibos_erp -c "SELECT 1;"', {
      stdio: 'pipe',
    });
    console.log('✅ Database "aibos_erp" exists');
    return true;
  } catch (error) {
    console.log('⚠️  Database "aibos_erp" does not exist');
    return false;
  }
}

// Create database
function createDatabase() {
  try {
    console.log('🔄 Creating database "aibos_erp"...');
    execSync('psql -h localhost -U postgres -c "CREATE DATABASE aibos_erp;"', {
      stdio: 'pipe',
    });
    console.log('✅ Database "aibos_erp" created successfully');
    return true;
  } catch (error) {
    console.log('❌ Failed to create database:', error.message);
    return false;
  }
}

// Check environment file
function checkEnvironmentFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(safeJoin(BASE_DIR, envPath))) {
    console.log('✅ Environment file .env.local exists');
    return true;
  } else {
    console.log('⚠️  Environment file .env.local not found');
    console.log('   Copy env.example to .env.local and update the values');
    return false;
  }
}

// Main setup function
async function setupDatabase() {
  console.log('Checking prerequisites...\n');

  // Check PostgreSQL
  if (!checkPostgreSQL()) {
    process.exit(1);
  }

  // Check environment file
  if (!checkEnvironmentFile()) {
    console.log('\n📝 Next steps:');
    console.log('   1. Copy env.example to .env.local');
    console.log('   2. Update database credentials in .env.local');
    console.log('   3. Run this script again');
    process.exit(1);
  }

  // Check database
  if (!checkDatabase()) {
    if (!createDatabase()) {
      process.exit(1);
    }
  }

  console.log('\n🎉 Database setup complete!');
  console.log('\n📋 Next steps:');
  console.log('   1. Start the BFF server: pnpm --filter @aibos/bff dev');
  console.log('   2. The server will automatically run migrations and seed data');
  console.log('   3. Check health endpoint: http://localhost:3001/health');
  console.log('\n🔑 Default login credentials:');
  console.log('   Admin: admin@aibos-erp.com / admin123');
  console.log('   Manager: manager@aibos-erp.com / demo123');
  console.log('   User: user@aibos-erp.com / demo123');
}

// Run setup
setupDatabase().catch(console.error);
