-- 기존 posts 테이블의 제약 조건 삭제
ALTER TABLE IF EXISTS public.posts DROP CONSTRAINT IF EXISTS posts_pkey CASCADE;
ALTER TABLE IF EXISTS public.posts DROP CONSTRAINT IF EXISTS posts_author_id_fkey CASCADE;

-- posts 테이블 재구성
ALTER TABLE public.posts 
  DROP COLUMN IF EXISTS userId CASCADE,
  ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ALTER COLUMN author_id TYPE UUID,
  ADD CONSTRAINT posts_author_id_fkey 
    FOREIGN KEY (author_id) 
    REFERENCES profiles(id)
    ON DELETE CASCADE;

-- title 컬럼 추가 (없는 경우)
ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS title TEXT;

-- RLS 활성화 및 정책 설정
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Users can insert their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;

-- 새로운 RLS 정책 생성
CREATE POLICY "게시글은 모든 인증된 사용자가 볼 수 있음"
ON public.posts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "사용자는 자신의 게시글만 생성 가능"
ON public.posts FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = posts.author_id
    AND profiles.user_id = auth.uid()
  )
);

CREATE POLICY "사용자는 자신의 게시글만 수정 가능"
ON public.posts FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = posts.author_id
    AND profiles.user_id = auth.uid()
  )
);

CREATE POLICY "사용자는 자신의 게시글만 삭제 가능"
ON public.posts FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = posts.author_id
    AND profiles.user_id = auth.uid()
  )
);

-- 관리자는 모든 게시글에 대한 권한을 가짐
CREATE POLICY "관리자는 모든 게시글 관리 가능"
ON public.posts FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
); 