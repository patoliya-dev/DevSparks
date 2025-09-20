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
    const { name, email, password } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password, // In production, hash this password
      createdAt: new Date()
    };

    users.push(newUser);

    // Generate token
    const token = generateToken(newUser.id);

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      },
      token
    });

  } catch (error) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
