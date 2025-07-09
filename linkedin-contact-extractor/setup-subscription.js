#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n🚀 LinkedIn Contact Extractor - Subscription Setup\n');
  console.log('This script will help you configure the subscription version.\n');

  // Check if .env.local exists
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const overwrite = await question('.env.local already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      process.exit(0);
    }
  }

  console.log('\n📋 Basic Configuration\n');
  
  const config = {};
  
  // Wiza API
  config.WIZA_API_KEY = await question('Wiza API Key (required): ');
  config.WIZA_BASE_URL = 'https://wiza.co';
  
  console.log('\n🗄️  Database Configuration\n');
  console.log('Choose database option:');
  console.log('1. Supabase (recommended)');
  console.log('2. PostgreSQL');
  const dbChoice = await question('Select (1 or 2): ');
  
  if (dbChoice === '1') {
    config.NEXT_PUBLIC_SUPABASE_URL = await question('Supabase URL: ');
    config.NEXT_PUBLIC_SUPABASE_ANON_KEY = await question('Supabase Anon Key: ');
    config.SUPABASE_SERVICE_ROLE_KEY = await question('Supabase Service Role Key: ');
    config.DATABASE_URL = config.NEXT_PUBLIC_SUPABASE_URL;
  } else {
    config.DATABASE_URL = await question('PostgreSQL connection string: ');
  }
  
  console.log('\n💰 TRON/Payment Configuration\n');
  
  const network = await question('TRON Network (mainnet/testnet) [mainnet]: ') || 'mainnet';
  config.NEXT_PUBLIC_TRON_NETWORK = network;
  
  config.NEXT_PUBLIC_PAYMENT_WALLET_ADDRESS = await question('Your TRON wallet address for receiving payments: ');
  config.TRON_API_KEY = await question('TronGrid API Key (optional, press Enter to skip): ');
  
  // USDT contract addresses
  config.NEXT_PUBLIC_USDT_CONTRACT_ADDRESS = network === 'mainnet' 
    ? 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'  // Mainnet USDT
    : 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj'; // Testnet USDT
  
  console.log('\n💵 Pricing Configuration\n');
  console.log('Note: Default pricing is based on 3x ROI (Wiza cost: $0.0315, Our price: $0.10 per extraction)\n');
  
  config.NEXT_PUBLIC_CREDITS_PER_USDT = await question('Credits per 1 USDT [10]: ') || '10';
  config.NEXT_PUBLIC_MIN_PURCHASE_USDT = await question('Minimum purchase amount in USDT [10]: ') || '10';
  config.NEXT_PUBLIC_CREDITS_PER_EXTRACTION = await question('Credits per extraction [1]: ') || '1';
  
  console.log('\n🔐 Security Configuration\n');
  
  // Generate JWT secret
  config.JWT_SECRET = crypto.randomBytes(32).toString('hex');
  console.log('Generated JWT Secret: ' + config.JWT_SECRET.substring(0, 10) + '...');
  
  config.ADMIN_EMAIL = await question('Admin email: ');
  
  // Generate admin password
  const bcrypt = require('bcryptjs');
  const adminPassword = await question('Admin password: ');
  config.ADMIN_PASSWORD_HASH = bcrypt.hashSync(adminPassword, 10);
  
  // Webhook secret
  const useWebhook = await question('Configure webhook secret? (y/N): ');
  if (useWebhook.toLowerCase() === 'y') {
    config.WEBHOOK_SECRET = crypto.randomBytes(16).toString('hex');
    console.log('Generated Webhook Secret: ' + config.WEBHOOK_SECRET);
  }
  
  // Application settings
  config.NEXT_PUBLIC_USE_SIMULATION = 'false';
  config.NEXT_PUBLIC_SUBSCRIPTION_MODE = 'true';
  
  // Write .env.local
  const envContent = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync(envPath, envContent);
  
  console.log('\n✅ Configuration saved to .env.local\n');
  
  // Show next steps
  console.log('📝 Next Steps:\n');
  console.log('1. Run the database schema:');
  console.log('   - For Supabase: Go to SQL Editor and run subscription-schema.sql');
  console.log('   - For PostgreSQL: psql -d your_database -f subscription-schema.sql\n');
  
  console.log('2. Install dependencies:');
  console.log('   npm install\n');
  
  console.log('3. Run the development server:');
  console.log('   npm run dev\n');
  
  console.log('4. For production deployment:');
  console.log('   - Review SUBSCRIPTION_DEPLOYMENT.md');
  console.log('   - Deploy to Vercel or your hosting provider');
  console.log('   - Configure your custom domain\n');
  
  if (network === 'testnet') {
    console.log('⚠️  You are using TESTNET. For production, update NEXT_PUBLIC_TRON_NETWORK to "mainnet"\n');
  }
  
  rl.close();
}

main().catch(console.error); 