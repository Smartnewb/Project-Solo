# Admin Broken-Control Inventory

**Generated:** 2026-03-12
**Spec reference:** `docs/superpowers/specs/2026-03-12-admin-hybrid-rewrite-design.md`

## Summary

| Pattern | Count | Severity | Resolution |
|---------|-------|----------|------------|
| `console.log/warn/error/debug` | 339 | Medium | Remove in page rewrite |
| `alert()` | 121 | High | Replace with MUI Dialog/toast |
| `confirm()` | 26 | High | Replace with MUI Dialog |
| `window.location` (hard nav) | 5 | High | Replace with Next.js router |
| Direct DOM manipulation | 2 | Medium | Replace with React state/refs |
| `ignoreBuildErrors: true` | 1 | Critical | Remove in Phase 6 |
| Middleware auth bypass | 1 | Critical | Rewrite in Phase 1 |
| `reactStrictMode: false` | 1 | Medium | Enable in Phase 1 |
| Non-deterministic build ID | 1 | Medium | Fix in Phase 1 |

---

## Global Issues

### middleware.ts (lines 13, 17, 51)

- **Issue:** Multiple `return NextResponse.next()` calls bypass all authentication — any unauthenticated request is passed through
- **Most critical:** Line 17 is the early-return that skips auth checks for all routes
- **Impact:** Any user can access `/admin/*` without login
- **Resolution:** Phase 1 — rewrite with cookie-based JWT validation before routing

### next.config.js

| Line | Issue | Severity | Resolution |
|------|-------|----------|------------|
| 57 | `ignoreBuildErrors: true` — TypeScript errors silently pass production builds | Critical | Remove in Phase 6 after type errors are fixed |
| 71 | `reactStrictMode: false` — disables React double-render and lifecycle checks | Medium | Enable in Phase 1 |
| 62 | `CACHE_INVALIDATION: Date.now()` as env var — changes every build | Medium | Replace with a stable version/hash |
| 67 | `generateBuildId: () => \`build-${Date.now()}\`` — non-deterministic, breaks CDN caching | Medium | Use `git rev-parse HEAD` or similar |

---

## Per-File Breakdown

Files are grouped by route. Only files with at least one anti-pattern instance are listed.

### Route: `banners/`

| File | console | alert | confirm | window.location | DOM |
|------|---------|-------|---------|-----------------|-----|
| `banners/page.tsx` | 3 | 3 | 0 | 0 | 0 |
| `banners/components/BannerFormDialog.tsx` | 0 | 0 | 0 | 0 | 1 |

### Route: `card-news/`

| File | console | alert | confirm | window.location | DOM |
|------|---------|-------|---------|-----------------|-----|
| `card-news/page.tsx` | 3 | 6 | 0 | 0 | 0 |
| `card-news/create/page.tsx` | 5 | 5 | 1 | 0 | 0 |
| `card-news/edit/[id]/page.tsx` | 5 | 7 | 1 | 0 | 0 |
| `card-news/components/BackgroundSelector.tsx` | 1 | 4 | 0 | 0 | 0 |
| `card-news/components/CardEditor.tsx` | 1 | 3 | 0 | 0 | 0 |
| `card-news/components/PresetEditModal.tsx` | 1 | 0 | 1 | 0 | 0 |
| `card-news/components/PresetSelectModal.tsx` | 1 | 0 | 0 | 0 | 0 |
| `card-news/components/PresetUploadModal.tsx` | 1 | 0 | 0 | 0 | 0 |

### Route: `chat/`

| File | console | alert | confirm | window.location | DOM |
|------|---------|-------|---------|-----------------|-----|
| `chat/components/ChatManagementTab.tsx` | 6 | 0 | 0 | 0 | 0 |
| `chat/components/ChatRefundTab.tsx` | 4 | 0 | 0 | 0 | 0 |
| `chat/components/ChatStatsTab.tsx` | 1 | 0 | 0 | 0 | 0 |

### Route: `community/`

| File | console | alert | confirm | window.location | DOM |
|------|---------|-------|---------|-----------------|-----|
| `community/page.tsx` | 19 | 0 | 1 | 0 | 0 |

### Route: `dashboard/`

