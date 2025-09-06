import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No auth token' });
    }

    // Decode token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Check users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', 'test');

    // Check user_credits table
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*');

    return NextResponse.json({
      tokenUserId: decoded.id,
      tokenUsername: decoded.username,
      usersInDb: users,
      creditsInDb: credits,
      errors: {
        users: usersError?.message,
        credits: creditsError?.message
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 