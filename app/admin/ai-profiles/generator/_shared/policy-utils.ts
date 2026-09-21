export function pruneEmpty(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v as object).length === 0) continue;
    if (typeof v === 'string' && v.trim() === '') continue;
    out[k] = v;
  }
  return out;
}

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

export function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function pickExtra(
  value: Record<string, unknown>,
  knownKeys: readonly string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    if (!knownKeys.includes(k)) out[k] = v;
  }
  return out;
}

export function emptyObjectToUndef<T extends Record<string, unknown>>(obj: T): T | undefined {
  return Object.keys(obj).length > 0 ? obj : undefined;
}
