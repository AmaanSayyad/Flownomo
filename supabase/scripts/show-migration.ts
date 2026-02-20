/**
 * Script to display migration SQL for manual application
 * 
 * This script reads and displays SQL migration files for manual application
 * via the Supabase Dashboard SQL Editor.
 * 
 * Usage:
 *   npx ts-node supabase/scripts/show-migration.ts [migration-number]
 * 
 * Example:
 *   npx ts-node supabase/scripts/show-migration.ts 003
 */

import * as fs from 'fs';
import * as path from 'path';

const migrationNumber = process.argv[2] || '003';
const migrationFiles = fs.readdirSync(path.join(__dirname, '..', 'migrations'));
const targetFile = migrationFiles.find(f => f.startsWith(migrationNumber));

if (!targetFile) {
  console.error(`Error: Migration file starting with ${migrationNumber} not found`);
  console.log('\nAvailable migrations:');
  migrationFiles.forEach(f => console.log(`  - ${f}`));
  process.exit(1);
}

const migrationPath = path.join(__dirname, '..', 'migrations', targetFile);
const sql = fs.readFileSync(migrationPath, 'utf-8');

console.log('='.repeat(80));
console.log(`Migration: ${targetFile}`);
console.log('='.repeat(80));
console.log('\nTo apply this migration:');
console.log('1. Open your Supabase project dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Copy the SQL below');
console.log('4. Paste into SQL Editor');
console.log('5. Click "Run" to execute');
console.log('\n' + '='.repeat(80));
console.log('SQL:');
console.log('='.repeat(80));
console.log('\n' + sql);
console.log('\n' + '='.repeat(80));
console.log('End of migration');
console.log('='.repeat(80));
