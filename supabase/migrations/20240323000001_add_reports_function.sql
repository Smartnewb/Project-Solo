-- 보고된 게시글을 조회하는 함수 생성
CREATE OR REPLACE FUNCTION get_reported_posts()
RETURNS SETOF posts AS $$
BEGIN
  RETURN QUERY
  SELECT p.*, c.*
  FROM posts p
  LEFT JOIN LATERAL (
    SELECT json_agg(c.*) as comments
    FROM comments c
    WHERE c.post_id = p.userId
  ) c ON true
  WHERE 
    -- reports 필드가 존재하고 비어있지 않은 경우
    (p.reports IS NOT NULL AND 
     p.reports != '{}' AND 
     p.reports != '[]' AND 
     p.reports::text != 'null');
END;
$$ LANGUAGE plpgsql; 