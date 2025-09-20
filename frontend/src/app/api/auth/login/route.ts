import { NextRequest, NextResponse } from 'next/server';

// Mock user database - in production, use a real database
const users: Array<{
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}> = [];

// Simple token generation - in production, use proper JWT
const generateToken = (userId: string) => {
  return `token_${userId}_${Date.now()}`;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = users.find(user => user.email === email);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check password (simple comparison for demo)
    if (password !== user.password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateToken(user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      token
    });

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
