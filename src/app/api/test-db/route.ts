import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test environment variables
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Test database connection - get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    // Test specific admin lookup
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'admin')
      .single();
    
    return NextResponse.json({
      environment: {
        hasSupabaseUrl,
        hasSupabaseKey,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      },
      database: {
        connected: !usersError,
        error: usersError?.message || null,
        userCount: users?.length || 0,
        users: users?.map(u => ({ 
          id: u.id, 
          username: u.username, 
          email: u.email,
          role: u.role,
          has_password_hash: !!u.password_hash 
        })) || [],
        adminLookup: {
          found: !!adminUser,
          error: adminError?.message || null,
          username: adminUser?.username || null,
          has_password_hash: !!adminUser?.password_hash
        }
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to test database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 