/**
 * Verification script for Supabase database setup
 * 
 * This script checks if the database is properly configured and accessible.
 * Run this after setting up your Supabase project and applying migrations.
 * 
 * Usage:
 *   npx ts-node supabase/scripts/verify-setup.ts
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('=== Supabase Setup Verification ===\n');

// Check environment variables
console.log('1. Checking environment variables...');
if (!supabaseUrl) {
  console.error('   ✗ NEXT_PUBLIC_SUPABASE_URL is not set');
  console.log('   Please add it to your .env.local file');
  process.exit(1);
}
console.log(`   ✓ NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}`);

if (!supabaseAnonKey) {
  console.error('   ✗ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
  console.log('   Please add it to your .env.local file');
  process.exit(1);
}
console.log('   ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY: [hidden]');

// Create Supabase client
console.log('\n2. Creating Supabase client...');
const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('   ✓ Client created successfully');

// Check database connection
console.log('\n3. Checking database connection...');

async function verifyConnection() {
  try {
    const { data, error } = await supabase
      .from('user_balances')
      .select('count')
      .limit(1);

    if (error) {
      console.error('   ✗ Database connection failed:', error.message);
      
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('\n   The user_balances table does not exist yet.');
        console.log('   Please apply the migration: 001_create_user_balances.sql');
        console.log('\n   You can do this by:');
        console.log('   1. Opening your Supabase dashboard');
        console.log('   2. Going to the SQL Editor');
        console.log('   3. Copying and pasting the contents of supabase/migrations/001_create_user_balances.sql');
        console.log('   4. Running the SQL');
      }
      
      return false;
    }

    console.log('   ✓ Database connection successful');
    return true;
  } catch (error) {
    console.error('   ✗ Unexpected error:', error);
    return false;
  }
}

async function verifyTableStructure() {
  console.log('\n4. Verifying table structure...');
  
  try {
    // Try to insert and then delete a test record
    const testAddress = '0xVERIFICATION_TEST';
    
    const { data: insertData, error: insertError } = await supabase
      .from('user_balances')
      .insert({
        user_address: testAddress,
        balance: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error('   ✗ Failed to insert test record:', insertError.message);
      return false;
    }

    console.log('   ✓ Insert operation works');

    // Verify columns
    const hasRequiredColumns = 
      insertData.hasOwnProperty('user_address') &&
      insertData.hasOwnProperty('balance') &&
      insertData.hasOwnProperty('updated_at') &&
      insertData.hasOwnProperty('created_at');

    if (!hasRequiredColumns) {
      console.error('   ✗ Table is missing required columns');
      return false;
    }

    console.log('   ✓ All required columns present');

    // Clean up test record
    await supabase
      .from('user_balances')
      .delete()
      .eq('user_address', testAddress);

    console.log('   ✓ Delete operation works');

    return true;
  } catch (error) {
    console.error('   ✗ Unexpected error:', error);
    return false;
  }
}

async function verifyConstraints() {
  console.log('\n5. Verifying constraints...');
  
  try {
    // Test negative balance constraint
    const { error } = await supabase
      .from('user_balances')
      .insert({
        user_address: '0xNEGATIVE_TEST',
        balance: -10,
      });

    if (!error) {
      console.error('   ✗ Negative balance constraint is not working');
      // Clean up if it somehow got inserted
      await supabase
        .from('user_balances')
        .delete()
        .eq('user_address', '0xNEGATIVE_TEST');
      return false;
    }

    if (error.message.includes('check constraint')) {
      console.log('   ✓ Non-negative balance constraint works');
      return true;
    } else {
      console.error('   ✗ Unexpected error:', error.message);
      return false;
    }
  } catch (error) {
    console.error('   ✗ Unexpected error:', error);
    return false;
  }
}

// Run all verifications
async function runVerification() {
  const connectionOk = await verifyConnection();
  
  if (!connectionOk) {
    console.log('\n=== Verification Failed ===');
    console.log('Please fix the issues above and try again.');
    process.exit(1);
  }

  const structureOk = await verifyTableStructure();
  const constraintsOk = await verifyConstraints();

  console.log('\n=== Verification Summary ===');
  console.log(`Database Connection: ${connectionOk ? '✓' : '✗'}`);
  console.log(`Table Structure: ${structureOk ? '✓' : '✗'}`);
  console.log(`Constraints: ${constraintsOk ? '✓' : '✗'}`);

  if (connectionOk && structureOk && constraintsOk) {
    console.log('\n✓ All checks passed! Your Supabase setup is ready.');
    process.exit(0);
  } else {
    console.log('\n✗ Some checks failed. Please review the errors above.');
    process.exit(1);
  }
}

runVerification().catch((error) => {
  console.error('\nFatal error:', error);
  process.exit(1);
});
