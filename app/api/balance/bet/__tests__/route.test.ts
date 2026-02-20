/**
 * Unit tests for POST /api/balance/bet endpoint
 * 
 * Task: 4.4 Create POST /api/balance/bet endpoint
 * Requirements: 3.1, 3.2, 7.2
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

// Mock FCL
jest.mock('@onflow/fcl', () => ({
  send: jest.fn(),
  decode: jest.fn(),
}));

describe('POST /api/balance/bet', () => {
  const mockRpc = supabase.rpc as jest.MockedFunction<typeof supabase.rpc>;
  const mockNextResponseJson = NextResponse.json as jest.MockedFunction<typeof NextResponse.json>;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully process a bet and return remaining balance', async () => {
    // Mock successful stored procedure response
    const mockResult = {
      success: true,
      error: null,
      new_balance: 15.5,
    };

    mockRpc.mockResolvedValue({
      data: mockResult,
      error: null,
    } as any);

    // Create mock request with valid bet data
    const requestBody = {
      userAddress: '0x123abc',
      betAmount: 5.0,
      roundId: 1,
      targetPrice: 50000,
      isOver: true,
      multiplier: 2.0,
      targetCell: {
        id: 1,
        priceChange: 100,
        direction: 'UP' as const,
        timeframe: 30,
      },
    };

    const request = new NextRequest('http://localhost:3000/api/balance/bet', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.remainingBalance).toBe(15.5);
    expect(json.betId).toBeDefined();

    // Verify stored procedure was called with correct parameters
    expect(mockRpc).toHaveBeenCalledWith('deduct_balance_for_bet', {
      p_user_address: '0x123abc',
      p_bet_amount: 5.0,
    });
  });

  it('should return 400 for missing userAddress', async () => {
    // Create mock request with missing userAddress
    const requestBody = {
      betAmount: 5.0,
      roundId: 1,
      targetPrice: 50000,
      isOver: true,
    };

    const request = new NextRequest('http://localhost:3000/api/balance/bet', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: 'Missing required fields: userAddress, betAmount',
    });

    // Verify stored procedure was not called
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should return 400 for missing betAmount', async () => {
    // Create mock request with missing betAmount
    const requestBody = {
      userAddress: '0x123abc',
      roundId: 1,
      targetPrice: 50000,
      isOver: true,
    };

    const request = new NextRequest('http://localhost:3000/api/balance/bet', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: 'Missing required fields: userAddress, betAmount',
    });

    // Verify stored procedure was not called
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid address format', async () => {
    // Create mock request with invalid address (no 0x prefix)
    const requestBody = {
      userAddress: 'invalid123',
      betAmount: 5.0,
      roundId: 1,
      targetPrice: 50000,
      isOver: true,
      multiplier: 2.0,
      targetCell: {
        id: 1,
        priceChange: 100,
        direction: 'UP' as const,
        timeframe: 30,
      },
    };

    const request = new NextRequest('http://localhost:3000/api/balance/bet', {
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

  it('should return 400 for zero bet amount', async () => {
    // Create mock request with zero amount
    const requestBody = {
      userAddress: '0x123abc',
      betAmount: 0,
      roundId: 1,
      targetPrice: 50000,
      isOver: true,
      multiplier: 2.0,
      targetCell: {
        id: 1,
        priceChange: 100,
        direction: 'UP' as const,
        timeframe: 30,
      },
    };

    const request = new NextRequest('http://localhost:3000/api/balance/bet', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: 'Bet amount must be greater than zero',
    });

    // Verify stored procedure was not called
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should return 400 for negative bet amount', async () => {
    // Create mock request with negative amount
    const requestBody = {
      userAddress: '0x123abc',
      betAmount: -5.0,
      roundId: 1,
      targetPrice: 50000,
      isOver: true,
      multiplier: 2.0,
      targetCell: {
        id: 1,
        priceChange: 100,
        direction: 'UP' as const,
        timeframe: 30,
      },
    };

    const request = new NextRequest('http://localhost:3000/api/balance/bet', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: 'Bet amount must be greater than zero',
    });

    // Verify stored procedure was not called
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should return 400 for insufficient house balance', async () => {
    // Mock stored procedure returning insufficient balance error
    const mockResult = {
      success: false,
      error: 'Insufficient balance',
      new_balance: 2.0,
    };

    mockRpc.mockResolvedValue({
      data: mockResult,
      error: null,
    } as any);

    // Create mock request
    const requestBody = {
      userAddress: '0x123abc',
      betAmount: 10.0,
      roundId: 1,
      targetPrice: 50000,
      isOver: true,
      multiplier: 2.0,
      targetCell: {
        id: 1,
        priceChange: 100,
        direction: 'UP' as const,
        timeframe: 30,
      },
    };

    const request = new NextRequest('http://localhost:3000/api/balance/bet', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: 'Insufficient house balance. Please deposit more FLOW.',
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
      userAddress: '0xnewuser',
      betAmount: 5.0,
      roundId: 1,
      targetPrice: 50000,
      isOver: true,
      multiplier: 2.0,
      targetCell: {
        id: 1,
        priceChange: 100,
        direction: 'UP' as const,
        timeframe: 30,
      },
    };

    const request = new NextRequest('http://localhost:3000/api/balance/bet', {
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
      betAmount: 5.0,
      roundId: 1,
      targetPrice: 50000,
      isOver: true,
      multiplier: 2.0,
      targetCell: {
        id: 1,
        priceChange: 100,
        direction: 'UP' as const,
        timeframe: 30,
      },
    };

    const request = new NextRequest('http://localhost:3000/api/balance/bet', {
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

  it('should return 400 for invalid multiplier (less than 1.0)', async () => {
    // Create mock request with invalid multiplier
    const requestBody = {
      userAddress: '0x123abc',
      betAmount: 5.0,
      roundId: 1,
      targetPrice: 50000,
      isOver: true,
      multiplier: 0.5,
      targetCell: {
        id: 1,
        priceChange: 100,
        direction: 'UP' as const,
        timeframe: 30,
      },
    };

    const request = new NextRequest('http://localhost:3000/api/balance/bet', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: 'Multiplier must be at least 1.0',
    });

    // Verify stored procedure was not called
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should return 400 for missing multiplier', async () => {
    // Create mock request with missing multiplier
    const requestBody = {
      userAddress: '0x123abc',
      betAmount: 5.0,
      roundId: 1,
      targetPrice: 50000,
      isOver: true,
      targetCell: {
        id: 1,
        priceChange: 100,
        direction: 'UP' as const,
        timeframe: 30,
      },
    };

    const request = new NextRequest('http://localhost:3000/api/balance/bet', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: 'Multiplier must be at least 1.0',
    });

    // Verify stored procedure was not called
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid target cell (missing id)', async () => {
    // Create mock request with invalid target cell
    const requestBody = {
      userAddress: '0x123abc',
      betAmount: 5.0,
      roundId: 1,
      targetPrice: 50000,
      isOver: true,
      multiplier: 2.0,
      targetCell: {
        priceChange: 100,
        direction: 'UP' as const,
        timeframe: 30,
      },
    };

    const request = new NextRequest('http://localhost:3000/api/balance/bet', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: 'Invalid target cell data',
    });

    // Verify stored procedure was not called
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid target cell (missing priceChange)', async () => {
    // Create mock request with invalid target cell
    const requestBody = {
      userAddress: '0x123abc',
      betAmount: 5.0,
      roundId: 1,
      targetPrice: 50000,
      isOver: true,
      multiplier: 2.0,
      targetCell: {
        id: 1,
        direction: 'UP' as const,
        timeframe: 30,
      },
    };

    const request = new NextRequest('http://localhost:3000/api/balance/bet', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: 'Invalid target cell data',
    });

    // Verify stored procedure was not called
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should handle unexpected errors gracefully', async () => {
    // Mock unexpected error
    mockRpc.mockRejectedValue(new Error('Unexpected error'));

    // Create mock request
    const requestBody = {
      userAddress: '0x123abc',
      betAmount: 5.0,
      roundId: 1,
      targetPrice: 50000,
      isOver: true,
      multiplier: 2.0,
      targetCell: {
        id: 1,
        priceChange: 100,
        direction: 'UP' as const,
        timeframe: 30,
      },
    };

    const request = new NextRequest('http://localhost:3000/api/balance/bet', {
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

  it('should handle malformed JSON gracefully', async () => {
    // Create mock request with malformed JSON
    const request = new NextRequest('http://localhost:3000/api/balance/bet', {
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

  it('should handle large bet amounts correctly', async () => {
    // Mock successful stored procedure response with large amount
    const mockResult = {
      success: true,
      error: null,
      new_balance: 999000.0,
    };

    mockRpc.mockResolvedValue({
      data: mockResult,
      error: null,
    } as any);

    // Create mock request with large bet amount
    const requestBody = {
      userAddress: '0x123abc',
      betAmount: 1000.0,
      roundId: 1,
      targetPrice: 50000,
      isOver: true,
      multiplier: 2.0,
      targetCell: {
        id: 1,
        priceChange: 100,
        direction: 'UP' as const,
        timeframe: 30,
      },
    };

    const request = new NextRequest('http://localhost:3000/api/balance/bet', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.remainingBalance).toBe(999000.0);
  });

  it('should handle small decimal bet amounts correctly', async () => {
    // Mock successful stored procedure response with small decimal
    const mockResult = {
      success: true,
      error: null,
      new_balance: 9.99999999,
    };

    mockRpc.mockResolvedValue({
      data: mockResult,
      error: null,
    } as any);

    // Create mock request with small decimal bet amount
    const requestBody = {
      userAddress: '0x123abc',
      betAmount: 0.00000001,
      roundId: 1,
      targetPrice: 50000,
      isOver: true,
      multiplier: 2.0,
      targetCell: {
        id: 1,
        priceChange: 100,
        direction: 'UP' as const,
        timeframe: 30,
      },
    };

    const request = new NextRequest('http://localhost:3000/api/balance/bet', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.remainingBalance).toBe(9.99999999);
  });

  it('should verify audit log is created via stored procedure', async () => {
    // The stored procedure handles audit log creation internally
    // This test verifies the procedure is called with correct parameters
    const mockResult = {
      success: true,
      error: null,
      new_balance: 10.0,
    };

    mockRpc.mockResolvedValue({
      data: mockResult,
      error: null,
    } as any);

    // Create mock request
    const requestBody = {
      userAddress: '0x123abc',
      betAmount: 5.0,
      roundId: 1,
      targetPrice: 50000,
      isOver: true,
      multiplier: 2.0,
      targetCell: {
        id: 1,
        priceChange: 100,
        direction: 'UP' as const,
        timeframe: 30,
      },
    };

    const request = new NextRequest('http://localhost:3000/api/balance/bet', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    await POST(request);

    // Verify stored procedure was called
    // The procedure internally creates audit log with operation_type='bet_placed'
    expect(mockRpc).toHaveBeenCalledWith('deduct_balance_for_bet', {
      p_user_address: '0x123abc',
      p_bet_amount: 5.0,
    });
  });

  it('should handle DOWN direction in target cell', async () => {
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

    // Create mock request with DOWN direction
    const requestBody = {
      userAddress: '0x123abc',
      betAmount: 5.0,
      roundId: 1,
      targetPrice: 50000,
      isOver: false,
      multiplier: 2.0,
      targetCell: {
        id: 2,
        priceChange: -100,
        direction: 'DOWN' as const,
        timeframe: 30,
      },
    };

    const request = new NextRequest('http://localhost:3000/api/balance/bet', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Call the endpoint
    const response = await POST(request);
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.remainingBalance).toBe(15.0);
  });
});
