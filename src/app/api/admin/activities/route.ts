import { NextRequest, NextResponse } from 'next/server';
import { getRecentActivities } from '@/utils/userDb';

export async function GET(request: NextRequest) {
  try {
    // Get recent activities
    const activities = await getRecentActivities(100);
    
    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 