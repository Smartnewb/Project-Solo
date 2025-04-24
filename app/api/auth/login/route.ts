import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 백엔드 API로 요청 전달
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    // 응답 데이터 가져오기
    const data = await response.json();
    
    // 백엔드 응답 상태 코드 유지
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('로그인 프록시 오류:', error);
    return NextResponse.json(
      { message: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
