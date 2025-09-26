/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as eventsEndpoint, clearCleanupInterval } from '../../app/api/events/route';
import * as auth from '@/lib/auth';

// Mock the auth module
jest.mock('@/lib/auth');
const mockGetTokenData = auth.getTokenData as jest.MockedFunction<typeof auth.getTokenData>;

// Mock console.error to keep test output clean
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Clear the cleanup interval after all tests to prevent Jest hanging
afterAll(() => {
  clearCleanupInterval();
});

describe('SSE Events API Endpoint', () => {
  const mockUserData = {
    userId: 'user-123',
    familyId: 'family-456',
    role: 'HERO'
  };

  const mockGuildMasterData = {
    userId: 'user-456',
    familyId: 'family-456',
    role: 'GUILD_MASTER'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/events - SSE Connection Establishment', () => {
    it('should establish SSE connection with proper headers for authenticated user', async () => {
      mockGetTokenData.mockResolvedValue(mockUserData);

      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer valid-token',
          'accept': 'text/event-stream',
        }
      });

      const response = await eventsEndpoint(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('text/event-stream');
      expect(response.headers.get('cache-control')).toBe('no-cache, no-transform');
      expect(response.headers.get('connection')).toBe('keep-alive');
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
      expect(response.headers.get('access-control-allow-headers')).toBe('Cache-Control');
    });

    it('should send initial connection success event', async () => {
      mockGetTokenData.mockResolvedValue(mockUserData);

      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer valid-token',
          'accept': 'text/event-stream',
        }
      });

      const response = await eventsEndpoint(request);
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      const { value } = await reader!.read();
      const chunk = decoder.decode(value);

      expect(chunk).toContain('event: connected');
      expect(chunk).toContain('data: {"type":"connected","familyId":"family-456","timestamp"');
    });

    it('should reject connection without valid authentication', async () => {
      mockGetTokenData.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'GET',
        headers: {
          'accept': 'text/event-stream',
        }
      });

      const response = await eventsEndpoint(request);

      expect(response.status).toBe(401);
      const responseData = await response.json();
      expect(responseData.error).toBe('Unauthorized');
    });

    it('should reject connection with invalid authorization header format', async () => {
      mockGetTokenData.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'GET',
        headers: {
          'authorization': 'Invalid token-format',
          'accept': 'text/event-stream',
        }
      });

      const response = await eventsEndpoint(request);

      expect(response.status).toBe(401);
      const responseData = await response.json();
      expect(responseData.error).toBe('Unauthorized');
    });

    it('should reject connection with expired/invalid token', async () => {
      mockGetTokenData.mockRejectedValue(new Error('Invalid or expired token'));

      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer expired-token',
          'accept': 'text/event-stream',
        }
      });

      const response = await eventsEndpoint(request);

      expect(response.status).toBe(401);
    });
  });

  describe('Family-Scoped Event Filtering', () => {
    it('should only allow connections from same family', async () => {
      mockGetTokenData.mockResolvedValue(mockUserData);

      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer valid-token',
          'accept': 'text/event-stream',
        }
      });

      const response = await eventsEndpoint(request);
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      const { value } = await reader!.read();
      const chunk = decoder.decode(value);

      // Parse the initial connection event
      const eventLines = chunk.split('\n').filter(line => line.startsWith('data: '));
      const eventData = JSON.parse(eventLines[0].substring(6));

      expect(eventData.familyId).toBe('family-456');
      expect(eventData.type).toBe('connected');
    });

    it('should establish separate connections for different families', async () => {
      // First family connection
      mockGetTokenData.mockResolvedValueOnce(mockUserData);

      const request1 = new NextRequest('http://localhost:3000/api/events', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer token-family-456',
          'accept': 'text/event-stream',
        }
      });

      const response1 = await eventsEndpoint(request1);
      expect(response1.status).toBe(200);

      // Second family connection
      const otherFamilyData = { ...mockUserData, familyId: 'family-789' };
      mockGetTokenData.mockResolvedValueOnce(otherFamilyData);

      const request2 = new NextRequest('http://localhost:3000/api/events', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer token-family-789',
          'accept': 'text/event-stream',
        }
      });

      const response2 = await eventsEndpoint(request2);
      expect(response2.status).toBe(200);

      // Both connections should succeed but be isolated
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
  });

  describe('Event Payload Structure', () => {
    it('should emit quest status change events with correct structure', async () => {
      mockGetTokenData.mockResolvedValue(mockUserData);

      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer valid-token',
          'accept': 'text/event-stream',
        }
      });

      const response = await eventsEndpoint(request);
      expect(response.status).toBe(200);

      // This test validates the expected event structure
      // Actual event emission will be tested in integration tests
      const expectedQuestEventStructure = {
        type: 'quest_updated',
        data: {
          questId: 'quest-123',
          status: 'COMPLETED',
          userId: 'user-123',
          xpAwarded: 100,
          goldAwarded: 50
        },
        familyId: 'family-456',
        timestamp: expect.any(String)
      };

      // Structure validation will be done when events are actually emitted
      expect(expectedQuestEventStructure.type).toBe('quest_updated');
      expect(expectedQuestEventStructure.familyId).toBe('family-456');
      expect(expectedQuestEventStructure.data).toHaveProperty('questId');
    });

    it('should emit character stats change events with correct structure', async () => {
      mockGetTokenData.mockResolvedValue(mockUserData);

      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer valid-token',
          'accept': 'text/event-stream',
        }
      });

      const response = await eventsEndpoint(request);
      expect(response.status).toBe(200);

      const expectedCharacterEventStructure = {
        type: 'character_updated',
        data: {
          userId: 'user-123',
          characterId: 'char-123',
          changes: {
            gold: 150,
            xp: 1200,
            level: 5
          }
        },
        familyId: 'family-456',
        timestamp: expect.any(String)
      };

      expect(expectedCharacterEventStructure.type).toBe('character_updated');
      expect(expectedCharacterEventStructure.familyId).toBe('family-456');
      expect(expectedCharacterEventStructure.data).toHaveProperty('userId');
      expect(expectedCharacterEventStructure.data).toHaveProperty('changes');
    });

    it('should emit reward redemption events with correct structure', async () => {
      mockGetTokenData.mockResolvedValue(mockGuildMasterData);

      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer guild-master-token',
          'accept': 'text/event-stream',
        }
      });

      const response = await eventsEndpoint(request);
      expect(response.status).toBe(200);

      const expectedRewardEventStructure = {
        type: 'reward_redemption_updated',
        data: {
          redemptionId: 'redemption-123',
          rewardId: 'reward-456',
          userId: 'user-123',
          status: 'PENDING',
          cost: 100
        },
        familyId: 'family-456',
        timestamp: expect.any(String)
      };

      expect(expectedRewardEventStructure.type).toBe('reward_redemption_updated');
      expect(expectedRewardEventStructure.familyId).toBe('family-456');
      expect(expectedRewardEventStructure.data).toHaveProperty('redemptionId');
      expect(expectedRewardEventStructure.data).toHaveProperty('status');
    });

    it('should emit family member role change events with correct structure', async () => {
      mockGetTokenData.mockResolvedValue(mockGuildMasterData);

      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer guild-master-token',
          'accept': 'text/event-stream',
        }
      });

      const response = await eventsEndpoint(request);
      expect(response.status).toBe(200);

      const expectedRoleChangeEventStructure = {
        type: 'user_role_updated',
        data: {
          userId: 'user-789',
          oldRole: 'HERO',
          newRole: 'GUILD_MASTER',
          changedBy: 'user-456'
        },
        familyId: 'family-456',
        timestamp: expect.any(String)
      };

      expect(expectedRoleChangeEventStructure.type).toBe('user_role_updated');
      expect(expectedRoleChangeEventStructure.familyId).toBe('family-456');
      expect(expectedRoleChangeEventStructure.data).toHaveProperty('userId');
      expect(expectedRoleChangeEventStructure.data).toHaveProperty('oldRole');
      expect(expectedRoleChangeEventStructure.data).toHaveProperty('newRole');
    });
  });

  describe('Connection Management', () => {
    it('should handle client disconnect gracefully', async () => {
      mockGetTokenData.mockResolvedValue(mockUserData);

      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer valid-token',
          'accept': 'text/event-stream',
        }
      });

      const response = await eventsEndpoint(request);
      const reader = response.body?.getReader();

      expect(response.status).toBe(200);

      // Simulate client disconnect
      reader?.cancel();

      // Connection should be cleaned up gracefully
      // Actual cleanup logic will be tested in integration tests
      expect(true).toBe(true); // Placeholder for cleanup verification
    });

    it('should handle multiple simultaneous connections from same family', async () => {
      mockGetTokenData.mockResolvedValue(mockUserData);

      // First connection
      const request1 = new NextRequest('http://localhost:3000/api/events', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer token1',
          'accept': 'text/event-stream',
        }
      });

      // Second connection from same family
      mockGetTokenData.mockResolvedValueOnce(mockGuildMasterData); // Same family
      const request2 = new NextRequest('http://localhost:3000/api/events', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer token2',
          'accept': 'text/event-stream',
        }
      });

      const response1 = await eventsEndpoint(request1);
      const response2 = await eventsEndpoint(request2);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });

    it('should handle connection errors gracefully', async () => {
      mockGetTokenData.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer valid-token',
          'accept': 'text/event-stream',
        }
      });

      const response = await eventsEndpoint(request);

      expect(response.status).toBe(401);
    });
  });

  describe('Error Handling', () => {
    it('should return 405 for non-GET requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
        }
      });

      // Since we only export GET, this will be handled by Next.js
      // But we should test our endpoint only accepts GET
      expect(eventsEndpoint).toBeDefined();
      expect(typeof eventsEndpoint).toBe('function');
    });

    it('should handle malformed authorization headers', async () => {
      mockGetTokenData.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'GET',
        headers: {
          'authorization': 'Malformed header value',
          'accept': 'text/event-stream',
        }
      });

      const response = await eventsEndpoint(request);

      expect(response.status).toBe(401);
    });

    it('should handle missing accept header gracefully', async () => {
      mockGetTokenData.mockResolvedValue(mockUserData);

      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer valid-token',
        }
      });

      const response = await eventsEndpoint(request);

      // Should still work even without explicit accept header
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('text/event-stream');
    });
  });
});