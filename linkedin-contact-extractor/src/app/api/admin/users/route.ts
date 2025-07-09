import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, createUser } from '@/utils/userDb';
import { creditService } from '@/lib/credits';

export async function GET(request: NextRequest) {
  try {
    // Get all users
    const users = await getAllUsers();
    
    // Enhance user data with credit balance
    const enhancedUsers = await Promise.all(
      users.map(async (user) => {
        const credits = await creditService.getUserCredits(user.id);
        return {
          ...user,
          balance: credits?.balance || 0,
          total_extractions: credits?.totalUsed || 0
        };
      })
    );

    return NextResponse.json(enhancedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { username, password, role } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const user = await createUser(username, password, role);
    
    // Initialize credits for new user
    await creditService.initializeUserCredits(user.id);

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 400 }
    );
  }
} 