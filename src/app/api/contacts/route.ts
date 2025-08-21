// API endpoint for managing extracted contacts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Only create client if both values exist (prevents build errors)
let supabase: any = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// Save extracted contact
export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is initialized
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const body = await request.json();
    const {
      userId,
      linkedinUrl,
      name,
      emails,
      phones,
      jobTitle,
      company,
      location,
      education,
      creditsUsed,
      rawData
    } = body;

    if (!userId || !linkedinUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('extracted_contacts')
      .insert({
        user_id: userId,
        linkedin_url: linkedinUrl,
        name,
        emails,
        phones,
        job_title: jobTitle,
        company,
        location,
        education,
        credits_used: creditsUsed || 1,
        raw_data: rawData
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving contact:', error);
      return NextResponse.json({ error: 'Failed to save contact' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get user's extracted contacts
export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is initialized
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const { data, error, count } = await supabase
      .from('extracted_contacts')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('extracted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching contacts:', error);
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data,
      count,
      hasMore: count ? offset + limit < count : false
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 

// Delete all user's extracted contacts (used after CSV download)
export async function DELETE(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const { error } = await supabase
      .from('extracted_contacts')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting contacts:', error);
      return NextResponse.json({ error: 'Failed to delete contacts' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}