import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/utils/auth';
import { creditService } from '@/lib/credits';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    
    // Check if user is admin
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { userId, amount, action, description } = await request.json();

    // Validate inputs
    if (!userId || !amount || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, amount, action' },
        { status: 400 }
      );
    }

    if (!['add', 'subtract', 'set'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: add, subtract, or set' },
        { status: 400 }
      );
    }

    // Get current user credits
    const currentCredits = await creditService.getUserCredits(userId);
    if (!currentCredits) {
      // Initialize credits if user doesn't have any
      await creditService.initializeUserCredits(userId);
    }

    let newBalance = 0;
    const currentBalance = currentCredits?.balance || 0;

    // Calculate new balance based on action
    switch (action) {
      case 'add':
        newBalance = currentBalance + amount;
        break;
      case 'subtract':
        newBalance = Math.max(0, currentBalance - amount);
        break;
      case 'set':
        newBalance = Math.max(0, amount);
        break;
    }

    // Update credits
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({
        balance: newBalance,
        last_updated: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Record transaction
    const transactionDescription = description || 
      `Admin ${action} ${amount} credits (by ${user.username})`;
    
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        type: action === 'add' ? 'admin_add' : 'admin_adjust',
        amount: action === 'add' ? amount : (newBalance - currentBalance),
        balance_after: newBalance,
        description: transactionDescription,
        metadata: {
          action,
          adminId: user.id,
          adminUsername: user.username,
          previousBalance: currentBalance
        }
      });

    if (transactionError) throw transactionError;

    // Get user info for response
    const { data: targetUser } = await supabase
      .from('users')
      .select('username, email')
      .eq('id', userId)
      .single();

    return NextResponse.json({
      success: true,
      user: targetUser,
      previousBalance: currentBalance,
      newBalance,
      action,
      amount
    });

  } catch (error) {
    console.error('Error managing credits:', error);
    return NextResponse.json(
      { error: 'Failed to manage credits' },
      { status: 500 }
    );
  }
}
