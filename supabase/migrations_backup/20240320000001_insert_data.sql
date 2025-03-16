-- Delete existing data first
DELETE FROM profiles;
DELETE FROM auth.users WHERE email IN ('user1@example.com', 'user2@example.com', 'user3@example.com');

-- Insert sample users data
INSERT INTO auth.users (id, email)
SELECT 
  gen_random_uuid(),
  email
FROM unnest(ARRAY['user1@example.com', 'user2@example.com', 'user3@example.com']) AS email;

-- Insert sample profiles
WITH inserted_users AS (
  SELECT id, email 
  FROM auth.users 
  WHERE email IN ('user1@example.com', 'user2@example.com', 'user3@example.com')
)
INSERT INTO profiles (id, role, nickname, university, department, height, mbti)
SELECT 
  id,
  'user',
  CASE 
    WHEN email = 'user1@example.com' THEN '김철수'
    WHEN email = 'user2@example.com' THEN '이영희'
    ELSE '박지민'
  END,
  '한밭대학교',
  CASE 
    WHEN email = 'user1@example.com' THEN '컴퓨터공학과'
    WHEN email = 'user2@example.com' THEN '정보통신공학과'
    ELSE '전기공학과'
  END,
  CASE 
    WHEN email = 'user1@example.com' THEN 175
    WHEN email = 'user2@example.com' THEN 162
    ELSE 180
  END,
  CASE 
    WHEN email = 'user1@example.com' THEN 'ISTJ'
    WHEN email = 'user2@example.com' THEN 'ENFP'
    ELSE 'ENTJ'
  END
FROM inserted_users; 