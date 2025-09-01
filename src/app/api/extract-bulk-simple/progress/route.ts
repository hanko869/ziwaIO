import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for extraction progress
const extractionProgress = new Map<string, {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  lastUpdate: number;
}>();

// Clean up old progress data (older than 1 hour)
function cleanupOldProgress() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [id, progress] of extractionProgress.entries()) {
    if (progress.lastUpdate < oneHourAgo) {
      extractionProgress.delete(id);
    }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const progressId = searchParams.get('id');
  
  if (!progressId) {
    return NextResponse.json({ error: 'Progress ID required' }, { status: 400 });
  }
  
  cleanupOldProgress();
  
  const progress = extractionProgress.get(progressId);
  if (!progress) {
    return NextResponse.json({ 
      id: progressId,
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      status: 'not_found'
    });
  }
  
  return NextResponse.json({
    id: progressId,
    ...progress,
    status: progress.processed >= progress.total ? 'completed' : 'in_progress'
  });
}

export async function POST(request: NextRequest) {
  const { id, total, processed, successful, failed } = await request.json();
  
  if (!id) {
    return NextResponse.json({ error: 'Progress ID required' }, { status: 400 });
  }
  
  extractionProgress.set(id, {
    total: total || 0,
    processed: processed || 0,
    successful: successful || 0,
    failed: failed || 0,
    lastUpdate: Date.now()
  });
  
  cleanupOldProgress();
  
  return NextResponse.json({ success: true });
}
