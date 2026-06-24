import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'node:crypto';
import { getSessionMeta } from '@/shared/auth';

// openclaw CS Playground — 어드민이 입력한 CS 질문을 openclaw 동기 엔드포인트로 보내
// RAG 답변(answer/confidence/domain/sources)을 즉시 받아온다. 실 CS 세션과 무관(미리보기).
// 서버사이드 프록시: 어드민 https → openclaw http 의 mixed-content/CORS 회피 + HMAC 서명.

const OPENCLAW_URL = process.env.OPENCLAW_URL;
const OPENCLAW_SECRET = process.env.OPENCLAW_WEBHOOK_SECRET;
const TIMEOUT_MS = 60_000; // RAG + gpt-5-nano ~20-30s

interface PlaygroundResult {
  answer: string;
  confidence: number;
  domain: string;
  sources: Array<{ question: string; answer: string; similarity: number }>;
}

export async function POST(request: NextRequest) {
  const session = await getSessionMeta();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // No Silent Fallback: 설정 누락은 조용히 넘기지 않고 명시적 503.
  if (!OPENCLAW_URL || !OPENCLAW_SECRET) {
    return NextResponse.json(
      { error: 'openclaw가 설정되지 않았습니다 (OPENCLAW_URL / OPENCLAW_WEBHOOK_SECRET).' },
      { status: 503 }
    );
  }

  let message: string;
  let language: 'ko' | 'ja';
  try {
    const parsed = await request.json();
    message = (parsed?.message ?? '').toString().trim();
    language = parsed?.language === 'ja' ? 'ja' : 'ko';
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: '질문을 입력하세요.' }, { status: 400 });
  }

  const payload = JSON.stringify({ message, language });
  const signature =
    'sha256=' + createHmac('sha256', OPENCLAW_SECRET).update(payload).digest('hex');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${OPENCLAW_URL}/playground`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hub-Signature-256': signature,
      },
      body: payload,
      signal: controller.signal,
    });
    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { error: `openclaw 응답 오류 (HTTP ${res.status})`, detail: text.slice(0, 300) },
        { status: 502 }
      );
    }
    const result = JSON.parse(text) as PlaygroundResult;
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isTimeout = msg.toLowerCase().includes('abort');
    return NextResponse.json(
      { error: isTimeout ? 'openclaw 응답 시간 초과 (60s)' : `openclaw 연결 실패: ${msg}` },
      { status: 504 }
    );
  } finally {
    clearTimeout(timer);
  }
}
