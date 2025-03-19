-- 중복 프로필 중 가장 최근 것을 제외한 나머지 삭제
DELETE FROM profiles a
USING (
  SELECT user_id, MAX(created_at) as max_created_at
  FROM profiles
  GROUP BY user_id
  HAVING COUNT(*) > 1
) b
WHERE a.user_id = b.user_id
AND a.created_at < b.max_created_at;

-- user_id에 unique constraint 추가
ALTER TABLE profiles
ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id); 