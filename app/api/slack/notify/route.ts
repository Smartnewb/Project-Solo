import { NextResponse } from 'next/server';
import { ADMIN_EMAIL } from '@/utils/config';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

export async function POST(request: Request) {
  try {
    // 관리자 권한 확인
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    
    if (!SLACK_WEBHOOK_URL) {
      throw new Error('Slack Webhook URL이 설정되지 않았습니다.');
    }

    // Slack으로 메시지 전송
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: body.text,
        username: '매칭봇',
        icon_emoji: ':cupid:'
      })
    });

    if (!response.ok) {
      throw new Error('Slack 알림 전송에 실패했습니다.');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Slack 알림 전송 중 오류:', error);
    return NextResponse.json(
      { error: '알림 전송에 실패했습니다.' },
      { status: 500 }
    );
  }
}
