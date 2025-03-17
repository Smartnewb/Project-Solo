-- 1. profiles 테이블과 auth.users 테이블의 불일치 확인
SELECT p.id, p.user_id, p.name, p.email AS profile_email, u.email AS auth_email 
FROM profiles p 
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE u.id IS NULL;

-- 2. '전준영'이라는 이름을 가진 사용자 확인
SELECT * FROM profiles WHERE name = '전준영';

-- 3. 데이터 정합성 검사 - user_id가 존재하지 않는 프로필 찾기
SELECT p.id, p.user_id, p.name 
FROM profiles p 
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE u.id IS NULL;

-- 4. 데이터 정합성 검사 - 성별 테이블과 메인 profiles 테이블 간의 불일치
SELECT 
  p.id AS profile_id, 
  p.user_id, 
  p.name, 
  p.gender,
  CASE 
    WHEN p.gender = 'male' THEN (SELECT id FROM male_profiles WHERE user_id = p.user_id) 
    WHEN p.gender = 'female' THEN (SELECT id FROM female_profiles WHERE user_id = p.user_id)
  END AS gender_profile_id
FROM profiles p
WHERE 
  (p.gender = 'male' AND NOT EXISTS (SELECT 1 FROM male_profiles WHERE user_id = p.user_id))
  OR
  (p.gender = 'female' AND NOT EXISTS (SELECT 1 FROM female_profiles WHERE user_id = p.user_id));

-- 5. 불일치 데이터 정리 (주의: 실행 전 백업 필요)
-- 존재하지 않는 auth.users 항목을 가진 profiles 삭제
/*
DELETE FROM profiles 
WHERE user_id NOT IN (SELECT id FROM auth.users);
*/

-- 6. 성별 테이블에 누락된 데이터 생성
/*
INSERT INTO male_profiles (user_id, name, age, gender, created_at, updated_at)
SELECT p.user_id, p.name, p.age, 'male', p.created_at, p.updated_at
FROM profiles p
WHERE p.gender = 'male' 
AND NOT EXISTS (SELECT 1 FROM male_profiles WHERE user_id = p.user_id);

INSERT INTO female_profiles (user_id, name, age, gender, created_at, updated_at)
SELECT p.user_id, p.name, p.age, 'female', p.created_at, p.updated_at
FROM profiles p
WHERE p.gender = 'female' 
AND NOT EXISTS (SELECT 1 FROM female_profiles WHERE user_id = p.user_id);
*/ 