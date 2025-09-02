import { NextRequest, NextResponse } from 'next/server';
import { progressStore } from '@/utils/progressStore';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const progressId = searchParams.get('id');
  
  if (!progressId) {
    return NextResponse.json({ error: 'Progress ID required' }, { status: 400 });
  }
  
  const progress = progressStore.get(progressId);
  
  if (!progress) {
    // Log when progress not found (only once per ID to avoid spam)
    if (!progressId.includes('logged')) {
      console.log(`Progress GET: No progress found for ID: ${progressId}`);
    }
    // Return pending state if progress not found
    return NextResponse.json({ 
      id: progressId,
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      started: 0,
      status: 'pending'
    });
  }
  
  // Log progress retrieval occasionally
  if (progress.processed === 1 || progress.processed % 50 === 0) {
    console.log(`Progress GET: Found ${progress.processed}/${progress.total} for ID: ${progressId}`);
  }
  
  return NextResponse.json({
    id: progressId,
    ...progress,
    status: progress.status || (progress.processed >= progress.total ? 'completed' : 'in_progress')
  });
}

export async function POST(request: NextRequest) {
  const { id, total, processed, successful, failed, started } = await request.json();
  
  if (!id) {
    return NextResponse.json({ error: 'Progress ID required' }, { status: 400 });
  }
  
  progressStore.set(id, {
    total: total || 0,
    processed: processed || 0,
    successful: successful || 0,
    failed: failed || 0,
    started: started || 0,
    lastUpdate: Date.now(),
    status: 'in_progress'
  });
  
  return NextResponse.json({ success: true });
}
