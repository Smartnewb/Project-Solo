/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { isSameOrigin } from '@/shared/lib/csrf';

const ORIGIN = 'http://localhost:3000';

function makeRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(`${ORIGIN}/api/admin-proxy/users`, {
    method: 'POST',
    headers,
  });
}

describe('isSameOrigin (csrf)', () => {
  it('returns true when Origin header matches the request origin', () => {
    expect(isSameOrigin(makeRequest({ Origin: ORIGIN }))).toBe(true);
  });

  it('returns false when Origin header is cross-origin', () => {
    expect(isSameOrigin(makeRequest({ Origin: 'https://evil.example' }))).toBe(false);
  });

  it('returns true when Origin is absent but Referer matches', () => {
    expect(isSameOrigin(makeRequest({ Referer: `${ORIGIN}/admin/users` }))).toBe(true);
  });

  it('returns false when Origin is absent but Referer is cross-origin', () => {
    expect(isSameOrigin(makeRequest({ Referer: 'https://evil.example/page' }))).toBe(false);
  });

  it('returns false when both Origin and Referer are absent (fail-closed)', () => {
    // A browser-issued same-origin mutation always carries one of these
    // headers. Neither present ⇒ treat the request as a forged CSRF attempt.
    expect(isSameOrigin(makeRequest())).toBe(false);
  });

  it('returns false for a malformed Origin value', () => {
    expect(isSameOrigin(makeRequest({ Origin: 'not-a-url' }))).toBe(false);
  });

  it('prioritises Origin over Referer', () => {
    const req = makeRequest({
      Origin: 'https://evil.example',
      Referer: `${ORIGIN}/admin/users`,
    });
    expect(isSameOrigin(req)).toBe(false);
  });
});
