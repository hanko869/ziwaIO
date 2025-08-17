import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    return NextResponse.json({
      user: {
        id: decoded.id,
        email: `${decoded.username}@example.com`, // Generate a dummy email since we don't store emails
        username: decoded.username,
        role: decoded.role || 'user'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
} 