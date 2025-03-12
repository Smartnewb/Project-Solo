'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'

export const createClient = () => {
  return createClientComponentClient<Database>()
}

// 서버 컴포넌트용 클라이언트
export const createServerClient = () => {
  return createClientComponentClient<Database>()
}

export const getActiveUsersCount = async () => {
  // 임시 더미 데이터 반환
  return { count: 100, error: null };
}; 