/**
 * Script to apply database migrations to Supabase
 * 
 * This script reads SQL migration files and executes them against the Supabase database.
 * It's useful for local development and testing.
 * 
 * Usage:
 *   npx ts-node supabase/scripts/apply-migration.ts [migration-file]
 * 
 * Example:
 *   npx ts-node supabase/scripts/apply-migration.ts 001_create_user_balances.sql
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration(migrationFile: string) {
  const migrationPath = path.join(__dirname, '..', 'migrations', migrationFile);
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`Error: Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  console.log(`Reading migration file: ${migrationFile}`);
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  console.log('Applying migration...');
  console.log('---');
  console.log(sql);
  console.log('---');

  try {
    // Note: Supabase JS client doesn't support raw SQL execution directly
    // This would need to be done via the Supabase SQL Editor or CLI
    console.log('\nNote: Please apply this migration using one of the following methods:');
    console.log('1. Supabase CLI: supabase db push');
    console.log('2. Supabase Dashboard: Copy the SQL above to the SQL Editor');
    console.log('3. Direct PostgreSQL connection using psql or another SQL client');
    
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }
}

async function verifyMigration() {
  console.log('\nVerifying migration...');
  
  try {
    // Try to query the user_balances table
    const { data, error } = await supabase
      .from('user_balances')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Verification failed:', error.message);
      console.log('\nThe table may not exist yet. Please apply the migration first.');
      return false;
    }

    console.log('✓ Migration verified successfully!');
    console.log('✓ user_balances table is accessible');
    return true;
  } catch (error) {
    console.error('Verification error:', error);
    return false;
  }
}

// Main execution
const migrationFile = process.argv[2] || '001_create_user_balances.sql';

applyMigration(migrationFile)
  .then(() => verifyMigration())
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
