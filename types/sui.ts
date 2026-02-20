/**
 * Sui blockchain-specific type definitions
 */

export interface SuiWallet {
  address: string | null;
  connected: boolean;
  name: string | null;
}

export interface SuiTransaction {
  digest: string;
  effects: {
    status: {
      status: 'success' | 'failure';
      error?: string;
    };
  };
  events: SuiEvent[];
}

export interface SuiEvent {
  type: string;
  parsedJson: any;
  packageId: string;
  transactionModule: string;
  sender: string;
  timestampMs: string;
}

export interface SuiAccount {
  address: string;
  publicKey: string;
}

export interface SuiBalance {
  coinType: string;
  coinObjectCount: number;
  totalBalance: string;
  lockedBalance: Record<string, string>;
}
