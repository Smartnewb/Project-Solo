-- 1. 디버깅: 현재 중복된 프로필 확인
SELECT user_id, COUNT(*) 
FROM profiles 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- 2. 각 user_id 별로 가장 최근 프로필만 남기고 나머지 삭제
CREATE TEMPORARY TABLE profiles_to_keep AS
SELECT DISTINCT ON (user_id) *
FROM profiles
ORDER BY user_id, created_at DESC;

-- 3. 중복 프로필 삭제
DELETE FROM profiles
WHERE id NOT IN (SELECT id FROM profiles_to_keep);

-- 4. unique constraint 추가 (아직 없는 경우)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_user_id_key'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  END IF;
END
$$;

-- 5. 검증: 중복 프로필이 제거되었는지 확인
SELECT user_id, COUNT(*) 
FROM profiles 
GROUP BY user_id 
HAVING COUNT(*) > 1; 