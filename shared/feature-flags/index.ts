// shared/feature-flags/index.ts
import { createClient } from '@vercel/edge-config';

// Feature flag keys
export const FLAGS = {
  ADMIN_SHELL_V2: 'admin_shell_v2',
  ADMIN_ROUTE_PREFIX: 'admin_route_mode_',
} as const;

// Route modes
export type RouteMode = 'legacy' | 'legacy-adapted' | 'v2';

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

/**
 * Check if the new admin shell is enabled.
 * Default: false — opt-in only via Edge Config.
 * Without EDGE_CONFIG env var (e.g. Preview deploys), legacy layout is used.
 */
export async function isAdminShellV2Enabled(): Promise<boolean> {
  return getFlag(FLAGS.ADMIN_SHELL_V2, false);
}

/**
 * Get route mode for a specific admin route.
 * Default: 'legacy-adapted' (all pages wrapped in LegacyPageAdapter)
 */
export async function getRouteMode(route: string): Promise<RouteMode> {
  return getFlag(`${FLAGS.ADMIN_ROUTE_PREFIX}${route}`, 'legacy-adapted');
}
