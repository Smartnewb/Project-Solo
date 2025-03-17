const { createClient } = require('@supabase/supabase-js');

// .env.local 파일에서 가져온 값을 직접 사용
const SUPABASE_URL = 'https://bwspuoeqqyatbyczjivb.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3c3B1b2VxcXlhdGJ5Y3pqaXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTgwMjQ2MywiZXhwIjoyMDU3Mzc4NDYzfQ.pWA6q6iIrJwv3LHuBLfgTa8yuL5C2ocG5vRH2pbZ1xU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  try {
    // 1. 관리자 계정 생성
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'notify@smartnewb.com',
      password: 'SmartNewbie!0705',
      email_confirm: true
    });

    if (error) {
      console.error('관리자 계정 생성 오류:', error);
      return;
    }

    console.log('관리자 계정이 생성되었습니다:', data.user.id);

    // 2. 프로필 생성
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          user_id: data.user.id,
          name: '관리자',
          age: 0,
          gender: 'other',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select('*')
      .single();

    if (profileError) {
      console.error('프로필 생성 오류:', profileError);
      return;
    }

    console.log('관리자 프로필이 생성되었습니다:', profile.id);
    console.log('관리자 계정 생성이 완료되었습니다.');

  } catch (error) {
    console.error('알 수 없는 오류:', error);
  }
}

main(); 