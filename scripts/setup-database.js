const { createClient } = require('@supabase/supabase-js');

// .env.local 파일에서 가져온 값을 직접 사용
const SUPABASE_URL = 'https://bwspuoeqqyatbyczjivb.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3c3B1b2VxcXlhdGJ5Y3pqaXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTgwMjQ2MywiZXhwIjoyMDU3Mzc4NDYzfQ.pWA6q6iIrJwv3LHuBLfgTa8yuL5C2ocG5vRH2pbZ1xU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// SQL 쿼리를 직접 실행하는 함수
async function executeSQL(query) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("SQL 실행 중 오류:", error);
    return { data: null, error };
  }
}

async function main() {
  try {
    console.log("데이터베이스 설정을 시작합니다...");

    // 1. SQL 실행 함수 생성
    console.log("SQL 실행 함수 생성 중...");
    await supabase.from('_exec_sql').select('*').limit(1).catch(() => {
      // 함수가 존재하지 않으면 무시
    });
    
    const createExecSQLQuery = `
      CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        EXECUTE sql_query;
        RETURN '{"success": true}'::JSONB;
      EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', SQLERRM
        );
      END;
      $$;
    `;
    
    const { error: createFunctionError } = await supabase.rpc('exec_sql', { 
      sql_query: createExecSQLQuery 
    }).catch(() => {
      console.log("SQL 실행 함수가 없어 CREATE FUNCTION을 직접 실행합니다...");
      return { error: { message: "함수가 존재하지 않습니다." } };
    });
    
    if (createFunctionError) {
      console.log("SQL 함수를 먼저 생성하겠습니다. 이 작업은 Supabase 관리 콘솔에서 수동으로 해야합니다.");
      console.log("다음 SQL을 Supabase SQL 편집기에서 실행하세요:");
      console.log(createExecSQLQuery);
      console.log("\n사용자 이메일을 가져오는 함수를 생성하려면 다음 SQL을 실행하세요:");
      console.log(`
        CREATE OR REPLACE FUNCTION public.get_users_email(user_ids UUID[])
        RETURNS TABLE (id UUID, email TEXT)
        LANGUAGE SQL
        SECURITY DEFINER
        SET search_path = public
        AS $$
          SELECT id, email
          FROM auth.users
          WHERE id = ANY(user_ids);
        $$;
        
        -- 함수 실행 권한 설정
        GRANT EXECUTE ON FUNCTION public.get_users_email(UUID[]) TO authenticated;
      `);
      return;
    }

    // 2. profiles 테이블이 이미 존재하는지 확인
    const { data: existingProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (profileError && profileError.code !== 'PGRST116') {
      console.log("profiles 테이블 확인 중 오류:", profileError);
      // 테이블이 없는 경우 생성
      console.log("profiles 테이블 생성 중...");
      
      const createProfilesQuery = `
        CREATE TABLE IF NOT EXISTS public.profiles (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          name TEXT,
          age INTEGER,
          gender TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        -- RLS 정책 설정
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        
        -- 모든 사용자가 프로필을 볼 수 있음
        CREATE POLICY "모든 사용자가 프로필을 볼 수 있음" ON public.profiles
          FOR SELECT USING (true);
          
        -- 자신의 프로필만 생성 가능
        CREATE POLICY "자신의 프로필만 생성 가능" ON public.profiles
          FOR INSERT WITH CHECK (auth.uid() = user_id);
          
        -- 자신의 프로필만 수정 가능
        CREATE POLICY "자신의 프로필만 수정 가능" ON public.profiles
          FOR UPDATE USING (auth.uid() = user_id);
          
        -- 자신의 프로필만 삭제 가능
        CREATE POLICY "자신의 프로필만 삭제 가능" ON public.profiles
          FOR DELETE USING (auth.uid() = user_id);
      `;
      
      const { error: createProfilesError } = await supabase.rpc('exec_sql', { 
        sql_query: createProfilesQuery 
      });
      
      if (createProfilesError) {
        console.error("profiles 테이블 생성 중 오류:", createProfilesError);
        return;
      }
      
      console.log("profiles 테이블이 생성되었습니다.");
    } else {
      console.log("profiles 테이블이 이미 존재합니다.");
    }

    // 3. posts 테이블 생성 (존재하지 않는 경우)
    const { data: existingPosts, error: postsError } = await supabase
      .from('posts')
      .select('count')
      .limit(1);

    if (postsError && postsError.code !== 'PGRST116') {
      console.log("posts 테이블 생성 중...");
      
      const createPostsQuery = `
        CREATE TABLE IF NOT EXISTS public.posts (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );

        -- RLS 정책 설정
        ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
        
        -- 모든 사용자가 게시글을 볼 수 있음
        CREATE POLICY "모든 사용자가 게시글을 볼 수 있음" ON public.posts
          FOR SELECT USING (true);
          
        -- 로그인한 사용자만 게시글 생성 가능
        CREATE POLICY "로그인한 사용자만 게시글 생성 가능" ON public.posts
          FOR INSERT WITH CHECK (auth.uid() = user_id);
          
        -- 자신의 게시글만 수정 가능
        CREATE POLICY "자신의 게시글만 수정 가능" ON public.posts
          FOR UPDATE USING (auth.uid() = user_id);
          
        -- 자신의 게시글만 삭제 가능
        CREATE POLICY "자신의 게시글만 삭제 가능" ON public.posts
          FOR DELETE USING (auth.uid() = user_id);
      `;
      
      const { error: createPostsError } = await supabase.rpc('exec_sql', { 
        sql_query: createPostsQuery 
      });
      
      if (createPostsError) {
        console.error("posts 테이블 생성 중 오류:", createPostsError);
        return;
      }
      
      console.log("posts 테이블이 생성되었습니다.");
    } else {
      console.log("posts 테이블이 이미 존재합니다.");
    }

    // 4. 사용자 이메일을 가져오는 함수 생성
    console.log("사용자 이메일을 가져오는 함수 생성 중...");
    
    const getUsersEmailQuery = `
      CREATE OR REPLACE FUNCTION public.get_users_email(user_ids UUID[])
      RETURNS TABLE (id UUID, email TEXT)
      LANGUAGE SQL
      SECURITY DEFINER
      SET search_path = public
      AS $$
        SELECT id, email
        FROM auth.users
        WHERE id = ANY(user_ids);
      $$;
      
      -- 함수 실행 권한 설정
      GRANT EXECUTE ON FUNCTION public.get_users_email(UUID[]) TO authenticated;
    `;
    
    const { error: getUsersEmailError } = await supabase.rpc('exec_sql', { 
      sql_query: getUsersEmailQuery 
    });
    
    if (getUsersEmailError) {
      console.error("사용자 이메일 함수 생성 중 오류:", getUsersEmailError);
    } else {
      console.log("사용자 이메일 함수가 성공적으로 생성되었습니다.");
    }

    // 5. 샘플 데이터 추가
    console.log("샘플 데이터 추가 중...");
    
    // 관리자 사용자 ID 가져오기 (수정 필요)
    const getAdminQuery = `
      SELECT id FROM auth.users WHERE email = 'notify@smartnewb.com' LIMIT 1;
    `;
    
    const { error: adminQueryError, data: adminQueryResult } = await supabase.rpc('exec_sql', { 
      sql_query: getAdminQuery 
    });
    
    if (adminQueryError || !adminQueryResult) {
      console.error("관리자 사용자 조회 중 오류:", adminQueryError || "결과가 없습니다");
      console.log("관리자 계정을 찾을 수 없습니다. 샘플 데이터 추가를 건너뜁니다.");
      return;
    }
    
    // 여기서는 JSON 결과 처리가 제한적이므로, Supabase 관리 콘솔에서 직접 데이터를 추가하는 것을 권장합니다
    console.log("샘플 데이터는 Supabase 관리 콘솔에서 직접 추가해주세요.");
    console.log("데이터베이스 설정이 완료되었습니다.");
  } catch (error) {
    console.error("데이터베이스 설정 중 오류 발생:", error);
  }
}

main(); 