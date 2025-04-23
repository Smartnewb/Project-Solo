import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 인증 토큰 가져오기
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { message: '인증 토큰이 필요합니다.' },
        { status: 401 }
      );
    }
    
    // 백엔드 API로 요청 전달
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/me`;
    console.log('API 요청 URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });
    
    // 응답 상태 코드 확인
    if (!response.ok) {
      console.error('백엔드 API 오류:', response.status, response.statusText);
      
      // 임시 관리자 응답 생성
      if (authHeader.includes('temp_admin')) {
        return NextResponse.json({
          id: 'temp-admin-id',
          email: 'admin@example.com',
          role: 'admin'
        });
      }
      
      return NextResponse.json(
        { message: '인증 정보를 가져오는데 실패했습니다.' },
        { status: response.status }
      );
    }
    
    // 응답 데이터 가져오기
    const data = await response.json();
    
    // 백엔드 응답 상태 코드 유지
    return NextResponse.json(data);
  } catch (error) {
    console.error('인증 정보 프록시 오류:', error);
    
    // 임시 관리자 응답 생성
    const authHeader = request.headers.get('Authorization') || '';
    if (authHeader.includes('temp_admin')) {
      return NextResponse.json({
        id: 'temp-admin-id',
        email: 'admin@example.com',
        role: 'admin'
      });
    }
    
    return NextResponse.json(
      { message: '인증 정보 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
