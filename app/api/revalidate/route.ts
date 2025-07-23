import { NextRequest, NextResponse } from 'next/server';
import { invalidateByDataType, invalidateAllStewData } from '@/lib/cache';

export async function POST(request: NextRequest) {
  try {
    // Check for authorization (you might want to add a secret token)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.REVALIDATE_TOKEN; // Set this in your environment
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body;

    if (type && ['ratings', 'stats', 'ingredients', 'sentiment', 'videos', 'all'].includes(type)) {
      await invalidateByDataType(type);
      return NextResponse.json({ 
        success: true, 
        message: `Cache invalidated for: ${type}`,
        timestamp: new Date().toISOString()
      });
    } else {
      // If no specific type provided, invalidate all
      await invalidateAllStewData();
      return NextResponse.json({ 
        success: true, 
        message: 'All cache invalidated',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Cache revalidation error:', error);
    return NextResponse.json({ 
      error: 'Failed to revalidate cache' 
    }, { status: 500 });
  }
}

// Example usage:
// POST /api/revalidate
// { "type": "all" }
// 
// Or for specific data:
// { "type": "ratings" }
// { "type": "ingredients" }
// etc. 