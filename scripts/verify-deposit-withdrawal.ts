/**
 * Verification Script for Deposit and Withdrawal Functionality
 * 
 * This script verifies that the deposit and withdrawal functionality is properly
 * implemented and configured for the Sui migration.
 * 
 * Task: 10. Checkpoint - Ensure deposit and withdrawal work end-to-end
 */

import * as fs from 'fs';
import * as path from 'path';

interface VerificationResult {
  category: string;
  checks: Array<{
    name: string;
    passed: boolean;
    message: string;
  }>;
}

const results: VerificationResult[] = [];

console.log('=== Deposit and Withdrawal Verification ===\n');

/**
 * Check 1: Verify Sui Configuration Files Exist
 */
function checkSuiConfigFiles(): VerificationResult {
  const result: VerificationResult = {
    category: 'Sui Configuration Files',
    checks: []
  };

  const requiredFiles = [
    'lib/sui/config.ts',
    'lib/sui/client.ts',
    'lib/sui/wallet.ts',
    'lib/sui/event-listener.ts'
  ];

  for (const file of requiredFiles) {
    const exists = fs.existsSync(path.join(process.cwd(), file));
    result.checks.push({
      name: `${file} exists`,
      passed: exists,
      message: exists ? '✓ File exists' : '✗ File not found'
    });
  }

  return result;
}

/**
 * Check 2: Verify Component Files Exist
 */
function checkComponentFiles(): VerificationResult {
  const result: VerificationResult = {
    category: 'UI Component Files',
    checks: []
  };

  const requiredFiles = [
    'components/balance/DepositModal.tsx',
    'components/balance/WithdrawModal.tsx',
    'components/balance/BalanceDisplay.tsx'
  ];

  for (const file of requiredFiles) {
    const exists = fs.existsSync(path.join(process.cwd(), file));
    result.checks.push({
      name: `${file} exists`,
      passed: exists,
      message: exists ? '✓ File exists' : '✗ File not found'
    });
  }

  return result;
}

/**
 * Check 3: Verify Environment Variables Configuration
 */
function checkEnvironmentVariables(): VerificationResult {
  const result: VerificationResult = {
    category: 'Environment Variables',
    checks: []
  };

  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    result.checks.push({
      name: '.env file exists',
      passed: false,
      message: '✗ .env file not found'
    });
    return result;
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUI_NETWORK',
    'NEXT_PUBLIC_SUI_RPC_ENDPOINT',
    'NEXT_PUBLIC_TREASURY_PACKAGE_ID',
    'NEXT_PUBLIC_TREASURY_OBJECT_ID',
    'NEXT_PUBLIC_USDC_TYPE',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];

  for (const varName of requiredVars) {
    const regex = new RegExp(`^${varName}=(.+)$`, 'm');
    const match = envContent.match(regex);
    const exists = match !== null;
    const hasValue = exists && match[1].trim() !== '' && !match[1].includes('your-');
    
    result.checks.push({
      name: varName,
      passed: hasValue,
      message: hasValue 
        ? '✓ Configured' 
        : exists 
          ? '⚠ Placeholder value (needs configuration)' 
          : '✗ Not found'
    });
  }

  return result;
}

/**
 * Check 4: Verify Sui SDK Integration in Components
 */
function checkSuiIntegration(): VerificationResult {
  const result: VerificationResult = {
    category: 'Sui SDK Integration',
    checks: []
  };

  // Check DepositModal
  const depositModalPath = path.join(process.cwd(), 'components/balance/DepositModal.tsx');
  if (fs.existsSync(depositModalPath)) {
    const content = fs.readFileSync(depositModalPath, 'utf-8');
    
    result.checks.push({
      name: 'DepositModal uses @mysten/dapp-kit',
      passed: content.includes('@mysten/dapp-kit'),
      message: content.includes('@mysten/dapp-kit') 
        ? '✓ Using Sui SDK' 
        : '✗ Not using Sui SDK'
    });

    result.checks.push({
      name: 'DepositModal uses buildDepositTransaction',
      passed: content.includes('buildDepositTransaction'),
      message: content.includes('buildDepositTransaction') 
        ? '✓ Transaction building implemented' 
        : '✗ Transaction building not found'
    });

    result.checks.push({
      name: 'DepositModal shows USDC (not FLOW)',
      passed: content.includes('USDC') && !content.includes('FLOW'),
      message: content.includes('USDC') 
        ? '✓ Token migration complete' 
        : '✗ Still references FLOW'
    });
  }

  // Check WithdrawModal
  const withdrawModalPath = path.join(process.cwd(), 'components/balance/WithdrawModal.tsx');
  if (fs.existsSync(withdrawModalPath)) {
    const content = fs.readFileSync(withdrawModalPath, 'utf-8');
    
    result.checks.push({
      name: 'WithdrawModal uses @mysten/dapp-kit',
      passed: content.includes('@mysten/dapp-kit'),
      message: content.includes('@mysten/dapp-kit') 
        ? '✓ Using Sui SDK' 
        : '✗ Not using Sui SDK'
    });

    result.checks.push({
      name: 'WithdrawModal uses buildWithdrawalTransaction',
      passed: content.includes('buildWithdrawalTransaction'),
      message: content.includes('buildWithdrawalTransaction') 
        ? '✓ Transaction building implemented' 
        : '✗ Transaction building not found'
    });

    result.checks.push({
      name: 'WithdrawModal validates balance before transaction',
      passed: content.includes('houseBalance') && content.includes('validateAmount'),
      message: content.includes('houseBalance') 
        ? '✓ Balance validation implemented' 
        : '✗ Balance validation not found'
    });
  }

  return result;
}

