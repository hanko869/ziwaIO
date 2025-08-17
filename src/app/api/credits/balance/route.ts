import { NextRequest, NextResponse } from 'next/server';
import { creditService } from '@/lib/credits';
import { getUser } from '@/utils/auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Getting credits for user:', user.id, user.username, user.role);

    // Admin users have unlimited credits
    if (user.role === 'admin') {
      return NextResponse.json({ balance: 999999 });
    }

    // First, check if this user exists in the database
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('username', user.username)
      .single();

    if (userError || !dbUser) {
      console.error('User not found in database:', userError);
      // Return default credits for now
      return NextResponse.json({ balance: 100 });
    }

    // Use the actual database user ID, not the token user ID
    const actualUserId = dbUser.id;
    console.log('Using actual DB user ID:', actualUserId);

    // Get credits using the correct user ID
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', actualUserId)
      .single();

    if (creditsError) {
      console.error('Error getting credits:', creditsError);
      // Initialize credits if they don't exist
      if (creditsError.code === 'PGRST116') {
        const { data: newCredits, error: insertError } = await supabase
          .from('user_credits')
          .insert({
            user_id: actualUserId,
            balance: 100,
            total_purchased: 100,
            total_used: 0
          })
          .select('balance')
          .single();
        
        if (insertError) {
          console.error('Error initializing credits:', insertError);
          return NextResponse.json({ balance: 0 });
        }
        
        return NextResponse.json({ balance: newCredits?.balance || 100 });
      }
      return NextResponse.json({ balance: 0 });
    }

    return NextResponse.json({ balance: credits?.balance || 0 });
  } catch (error) {
    console.error('Error in credits balance:', error);
    return NextResponse.json(
      { error: 'Failed to get credit balance' },
      { status: 500 }
    );
  }
} 