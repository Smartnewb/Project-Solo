import { NextResponse } from 'next/server';
import { clearAdminCookies } from '@/shared/auth';

export async function POST() {
  await clearAdminCookies();
  return NextResponse.json({ success: true });
}
