/**
 * POST /api/balance/deposit endpoint
 * 
 * Task: 7.2 Update deposit endpoint for Sui
 * Requirements: 2.4
 * 
 * Called by blockchain event listener after deposit transaction.
 * Updates Supabase balance by adding deposit amount.
 * Inserts audit log entry with operation_type='deposit'.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { ethers } from 'ethers';

interface DepositRequest {
  userAddress: string;
  amount: number;
  txHash: string;
  currency: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: DepositRequest = await request.json();
    const { userAddress, amount, txHash, currency = 'BNB' } = body;

    // Validate required fields
    if (!userAddress || amount === undefined || amount === null || !txHash) {
      return NextResponse.json(
        { error: 'Missing required fields: userAddress, amount, txHash' },
        { status: 400 }
      );
    }

    // Validate address (support BNB, Solana, Sui, Stellar and Tezos)
    let isValid = false;

    // Check if it's a valid EVM address
    if (ethers.isAddress(userAddress)) {
      isValid = true;
    } else if (/^0x[0-9a-fA-F]{64}$/.test(userAddress)) {
      // Check if it's a valid Sui address
      isValid = true;
    } else if (/^(tz1|tz2|tz3|KT1)[a-zA-Z0-9]{33}$/.test(userAddress)) {
      // Check if it's a valid Tezos address
      isValid = true;
    } else {
      // Check if it's a valid Solana address
      try {
        const { PublicKey } = await import('@solana/web3.js');
        const pk = new PublicKey(userAddress);
        isValid = pk.toBuffer().length === 32;
      } catch (e) {
        // Check if it's a valid Stellar address (starts with G, 56 characters)
        if (/^G[A-Z2-7]{55}$/.test(userAddress)) {
          isValid = true;
        } else if (/^[0-9a-fA-F]{64}$/.test(userAddress) || /^(([a-z\d]+[-_])*[a-z\d]+\.)+[a-z\d]+$/.test(userAddress)) {
          // Check if it's a valid NEAR address (implicit 64-char hex OR named account ending in .near/.testnet)
          isValid = true;
        } else {
          isValid = false;
        }
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid wallet address format (BNB, Solana, Sui, Stellar, Tezos or NEAR required)' },
        { status: 400 }
      );
    }

    // Validate amount is positive
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Deposit amount must be greater than zero' },
        { status: 400 }
      );
    }

    // Call update_balance_for_deposit stored procedure
    const { data, error } = await supabase.rpc('update_balance_for_deposit', {
      p_user_address: userAddress,
      p_deposit_amount: amount,
      p_currency: currency,
      p_transaction_hash: txHash,
    });

    // Handle database errors
    if (error) {
      console.error('Database error in deposit:', error);
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again.' },
        { status: 503 }
      );
    }

    // Parse the JSON result from the stored procedure
    const result = data as { success: boolean; error: string | null; new_balance: number };

    // Check if the procedure reported an error
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Deposit failed' },
        { status: 400 }
      );
    }

    // Return success with new balance
    return NextResponse.json({
      success: true,
      newBalance: parseFloat(result.new_balance.toString()),
    });
  } catch (error) {
    // Handle unexpected errors
    console.error('Unexpected error in POST /api/balance/deposit:', error);
    return NextResponse.json(
      { error: 'An error occurred processing your request' },
      { status: 500 }
    );
  }
}
