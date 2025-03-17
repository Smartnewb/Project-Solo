-- Supabase 관리 콘솔에서 실행할 SQL 명령어
-- 기존 테이블을 삭제하는 경우에만 실행하세요!

-- 외래 키 제약 조건으로 인해 posts 테이블을 먼저 삭제해야 합니다
DROP TABLE IF EXISTS public.posts CASCADE;

-- 그 다음 profiles 테이블 삭제
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 함수도 삭제
DROP FUNCTION IF EXISTS public.get_users_email(UUID[]); 