| File | console | alert | confirm | window.location | DOM |
|------|---------|-------|---------|-----------------|-----|
| `dashboard/page.tsx` | 2 | 0 | 0 | 0 | 0 |
| `dashboard/member-stats/page.tsx` | 1 | 0 | 0 | 0 | 0 |
| `dashboard/components/ActionRequired.tsx` | 2 | 0 | 0 | 0 | 0 |
| `dashboard/components/ActionableInsights.tsx` | 1 | 0 | 0 | 0 | 0 |
| `dashboard/components/GemSystemFunnel.tsx` | 2 | 0 | 0 | 0 | 0 |
| `dashboard/components/RevenueOverview.tsx` | 1 | 0 | 0 | 0 | 0 |
| `dashboard/components/UserEngagementStats.tsx` | 1 | 0 | 0 | 0 | 0 |
| `dashboard/components/WeeklyTrend.tsx` | 1 | 0 | 0 | 0 | 0 |

### Route: `deleted-females/`

| File | console | alert | confirm | window.location | DOM |
|------|---------|-------|---------|-----------------|-----|
| `deleted-females/page.tsx` | 0 | 4 | 0 | 0 | 0 |

### Route: `dormant-likes/`

| File | console | alert | confirm | window.location | DOM |
|------|---------|-------|---------|-----------------|-----|
| `dormant-likes/page.tsx` | 0 | 0 | 0 | 0 | 0 |
| `dormant-likes/components/BulkProcessModal.tsx` | 1 | 0 | 1 | 0 | 0 |
| `dormant-likes/components/PendingLikesModal.tsx` | 0 | 8 | 2 | 0 | 0 |

### Route: `fcm-tokens/`

| File | console | alert | confirm | window.location | DOM |
|------|---------|-------|---------|-----------------|-----|
| `fcm-tokens/page.tsx` | 1 | 0 | 0 | 0 | 0 |

### Route: `female-retention/`

| File | console | alert | confirm | window.location | DOM |
|------|---------|-------|---------|-----------------|-----|
| `female-retention/page.tsx` | 2 | 3 | 0 | 0 | 0 |

### Route: `gems/`

| File | console | alert | confirm | window.location | DOM |
|------|---------|-------|---------|-----------------|-----|
| `gems/page.tsx` | 2 | 12 | 0 | 0 | 0 |

### Route: `ios-refund/`

| File | console | alert | confirm | window.location | DOM |
|------|---------|-------|---------|-----------------|-----|
| `ios-refund/page.tsx` | 2 | 2 | 0 | 0 | 0 |

### Route: `kpi-report/`

| File | console | alert | confirm | window.location | DOM |
|------|---------|-------|---------|-----------------|-----|
| `kpi-report/page.tsx` | 4 | 0 | 0 | 0 | 0 |

### Route: `lab/`

| File | console | alert | confirm | window.location | DOM |
|------|---------|-------|---------|-----------------|-----|
| `lab/components/VisionPhotoTestTab.tsx` | 1 | 0 | 0 | 0 | 1 |

### Route: `layout.tsx` (shared)

| File | console | alert | confirm | window.location | DOM |
|------|---------|-------|---------|-----------------|-----|
| `layout.tsx` | 9 | 0 | 0 | 0 | 0 |

### Route: `matching-management/`

| File | console | alert | confirm | window.location | DOM |
|------|---------|-------|---------|-----------------|-----|
| `matching-management/page.tsx` | 18 | 0 | 0 | 0 | 0 |
| `matching-management/useBatchStatus.ts` | 2 | 0 | 0 | 0 | 0 |
| `matching-management/components/ForceMatchingTab.tsx` | 2 | 0 | 0 | 0 | 0 |
| `matching-management/components/GemsManagement.tsx` | 6 | 0 | 0 | 0 | 0 |
| `matching-management/components/LikeHistory.tsx` | 3 | 0 | 0 | 0 | 0 |
| `matching-management/components/MatcherHistory.tsx` | 2 | 0 | 0 | 0 | 0 |
| `matching-management/components/SingleMatching.tsx` | 8 | 0 | 0 | 0 | 0 |
| `matching-management/components/TicketManagement.tsx` | 6 | 0 | 0 | 0 | 0 |

