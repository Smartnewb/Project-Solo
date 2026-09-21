function toOrigin(value?: string): string | null {
	if (!value) return null;
	try {
		return new URL(value).origin;
	} catch {
		return null;
	}
}

// Origins the browser may legitimately talk to: the API and the support-chat
// socket (socket.io needs both https and wss forms of its origin).
export function allowedConnectOrigins(): string {
	const apiOrigin = toOrigin(process.env.NEXT_PUBLIC_API_URL);
	const socketOrigin = toOrigin(process.env.NEXT_PUBLIC_SOCKET_URL);
	const socketWsOrigin = socketOrigin
		? socketOrigin.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:')
		: null;
	return ["'self'", apiOrigin, socketOrigin, socketWsOrigin].filter(Boolean).join(' ');
}

// Per-request nonce CSP. Next.js reads the nonce off the request's CSP header
// and applies it to its own bootstrap scripts; 'strict-dynamic' lets those
// nonce'd scripts load webpack chunks. unsafe-inline/unsafe-eval stay in dev
// for React Refresh.
export function buildContentSecurityPolicy(nonce: string): string {
	const isDev = process.env.NODE_ENV !== 'production';
	const connect = allowedConnectOrigins();
	return [
		"default-src 'self'",
		isDev
			? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
			: `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' data: blob: https:",
		isDev ? `connect-src ${connect} https: http: wss: ws:` : `connect-src ${connect}`,
		"font-src 'self' data: https:",
		"frame-src 'self' https:",
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		"frame-ancestors 'none'",
	].join('; ');
}
