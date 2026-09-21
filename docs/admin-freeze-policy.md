# Admin Legacy Code Freeze Policy

**Effective:** Phase 0 start ~ Phase 6 completion
**Scope:** All files under `app/admin/`, `app/services/admin.ts`, admin-related contexts

## Rules

### Allowed Changes (긴급 수정만)

1. **Production bug fixes** that cause data loss or user-facing errors
2. **Security patches** for critical vulnerabilities
3. **Backend API contract changes** that break existing functionality (forced by backend team)

### Forbidden Changes

1. New features in legacy admin pages
2. Refactoring or "cleanup" of legacy code
3. Adding new dependencies for legacy pages
4. Changing admin routing structure outside the rewrite plan
5. Modifying `app/services/admin.ts` except for bug fixes

### Process for Allowed Changes

1. Describe the issue and why it cannot wait for the rewrite
2. Make the minimal change needed
3. Tag the commit with `fix(admin-legacy):` prefix
4. Document the change in this file's changelog below

### Changelog

| Date | Description | Commit |
|------|-------------|--------|
| (template — add entries as needed) | | |

## Rationale

The hybrid rewrite replaces pages one by one under a new Shell. If legacy code keeps changing,
the rewrite target moves and adapter/bridge assumptions break. Freezing legacy code ensures
stability during the transition.