### Route: `profile-review/`

| File | console | alert | confirm | window.location | DOM |
|------|---------|-------|---------|-----------------|-----|
| `profile-review/page.tsx` | 13 | 0 | 0 | 0 | 0 |
| `profile-review/components/ImageReviewPanel.tsx` | 3 | 6 | 2 | 0 | 0 |
| `profile-review/components/ReviewHistoryTab.tsx` | 2 | 0 | 0 | 0 | 0 |
| `profile-review/components/RejectReasonModal.tsx` | 0 | 2 | 0 | 0 | 0 |

### Route: `push-notifications/`

| File | console | alert | confirm | window.location | DOM |
|------|---------|-------|---------|-----------------|-----|
| `push-notifications/page.tsx` | 9 | 12 | 3 | 3 | 0 |

### Route: `reports/`

| File | console | alert | confirm | window.location | DOM |
|------|---------|-------|---------|-----------------|-----|
| `reports/page.tsx` | 6 | 4 | 0 | 0 | 0 |

### Route: `reset-password/`

| File | console | alert | confirm | window.location | DOM |
|------|---------|-------|---------|-----------------|-----|
| `reset-password/page.tsx` | 0 | 2 | 0 | 0 | 0 |

### Route: `sales/`

| File | console | alert | confirm | window.location | DOM |
|------|---------|-------|---------|-----------------|-----|
| `sales/components/DailySalesTrendGraph.tsx` | 1 | 0 | 0 | 0 | 0 |
| `sales/components/InsightsTab.tsx` | 6 | 0 | 0 | 0 | 0 |
| `sales/components/MonthlyPaymentGraph.tsx` | 2 | 0 | 0 | 0 | 0 |
| `sales/components/PaymentAnalysis.tsx` | 2 | 0 | 0 | 0 | 0 |
| `sales/components/PeriodSalesSummary.tsx` | 1 | 0 | 0 | 0 | 0 |
| `sales/components/PeriodSelector.tsx` | 4 | 0 | 0 | 0 | 0 |
| `sales/components/ProductAnalysisTab.tsx` | 5 | 0 | 0 | 0 | 0 |
| `sales/components/RankingByUniv.tsx` | 3 | 0 | 0 | 0 | 0 |
| `sales/components/RevenueMetricsTab.tsx` | 7 | 0 | 0 | 0 | 0 |
| `sales/components/SalesGrowthAnalysis.tsx` | 1 | 0 | 0 | 0 | 0 |
| `sales/components/SuccessRate.tsx` | 1 | 0 | 0 | 0 | 0 |
| `sales/components/TotalAmount.tsx` | 13 | 0 | 0 | 0 | 0 |

### Route: `scheduled-matching/`

| File | console | alert | confirm | window.location | DOM |
|------|---------|-------|---------|-----------------|-----|
| `scheduled-matching/components/BatchDetailModal.tsx` | 1 | 0 | 0 | 0 | 0 |
| `scheduled-matching/components/BatchHistory.tsx` | 1 | 0 | 0 | 0 | 0 |
| `scheduled-matching/components/CountryOverview.tsx` | 5 | 0 | 1 | 0 | 0 |
| `scheduled-matching/components/ManualMatching.tsx` | 5 | 0 | 1 | 0 | 0 |
| `scheduled-matching/components/ScheduleConfig.tsx` | 2 | 0 | 0 | 0 | 0 |

### Route: `sms/`

| File | console | alert | confirm | window.location | DOM |
|------|---------|-------|---------|-----------------|-----|
| `sms/components/MessageComposer.tsx` | 30 | 17 | 4 | 0 | 0 |
| `sms/components/RecipientSelector.tsx` | 10 | 0 | 0 | 0 | 0 |
| `sms/components/SmsHistoryTable.tsx` | 1 | 0 | 0 | 0 | 0 |
| `sms/components/TemplateManager.tsx` | 3 | 5 | 1 | 0 | 0 |

### Route: `sometime-articles/`

