// Health Check API Endpoint
// Used by Docker health checks and load balancers

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Health check endpoint - no authentication required
export async function GET(request: NextRequest) {
  try {
    // Basic application health
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '0.1.0',
    };

    // Test database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      healthData.database = 'connected';
    } catch (error) {
      console.error('Health check - Database connection failed:', error);
      healthData.database = 'disconnected';

      return NextResponse.json(
        {
          ...healthData,
          status: 'unhealthy',
          error: 'Database connection failed',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(healthData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}