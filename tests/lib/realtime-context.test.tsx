/**
 * @jest-environment jsdom
 */
import React, { ReactNode, useEffect } from 'react';
import { render, screen, waitFor, act } from '@/tests/utils/test-helpers';
import {
  RealTimeProvider,
  useRealTime,
  RealTimeEvent,
  RealTimeContextValue,
  ConnectionStatus
} from '../../lib/realtime-context';

// Mock fetch globally
global.fetch = jest.fn();

// Mock EventSource with Jest mock functionality
class MockEventSource {
  url: string;
  readyState: number = 0; // CONNECTING
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  constructor(url: string) {
    this.url = url;
    // Store this instance for test access
    (MockEventSource as any).mock.instances.push(this);
    setTimeout(() => this.simulateConnection(), 10);
  }

  simulateConnection() {
    this.readyState = MockEventSource.OPEN;
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }

  simulateMessage(data: string, event?: string) {
    if (this.onmessage) {
      const messageEvent = new MessageEvent('message', {
        data,
        ...(event && { lastEventId: event })
      });
      this.onmessage(messageEvent);
    }
  }

  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }

  close() {
    this.readyState = MockEventSource.CLOSED;
    // Add to spy tracking
    if ((this as any)._closeCalled) {
      (this as any)._closeCalled = (this as any)._closeCalled + 1;
    } else {
      (this as any)._closeCalled = 1;
    }
  }

  addEventListener(type: string, listener: EventListener) {
    if (type === 'open') this.onopen = listener as any;
    if (type === 'message') this.onmessage = listener as any;
    if (type === 'error') this.onerror = listener as any;
  }

  removeEventListener() {
    // Mock implementation
  }
}

// Add Jest mock structure
(MockEventSource as any).mock = {
  instances: [],
  calls: []
};

global.EventSource = MockEventSource as any;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock console.error to keep test output clean
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  // Clear EventSource mock instances
  (MockEventSource as any).mock.instances = [];
});

// Test component to consume real-time context
function TestConsumer({ onContextValue }: { onContextValue?: (value: RealTimeContextValue) => void }) {
  const context = useRealTime();

  useEffect(() => {
    if (onContextValue) {
      onContextValue(context);
    }
  }, [context, onContextValue]);

  return (
    <div data-testid="test-consumer">
      <div data-testid="connection-status">{context.connectionStatus}</div>
      <div data-testid="event-count">{context.events.length}</div>
      <div data-testid="is-connected">{context.isConnected.toString()}</div>
    </div>
  );
}

// Test component wrapper with provider
function TestWrapper({
  children,
  token = 'test-token-123'
}: {
  children: ReactNode;
  token?: string
}) {
  return (
    <RealTimeProvider token={token}>
      {children}
    </RealTimeProvider>
  );
}