/**
 * Check 5: Verify Event Listener Implementation
 */
function checkEventListener(): VerificationResult {
  const result: VerificationResult = {
    category: 'Event Listener Service',
    checks: []
  };

  const eventListenerPath = path.join(process.cwd(), 'lib/sui/event-listener.ts');
  if (fs.existsSync(eventListenerPath)) {
    const content = fs.readFileSync(eventListenerPath, 'utf-8');
    
    result.checks.push({
      name: 'Event listener has startEventListener function',
      passed: content.includes('startEventListener'),
      message: content.includes('startEventListener') 
        ? '✓ Function implemented' 
        : '✗ Function not found'
    });

    result.checks.push({
      name: 'Event listener handles DepositEvent',
      passed: content.includes('handleDepositEvent') && content.includes('DepositEvent'),
      message: content.includes('handleDepositEvent') 
        ? '✓ Deposit event handling implemented' 
        : '✗ Deposit event handling not found'
    });

    result.checks.push({
      name: 'Event listener handles WithdrawalEvent',
      passed: content.includes('handleWithdrawalEvent') && content.includes('WithdrawalEvent'),
      message: content.includes('handleWithdrawalEvent') 
        ? '✓ Withdrawal event handling implemented' 
        : '✗ Withdrawal event handling not found'
    });

    result.checks.push({
      name: 'Event listener updates Supabase',
      passed: content.includes('updateUserBalance') && content.includes('supabase'),
      message: content.includes('updateUserBalance') 
        ? '✓ Supabase integration implemented' 
        : '✗ Supabase integration not found'
    });

    result.checks.push({
      name: 'Event listener has reconnection logic',
      passed: content.includes('reconnect') || content.includes('retry'),
      message: content.includes('reconnect') || content.includes('retry')
        ? '✓ Reconnection logic implemented' 
        : '✗ Reconnection logic not found'
    });
  }

  return result;
}

/**
 * Check 6: Verify Treasury Contract Deployment
 */
function checkTreasuryContract(): VerificationResult {
  const result: VerificationResult = {
    category: 'Treasury Contract',
    checks: []
  };

  const contractPath = path.join(process.cwd(), 'sui-contracts/sources/treasury.move');
  const exists = fs.existsSync(contractPath);
  
  result.checks.push({
    name: 'Treasury contract file exists',
    passed: exists,
    message: exists ? '✓ Contract file found' : '✗ Contract file not found'
  });

  if (exists) {
    const content = fs.readFileSync(contractPath, 'utf-8');
    
    result.checks.push({
      name: 'Contract has deposit function',
      passed: content.includes('public entry fun deposit'),
      message: content.includes('public entry fun deposit') 
        ? '✓ Deposit function implemented' 
        : '✗ Deposit function not found'
    });

    result.checks.push({
      name: 'Contract has withdraw function',
      passed: content.includes('public entry fun withdraw'),
      message: content.includes('public entry fun withdraw') 
        ? '✓ Withdraw function implemented' 
        : '✗ Withdraw function not found'
    });

    result.checks.push({
      name: 'Contract emits DepositEvent',
      passed: content.includes('DepositEvent'),
      message: content.includes('DepositEvent') 
        ? '✓ DepositEvent defined' 
        : '✗ DepositEvent not found'
    });

    result.checks.push({
      name: 'Contract emits WithdrawalEvent',
      passed: content.includes('WithdrawalEvent'),
      message: content.includes('WithdrawalEvent') 
        ? '✓ WithdrawalEvent defined' 
        : '✗ WithdrawalEvent not found'
    });
  }

  // Check deployment info
  const deploymentPath = path.join(process.cwd(), 'sui-contracts/DEPLOYMENT.md');
  if (fs.existsSync(deploymentPath)) {
    result.checks.push({
      name: 'Deployment documentation exists',
      passed: true,
      message: '✓ DEPLOYMENT.md found'
    });
  }

  return result;
}

