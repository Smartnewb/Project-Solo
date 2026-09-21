// shared/feature-flags/index.ts
import { createClient } from '@vercel/edge-config';

const edgeConfig = process.env.EDGE_CONFIG ? createClient(process.env.EDGE_CONFIG) : null;

/**
 * Get a feature flag value. Falls back to defaultValue if Edge Config
 * is not configured (local dev) or key doesn't exist.
 */
export async function getFlag<T>(key: string, defaultValue: T): Promise<T> {
  if (!edgeConfig) return defaultValue;
  try {
    const value = await edgeConfig.get<T>(key);
    return value ?? defaultValue;
  } catch {
    return defaultValue;
  }
}
