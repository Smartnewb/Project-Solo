-- 프로필 테이블에 새로운 필드 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height INTEGER CHECK (height >= 140 AND height <= 200);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personalities TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dating_styles TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lifestyles TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS drinking TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS smoking TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tattoo TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mbti TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram_id TEXT;

-- 필드 제약조건 추가
ALTER TABLE profiles ADD CONSTRAINT height_range 
  CHECK (height >= 140 AND height <= 200);

ALTER TABLE profiles ADD CONSTRAINT drinking_values 
  CHECK (drinking IN (
    '자주 마심',
    '가끔 마심',
    '거의 안 마심',
    '전혀 안 마심'
  ) OR drinking IS NULL);

ALTER TABLE profiles ADD CONSTRAINT smoking_values 
  CHECK (smoking IN (
    '흡연',
    '비흡연'
  ) OR smoking IS NULL);

ALTER TABLE profiles ADD CONSTRAINT tattoo_values 
  CHECK (tattoo IN (
    '있음',
    '작은 문신 있음',
    '없음'
  ) OR tattoo IS NULL);

ALTER TABLE profiles ADD CONSTRAINT mbti_values 
  CHECK (mbti IN (
    'INTJ', 'INTP', 'ENTJ', 'ENTP',
    'INFJ', 'INFP', 'ENFJ', 'ENFP',
    'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
    'ISTP', 'ISFP', 'ESTP', 'ESFP'
  ) OR mbti IS NULL);

-- 배열 필드의 최대 길이 체크를 위한 트리거 함수
CREATE OR REPLACE FUNCTION check_profile_array_limits()
RETURNS TRIGGER AS $$
BEGIN
  -- 성격 특성 최대 5개
  IF array_length(NEW.personalities, 1) > 5 THEN
    RAISE EXCEPTION '성격 특성은 최대 5개까지만 선택할 수 있습니다.';
  END IF;
  
  -- 데이트 스타일 최대 3개
  IF array_length(NEW.dating_styles, 1) > 3 THEN
    RAISE EXCEPTION '데이트 스타일은 최대 3개까지만 선택할 수 있습니다.';
  END IF;
  
  -- 라이프스타일 최대 3개
  IF array_length(NEW.lifestyles, 1) > 3 THEN
    RAISE EXCEPTION '라이프스타일은 최대 3개까지만 선택할 수 있습니다.';
  END IF;
  
  -- 관심사 최대 5개
  IF array_length(NEW.interests, 1) > 5 THEN
    RAISE EXCEPTION '관심사는 최대 5개까지만 선택할 수 있습니다.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS check_profile_array_limits_trigger ON profiles;
CREATE TRIGGER check_profile_array_limits_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_profile_array_limits();

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS profiles_height_idx ON profiles(height);
CREATE INDEX IF NOT EXISTS profiles_mbti_idx ON profiles(mbti);