# Admin Route Inventory

**Generated:** 2026-03-12
**Total routes:** 31
**Spec reference:** `docs/superpowers/specs/2026-03-12-admin-hybrid-rewrite-design.md`

## Summary by Phase

| Phase | Routes | Count |
|-------|--------|-------|
| Phase 2 | dashboard, kpi-report | 2 |
| Phase 3A | users, profile-review, push-notifications | 3 |
| Phase 3B | matching-management | 1 |
| Phase 4 | reports, sms, support-chat, community | 4 |
| Phase 5 | ai-chat, app-reviews, banners, card-news, chat, deleted-females, dormant-likes, fcm-tokens, female-retention, force-matching, gems, ios-refund, lab, likes, moment, reset-password, sales, scheduled-matching, sometime-articles, universities, version-management | 21 |
| **Total** | | **31** |

## Detailed Inventory

| # | Route | File Path | Phase | 'use client' | Files Count | Patterns (axios/localStorage/alert) | Notes |
|---|-------|-----------|-------|--------------|-------------|--------------------------------------|-------|
| 1 | ai-chat | app/admin/ai-chat/page.tsx | 5 | Yes | 3 | 0/0/0 | |
| 2 | app-reviews | app/admin/app-reviews/page.tsx | 5 | Yes | 4 | 0/0/0 | |
| 3 | banners | app/admin/banners/page.tsx | 5 | Yes | 3 | 0/0/1 | alert usage |
| 4 | card-news | app/admin/card-news/page.tsx | 5 | Yes | 10 | 0/0/6 | heavy alert usage |
| 5 | chat | app/admin/chat/page.tsx | 5 | Yes | 4 | 0/0/0 | |
| 6 | community | app/admin/community/page.tsx | 4 | Yes | 1 | 0/0/1 | alert usage |
| 7 | dashboard | app/admin/dashboard/page.tsx | 2 | Yes | 11 | 0/2/1 | localStorage + alert |
| 8 | deleted-females | app/admin/deleted-females/page.tsx | 5 | Yes | 1 | 0/0/1 | alert usage |
| 9 | dormant-likes | app/admin/dormant-likes/page.tsx | 5 | Yes | 4 | 0/0/2 | alert usage |
| 10 | fcm-tokens | app/admin/fcm-tokens/page.tsx | 5 | Yes | 1 | 0/0/0 | |
| 11 | female-retention | app/admin/female-retention/page.tsx | 5 | Yes | 1 | 0/0/1 | alert usage |
| 12 | force-matching | app/admin/force-matching/page.tsx | 5 | Yes | 1 | 0/0/0 | |
| 13 | gems | app/admin/gems/page.tsx | 5 | Yes | 2 | 1/0/1 | axios + alert |
| 14 | ios-refund | app/admin/ios-refund/page.tsx | 5 | Yes | 1 | 0/0/1 | alert usage |
| 15 | kpi-report | app/admin/kpi-report/page.tsx | 2 | Yes | 8 | 0/1/0 | localStorage usage |
| 16 | lab | app/admin/lab/page.tsx | 5 | Yes | 2 | 1/0/0 | axios usage |
| 17 | likes | app/admin/likes/page.tsx | 5 | Yes | 1 | 0/0/0 | |
| 18 | matching-management | app/admin/matching-management/page.tsx | 3B | Yes | 12 | 4/0/0 | heavy axios usage |
| 19 | moment | app/admin/moment/page.tsx | 5 | Yes | 6 | 0/0/0 | |
| 20 | profile-review | app/admin/profile-review/page.tsx | 3A | No | 6 | 1/1/2 | no 'use client'; axios + localStorage + alert |
| 21 | push-notifications | app/admin/push-notifications/page.tsx | 3A | Yes | 1 | 0/1/1 | localStorage + alert |
| 22 | reports | app/admin/reports/page.tsx | 4 | No | 1 | 0/0/1 | no 'use client'; alert usage |
| 23 | reset-password | app/admin/reset-password/page.tsx | 5 | Yes | 1 | 0/0/1 | alert usage |
| 24 | sales | app/admin/sales/page.tsx | 5 | No | 19 | 0/0/0 | no 'use client'; largest dir (19 files) |
| 25 | scheduled-matching | app/admin/scheduled-matching/page.tsx | 5 | Yes | 14 | 1/0/2 | axios + alert |
| 26 | sms | app/admin/sms/page.tsx | 4 | Yes | 7 | 0/1/2 | localStorage + alert |
| 27 | sometime-articles | app/admin/sometime-articles/page.tsx | 5 | Yes | 5 | 0/0/4 | heavy alert usage |
| 28 | support-chat | app/admin/support-chat/page.tsx | 4 | Yes | 8 | 0/1/1 | localStorage + alert |
| 29 | universities | app/admin/universities/page.tsx | 5 | Yes | 11 | 0/0/5 | heavy alert usage |
| 30 | users | app/admin/users/page.tsx | 3A | Yes | 3 | 1/0/1 | axios + alert |
| 31 | version-management | app/admin/version-management/page.tsx | 5 | Yes | 1 | 0/0/0 | |

## Pattern Summary

| Pattern | Routes Affected | Count |
|---------|----------------|-------|
| Direct axios usage | matching-management, gems, lab, scheduled-matching, profile-review, users | 6 |
| localStorage usage | dashboard, kpi-report, profile-review, push-notifications, sms, support-chat | 6 |
| alert/confirm usage | banners, card-news, community, dashboard, deleted-females, dormant-likes, female-retention, gems, ios-refund, profile-review, push-notifications, reports, reset-password, scheduled-matching, sms, sometime-articles, support-chat, universities, users | 19 |
| Missing 'use client' | profile-review, reports, sales | 3 |

## Notes

- **profile-review** is the only Phase 3A route missing `'use client'` — needs attention during rewrite.
- **reports** (Phase 4) is missing `'use client'` — server component or omission to verify.
- **sales** (Phase 5) has no `'use client'` and is the largest directory at 19 files.
- **matching-management** (Phase 3B) has the most direct axios calls (4 files) — highest migration effort.
- **alert/confirm** is used in 19 of 31 routes (61%) — broad impact for replacement with modal dialogs.
