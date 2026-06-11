import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  // Validate super admin credentials (hardcoded for demo)
  // In production, verify against Supabase with SUPER_ADMIN role
  const validCredentials = email === 'admin@opticx.com' && password === 'admin123';

  if (validCredentials) {
    const response = NextResponse.json({ success: true });
    response.cookies.set('super_admin_token', 'authenticated', { 
      httpOnly: true, 
      maxAge: 60 * 60 * 24 * 7 
    });
    return response;
  }

  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
}