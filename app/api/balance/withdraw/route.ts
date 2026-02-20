import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { ethers } from 'ethers';
import { transferBNBFromTreasury } from '@/lib/bnb/backend-client';

interface WithdrawRequest {
  userAddress: string;
  amount: number;
  currency: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: WithdrawRequest = await request.json();
    const { userAddress, amount, currency = 'BNB' } = body;

    // Validate required fields
    if (!userAddress || amount === undefined || amount === null) {
      return NextResponse.json(
        { error: 'Missing required fields: userAddress, amount' },
        { status: 400 }
      );
    }

    // Validate address using utility
    const { isValidAddress } = await import('@/lib/utils/address');
    if (!(await isValidAddress(userAddress))) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Detect network flags for backend transfer
    let isBNB = ethers.isAddress(userAddress);
    let isSOL = false;
    let isSUI = false;
    let isXLM = false;
    let isXTZ = false;
    let isNEAR = false;

    if (!isBNB) {
      if (/^0x[0-9a-fA-F]{64}$/.test(userAddress)) {
        isSUI = true;
      } else if (/^G[A-Z2-7]{55}$/.test(userAddress)) {
        isXLM = true;
      } else if (/^(tz1|tz2|tz3|KT1)[a-zA-Z0-9]{33}$/.test(userAddress)) {
        isXTZ = true;
      } else if (/^[0-9a-fA-F]{64}$/.test(userAddress) || /^(([a-z\d]+[-_])*[a-z\d]+\.)+[a-z\d]+$/.test(userAddress)) {
        // NEAR: implicit account (64 hex chars) OR named account (e.g., user.near, user.testnet)
        isNEAR = true;
      } else {
        // Must be Solana if isValidAddress passed
        isSOL = true;
      }
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Withdrawal amount must be greater than zero' },
        { status: 400 }
      );
    }

    // 1. Get house balance and status from Supabase and validate
    const { data: userData, error: userError } = await supabase
      .from('user_balances')
      .select('balance, status')
      .eq('user_address', userAddress)
      .eq('currency', currency)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User record not found' }, { status: 404 });
    }

    if (userData.status === 'frozen') {
      return NextResponse.json({ error: 'Account is frozen. Withdrawals are disabled.' }, { status: 403 });
    }

    if (userData.status === 'banned') {
      return NextResponse.json({ error: 'Account is banned.' }, { status: 403 });
    }

    if (userData.balance < amount) {
      return NextResponse.json({ error: `Insufficient house balance in ${currency}` }, { status: 400 });
    }

    // 2. Apply 2% Treasury Fee
    const feePercent = 0.02;
    const feeAmount = amount * feePercent;
    const netWithdrawAmount = amount - feeAmount;

    console.log(`Withdrawal Request: Total=${amount}, Fee=${feeAmount}, Net=${netWithdrawAmount}, Currency=${currency}`);

    // 3. Perform transfer from treasury based on network
    let signature: string;
    try {
      if (isBNB) {
        signature = await transferBNBFromTreasury(userAddress, netWithdrawAmount);
      } else if (isSOL) {
        if (currency === 'BYNOMO') {
          const { transferTokenFromTreasury } = await import('@/lib/solana/backend-client');
          const BYNOMO_MINT = 'Bi4NEEQhtrFdnoS9NjrXaWkQftXifh2t3RzQHSTQpump';
          signature = await transferTokenFromTreasury(userAddress, netWithdrawAmount, BYNOMO_MINT);
        } else {
          const { transferSOLFromTreasury } = await import('@/lib/solana/backend-client');
          signature = await transferSOLFromTreasury(userAddress, netWithdrawAmount);
        }
      } else if (isSUI) {
        const { transferUSDCFromTreasury } = await import('@/lib/sui/backend-client');
        signature = await transferUSDCFromTreasury(userAddress, netWithdrawAmount);
      } else if (isXLM) {
        const { transferXLMFromTreasury } = await import('@/lib/stellar/backend-client');
        signature = await transferXLMFromTreasury(userAddress, netWithdrawAmount);
      } else if (isXTZ) {
        const { transferXTZFromTreasury } = await import('@/lib/tezos/backend-client');
        signature = await transferXTZFromTreasury(userAddress, netWithdrawAmount);
      } else if (isNEAR) {
        const { transferNEARFromTreasury } = await import('@/lib/near/backend-client');
        signature = await transferNEARFromTreasury(userAddress, netWithdrawAmount);
      } else {
        throw new Error('Unsupported network for withdrawal');
      }
    } catch (e: any) {
      console.error('Transfer failed:', e);
      return NextResponse.json({ error: `Withdrawal failed: ${e.message}` }, { status: 500 });
    }

    // 3. Update Supabase balance using RPC
    const { data, error } = await supabase.rpc('update_balance_for_withdrawal', {
      p_user_address: userAddress,
      p_withdrawal_amount: amount,
      p_currency: currency,
      p_transaction_hash: signature,
    });

    if (error) {
      console.error('Database error in withdrawal update:', error);
      // Note: At this point the BNB has been sent!
      return NextResponse.json(
        {
          success: true,
          txHash: signature,
          warning: 'BNB sent but balance update failed. Please contact support.',
          error: error.message
        },
        { status: 200 }
      );
    }

    const result = data as { success: boolean; error: string | null; new_balance: number };

    return NextResponse.json({
      success: true,
      txHash: signature,
      newBalance: result.new_balance,
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/balance/withdraw:', error);
    return NextResponse.json(
      { error: 'An error occurred processing your request' },
      { status: 500 }
    );
  }
}
