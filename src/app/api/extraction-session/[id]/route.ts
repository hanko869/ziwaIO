import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Initialize Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get session data
    const { data: session, error } = await supabase
      .from('extraction_sessions')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      id: session.id,
      status: session.status,
      total_urls: session.total_urls,
      processed_urls: session.processed_urls || 0,
      successful_extractions: session.successful_extractions || 0,
      failed_extractions: session.failed_extractions || 0,
      error_message: session.error_message
    });
    
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}
