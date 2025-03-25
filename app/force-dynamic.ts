// 모든 라우트 세그먼트에 적용되는 렌더링 설정
//
// 이 파일을 route.js, page.js 또는 layout.js가 있는 디렉토리에 배치하면
// 해당 세그먼트와 모든 하위 세그먼트에 이 설정이 적용됩니다.
//
// Vercel 빌드 시 쿠키 사용 관련 정적 생성 오류를 해결하기 위함입니다.

export const dynamic = 'force-dynamic'; 