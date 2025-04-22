import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// 대학 목록 (정렬된 상태로 유지)
const UNIVERSITIES = [
  '건양대학교(메디컬캠퍼스)',
  '대전대학교',
  '목원대학교',
  '배재대학교',
  '우송대학교',
  '한남대학교',
  '충남대학교',
  'KAIST',
  '한밭대학교',
  '을지대학교',
  '대전보건대학교',
  '대덕대학교'
];

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // 사용자 권한 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 관리자 계정 검증
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 대학별 회원 데이터 조회
    const { data: universityData, error: universityError } = await supabase
      .from('profiles')
      .select('university, gender')
      .not('university', 'is', null);

    if (universityError) {
      console.error('Error fetching university data:', universityError);
      return NextResponse.json(
        { error: 'Failed to fetch university data' },
        { status: 500 }
      );
    }

    // 전체 회원 수 조회
    const { count: totalUsers, error: totalError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('Error fetching total users:', totalError);
      return NextResponse.json(
        { error: 'Failed to fetch total users' },
        { status: 500 }
      );
    }

    // 대학별 통계 계산
    const universityStats: Record<string, {
      university: string;
      totalUsers: number;
      maleUsers: number;
      femaleUsers: number;
      userRatio: number;
      genderRatio: string;
    }> = {};

    // 대학별 초기 데이터 설정
    UNIVERSITIES.forEach((university) => {
      console.log(`초기화 대학명: ${university}`);
      universityStats[university] = {
        university: university, // 명시적으로 대학명 설정
        totalUsers: 0,
        maleUsers: 0,
        femaleUsers: 0,
        userRatio: 0, // 나중에 계산
        genderRatio: '0:0' // 나중에 계산
      };
    });

    // 대학별 회원 수 집계
    universityData.forEach(user => {
      const university = user.university;
      
      // 대학이 없거나 목록에 없는 대학은 건너뜀
      if (!university || !universityStats[university]) return;
      
      universityStats[university].totalUsers += 1;
      
      if (user.gender === 'male') {
        universityStats[university].maleUsers += 1;
      } else if (user.gender === 'female') {
        universityStats[university].femaleUsers += 1;
      }
    });

    // 비율 계산 및 정렬
    const result = Object.values(universityStats).map(stat => {
      // 전체 유저 대비 비율 계산
      stat.userRatio = parseFloat(((stat.totalUsers / (totalUsers || 1)) * 100).toFixed(2));
      
      // 성비 계산
      const maleRatio = Math.round((stat.maleUsers / (stat.totalUsers || 1)) * 100);
      const femaleRatio = Math.round((stat.femaleUsers / (stat.totalUsers || 1)) * 100);
      stat.genderRatio = `${femaleRatio}:${maleRatio}`;
      
      // 대학명이 제대로 설정되었는지 확인
      console.log(`대학명 디버깅: ${stat.university}, 타입: ${typeof stat.university}`);
      
      return stat;
    }).sort((a, b) => b.totalUsers - a.totalUsers); // 회원 수 기준 내림차순 정렬

    // 결과 데이터 로그
    console.log('대학별 통계 결과:', JSON.stringify(result[0], null, 2));

    return NextResponse.json({
      universities: result,
      totalUsers: totalUsers || 0
    });
  } catch (error) {
    console.error('Error in university stats API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
