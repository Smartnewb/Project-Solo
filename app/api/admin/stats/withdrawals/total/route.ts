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
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats/withdrawals/total`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });
    
    // 응답 데이터 가져오기
    const data = await response.json();
    
    // 백엔드 응답 상태 코드 유지
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('회원 탈퇴 통계 프록시 오류:', error);
    return NextResponse.json(
      { 
        message: '회원 탈퇴 통계 데이터 처리 중 오류가 발생했습니다.',
        totalWithdrawals: 0 
      },
      { status: 200 }
    );
  }
}
