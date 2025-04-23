import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: '관리자 디버그 API 호출 성공',
    timestamp: new Date().toISOString()
  });
}
