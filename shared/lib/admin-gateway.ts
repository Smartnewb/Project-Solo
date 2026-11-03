// 운영 WAF admin-gate 규칙은 이 헤더가 없는 어드민 API 요청을 #sometime-incidents 에 알린다.
// 값은 Secrets Manager sometimes-admin-gateway 와 같고 Vercel 환경변수 ADMIN_GATEWAY_SECRET 에 둔다.
// 비어 있으면 헤더를 빼서 보낸다. 그러면 WAF 알림으로 바로 드러난다
export function adminGatewayHeader(): Record<string, string> {
	const secret = process.env.ADMIN_GATEWAY_SECRET;
	return secret ? { 'x-admin-gateway': secret } : {};
}