describe('Real-Time Context', () => {
  beforeEach(() => {
    // Mock localStorage to return valid auth data
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ token: 'test-token-123' }));
  });

  describe('Provider Initialization', () => {
    it('should provide initial context values', async () => {
      let contextValue: RealTimeContextValue;

      render(
        <TestWrapper>
          <TestConsumer onContextValue={(value) => contextValue = value} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(contextValue!).toBeDefined();
        expect(contextValue!.connectionStatus).toBe('connecting');
        expect(contextValue!.isConnected).toBe(false);
        expect(contextValue!.events).toEqual([]);
        expect(typeof contextValue!.connect).toBe('function');
        expect(typeof contextValue!.disconnect).toBe('function');
        expect(typeof contextValue!.clearEvents).toBe('function');
      });
    });

    it('should establish SSE connection on mount with valid token', async () => {
      render(
        <TestWrapper>
          <TestConsumer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
        expect(screen.getByTestId('is-connected')).toHaveTextContent('true');
      });
    });

    it('should not connect without valid token', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      render(
        <TestWrapper token="">
          <TestConsumer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
        expect(screen.getByTestId('is-connected')).toHaveTextContent('false');
      });
    });
  });

  describe('SSE Connection Management', () => {
    it('should handle successful connection', async () => {
      render(
        <TestWrapper>
          <TestConsumer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });
    });

    it('should handle connection errors', async () => {
      render(
        <TestWrapper>
          <TestConsumer />
        </TestWrapper>
      );

      // Wait for initial connection
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      // Simulate error
      const eventSource = (global.EventSource as any).mock.instances[0];
      act(() => {
        eventSource.simulateError();
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('error');
      });
    });

    it('should handle manual disconnect', async () => {
      let contextValue: RealTimeContextValue;

      render(
        <TestWrapper>
          <TestConsumer onContextValue={(value) => contextValue = value} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      act(() => {
        contextValue!.disconnect();
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
        expect(screen.getByTestId('is-connected')).toHaveTextContent('false');
      });
    });

    it('should handle manual reconnect', async () => {
      let contextValue: RealTimeContextValue;

      render(
        <TestWrapper>
          <TestConsumer onContextValue={(value) => contextValue = value} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      // Disconnect first
      act(() => {
        contextValue!.disconnect();
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
      });

      // Reconnect
      act(() => {
        contextValue!.connect();
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });
    });
  });

  describe('Event Handling', () => {
    it('should receive and store quest update events', async () => {
      render(
        <TestWrapper>
          <TestConsumer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      const questEvent: RealTimeEvent = {
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
        timestamp: new Date().toISOString()
      };

      const eventSource = (global.EventSource as any).mock.instances[0];
      act(() => {
        eventSource.simulateMessage(JSON.stringify(questEvent), 'quest_updated');
      });

      await waitFor(() => {
        expect(screen.getByTestId('event-count')).toHaveTextContent('1');
      });
    });

    it('should receive and store character update events', async () => {
      render(
        <TestWrapper>
          <TestConsumer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      const characterEvent: RealTimeEvent = {
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
        timestamp: new Date().toISOString()
      };

      const eventSource = (global.EventSource as any).mock.instances[0];
      act(() => {
        eventSource.simulateMessage(JSON.stringify(characterEvent), 'character_updated');
      });

      await waitFor(() => {
        expect(screen.getByTestId('event-count')).toHaveTextContent('1');
      });
    });

    it('should receive and store reward redemption events', async () => {
      render(
        <TestWrapper>
          <TestConsumer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      const rewardEvent: RealTimeEvent = {
        type: 'reward_redemption_updated',
        data: {
          redemptionId: 'redemption-123',
          rewardId: 'reward-456',
          userId: 'user-123',
          status: 'APPROVED',
          cost: 100,
          rewardName: 'Extra Screen Time'
        },
        familyId: 'family-456',
        timestamp: new Date().toISOString()
      };

      const eventSource = (global.EventSource as any).mock.instances[0];
      act(() => {
        eventSource.simulateMessage(JSON.stringify(rewardEvent), 'reward_redemption_updated');
      });

      await waitFor(() => {
        expect(screen.getByTestId('event-count')).toHaveTextContent('1');
      });
    });

    it('should receive and store user role change events', async () => {
      render(
        <TestWrapper>
          <TestConsumer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      const roleEvent: RealTimeEvent = {
        type: 'user_role_updated',
        data: {
          userId: 'user-789',
          userName: 'John Doe',
          oldRole: 'HERO',
          newRole: 'GUILD_MASTER',
          changedBy: 'user-456'
        },
        familyId: 'family-456',
        timestamp: new Date().toISOString()
      };

      const eventSource = (global.EventSource as any).mock.instances[0];
      act(() => {
        eventSource.simulateMessage(JSON.stringify(roleEvent), 'user_role_updated');
      });

      await waitFor(() => {
        expect(screen.getByTestId('event-count')).toHaveTextContent('1');
      });
    });

    it('should handle multiple events in sequence', async () => {
      render(
        <TestWrapper>
          <TestConsumer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      const events = [
        {
          type: 'quest_updated',
          data: { questId: 'quest-1', status: 'STARTED' },
          familyId: 'family-456',
          timestamp: new Date().toISOString()
        },
        {
          type: 'character_updated',
          data: { userId: 'user-123', characterId: 'char-123', changes: { gold: 100 } },
          familyId: 'family-456',
          timestamp: new Date().toISOString()
        }
      ];

      const eventSource = (global.EventSource as any).mock.instances[0];

      events.forEach((event, index) => {
        act(() => {
          eventSource.simulateMessage(JSON.stringify(event), event.type);
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('event-count')).toHaveTextContent('2');
      });
    });
  });

  describe('Event Filtering and Validation', () => {
    it('should ignore malformed event data', async () => {
      render(
        <TestWrapper>
          <TestConsumer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      const eventSource = (global.EventSource as any).mock.instances[0];
      act(() => {
        // Send malformed JSON
        eventSource.simulateMessage('invalid-json');
      });

      await waitFor(() => {
        expect(screen.getByTestId('event-count')).toHaveTextContent('0');
      });
    });

    it('should ignore events with missing required fields', async () => {
      render(
        <TestWrapper>
          <TestConsumer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      const invalidEvent = {
        // Missing type and familyId
        data: { questId: 'quest-123' },
        timestamp: new Date().toISOString()
      };

      const eventSource = (global.EventSource as any).mock.instances[0];
      act(() => {
        eventSource.simulateMessage(JSON.stringify(invalidEvent));
      });

      await waitFor(() => {
        expect(screen.getByTestId('event-count')).toHaveTextContent('0');
      });
    });

    it('should handle SSE connection events', async () => {
      render(
        <TestWrapper>
          <TestConsumer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      const connectionEvent = {
        type: 'connected',
        familyId: 'family-456',
        timestamp: new Date().toISOString()
      };

      const eventSource = (global.EventSource as any).mock.instances[0];
      act(() => {
        eventSource.simulateMessage(JSON.stringify(connectionEvent), 'connected');
      });

      // Connection events shouldn't be stored in events array
      await waitFor(() => {
        expect(screen.getByTestId('event-count')).toHaveTextContent('0');
      });
    });
  });

  describe('Event Management', () => {
    it('should clear events when requested', async () => {
      let contextValue: RealTimeContextValue;

      render(
        <TestWrapper>
          <TestConsumer onContextValue={(value) => contextValue = value} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      // Add an event
      const questEvent: RealTimeEvent = {
        type: 'quest_updated',
        data: { questId: 'quest-123', status: 'COMPLETED', userId: 'user-123' },
        familyId: 'family-456',
        timestamp: new Date().toISOString()
      };

      const eventSource = (global.EventSource as any).mock.instances[0];
      act(() => {
        eventSource.simulateMessage(JSON.stringify(questEvent), 'quest_updated');
      });

      await waitFor(() => {
        expect(screen.getByTestId('event-count')).toHaveTextContent('1');
      });

      // Clear events
      act(() => {
        contextValue!.clearEvents();
      });

      await waitFor(() => {
        expect(screen.getByTestId('event-count')).toHaveTextContent('0');
      });
    });

    it('should limit event history to prevent memory issues', async () => {
      render(
        <TestWrapper>
          <TestConsumer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      const eventSource = (global.EventSource as any).mock.instances[0];

      // Send more than maximum events (assuming limit is 100)
      for (let i = 0; i < 150; i++) {
        const event: RealTimeEvent = {
          type: 'quest_updated',
          data: { questId: `quest-${i}`, status: 'COMPLETED', userId: 'user-123' },
          familyId: 'family-456',
          timestamp: new Date().toISOString()
        };

        act(() => {
          eventSource.simulateMessage(JSON.stringify(event), 'quest_updated');
        });
      }

      await waitFor(() => {
        // Should be limited to maximum (typically 100)
        const eventCount = parseInt(screen.getByTestId('event-count').textContent || '0');
        expect(eventCount).toBeLessThanOrEqual(100);
        expect(eventCount).toBeGreaterThan(0);
      });
    });
  });

  describe('Cleanup and Error Handling', () => {
    it('should cleanup connection on unmount', async () => {
      const { unmount } = render(
        <TestWrapper>
          <TestConsumer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      const eventSource = (global.EventSource as any).mock.instances[0];

      unmount();

      // Need to wait for the cleanup to complete since it happens in useEffect cleanup
      await waitFor(() => {
        expect((eventSource as any)._closeCalled).toBeTruthy();
      });
    });

    it('should handle context used outside provider', () => {
      // This should throw an error
      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useRealTime must be used within a RealTimeProvider');
    });

    it('should handle token changes gracefully', async () => {
      const { rerender } = render(
        <TestWrapper token="old-token">
          <TestConsumer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      // Change token
      rerender(
        <TestWrapper token="new-token">
          <TestConsumer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });
    });
  });

  describe('Automatic Reconnection', () => {
    it('should attempt to reconnect after connection loss', async () => {
      jest.useFakeTimers();

      render(
        <TestWrapper>
          <TestConsumer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      // Simulate connection error
      const eventSource = (global.EventSource as any).mock.instances[0];
      act(() => {
        eventSource.simulateError();
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('error');
      });

      // Fast-forward past reconnection delay and connection time
      act(() => {
        jest.advanceTimersByTime(5100); // 5000ms for reconnection + 100ms for connection
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      jest.useRealTimers();
    });
  });
});