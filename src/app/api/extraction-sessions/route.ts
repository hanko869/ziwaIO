import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { userId, type, urls } = await request.json();
    
    if (!userId || !type) {
      return NextResponse.json(
        { error: 'userId and type are required' },
        { status: 400 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Create new extraction session
    const { data, error } = await supabase
      .from('extraction_sessions')
      .insert({
        user_id: userId,
        type,
        total_urls: urls?.length || 1,
        urls: urls || [],
        status: 'in_progress'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating extraction session:', error);
      return NextResponse.json(
        { error: 'Failed to create extraction session' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, session: data });
  } catch (error) {
    console.error('Extraction session creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    const status = searchParams.get('status');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    let query = supabase
      .from('extraction_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (sessionId) {
      query = query.eq('id', sessionId);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching extraction sessions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch extraction sessions' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, sessions: data });
  } catch (error) {
    console.error('Extraction session fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
