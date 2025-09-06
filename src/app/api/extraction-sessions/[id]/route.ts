import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updates = await request.json();
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Update extraction session
    const { data, error } = await supabase
      .from('extraction_sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating extraction session:', error);
      return NextResponse.json(
        { error: 'Failed to update extraction session' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, session: data });
  } catch (error) {
    console.error('Extraction session update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Update status to cancelled
    const { error } = await supabase
      .from('extraction_sessions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error cancelling extraction session:', error);
      return NextResponse.json(
        { error: 'Failed to cancel extraction session' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Extraction session cancellation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}