| File | console | alert | confirm | window.location | DOM |
|------|---------|-------|---------|-----------------|-----|
| `sometime-articles/page.tsx` | 3 | 3 | 1 | 0 | 0 |
| `sometime-articles/create/page.tsx` | 1 | 1 | 1 | 0 | 0 |
| `sometime-articles/edit/[id]/page.tsx` | 2 | 1 | 1 | 0 | 0 |
| `sometime-articles/components/ImageUploader.tsx` | 1 | 0 | 0 | 0 | 0 |
| `sometime-articles/components/MarkdownEditor.tsx` | 1 | 3 | 0 | 0 | 0 |

### Route: `support-chat/`

| File | console | alert | confirm | window.location | DOM |
|------|---------|-------|---------|-----------------|-----|
| `support-chat/components/ChatDetailDialog.tsx` | 4 | 0 | 0 | 0 | 0 |
| `support-chat/components/ChatPanel.tsx` | 4 | 0 | 0 | 0 | 0 |
| `support-chat/components/SessionListTab.tsx` | 1 | 0 | 0 | 0 | 0 |
| `support-chat/hooks/useSessionPolling.ts` | 2 | 0 | 0 | 0 | 0 |
| `support-chat/hooks/useSupportChatSocket.ts` | 10 | 0 | 0 | 0 | 0 |

### Route: `universities/`

| File | console | alert | confirm | window.location | DOM |
|------|---------|-------|---------|-----------------|-----|
| `universities/page.tsx` | 1 | 2 | 1 | 0 | 0 |
| `universities/components/DepartmentManagement.tsx` | 1 | 3 | 1 | 0 | 0 |
| `universities/components/UniversityDetailDialog.tsx` | 1 | 0 | 0 | 0 | 0 |
| `universities/components/UniversityFormDialog.tsx` | 1 | 2 | 0 | 0 | 0 |
| `universities/components/DepartmentCsvUpload.tsx` | 0 | 0 | 1 | 0 | 0 |
| `universities/components/LogoUpload.tsx` | 0 | 0 | 1 | 0 | 0 |

### Route: `users/`

| File | console | alert | confirm | window.location | DOM |
|------|---------|-------|---------|-----------------|-----|
| `users/page.tsx` | 21 | 1 | 0 | 1 | 0 |
| `users/appearance/page.tsx` | 11 | 0 | 0 | 0 | 0 |

### Shared Components

| File | console | alert | confirm | window.location | DOM |
|------|---------|-------|---------|-----------------|-----|
| `components/CountrySelectorModal.tsx` | 4 | 0 | 0 | 1 | 0 |

---

## High-Priority Files (Most Anti-Patterns)

Files with the most accumulated debt, highest priority for rewrite:

| File | Total Issues | Breakdown |
|------|-------------|-----------|
| `sms/components/MessageComposer.tsx` | 51 | 30 console + 17 alert + 4 confirm |
| `community/page.tsx` | 20 | 19 console + 1 confirm |
| `matching-management/page.tsx` | 18 | 18 console |
| `push-notifications/page.tsx` | 27 | 9 console + 12 alert + 3 confirm + 3 window.location |
| `users/page.tsx` | 23 | 21 console + 1 alert + 1 window.location |
| `gems/page.tsx` | 14 | 2 console + 12 alert |
| `sales/components/TotalAmount.tsx` | 13 | 13 console |
| `profile-review/page.tsx` | 13 | 13 console |

---

## Resolution Mapping

| Severity | Pattern | Target API |
|----------|---------|-----------|
| Critical | Middleware bypass | Cookie-based JWT check in middleware.ts |
| Critical | `ignoreBuildErrors: true` | Remove flag; fix all TS errors first |
| High | `alert()` | MUI `Snackbar`/`Alert` or `Dialog` |
| High | `confirm()` | MUI `Dialog` with confirm/cancel buttons |
| High | `window.location.href` | `useRouter().push()` from `next/navigation` |
| Medium | `window.location.reload()` | `router.refresh()` from `next/navigation` |
| Medium | `console.*` | Remove or replace with structured logger |
| Medium | DOM manipulation | React `ref` or state-driven rendering |
| Medium | `reactStrictMode: false` | Set to `true` in next.config.js |
| Medium | Non-deterministic build ID | Use `git rev-parse --short HEAD` |
