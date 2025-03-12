import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    // 1. 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing environment variables');
      return NextResponse.json({
        status: 'error',
        message: 'Configuration error',
        error: 'Missing Supabase configuration',
        debug: {
          url: supabaseUrl ? 'URL is set' : 'URL is missing',
          anonKey: supabaseAnonKey ? 'Anon key is set' : 'Anon key is missing'
        }
      }, { status: 500 });
    }

    console.log('Starting Supabase connection test...');
    console.log('URL:', supabaseUrl);
    
    // 2. Supabase 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // 3. 인증 서비스 테스트
    console.log('Testing auth service...');
    const { data: authData, error: authError } = await supabase.auth.getSession();

    if (authError) {
      console.error('Auth service error:', authError);
      return NextResponse.json({
        status: 'error',
        message: 'Auth service test failed',
        error: authError.message,
        debug: {
          errorCode: authError.status || 'unknown',
          suggestion: '인증 서비스 연결에 실패했습니다. API 키를 확인해주세요.'
        }
      }, { status: 500 });
    }

    // 4. 스토리지 서비스 테스트
    console.log('Testing storage service...');
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();

    return NextResponse.json({
      status: 'success',
      message: 'Successfully connected to Supabase',
      debug: {
        connectionStatus: 'Connected',
        authService: 'Working',
        storageService: storageError ? 'Not available' : 'Working',
        nextSteps: [
          'Supabase 대시보드에서 테이블 생성',
          'RLS(Row Level Security) 정책 설정',
          '필요한 스키마 마이그레이션 실행'
        ],
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Unexpected error occurred',
        error: error instanceof Error ? error.message : 'Unknown error',
        debug: {
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
} 