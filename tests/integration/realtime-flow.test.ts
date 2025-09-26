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
    assignedToId: 'user-123',
    assignedTo: {
      id: 'user-123',
      familyId: 'family-456'
    },
    familyId: 'family-456',
    xpReward: 100,
    goldReward: 50,
    title: 'Clean Kitchen',
    template: {
      title: 'Clean Kitchen',
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
    // Don't use fake timers for integration tests - they need real async behavior
    mockGetTokenData.mockResolvedValue(mockUserData);
    (mockPrisma.questInstance.findUnique as jest.Mock).mockResolvedValue(mockQuestData);
    (mockPrisma.character.findUnique as jest.Mock).mockResolvedValue(mockCharacterData);

    emitter = new DatabaseChangeEmitter();
  });

  afterEach(async () => {
    emitter.removeAllListeners();

    // Clear SSE connections to prevent memory leaks
    const { clearConnections } = await import('../../app/api/events/route');
    if (clearConnections) {
      clearConnections();
    }

    // Clear any pending timers if any were used
    jest.clearAllTimers();
  });

  describe('Database Change → SSE Event → Client Update Flow', () => {
    it('should complete full flow for quest status change', (done) => {
      // Setup SSE connection with AbortController for cleanup
      const abortController = new AbortController();
      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'GET',
        signal: abortController.signal,
        headers: {
          'authorization': 'Bearer valid-token',
          'accept': 'text/event-stream',
        }
      });

      // Handle async response
      eventsEndpoint(request).then(response => {
        if (response.status !== 200) {
          response.text().then(text => {
            done(new Error(`Expected status 200, got ${response.status}: ${text}`));
          });
          return;
        }
        expect(response.status).toBe(200);

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        let eventCount = 0;
        let cleanup = () => {
          if (reader) {
            reader.cancel();
          }
          abortController.abort();
        };

        // Set timeout to prevent hanging
        const timeout = setTimeout(() => {
          cleanup();
          done(new Error('Test timeout - no events received'));
        }, 4000);

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
                    clearTimeout(timeout);
                    cleanup();
                    done();
                  }
                }
              }
            }
          } catch (error) {
            // Expected when reader is cancelled
            if (error && error.name !== 'AbortError') {
              clearTimeout(timeout);
              done(error);
            }
          }
        };

        readEvents();
      }).catch(error => {
        done(error);
      });
    });

    it('should complete full flow for character stats change', (done) => {
      // Setup SSE connection with AbortController for cleanup
      const abortController = new AbortController();
      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'GET',
        signal: abortController.signal,
        headers: {
          'authorization': 'Bearer valid-token',
          'accept': 'text/event-stream',
        }
      });

      // Handle async response
      eventsEndpoint(request).then(response => {
        if (response.status !== 200) {
          response.text().then(text => {
            done(new Error(`Expected status 200, got ${response.status}: ${text}`));
          });
          return;
        }
        expect(response.status).toBe(200);

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        let eventCount = 0;
        let cleanup = () => {
          if (reader) {
            reader.cancel();
          }
          abortController.abort();
        };

        // Set timeout to prevent hanging
        const timeout = setTimeout(() => {
          cleanup();
          done(new Error('Test timeout - no events received'));
        }, 4000);

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
                    clearTimeout(timeout);
                    cleanup();
                    done();
                  }
                }
              }
            }
          } catch (error) {
            // Expected when reader is cancelled
            if (error && error.name !== 'AbortError') {
              clearTimeout(timeout);
              done(error);
            }
          }
        };

        readEvents();
      }).catch(error => {
        done(error);
      });
    });

    it('should handle multiple database changes with proper event sequencing', (done) => {
      const abortController = new AbortController();
      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'GET',
        signal: abortController.signal,
        headers: {
          'authorization': 'Bearer valid-token',
          'accept': 'text/event-stream',
        }
      });

      eventsEndpoint(request).then(response => {
        if (response.status !== 200) {
          response.text().then(text => {
            done(new Error(`Expected status 200, got ${response.status}: ${text}`));
          });
          return;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        const receivedEvents: unknown[] = [];
        let connectionEstablished = false;

        let cleanup = () => {
          if (reader) {
            reader.cancel();
          }
          abortController.abort();
        };

        // Set timeout to prevent hanging
        const timeout = setTimeout(() => {
          cleanup();
          done(new Error('Test timeout - no events received'));
        }, 4000);

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

                    clearTimeout(timeout);
                    cleanup();
                    done();
                  }
                }
              }
            }
          } catch (error) {
            // Expected when reader is cancelled
            if (error && error.name !== 'AbortError') {
              clearTimeout(timeout);
              done(error);
            }
          }
        };

        readEvents();
      }).catch(error => {
        done(error);
      });
    });
  });

  describe('Multi-Client Event Delivery', () => {
    it('should deliver events to multiple clients in same family', (done) => {
      // Test the broadcast function directly instead of full integration
      // This tests the core functionality without complex SSE setup

      const { broadcastToFamily, connections } = require('../../app/api/events/route');

      // Mock connections for testing
      const mockController1 = {
        enqueue: jest.fn()
      };
      const mockController2 = {
        enqueue: jest.fn()
      };

      const encoder = new TextEncoder();

      // Add two connections for same family
      connections.set('conn-1', {
        familyId: 'family-456',
        userId: 'user-123',
        controller: mockController1,
        encoder
      });

      connections.set('conn-2', {
        familyId: 'family-456',
        userId: 'user-456',
        controller: mockController2,
        encoder
      });

      // Create test event
      const testEvent = {
        type: 'quest_updated',
        data: {
          questId: 'quest-123',
          status: 'COMPLETED',
          userId: 'user-123',
          questName: 'Test Quest',
          xpAwarded: 100,
          goldAwarded: 50
        },
        familyId: 'family-456',
        timestamp: new Date().toISOString()
      };

      // Broadcast event
      broadcastToFamily('family-456', testEvent);

      // Verify both clients received the event
      expect(mockController1.enqueue).toHaveBeenCalledWith(
        encoder.encode(`event: quest_updated\ndata: ${JSON.stringify(testEvent)}\n\n`)
      );
      expect(mockController2.enqueue).toHaveBeenCalledWith(
        encoder.encode(`event: quest_updated\ndata: ${JSON.stringify(testEvent)}\n\n`)
      );

      // Clean up
      connections.clear();
      done();
    });
  });

  describe('Family Data Isolation', () => {
    it('should not deliver events to clients from different families', (done) => {
      // Test the broadcast function directly for family isolation
      const { broadcastToFamily, connections } = require('../../app/api/events/route');

      // Mock connections for testing
      const mockController1 = {
        enqueue: jest.fn()
      };
      const mockController2 = {
        enqueue: jest.fn()
      };

      const encoder = new TextEncoder();

      // Add connections for different families
      connections.set('family1-conn', {
        familyId: 'family-456',
        userId: 'user-123',
        controller: mockController1,
        encoder
      });

      connections.set('family2-conn', {
        familyId: 'family-999',
        userId: 'user-789',
        controller: mockController2,
        encoder
      });

      // Create test event for family-456
      const testEvent = {
        type: 'quest_updated',
        data: {
          questId: 'quest-123',
          status: 'COMPLETED',
          userId: 'user-123',
          questName: 'Test Quest',
          xpAwarded: 100,
          goldAwarded: 50
        },
        familyId: 'family-456',
        timestamp: new Date().toISOString()
      };

      // Broadcast event to family-456 only
      broadcastToFamily('family-456', testEvent);

      // Verify only family-456 client received the event
      expect(mockController1.enqueue).toHaveBeenCalledWith(
        encoder.encode(`event: quest_updated\ndata: ${JSON.stringify(testEvent)}\n\n`)
      );

      // Verify family-999 client did NOT receive the event
      expect(mockController2.enqueue).not.toHaveBeenCalled();

      // Clean up
      connections.clear();
      done();
    });
  });

  describe('Connection Resilience', () => {
    it('should handle client disconnection gracefully', (done) => {
      const abortController = new AbortController();
      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'GET',
        signal: abortController.signal,
        headers: {
          'authorization': 'Bearer valid-token',
          'accept': 'text/event-stream',
        }
      });

      eventsEndpoint(request).then(response => {
        if (response.status !== 200) {
          response.text().then(text => {
            done(new Error(`Expected status 200, got ${response.status}: ${text}`));
          });
          return;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        let connectionEstablished = false;

        let cleanup = () => {
          if (reader) {
            reader.cancel();
          }
          abortController.abort();
        };

        // Set timeout to prevent hanging
        const timeout = setTimeout(() => {
          cleanup();
          done(new Error('Test timeout - no events received'));
        }, 4000);

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
                    cleanup();

                    // Verify system handles disconnection gracefully
                    // and continues to work for new connections
                    setTimeout(async () => {
                      try {
                        // Try to emit an event - should not cause errors
                        await emitter.handleQuestStatusChange('quest-456', 'STARTED', 'COMPLETED');
                        clearTimeout(timeout);
                        done();
                      } catch (error) {
                        clearTimeout(timeout);
                        done(error);
                      }
                    }, 100);
                  }, 50);
                }
              }
            }
          } catch (error) {
            // Expected when reader is cancelled
            if (error && error.name !== 'AbortError') {
              clearTimeout(timeout);
              done(error);
            }
          }
        };

        readEvents();
      }).catch(error => {
        done(error);
      });
    });

    it('should handle database errors during event emission gracefully', (done) => {
      // Mock database error
      (mockPrisma.questInstance.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const abortController = new AbortController();
      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'GET',
        signal: abortController.signal,
        headers: {
          'authorization': 'Bearer valid-token',
          'accept': 'text/event-stream',
        }
      });

      eventsEndpoint(request).then(response => {
        if (response.status !== 200) {
          response.text().then(text => {
            done(new Error(`Expected status 200, got ${response.status}: ${text}`));
          });
          return;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        let connectionEstablished = false;

        let cleanup = () => {
          if (reader) {
            reader.cancel();
          }
          abortController.abort();
        };

        // Set timeout to prevent hanging
        const timeout = setTimeout(() => {
          cleanup();
          done(new Error('Test timeout - no events received'));
        }, 4000);

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
                    try {
                      await emitter.handleQuestStatusChange('quest-123', 'STARTED', 'COMPLETED');
                    } catch (error) {
                      // Database error is expected and should be handled gracefully
                    }

                    // Wait a bit to ensure no error events are emitted
                    setTimeout(() => {
                      clearTimeout(timeout);
                      cleanup();
                      done();
                    }, 100);
                  }, 50);
                } else if (eventData.type === 'quest_updated') {
                  // Should not receive this due to database error
                  clearTimeout(timeout);
                  cleanup();
                  done(new Error('Should not receive event when database error occurs'));
                }
              }
            }
          } catch (error) {
            // Expected when reader is cancelled
            if (error && error.name !== 'AbortError') {
              clearTimeout(timeout);
              done(error);
            }
          }
        };

        readEvents();
      }).catch(error => {
        done(error);
      });
    });
  });
});