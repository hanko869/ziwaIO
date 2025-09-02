import { NextRequest, NextResponse } from 'next/server';
import { progressStore } from '@/utils/progressStore';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const progressId = searchParams.get('id');
  
  if (!progressId) {
    return NextResponse.json({ error: 'Progress ID required' }, { status: 400 });
  }
  
  // Don't cleanup during active extraction
  // cleanupOldProgress();
  
  const progress = progressStore.get(progressId);
  if (!progress) {
    // Don't return 0s immediately - this might be a new serverless instance
    // Return a "pending" state instead
    return NextResponse.json({ 
      id: progressId,
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      status: 'pending' // Changed from 'not_found' to 'pending'
    });
  }
  
  return NextResponse.json({
    id: progressId,
    ...progress,
    status: progress.status || (progress.processed >= progress.total ? 'completed' : 'in_progress')
  });
}

export async function POST(request: NextRequest) {
  const { id, total, processed, successful, failed } = await request.json();
  
  if (!id) {
    return NextResponse.json({ error: 'Progress ID required' }, { status: 400 });
  }
  
  progressStore.set(id, {
    total: total || 0,
    processed: processed || 0,
    successful: successful || 0,
    failed: failed || 0,
    lastUpdate: Date.now(),
    status: 'in_progress'
  });
  
  return NextResponse.json({ success: true });
}
