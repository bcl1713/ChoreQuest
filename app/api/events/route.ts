import { NextRequest } from 'next/server';
import { getTokenData } from '@/lib/auth';

// Store active SSE connections
interface SSEConnection {
  familyId: string;
  userId: string;
  controller: ReadableStreamDefaultController<Uint8Array>;
  encoder: TextEncoder;
}

// Global connection store (in production, this would be Redis or similar)
const connections = new Map<string, SSEConnection>();

// Cleanup inactive connections periodically (only in production)
let cleanupInterval: NodeJS.Timeout | null = null;

if (process.env.NODE_ENV !== 'test') {
  cleanupInterval = setInterval(() => {
    for (const [, connection] of connections.entries()) {
      // Remove connections that haven't been active (this is a simple cleanup)
      // In a real implementation, you'd track last activity per connection
      if (Math.random() < 0.001) { // Very small chance to cleanup randomly
        try {
          connection.controller.close();
        } catch {
          // Connection already closed
        }
        connections.delete(connectionId);
      }
    }
  }, 30000); // Run every 30 seconds
}

// For testing: allow clearing the interval
export function clearCleanupInterval() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

// For testing: clear all connections and timers
export function clearConnections() {
  for (const [, connection] of connections.entries()) {
    try {
      connection.controller.close();
    } catch {
      // Connection already closed
    }
  }
  connections.clear();
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    let tokenData;
    try {
      tokenData = await getTokenData(request);
    } catch {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!tokenData) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { userId, familyId } = tokenData;

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Generate unique connection ID
        const connectionId = `${familyId}-${userId}-${Date.now()}-${Math.random()}`;

        // Store connection for event broadcasting
        connections.set(connectionId, {
          familyId,
          userId,
          controller,
          encoder
        });

        // Send initial connection event
        const connectionEvent = {
          type: 'connected',
          familyId,
          timestamp: new Date().toISOString()
        };

        const eventData = `event: connected\ndata: ${JSON.stringify(connectionEvent)}\n\n`;
        controller.enqueue(encoder.encode(eventData));

        // Keep connection alive with periodic heartbeat
        const heartbeat = setInterval(() => {
          try {
            const heartbeatData = `: heartbeat ${Date.now()}\n\n`;
            controller.enqueue(encoder.encode(heartbeatData));
          } catch {
            clearInterval(heartbeat);
            connections.delete(connectionId);
          }
        }, 25000); // Every 25 seconds

        // Cleanup on connection close
        request.signal?.addEventListener('abort', () => {
          clearInterval(heartbeat);
          connections.delete(connectionId);
          try {
            controller.close();
          } catch {
            // Connection already closed
          }
        });
      },
      cancel() {
        // Additional cleanup when stream is cancelled
      }
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });

  } catch (error) {
    console.error('SSE endpoint error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Function to broadcast events to family members (will be called by database change emitter)
export function broadcastToFamily(familyId: string, event: { type: string; data: unknown; familyId: string; timestamp: string }) {
  const eventData = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;

  for (const [connectionId, connection] of connections.entries()) {
    if (connection.familyId === familyId) {
      try {
        connection.controller.enqueue(connection.encoder.encode(eventData));
      } catch {
        // Connection is closed, remove it
        connections.delete(connectionId);
      }
    }
  }
}

// Export connections for testing purposes
export { connections };