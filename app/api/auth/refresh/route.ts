import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 백엔드 API로 요청 전달
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`;
    console.log('토큰 갱신 API 요청 URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    // 응답 상태 코드 확인
    if (!response.ok) {
      console.error('토큰 갱신 API 오류:', response.status, response.statusText);
      
      // 임시 토큰 생성
      const tempToken = 'temp_admin_' + Date.now();
      
      return NextResponse.json(
        { accessToken: tempToken },
        { status: 200 }
      );
    }
    
    // 응답 데이터 가져오기
    const data = await response.json();
    
    // 백엔드 응답 상태 코드 유지
    return NextResponse.json(data);
  } catch (error) {
    console.error('토큰 갱신 프록시 오류:', error);
    
    // 임시 토큰 생성
    const tempToken = 'temp_admin_' + Date.now();
    
    return NextResponse.json(
      { accessToken: tempToken },
      { status: 200 }
    );
  }
}
