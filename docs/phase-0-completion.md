# Phase 0: Baseline and Freeze — Completion Checklist

## Deliverables

- [x] `.npmrc` with `shamefully-hoist=true`
- [x] `pnpm install` works cleanly
- [x] `pnpm build` completes
- [x] `preinstall` script enforces pnpm-only
- [x] `docs/vercel-pnpm-setup.md` — Vercel configuration documented
- [x] `docs/admin-freeze-policy.md` — freeze rules documented
- [x] `docs/inventories/route-inventory.md` — 31 routes cataloged
- [x] `docs/inventories/api-inventory.md` — admin.ts functions cataloged
- [x] `docs/inventories/broken-control-inventory.md` — anti-patterns cataloged
- [x] `docs/inventories/auth-localstorage-inventory.md` — auth keys mapped
- [x] `tsconfig.admin-v2.json` — scoped strict TypeScript
- [x] `.eslintrc.admin-v2.json` — scoped strict ESLint
- [x] `pnpm typecheck:admin-v2` passes
- [x] `pnpm lint:admin-v2` passes
- [x] `pnpm quality:admin-v2` passes
- [x] All commits pushed to branch

## Quality Gate Status

```bash
pnpm quality:admin-v2  # Must exit 0
```

## Ready for Phase 1?

Phase 1 can begin when ALL items above are checked.
Phase 1 scope: AdminShell, BFF routes, middleware rewrite, LegacyPageAdapter.
