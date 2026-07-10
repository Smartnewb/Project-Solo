import { NextRequest, NextResponse } from 'next/server';
import { getAdminAccessToken, getSessionMeta } from '@/shared/auth';
import { isSameOrigin } from '@/shared/lib/csrf';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8044/api';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	if (!isSameOrigin(request)) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
	}

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

	const response = await fetch(`${BACKEND_URL}/support-chat/admin/kb-candidates/${id}/reject`, {
		method: 'POST',
		headers,
	});

	if (!response.ok) {
		const text = await response.text();
		return NextResponse.json(
			{ error: `kb-candidates reject failed: ${response.status}`, detail: text.slice(0, 300) },
			{ status: response.status },
		);
	}

	const data = await response.json();
	return NextResponse.json(data);
}
