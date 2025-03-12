import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 1. 데이터베이스 연결 테스트
    const { data: testResult, error: testError } = await supabase
      .rpc('test_connection');

    if (testError) throw testError;

    // 2. 인증 서비스 테스트
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    // 3. 스토리지 버킷 테스트
    const { data: buckets, error: storageError } = await supabase
      .storage
      .listBuckets();

    return NextResponse.json({
      status: 'success',
      message: testResult,
      auth: authData ? 'Auth service is working' : 'Auth service not initialized',
      storage: buckets ? 'Storage service is working' : 'Storage service not initialized',
    });

  } catch (error) {
    console.error('Connection test error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Failed to connect to Supabase',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 