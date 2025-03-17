-- 캐시 새로고침을 위한 스키마 업데이트
-- posts 테이블과 comments 테이블 관계 정리

-- posts 테이블의 관계 재정의
ALTER TABLE IF EXISTS public.posts DROP CONSTRAINT IF EXISTS posts_author_id_fkey CASCADE;

-- posts 테이블 타임스탬프 컬럼 추가 (없는 경우)
ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT now();

-- 외래 키 다시 생성
ALTER TABLE public.posts 
  ADD CONSTRAINT posts_author_id_fkey 
  FOREIGN KEY (author_id) 
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- comments 테이블 관계 정리
ALTER TABLE IF EXISTS public.comments DROP CONSTRAINT IF EXISTS comments_author_id_fkey CASCADE;
ALTER TABLE IF EXISTS public.comments DROP CONSTRAINT IF EXISTS comments_post_id_fkey CASCADE;

-- comments 외래 키 다시 생성
ALTER TABLE public.comments 
  ADD CONSTRAINT comments_author_id_fkey 
  FOREIGN KEY (author_id) 
  REFERENCES profiles(id)
  ON DELETE CASCADE;

ALTER TABLE public.comments 
  ADD CONSTRAINT comments_post_id_fkey 
  FOREIGN KEY (post_id) 
  REFERENCES posts(id)
  ON DELETE CASCADE; 