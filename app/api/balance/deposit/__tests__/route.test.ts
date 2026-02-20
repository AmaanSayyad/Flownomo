/**
 * Unit tests for POST /api/balance/deposit endpoint
 * 
 * Task: 4.2 Create POST /api/balance/deposit endpoint
 * Requirements: 1.2, 7.5
 */

import { POST } from '../route';
import { supabase } from '@/lib/supabase/client';
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Mock the Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    rpc: jest.fn(),
  },
}));

// Mock NextResponse.json to return a proper Response object
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server');
  return {
    ...actual,
    NextResponse: {
      json: jest.fn((body: any, init?: ResponseInit) => {
        return {
          json: async () => body,
          status: init?.status || 200,
          headers: new Headers(init?.headers),
        };
      }),
    },
  };
});

describe('POST /api/balance/deposit', () => {
  const mockRpc = supabase.rpc as jest.MockedFunction<typeof supabase.rpc>;
  const mockNextResponseJson = NextResponse.json as jest.MockedFunction<typeof NextResponse.json>;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully process a deposit and return new balance', async () => {
    // Mock successful stored procedure response
    const mockResult = {
      success: true,
      error: null,
      new_balance: 25.5,
    };

    mockRpc.mockResolvedValue({
      data: mockResult,
      error: null,
    } as any);

    // Create mock request with valid deposit data
    const requestBody = {
      userAddress: '0x123abc',
      amount: 10.5,
      txHash: '0xabcdef123456',
    };

    const request = new NextRequest('http://localhost:3000/api/balance/deposit', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(json).toEqual({
      success: true,
      newBalance: 25.5,
    });

    // Verify stored procedure was called with correct parameters
    expect(mockRpc).toHaveBeenCalledWith('update_balance_for_deposit', {
      p_user_address: '0x123abc',
      p_deposit_amount: 10.5,
      p_transaction_hash: '0xabcdef123456',
    });
  });

  it('should create new user record for first deposit', async () => {
    // Mock successful stored procedure response for new user
    const mockResult = {
      success: true,
      error: null,
      new_balance: 5.0,
    };

    mockRpc.mockResolvedValue({
      data: mockResult,
      error: null,
    } as any);

    // Create mock request
    const requestBody = {
      userAddress: '0xnewuser',
      amount: 5.0,
      txHash: '0xtxhash123',
    };

    const request = new NextRequest('http://localhost:3000/api/balance/deposit', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.newBalance).toBe(5.0);
  });

  it('should return 400 for missing userAddress', async () => {
    // Create mock request with missing userAddress
    const requestBody = {
      amount: 10.5,
      txHash: '0xabcdef123456',
    };

    const request = new NextRequest('http://localhost:3000/api/balance/deposit', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: 'Missing required fields: userAddress, amount, txHash',
    });

    // Verify stored procedure was not called
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should return 400 for missing amount', async () => {
    // Create mock request with missing amount
    const requestBody = {
      userAddress: '0x123abc',
      txHash: '0xabcdef123456',
    };

    const request = new NextRequest('http://localhost:3000/api/balance/deposit', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: 'Missing required fields: userAddress, amount, txHash',
    });

    // Verify stored procedure was not called
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should return 400 for missing txHash', async () => {
    // Create mock request with missing txHash
    const requestBody = {
      userAddress: '0x123abc',
      amount: 10.5,
    };

    const request = new NextRequest('http://localhost:3000/api/balance/deposit', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: 'Missing required fields: userAddress, amount, txHash',
    });

    // Verify stored procedure was not called
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid address format', async () => {
    // Create mock request with invalid address (no 0x prefix)
    const requestBody = {
      userAddress: 'invalid123',
      amount: 10.5,
      txHash: '0xabcdef123456',
    };

    const request = new NextRequest('http://localhost:3000/api/balance/deposit', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: 'Invalid address format. Flow addresses must start with 0x',
    });

    // Verify stored procedure was not called
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should return 400 for zero amount', async () => {
    // Create mock request with zero amount
    const requestBody = {
      userAddress: '0x123abc',
      amount: 0,
      txHash: '0xabcdef123456',
    };

    const request = new NextRequest('http://localhost:3000/api/balance/deposit', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: 'Deposit amount must be greater than zero',
    });

    // Verify stored procedure was not called
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should return 400 for negative amount', async () => {
    // Create mock request with negative amount
    const requestBody = {
      userAddress: '0x123abc',
      amount: -5.5,
      txHash: '0xabcdef123456',
    };

    const request = new NextRequest('http://localhost:3000/api/balance/deposit', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: 'Deposit amount must be greater than zero',
    });

    // Verify stored procedure was not called
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should return 503 for database connection errors', async () => {
    // Mock database connection error
    mockRpc.mockResolvedValue({
      data: null,
      error: { code: 'CONNECTION_ERROR', message: 'Connection failed' },
    } as any);

    // Create mock request
    const requestBody = {
      userAddress: '0x123abc',
      amount: 10.5,
      txHash: '0xabcdef123456',
    };

    const request = new NextRequest('http://localhost:3000/api/balance/deposit', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(503);
    expect(json).toEqual({
      error: 'Service temporarily unavailable. Please try again.',
    });
  });

  it('should handle stored procedure errors', async () => {
    // Mock stored procedure returning error
    const mockResult = {
      success: false,
      error: 'Database constraint violation',
      new_balance: null,
    };

    mockRpc.mockResolvedValue({
      data: mockResult,
      error: null,
    } as any);

    // Create mock request
    const requestBody = {
      userAddress: '0x123abc',
      amount: 10.5,
      txHash: '0xabcdef123456',
    };

    const request = new NextRequest('http://localhost:3000/api/balance/deposit', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: 'Database constraint violation',
    });
  });

  it('should handle unexpected errors gracefully', async () => {
    // Mock unexpected error
    mockRpc.mockRejectedValue(new Error('Unexpected error'));

    // Create mock request
    const requestBody = {
      userAddress: '0x123abc',
      amount: 10.5,
      txHash: '0xabcdef123456',
    };

    const request = new NextRequest('http://localhost:3000/api/balance/deposit', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(500);
    expect(json).toEqual({
      error: 'An error occurred processing your request',
    });
  });

  it('should handle large deposit amounts correctly', async () => {
    // Mock successful stored procedure response with large amount
    const mockResult = {
      success: true,
      error: null,
      new_balance: 1000000.12345678,
    };

    mockRpc.mockResolvedValue({
      data: mockResult,
      error: null,
    } as any);

    // Create mock request with large amount
    const requestBody = {
      userAddress: '0x123abc',
      amount: 999999.12345678,
      txHash: '0xabcdef123456',
    };

    const request = new NextRequest('http://localhost:3000/api/balance/deposit', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.newBalance).toBe(1000000.12345678);
  });

  it('should handle small decimal amounts correctly', async () => {
    // Mock successful stored procedure response with small decimal
    const mockResult = {
      success: true,
      error: null,
      new_balance: 0.00000001,
    };

    mockRpc.mockResolvedValue({
      data: mockResult,
      error: null,
    } as any);

    // Create mock request with small decimal amount
    const requestBody = {
      userAddress: '0x123abc',
      amount: 0.00000001,
      txHash: '0xabcdef123456',
    };

    const request = new NextRequest('http://localhost:3000/api/balance/deposit', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.newBalance).toBe(0.00000001);
  });

  it('should handle malformed JSON gracefully', async () => {
    // Create mock request with malformed JSON
    const request = new NextRequest('http://localhost:3000/api/balance/deposit', {
      method: 'POST',
      body: 'not valid json',
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(500);
    expect(json).toEqual({
      error: 'An error occurred processing your request',
    });

    // Verify stored procedure was not called
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should verify audit log is created via stored procedure', async () => {
    // The stored procedure handles audit log creation internally
    // This test verifies the procedure is called with correct parameters
    const mockResult = {
      success: true,
      error: null,
      new_balance: 15.0,
    };

    mockRpc.mockResolvedValue({
      data: mockResult,
      error: null,
    } as any);

    // Create mock request
    const requestBody = {
      userAddress: '0x123abc',
      amount: 10.0,
      txHash: '0xtxhash789',
    };

    const request = new NextRequest('http://localhost:3000/api/balance/deposit', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    await POST(request);

    // Verify stored procedure was called with transaction hash
    // The procedure internally creates audit log with operation_type='deposit'
    expect(mockRpc).toHaveBeenCalledWith('update_balance_for_deposit', {
      p_user_address: '0x123abc',
      p_deposit_amount: 10.0,
      p_transaction_hash: '0xtxhash789',
    });
  });
});
