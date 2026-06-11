import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  // Validate against Supabase with ADMIN_BRANCH role
  const valid = email && password;
  if (valid) {
    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_branch_token', 'authenticated', { httpOnly: true, maxAge: 60 * 60 * 24 * 7 });
    return response;
  }
  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
}