/**
 * Flow blockchain-specific type definitions
 */

export interface FlowUser {
  addr: string | null;
  cid: string | null;
  loggedIn: boolean | null;
}

export interface FlowTransaction {
  transactionId: string;
  status: number;
  statusCode: number;
  errorMessage: string;
  events: FlowEvent[];
}

export interface FlowEvent {
  type: string;
  transactionId: string;
  transactionIndex: number;
  eventIndex: number;
  data: any;
}

export interface FlowAccount {
  address: string;
  balance: string;
  code: string;
  contracts: Record<string, string>;
  keys: FlowAccountKey[];
}

export interface FlowAccountKey {
  index: number;
  publicKey: string;
  signAlgo: number;
  hashAlgo: number;
  weight: number;
  sequenceNumber: number;
  revoked: boolean;
}
