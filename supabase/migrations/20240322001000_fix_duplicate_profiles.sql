-- Step 1: 임시 테이블 생성
CREATE TABLE profiles_temp AS
SELECT DISTINCT ON (user_id)
  id,
  user_id,
  role,
  nickname,
  studentid,
  created_at,
  updated_at
FROM profiles
ORDER BY user_id, created_at DESC;

-- Step 2: 기존 테이블 삭제
DROP TABLE profiles;

-- Step 3: 임시 테이블을 profiles로 이름 변경
ALTER TABLE profiles_temp RENAME TO profiles;

-- Step 4: 필요한 인덱스와 제약조건 추가
ALTER TABLE profiles ADD PRIMARY KEY (id);
ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
ALTER TABLE profiles ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE profiles ALTER COLUMN updated_at SET DEFAULT now();

-- Step 5: RLS 정책 재설정
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 자신의 프로필을 볼 수 있음
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 프로필만 수정할 수 있음
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- 새 사용자는 프로필을 생성할 수 있음
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 관리자는 모든 프로필을 볼 수 있음
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- 관리자는 모든 프로필을 수정할 수 있음
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.role = 'admin'
    )
  ); 