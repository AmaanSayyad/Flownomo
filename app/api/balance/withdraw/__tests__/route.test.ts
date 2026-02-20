/**
 * Unit tests for POST /api/balance/withdraw endpoint
 * 
 * Task: 4.3 Create POST /api/balance/withdraw endpoint
 * Requirements: 5.3, 7.5
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

describe('POST /api/balance/withdraw', () => {
  const mockRpc = supabase.rpc as jest.MockedFunction<typeof supabase.rpc>;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully process a withdrawal and return new balance', async () => {
    // Mock successful stored procedure response
    const mockResult = {
      success: true,
      error: null,
      new_balance: 15.0,
    };

    mockRpc.mockResolvedValue({
      data: mockResult,
      error: null,
    } as any);

    // Create mock request with valid withdrawal data
    const requestBody = {
      userAddress: '0x123abc',
      amount: 10.5,
      txHash: '0xabcdef123456',
    };

    const request = new NextRequest('http://localhost:3000/api/balance/withdraw', {
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
      newBalance: 15.0,
    });

    // Verify stored procedure was called with correct parameters
    expect(mockRpc).toHaveBeenCalledWith('update_balance_for_withdrawal', {
      p_user_address: '0x123abc',
      p_withdrawal_amount: 10.5,
      p_transaction_hash: '0xabcdef123456',
    });
  });

  it('should return 400 for missing userAddress', async () => {
    // Create mock request with missing userAddress
    const requestBody = {
      amount: 10.5,
      txHash: '0xabcdef123456',
    };

    const request = new NextRequest('http://localhost:3000/api/balance/withdraw', {
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

    const request = new NextRequest('http://localhost:3000/api/balance/withdraw', {
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

    const request = new NextRequest('http://localhost:3000/api/balance/withdraw', {
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

    const request = new NextRequest('http://localhost:3000/api/balance/withdraw', {
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

    const request = new NextRequest('http://localhost:3000/api/balance/withdraw', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: 'Withdrawal amount must be greater than zero',
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

    const request = new NextRequest('http://localhost:3000/api/balance/withdraw', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: 'Withdrawal amount must be greater than zero',
    });

    // Verify stored procedure was not called
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should return 400 for insufficient balance', async () => {
    // Mock stored procedure returning insufficient balance error
    const mockResult = {
      success: false,
      error: 'Insufficient balance',
      new_balance: 5.0,
    };

    mockRpc.mockResolvedValue({
      data: mockResult,
      error: null,
    } as any);

    // Create mock request with amount exceeding balance
    const requestBody = {
      userAddress: '0x123abc',
      amount: 10.5,
      txHash: '0xabcdef123456',
    };

    const request = new NextRequest('http://localhost:3000/api/balance/withdraw', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: 'Insufficient balance',
    });
  });

  it('should return 400 for user not found', async () => {
    // Mock stored procedure returning user not found error
    const mockResult = {
      success: false,
      error: 'User not found',
      new_balance: null,
    };

    mockRpc.mockResolvedValue({
      data: mockResult,
      error: null,
    } as any);

    // Create mock request
    const requestBody = {
      userAddress: '0xnonexistent',
      amount: 10.5,
      txHash: '0xabcdef123456',
    };

    const request = new NextRequest('http://localhost:3000/api/balance/withdraw', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: 'User not found',
    });
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

    const request = new NextRequest('http://localhost:3000/api/balance/withdraw', {
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

    const request = new NextRequest('http://localhost:3000/api/balance/withdraw', {
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

    const request = new NextRequest('http://localhost:3000/api/balance/withdraw', {
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

  it('should handle large withdrawal amounts correctly', async () => {
    // Mock successful stored procedure response with large amount
    const mockResult = {
      success: true,
      error: null,
      new_balance: 0.12345678,
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

    const request = new NextRequest('http://localhost:3000/api/balance/withdraw', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.newBalance).toBe(0.12345678);
  });

  it('should handle small decimal amounts correctly', async () => {
    // Mock successful stored procedure response with small decimal
    const mockResult = {
      success: true,
      error: null,
      new_balance: 0.99999999,
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

    const request = new NextRequest('http://localhost:3000/api/balance/withdraw', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.newBalance).toBe(0.99999999);
  });

  it('should handle malformed JSON gracefully', async () => {
    // Create mock request with malformed JSON
    const request = new NextRequest('http://localhost:3000/api/balance/withdraw', {
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
      new_balance: 5.0,
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

    const request = new NextRequest('http://localhost:3000/api/balance/withdraw', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    await POST(request);

    // Verify stored procedure was called with transaction hash
    // The procedure internally creates audit log with operation_type='withdrawal'
    expect(mockRpc).toHaveBeenCalledWith('update_balance_for_withdrawal', {
      p_user_address: '0x123abc',
      p_withdrawal_amount: 10.0,
      p_transaction_hash: '0xtxhash789',
    });
  });

  it('should handle withdrawal of entire balance', async () => {
    // Mock successful stored procedure response for withdrawing entire balance
    const mockResult = {
      success: true,
      error: null,
      new_balance: 0,
    };

    mockRpc.mockResolvedValue({
      data: mockResult,
      error: null,
    } as any);

    // Create mock request to withdraw entire balance
    const requestBody = {
      userAddress: '0x123abc',
      amount: 25.5,
      txHash: '0xabcdef123456',
    };

    const request = new NextRequest('http://localhost:3000/api/balance/withdraw', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.newBalance).toBe(0);
  });
});
