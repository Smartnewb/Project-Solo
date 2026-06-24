import { NextRequest, NextResponse } from 'next/server';
import { getAdminAccessToken, getSessionMeta } from '@/shared/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8044/api';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const token = await getAdminAccessToken();
	const sessionMeta = await getSessionMeta();

	if (!token) {
		return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
	}

	const { id } = await params;

	const headers: Record<string, string> = {
		Authorization: `Bearer ${token}`,
		'Content-Type': 'application/json',
	};

	if (sessionMeta?.selectedCountry) {
		headers['x-country'] = sessionMeta.selectedCountry;
	}

	let body: string | undefined;
	try {
		const parsed = await request.json();
		body = JSON.stringify(parsed);
	} catch {
		body = JSON.stringify({});
	}

	const response = await fetch(`${BACKEND_URL}/support-chat/admin/kb-candidates/${id}/approve`, {
		method: 'POST',
		headers,
		body,
	});

	if (!response.ok) {
		const text = await response.text();
		return NextResponse.json(
			{ error: `kb-candidates approve failed: ${response.status}`, detail: text.slice(0, 300) },
			{ status: response.status },
		);
	}

	const data = await response.json();
	return NextResponse.json(data);
}
