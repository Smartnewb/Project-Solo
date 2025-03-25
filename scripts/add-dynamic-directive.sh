#!/bin/bash

# API 라우트 디렉토리 경로
API_DIR="app/api"

# 결과 로그 파일
LOG_FILE="dynamic-directive-results.log"

echo "API 라우트에 동적 렌더링 지시어 추가를 시작합니다..." > $LOG_FILE

# 모든 route.ts 파일 찾기
find $API_DIR -name "route.ts" | while read -r file; do
  echo "처리 중: $file" >> $LOG_FILE
  
  # 이미 'export const dynamic' 지시어가 있는지 확인
  if grep -q "export const dynamic" "$file"; then
    echo "  이미 dynamic 지시어가 있습니다. 건너뜁니다." >> $LOG_FILE
    continue
  fi

  # 파일의 첫 번째 import 문 찾기
  FIRST_IMPORT=$(grep -n "^import" "$file" | head -1 | cut -d: -f1)
  
  if [ -n "$FIRST_IMPORT" ]; then
    # import 문 다음에 빈 줄이 있는지 확인하고, 없으면 추가
    NEXT_LINE=$((FIRST_IMPORT + 1))
    NEXT_LINE_CONTENT=$(sed "${NEXT_LINE}q;d" "$file")
    
    if [[ -n "$NEXT_LINE_CONTENT" && ! "$NEXT_LINE_CONTENT" =~ ^[[:space:]]*$ ]]; then
      # import 블록 다음에 dynamic export 추가
      LAST_IMPORT=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
      DIRECTIVE_LINE=$((LAST_IMPORT + 1))
      
      sed -i "${DIRECTIVE_LINE}i\\
\\
// 정적 생성에서 동적 렌더링으로 전환\\
export const dynamic = 'force-dynamic';" "$file"
    else
      # 이미 빈 줄이 있으면 그 다음에 추가
      sed -i "${NEXT_LINE}i\\
// 정적 생성에서 동적 렌더링으로 전환\\
export const dynamic = 'force-dynamic';" "$file"
    fi
    
    echo "  동적 렌더링 지시어가 추가되었습니다." >> $LOG_FILE
  else
    # import 문이 없는 경우 파일 맨 앞에 추가
    sed -i "1i\\
// 정적 생성에서 동적 렌더링으로 전환\\
export const dynamic = 'force-dynamic';\\
" "$file"
    
    echo "  동적 렌더링 지시어가 파일 맨 앞에 추가되었습니다." >> $LOG_FILE
  fi
done

echo "처리가 완료되었습니다." >> $LOG_FILE
echo "결과는 $LOG_FILE 파일에서 확인할 수 있습니다." 