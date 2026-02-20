/**
 * Unit tests for GET /api/balance/[address] endpoint
 * 
 * Task: 4.1 Create GET /api/balance/[address] endpoint
 * Requirements: 2.3
 */

import { GET } from '../route';
import { supabase } from '@/lib/supabase/client';
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Mock the Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
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

describe('GET /api/balance/[address]', () => {
  const mockFrom = supabase.from as jest.MockedFunction<typeof supabase.from>;
  const mockNextResponseJson = NextResponse.json as jest.MockedFunction<typeof NextResponse.json>;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return balance and updated_at for existing user', async () => {
    // Mock successful database response
    const mockData = {
      balance: '10.5',
      updated_at: '2024-01-15T10:30:00Z',
    };

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      }),
    } as any);

    // Create mock request
    const request = new NextRequest('http://localhost:3000/api/balance/0x123');
    const params = { address: '0x123' };

    // Call the endpoint
    const response = await GET(request, { params });
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(json).toEqual({
      balance: 10.5,
      updatedAt: '2024-01-15T10:30:00Z',
    });

    // Verify database query
    expect(mockFrom).toHaveBeenCalledWith('user_balances');
  });

  it('should return 0 balance for user not found', async () => {
    // Mock user not found error (PGRST116)
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'No rows found' },
          }),
        }),
      }),
    } as any);

    // Create mock request
    const request = new NextRequest('http://localhost:3000/api/balance/0x456');
    const params = { address: '0x456' };

    // Call the endpoint
    const response = await GET(request, { params });
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(json).toEqual({
      balance: 0,
      updatedAt: null,
    });
  });

  it('should return 400 for invalid address format', async () => {
    // Create mock request with invalid address
    const request = new NextRequest('http://localhost:3000/api/balance/invalid');
    const params = { address: 'invalid' };

    // Call the endpoint
    const response = await GET(request, { params });
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: 'Invalid address format. Flow addresses must start with 0x',
    });

    // Verify database was not queried
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('should return 400 for empty address', async () => {
    // Create mock request with empty address
    const request = new NextRequest('http://localhost:3000/api/balance/');
    const params = { address: '' };

    // Call the endpoint
    const response = await GET(request, { params });
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: 'Invalid address format. Flow addresses must start with 0x',
    });
  });

  it('should return 503 for database connection errors', async () => {
    // Mock database connection error
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'CONNECTION_ERROR', message: 'Connection failed' },
          }),
        }),
      }),
    } as any);

    // Create mock request
    const request = new NextRequest('http://localhost:3000/api/balance/0x789');
    const params = { address: '0x789' };

    // Call the endpoint
    const response = await GET(request, { params });
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(503);
    expect(json).toEqual({
      error: 'Service temporarily unavailable. Please try again.',
    });
  });

  it('should handle unexpected errors gracefully', async () => {
    // Mock unexpected error
    mockFrom.mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    // Create mock request
    const request = new NextRequest('http://localhost:3000/api/balance/0xabc');
    const params = { address: '0xabc' };

    // Call the endpoint
    const response = await GET(request, { params });
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(500);
    expect(json).toEqual({
      error: 'An error occurred processing your request',
    });
  });

  it('should parse numeric balance correctly', async () => {
    // Mock successful database response with string balance
    const mockData = {
      balance: '123.45678901',
      updated_at: '2024-01-15T10:30:00Z',
    };

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      }),
    } as any);

    // Create mock request
    const request = new NextRequest('http://localhost:3000/api/balance/0xdef');
    const params = { address: '0xdef' };

    // Call the endpoint
    const response = await GET(request, { params });
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(json.balance).toBe(123.45678901);
    expect(typeof json.balance).toBe('number');
  });

  it('should handle zero balance correctly', async () => {
    // Mock successful database response with zero balance
    const mockData = {
      balance: '0',
      updated_at: '2024-01-15T10:30:00Z',
    };

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      }),
    } as any);

    // Create mock request
    const request = new NextRequest('http://localhost:3000/api/balance/0x000');
    const params = { address: '0x000' };

    // Call the endpoint
    const response = await GET(request, { params });
    const json = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(json.balance).toBe(0);
  });
});
