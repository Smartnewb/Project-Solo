import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // 관리자 계정 생성
    const { data: user, error: signUpError } = await supabase.auth.signUp({
      email: 'admin@smartnewbie.com',
      password: 'SmartNewbie!0705',
      options: {
        data: {
          role: 'admin'
        }
      }
    });

    if (signUpError) {
      console.error('관리자 계정 생성 에러:', signUpError);
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }

    if (user.user) {
      // 관리자 프로필 생성
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.user.id,
          role: 'admin'
        });

      if (profileError) {
        console.error('관리자 프로필 생성 에러:', profileError);
        return NextResponse.json({ error: profileError.message }, { status: 400 });
      }

      return NextResponse.json({ 
        message: 'Admin account created successfully',
        user: user.user
      });
    }

    return NextResponse.json({ error: 'Failed to create admin account' }, { status: 400 });
  } catch (error) {
    console.error('Error creating admin account:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 