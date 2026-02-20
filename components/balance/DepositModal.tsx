'use client';

import React, { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useOverflowStore } from '@/lib/store';
import { useToast } from '@/lib/hooks/useToast';
import { getBNBConfig } from '@/lib/bnb/config';
import { getAddress } from 'viem';
import { Connection, PublicKey } from '@solana/web3.js';
import { getSuiConfig } from '@/lib/sui/config';
import { buildDepositTransaction as buildSuiDepositTransaction } from '@/lib/sui/client';

import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (amount: number, txHash: string) => void;
  onError?: (error: string) => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError
}) => {
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { wallets: privyWallets } = useWallets();
  const { authenticated, user } = usePrivy();

  // Solana Hook
  const { sendTransaction: signAndSendSolana, publicKey: solanaPublicKey } = useSolanaWallet();

  // Sui Hooks
  const { mutateAsync: signAndExecuteSui } = useSignAndExecuteTransaction();
  const suiAccount = useCurrentAccount();

  const { depositFunds, network, walletBalance, refreshWalletBalance, address } = useOverflowStore();
  const toast = useToast();

  const selectedCurrency = useOverflowStore(state => state.selectedCurrency);
  const currencySymbol = network === 'SUI' ? 'USDC' : network === 'SOL' ? (selectedCurrency || 'SOL') : network === 'XLM' ? 'XLM' : network === 'XTZ' ? 'XTZ' : network === 'NEAR' ? 'NEAR' : 'BNB';
  const networkName = network === 'SUI' ? 'Sui Network' : network === 'SOL' ? 'Solana' : network === 'XLM' ? 'Stellar' : network === 'XTZ' ? 'Tezos' : network === 'NEAR' ? 'NEAR Protocol' : 'BNB Chain';

  // Quick select amounts
  const quickAmounts = network === 'SUI' ? [1, 5, 10, 25] : [0.1, 0.5, 1, 5];

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setAmount('');
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  const validateAmount = (value: string): string | null => {
    if (!value || value.trim() === '') {
      return 'Please enter an amount';
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return 'Please enter a valid number';
    }

    if (numValue <= 0) {
      return 'Amount must be greater than zero';
    }

    if (numValue > walletBalance) {
      return `Insufficient ${currencySymbol} balance`;
    }

    return null;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };

  const handleQuickSelect = (value: number) => {
    setAmount(value.toString());
    setError(null);
  };

  const handleMaxClick = () => {
    if (walletBalance > 0) {
      // Leave a small amount for gas (except for Sui USDC)
      const gasBuffer = network === 'SUI' ? 0 : network === 'SOL' ? 0.001 : 0.005;
      const maxAmount = Math.max(0, walletBalance - gasBuffer);
      setAmount(maxAmount.toFixed(4));
      setError(null);
    }
  };

  const handleDeposit = async () => {
    const validationError = validateAmount(amount);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!address) {
      setError('Please connect your wallet');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const depositAmount = parseFloat(amount);
      let txHash: string;

      if (network === 'SUI') {
        if (!suiAccount) throw new Error('Sui wallet not connected');
        toast.info('Please confirm the transaction in your Sui wallet...');

        const tx = await buildSuiDepositTransaction(depositAmount, address);
        const result = await signAndExecuteSui({ transaction: tx as any });
        txHash = result.digest;

      } else if (network === 'SOL') {
        if (!solanaPublicKey) throw new Error('Solana wallet not connected');

        const { buildDepositTransaction, buildTokenDepositTransaction, getSolanaConnection } = await import('@/lib/solana/client');
        const connection = getSolanaConnection();
        const selectedCurrency = useOverflowStore.getState().selectedCurrency;

        let transaction;
        if (selectedCurrency === 'BYNOMO') {
          const BYNOMO_MINT = 'Bi4NEEQhtrFdnoS9NjrXaWkQftXifh2t3RzQHSTQpump';
          transaction = await buildTokenDepositTransaction(depositAmount, address, BYNOMO_MINT);
        } else {
          transaction = await buildDepositTransaction(depositAmount, address);
        }

        toast.info('Please confirm the transaction in your Solana wallet...');

        txHash = await signAndSendSolana(transaction, connection);
      } else if (network === 'NEAR') {
        const { depositNEAR } = await import('@/lib/near/wallet');
        toast.info('Please confirm the transaction in your NEAR wallet...');
        txHash = await depositNEAR(amount);
      } else if (network === 'XTZ') {
        const { BeaconWallet } = await import('@taquito/beacon-wallet');
        const { NetworkType } = await import('@airgap/beacon-types');
        const { getTezosClient } = await import('@/lib/tezos/client');

        const rpcUrl = process.env.NEXT_PUBLIC_TEZOS_RPC_URL || 'https://rpc.tzkt.io/mainnet';
        const wallet = new BeaconWallet({
          name: "BYNOMO",
          preferredNode: rpcUrl,
          network: {
            type: NetworkType.MAINNET,
            rpcUrl,
          },
        } as any);

        // Clear any cached connection that might use old ecadinfra RPC
        await wallet.clearActiveAccount();
        await wallet.requestPermissions();

        const tezos = await getTezosClient();
        tezos.setWalletProvider(wallet);

        const treasuryAddress = process.env.NEXT_PUBLIC_TEZOS_TREASURY_ADDRESS;
        if (!treasuryAddress) throw new Error('Tezos treasury not configured');

        toast.info('Please confirm the transaction in your Tezos wallet...');
        const op = await tezos.wallet.transfer({ to: treasuryAddress, amount: depositAmount }).send();
        txHash = op.opHash;
      } else if (network === 'XLM') {
        // Stellar deposit via Stellar Wallets Kit
        const { StellarWalletsKit, WalletNetwork, allowAllModules } = await import('@creit.tech/stellar-wallets-kit');
        const { TransactionBuilder, Networks, Operation, Asset } = await import('@stellar/stellar-sdk');
        const { Horizon } = await import('@stellar/stellar-sdk');

        const treasuryAddress = process.env.NEXT_PUBLIC_STELLAR_TREASURY_ADDRESS;
        if (!treasuryAddress) throw new Error('Stellar treasury not configured');

        const server = new Horizon.Server(process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || 'https://horizon.stellar.org');
        const account = await server.loadAccount(address);

        const transaction = new TransactionBuilder(account, {
          fee: '100',
          networkPassphrase: Networks.PUBLIC,
        })
          .addOperation(
            Operation.payment({
              destination: treasuryAddress,
              asset: Asset.native(),
              amount: depositAmount.toFixed(7),
            })
          )
          .setTimeout(30)
          .build();

        const kit = new StellarWalletsKit({
          network: WalletNetwork.PUBLIC,
          modules: allowAllModules(),
        });

        toast.info('Please confirm the transaction in your Stellar wallet...');
        const { signedTxXdr } = await kit.signTransaction(transaction.toXDR());
        const result = await server.submitTransaction(TransactionBuilder.fromXDR(signedTxXdr, Networks.PUBLIC));
        txHash = (result as any).hash || (result as any).id || signedTxXdr.slice(0, 16);
      } else {
        // BNB (EVM via Privy)
        if (!authenticated) throw new Error('Not authenticated with Privy');
        const wallet = privyWallets.find(w => w.address.toLowerCase() === address.toLowerCase());
        if (!wallet) throw new Error('Privy wallet not found');

        const ethereumProvider = await wallet.getEthereumProvider();
        const provider = new ethers.BrowserProvider(ethereumProvider);
        const signer = await provider.getSigner();

        const bnbConfig = getBNBConfig();
        if (!bnbConfig.treasuryAddress) throw new Error('Treasury address not configured');

        toast.info('Please confirm the transaction in your wallet...');
        const txResponse = await signer.sendTransaction({
          to: getAddress(bnbConfig.treasuryAddress),
          value: ethers.parseEther(depositAmount.toString()),
        });
        txHash = txResponse.hash;
      }

      toast.info('Transaction submitted. Waiting for confirmation...');

      // Update balance in database
      await depositFunds(address, depositAmount, txHash!);

      // Refresh balances
      refreshWalletBalance();

      toast.success(
        `Successfully deposited ${depositAmount.toFixed(4)} ${currencySymbol}! Balance updated.`
      );

      if (onSuccess) onSuccess(depositAmount, txHash!);
      onClose();
    } catch (err: any) {
      console.error('Deposit error:', err);
      const errorMessage = err.message || 'Failed to deposit funds';
      setError(errorMessage);
      toast.error(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Deposit ${currencySymbol}`}
      showCloseButton={!isLoading}
    >
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-[#00f5ff]/10 to-purple-500/10 border border-[#00f5ff]/30 rounded-lg p-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 px-2 py-0.5 bg-[#00f5ff]/20 text-[#00f5ff] text-[8px] font-bold uppercase tracking-tighter rounded-bl-lg">
            {networkName}
          </div>
          <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1 font-mono">
            Wallet Balance
          </p>
          <p className="text-[#00f5ff] text-xl font-bold font-mono flex items-center gap-2">
            {network === 'SUI' && <img src="/usd-coin-usdc-logo.png" alt="USDC" className="w-5 h-5" />}
            {network === 'XTZ' && <img src="/logos/tezos-xtz-logo.png" alt="XTZ" className="w-5 h-5" />}
            {network === 'BNB' && <img src="/logos/bnb-bnb-logo.png" alt="BNB" className="w-5 h-5" />}
            {currencySymbol === 'BYNOMO' ? <img src="/overflowlogo.png" alt="BYNOMO" className="w-5 h-5" /> : (network === 'SOL' && <img src="/logos/solana-sol-logo.png" alt="SOL" className="w-5 h-5" />)}
            {network === 'XLM' && <img src="/logos/stellar-xlm-logo.png" alt="XLM" className="w-5 h-5" />}
            {network === 'NEAR' && <img src="/logos/near-logo.svg" alt="NEAR" className="w-5 h-5" />}
            {walletBalance.toFixed(4)} {currencySymbol}
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="deposit-amount" className="text-gray-400 text-xs font-mono uppercase">Amount to Deposit</label>
          <div className="relative">
            <input
              id="deposit-amount"
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              disabled={isLoading}
              className={`
                w-full px-4 py-3 bg-black/50 border rounded-lg text-lg
                text-white font-mono
                focus:outline-none focus:ring-1 focus:ring-[#00f5ff]
                disabled:opacity-50 disabled:cursor-not-allowed
                ${error ? 'border-red-500' : 'border-[#00f5ff]/30'}
              `}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono">
              {currencySymbol}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={handleMaxClick}
              disabled={isLoading}
              className="text-[10px] text-[#00f5ff] hover:text-cyan-400 font-mono disabled:opacity-50 transition-colors uppercase tracking-wider"
            >
              Use Max
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {quickAmounts.map((quickAmount) => (
            <button
              key={quickAmount}
              onClick={() => handleQuickSelect(quickAmount)}
              disabled={isLoading}
              className={`
                px-2 py-2 rounded border font-mono text-xs
                transition-all duration-200
                ${amount === quickAmount.toString()
                  ? 'bg-[#00f5ff]/20 border-[#00f5ff] text-[#00f5ff] shadow-[0_0_10px_rgba(0,245,255,0.3)]'
                  : 'bg-black/30 border-[#00f5ff]/30 text-gray-300 hover:border-[#00f5ff] hover:text-[#00f5ff]'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {quickAmount}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg px-3 py-2">
            <p className="text-red-400 text-xs font-mono">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            onClick={onClose}
            variant="secondary"
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeposit}
            variant="primary"
            className="flex-1"
            disabled={isLoading || !amount || parseFloat(amount || '0') <= 0}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Processing</span>
              </span>
            ) : (
              `Deposit ${currencySymbol}`
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
