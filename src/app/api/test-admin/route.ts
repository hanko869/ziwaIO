import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');
    
    if (!token) {
      return NextResponse.json({ error: 'No auth token found' }, { status: 401 });
    }

    const decoded = jwt.verify(token.value, process.env.JWT_SECRET!) as any;
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role
      },
      rawToken: decoded
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Invalid token',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 401 });
  }
} 