-- system_settings 테이블이 없는 경우 생성
CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT PRIMARY KEY,
  matching_datetime TIMESTAMP WITH TIME ZONE,
  signup_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기본 설정값 삽입
INSERT INTO system_settings (id, signup_enabled, updated_at)
VALUES ('signup_control', true, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO system_settings (id, matching_datetime, updated_at)
VALUES ('matching_time', NOW() + INTERVAL '1 day', NOW())
ON CONFLICT (id) DO NOTHING;

-- 현재 설정 확인
SELECT * FROM system_settings;
