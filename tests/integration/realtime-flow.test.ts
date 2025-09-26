/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { GET as eventsEndpoint } from '../../app/api/events/route';
import { DatabaseChangeEmitter } from '../../lib/realtime-events';
import * as auth from '@/lib/auth';

// Mock the auth module
jest.mock('@/lib/auth');
const mockGetTokenData = auth.getTokenData as jest.MockedFunction<typeof auth.getTokenData>;

// Mock PrismaClient
jest.mock('@/lib/generated/prisma', () => {
  const mockPrisma = {
    questInstance: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    character: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    rewardRedemption: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;

// Mock console.error to keep test output clean
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Real-Time Integration Flow', () => {
  let emitter: DatabaseChangeEmitter;

  const mockUserData = {
    userId: 'user-123',
    familyId: 'family-456',
    role: 'HERO'
  };

  const mockQuestData = {
    id: 'quest-123',
    status: 'COMPLETED',
    assignedTo: 'user-123',
    xpAwarded: 100,
    goldAwarded: 50,
    user: {
      familyId: 'family-456'
    },
    template: {
      name: 'Clean Kitchen',
      baseXP: 100
    }
  };

  const mockCharacterData = {
    id: 'char-123',
    userId: 'user-123',
    gold: 250,
    xp: 1200,
    level: 5,
    user: {
      familyId: 'family-456'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTokenData.mockResolvedValue(mockUserData);
    (mockPrisma.questInstance.findUnique as jest.Mock).mockResolvedValue(mockQuestData);
    (mockPrisma.character.findUnique as jest.Mock).mockResolvedValue(mockCharacterData);

    emitter = new DatabaseChangeEmitter();
  });

  afterEach(() => {
    emitter.removeAllListeners();
  });

  describe('Database Change → SSE Event → Client Update Flow', () => {
    it('should complete full flow for quest status change', async (done) => {
      // Setup SSE connection
      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer valid-token',
          'accept': 'text/event-stream',
        }
      });

      const response = await eventsEndpoint(request);
      expect(response.status).toBe(200);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let eventCount = 0;
      let connectionEstablished = false;

      // Read SSE events
      const readEvents = async () => {
        try {
          while (true) {
            const { value, done: streamDone } = await reader!.read();
            if (streamDone) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

            for (const line of lines) {
              const eventData = JSON.parse(line.substring(6));

              if (eventData.type === 'connected') {
                connectionEstablished = true;

                // Simulate database change after connection established
                setTimeout(async () => {
                  await emitter.handleQuestStatusChange('quest-123', 'STARTED', 'COMPLETED');
                }, 50);
              } else if (eventData.type === 'quest_updated') {
                expect(eventData).toEqual({
                  type: 'quest_updated',
                  data: {
                    questId: 'quest-123',
                    status: 'COMPLETED',
                    userId: 'user-123',
                    questName: 'Clean Kitchen',
                    xpAwarded: 100,
                    goldAwarded: 50
                  },
                  familyId: 'family-456',
                  timestamp: expect.any(String)
                });

                eventCount++;

                if (eventCount === 1) {
                  reader!.cancel();
                  done();
                }
              }
            }
          }
        } catch (error) {
          // Expected when reader is cancelled
        }
      };

      readEvents();
    });

    it('should complete full flow for character stats change', async (done) => {
      // Setup SSE connection
      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer valid-token',
          'accept': 'text/event-stream',
        }
      });

      const response = await eventsEndpoint(request);
      expect(response.status).toBe(200);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let eventCount = 0;

      // Read SSE events
      const readEvents = async () => {
        try {
          while (true) {
            const { value, done: streamDone } = await reader!.read();
            if (streamDone) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

            for (const line of lines) {
              const eventData = JSON.parse(line.substring(6));

              if (eventData.type === 'connected') {
                // Simulate character stats change after connection established
                setTimeout(async () => {
                  const changes = {
                    gold: { old: 200, new: 250 },
                    xp: { old: 1000, new: 1200 },
                    level: { old: 4, new: 5 }
                  };
                  await emitter.handleCharacterStatsChange('char-123', changes);
                }, 50);
              } else if (eventData.type === 'character_updated') {
                expect(eventData).toEqual({
                  type: 'character_updated',
                  data: {
                    userId: 'user-123',
                    characterId: 'char-123',
                    changes: {
                      gold: 250,
                      xp: 1200,
                      level: 5
                    }
                  },
                  familyId: 'family-456',
                  timestamp: expect.any(String)
                });

                eventCount++;

                if (eventCount === 1) {
                  reader!.cancel();
                  done();
                }
              }
            }
          }
        } catch (error) {
          // Expected when reader is cancelled
        }
      };

      readEvents();
    });

    it('should handle multiple database changes with proper event sequencing', async (done) => {
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

      const receivedEvents: any[] = [];
      let connectionEstablished = false;

      const readEvents = async () => {
        try {
          while (true) {
            const { value, done: streamDone } = await reader!.read();
            if (streamDone) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

            for (const line of lines) {
              const eventData = JSON.parse(line.substring(6));

              if (eventData.type === 'connected' && !connectionEstablished) {
                connectionEstablished = true;

                // Simulate multiple database changes
                setTimeout(async () => {
                  await emitter.handleQuestStatusChange('quest-123', 'STARTED', 'COMPLETED');
                  await emitter.handleCharacterStatsChange('char-123', { gold: { old: 200, new: 250 } });
                }, 50);
              } else if (eventData.type !== 'connected') {
                receivedEvents.push(eventData);

                if (receivedEvents.length === 2) {
                  // Verify both events were received
                  expect(receivedEvents).toHaveLength(2);
                  expect(receivedEvents.map(e => e.type)).toContain('quest_updated');
                  expect(receivedEvents.map(e => e.type)).toContain('character_updated');

                  reader!.cancel();
                  done();
                }
              }
            }
          }
        } catch (error) {
          // Expected when reader is cancelled
        }
      };

      readEvents();
    });
  });

  describe('Multi-Client Event Delivery', () => {
    it('should deliver events to multiple clients in same family', async (done) => {
      // Setup two SSE connections for same family
      const request1 = new NextRequest('http://localhost:3000/api/events', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer token1',
          'accept': 'text/event-stream',
        }
      });

      const request2 = new NextRequest('http://localhost:3000/api/events', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer token2',
          'accept': 'text/event-stream',
        }
      });

      // Mock both tokens for same family
      mockGetTokenData
        .mockResolvedValueOnce(mockUserData)
        .mockResolvedValueOnce({ ...mockUserData, userId: 'user-456' }); // Different user, same family

      const response1 = await eventsEndpoint(request1);
      const response2 = await eventsEndpoint(request2);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      const reader1 = response1.body?.getReader();
      const reader2 = response2.body?.getReader();
      const decoder = new TextDecoder();

      let client1Events = 0;
      let client2Events = 0;
      let connectionsEstablished = 0;

      const readClient1 = async () => {
        try {
          while (true) {
            const { value, done: streamDone } = await reader1!.read();
            if (streamDone) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

            for (const line of lines) {
              const eventData = JSON.parse(line.substring(6));

              if (eventData.type === 'connected') {
                connectionsEstablished++;
                if (connectionsEstablished === 2) {
                  // Both clients connected, trigger event
                  setTimeout(async () => {
                    await emitter.handleQuestStatusChange('quest-123', 'STARTED', 'COMPLETED');
                  }, 50);
                }
              } else if (eventData.type === 'quest_updated') {
                client1Events++;

                if (client1Events === 1 && client2Events === 1) {
                  reader1!.cancel();
                  reader2!.cancel();
                  done();
                }
              }
            }
          }
        } catch (error) {
          // Expected when reader is cancelled
        }
      };

      const readClient2 = async () => {
        try {
          while (true) {
            const { value, done: streamDone } = await reader2!.read();
            if (streamDone) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

            for (const line of lines) {
              const eventData = JSON.parse(line.substring(6));

              if (eventData.type === 'quest_updated') {
                client2Events++;

                if (client1Events === 1 && client2Events === 1) {
                  reader1!.cancel();
                  reader2!.cancel();
                  done();
                }
              }
            }
          }
        } catch (error) {
          // Expected when reader is cancelled
        }
      };

      readClient1();
      readClient2();
    });
  });

  describe('Family Data Isolation', () => {
    it('should not deliver events to clients from different families', async (done) => {
      const family1Data = { ...mockUserData, familyId: 'family-456' };
      const family2Data = { ...mockUserData, userId: 'user-789', familyId: 'family-999' };

      // Setup connections for different families
      const request1 = new NextRequest('http://localhost:3000/api/events', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer family1-token',
          'accept': 'text/event-stream',
        }
      });

      const request2 = new NextRequest('http://localhost:3000/api/events', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer family2-token',
          'accept': 'text/event-stream',
        }
      });

      mockGetTokenData
        .mockResolvedValueOnce(family1Data)
        .mockResolvedValueOnce(family2Data);

      const response1 = await eventsEndpoint(request1);
      const response2 = await eventsEndpoint(request2);

      const reader1 = response1.body?.getReader();
      const reader2 = response2.body?.getReader();
      const decoder = new TextDecoder();

      let family1Connected = false;
      let family2Connected = false;
      let family2ReceivedEvent = false;

      const readFamily1 = async () => {
        try {
          while (true) {
            const { value, done: streamDone } = await reader1!.read();
            if (streamDone) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

            for (const line of lines) {
              const eventData = JSON.parse(line.substring(6));

              if (eventData.type === 'connected') {
                family1Connected = true;
                if (family1Connected && family2Connected) {
                  // Both connected, emit event for family-456 only
                  setTimeout(async () => {
                    await emitter.handleQuestStatusChange('quest-123', 'STARTED', 'COMPLETED');

                    // Give time for event to propagate, then check family2 didn't receive it
                    setTimeout(() => {
                      expect(family2ReceivedEvent).toBe(false);
                      reader1!.cancel();
                      reader2!.cancel();
                      done();
                    }, 100);
                  }, 50);
                }
              } else if (eventData.type === 'quest_updated') {
                expect(eventData.familyId).toBe('family-456');
              }
            }
          }
        } catch (error) {
          // Expected when reader is cancelled
        }
      };

      const readFamily2 = async () => {
        try {
          while (true) {
            const { value, done: streamDone } = await reader2!.read();
            if (streamDone) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

            for (const line of lines) {
              const eventData = JSON.parse(line.substring(6));

              if (eventData.type === 'connected') {
                family2Connected = true;
              } else if (eventData.type === 'quest_updated') {
                // This should NOT happen for family-456 events
                family2ReceivedEvent = true;
              }
            }
          }
        } catch (error) {
          // Expected when reader is cancelled
        }
      };

      readFamily1();
      readFamily2();
    });
  });

  describe('Connection Resilience', () => {
    it('should handle client disconnection gracefully', async (done) => {
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

      let connectionEstablished = false;

      const readEvents = async () => {
        try {
          while (true) {
            const { value, done: streamDone } = await reader!.read();
            if (streamDone) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

            for (const line of lines) {
              const eventData = JSON.parse(line.substring(6));

              if (eventData.type === 'connected' && !connectionEstablished) {
                connectionEstablished = true;

                // Simulate client disconnect after short time
                setTimeout(() => {
                  reader!.cancel();

                  // Verify system handles disconnection gracefully
                  // and continues to work for new connections
                  setTimeout(async () => {
                    // Try to emit an event - should not cause errors
                    await emitter.handleQuestStatusChange('quest-456', 'STARTED', 'COMPLETED');
                    done();
                  }, 100);
                }, 50);
              }
            }
          }
        } catch (error) {
          // Expected when reader is cancelled
        }
      };

      readEvents();
    });

    it('should handle database errors during event emission gracefully', async (done) => {
      // Mock database error
      (mockPrisma.questInstance.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

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

      let connectionEstablished = false;

      const readEvents = async () => {
        try {
          while (true) {
            const { value, done: streamDone } = await reader!.read();
            if (streamDone) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

            for (const line of lines) {
              const eventData = JSON.parse(line.substring(6));

              if (eventData.type === 'connected' && !connectionEstablished) {
                connectionEstablished = true;

                // Trigger database error during event emission
                setTimeout(async () => {
                  await emitter.handleQuestStatusChange('quest-123', 'STARTED', 'COMPLETED');

                  // Wait a bit to ensure no error events are emitted
                  setTimeout(() => {
                    reader!.cancel();
                    done();
                  }, 100);
                }, 50);
              } else if (eventData.type === 'quest_updated') {
                // Should not receive this due to database error
                fail('Should not receive event when database error occurs');
              }
            }
          }
        } catch (error) {
          // Expected when reader is cancelled
        }
      };

      readEvents();
    });
  });
});