import { NextRequest, NextResponse } from 'next/server';
import { getAdminAccessToken, getSessionMeta } from '@/shared/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8044/api';

export async function GET(request: NextRequest) {
	const token = await getAdminAccessToken();
	const sessionMeta = await getSessionMeta();

	if (!token) {
		return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
	}

	const { searchParams } = request.nextUrl;
	const url = new URL(`${BACKEND_URL}/support-chat/admin/kb-candidates`);

	const limit = searchParams.get('limit');
	const offset = searchParams.get('offset');

	if (limit != null) url.searchParams.set('limit', limit);
	if (offset != null) url.searchParams.set('offset', offset);

	const headers: Record<string, string> = {
		Authorization: `Bearer ${token}`,
	};

	if (sessionMeta?.selectedCountry) {
		headers['x-country'] = sessionMeta.selectedCountry;
	}

	const response = await fetch(url.toString(), {
		method: 'GET',
		headers,
	});

	if (!response.ok) {
		const text = await response.text();
		return NextResponse.json(
			{ error: `kb-candidates fetch failed: ${response.status}`, detail: text.slice(0, 300) },
			{ status: response.status },
		);
	}

	const data = await response.json();
	return NextResponse.json(data);
}