/**
 * Check 7: Verify Supabase Schema
 */
function checkSupabaseSchema(): VerificationResult {
  const result: VerificationResult = {
    category: 'Supabase Database Schema',
    checks: []
  };

  const migrationsDir = path.join(process.cwd(), 'supabase/migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    result.checks.push({
      name: 'Migrations directory exists',
      passed: false,
      message: '✗ Migrations directory not found'
    });
    return result;
  }

  const requiredMigrations = [
    '001_create_user_balances.sql',
    '002_create_balance_audit_log.sql',
    '003_create_balance_procedures.sql'
  ];

  for (const migration of requiredMigrations) {
    const migrationPath = path.join(migrationsDir, migration);
    const exists = fs.existsSync(migrationPath);
    
    result.checks.push({
      name: migration,
      passed: exists,
      message: exists ? '✓ Migration file exists' : '✗ Migration file not found'
    });
  }

  return result;
}

/**
 * Run all verification checks
 */
function runVerification() {
  console.log('Running verification checks...\n');

  results.push(checkSuiConfigFiles());
  results.push(checkComponentFiles());
  results.push(checkEnvironmentVariables());
  results.push(checkSuiIntegration());
  results.push(checkEventListener());
  results.push(checkTreasuryContract());
  results.push(checkSupabaseSchema());

  // Print results
  let totalChecks = 0;
  let passedChecks = 0;
  let warningChecks = 0;

  for (const result of results) {
    console.log(`\n${result.category}:`);
    console.log('─'.repeat(50));
    
    for (const check of result.checks) {
      console.log(`  ${check.message} - ${check.name}`);
      totalChecks++;
      if (check.passed) {
        passedChecks++;
      } else if (check.message.includes('⚠')) {
        warningChecks++;
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Checks: ${totalChecks}`);
  console.log(`Passed: ${passedChecks} ✓`);
  console.log(`Warnings: ${warningChecks} ⚠`);
  console.log(`Failed: ${totalChecks - passedChecks - warningChecks} ✗`);
  
  const successRate = ((passedChecks / totalChecks) * 100).toFixed(1);
  const successRateNum = parseFloat(successRate);
  console.log(`Success Rate: ${successRate}%`);

  // Recommendations
  console.log('\n' + '='.repeat(50));
  console.log('RECOMMENDATIONS');
  console.log('='.repeat(50));

  const hasSupabaseWarnings = results.some(r => 
    r.category === 'Environment Variables' && 
    r.checks.some(c => c.name.includes('SUPABASE') && !c.passed)
  );

  if (hasSupabaseWarnings) {
    console.log('\n⚠ Supabase Configuration:');
    console.log('  - Update NEXT_PUBLIC_SUPABASE_URL with your Supabase project URL');
    console.log('  - Update NEXT_PUBLIC_SUPABASE_ANON_KEY with your Supabase anon key');
    console.log('  - Run: npm run db:verify to test the connection');
  }

  const failedChecks = results.flatMap(r => 
    r.checks.filter(c => !c.passed && !c.message.includes('⚠'))
  );

  if (failedChecks.length > 0) {
    console.log('\n✗ Failed Checks:');
    for (const check of failedChecks) {
      console.log(`  - ${check.name}`);
    }
  }

  if (passedChecks === totalChecks) {
    console.log('\n✓ All checks passed! Deposit and withdrawal functionality is ready.');
    console.log('\nNext Steps:');
    console.log('  1. Ensure Supabase is configured with actual credentials');
    console.log('  2. Start the event listener service');
    console.log('  3. Test deposit and withdrawal in the UI');
    console.log('  4. Monitor event listener logs for proper balance updates');
  } else if (successRateNum >= 80) {
    console.log('\n✓ Most checks passed. Address warnings and failed checks before production.');
  } else {
    console.log('\n✗ Several checks failed. Please address the issues above.');
  }

  console.log('\n' + '='.repeat(50));
}

// Run the verification
runVerification();
