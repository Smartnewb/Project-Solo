-- 기존 중복 정책들 제거
DROP POLICY IF EXISTS "Male profiles are viewable by admins" ON male_profiles;
DROP POLICY IF EXISTS "Users can insert their own male profile" ON male_profiles;
DROP POLICY IF EXISTS "Users can update own male profile" ON male_profiles;
DROP POLICY IF EXISTS "관리자는 모든 작업 가능" ON male_profiles;
DROP POLICY IF EXISTS "사용자는 자신의 프로필만 읽기/수정 가능" ON male_profiles;
DROP POLICY IF EXISTS "관리자는 모든 male_profiles에 접근 가능" ON male_profiles;
DROP POLICY IF EXISTS "사용자는 자신의 male_profile만 접근 가능" ON male_profiles;

DROP POLICY IF EXISTS "Female profiles are viewable by admins" ON female_profiles;
DROP POLICY IF EXISTS "Users can insert their own female profile" ON female_profiles;
DROP POLICY IF EXISTS "Users can update own female profile" ON female_profiles;
DROP POLICY IF EXISTS "관리자는 모든 작업 가능" ON female_profiles;
DROP POLICY IF EXISTS "사용자는 자신의 프로필만 읽기/수정 가능" ON female_profiles;
DROP POLICY IF EXISTS "관리자는 모든 female_profiles에 접근 가능" ON female_profiles;
DROP POLICY IF EXISTS "사용자는 자신의 female_profile만 접근 가능" ON female_profiles;

-- classification 컬럼을 TEXT 타입으로 통일 (일부는 varchar(1)로 정의되어 있어 불일치 가능성이 있음)
ALTER TABLE profiles 
  ALTER COLUMN classification TYPE TEXT;

ALTER TABLE male_profiles 
  ALTER COLUMN classification TYPE TEXT;

ALTER TABLE female_profiles 
  ALTER COLUMN classification TYPE TEXT;

-- 기존 데이터 NULL 값 업데이트
UPDATE profiles SET classification = 'C' WHERE classification IS NULL;
UPDATE male_profiles SET classification = 'C' WHERE classification IS NULL;
UPDATE female_profiles SET classification = 'C' WHERE classification IS NULL;

-- RLS 정책 다시 설정 (단순화 및 명확하게)
-- male_profiles 테이블
CREATE POLICY "관리자는 모든 male_profiles 접근 가능" ON male_profiles
FOR ALL
TO authenticated
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'notify@smartnewb.com'
);

CREATE POLICY "사용자는 자신의 male_profile 접근 가능" ON male_profiles
FOR ALL
TO authenticated
USING (user_id = auth.uid());

-- female_profiles 테이블
CREATE POLICY "관리자는 모든 female_profiles 접근 가능" ON female_profiles
FOR ALL
TO authenticated
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'notify@smartnewb.com'
);

CREATE POLICY "사용자는 자신의 female_profile 접근 가능" ON female_profiles
FOR ALL
TO authenticated
USING (user_id = auth.uid());

-- 초기 관리자 설정 함수 재정의
CREATE OR REPLACE FUNCTION set_initial_admin()
RETURNS void AS $$
BEGIN
    UPDATE profiles 
    SET role = 'admin' 
    WHERE user_id IN (
        SELECT id FROM auth.users 
        WHERE email = 'notify@smartnewb.com'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수 실행
SELECT set_initial_admin();
