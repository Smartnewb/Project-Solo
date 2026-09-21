# Admin API Inventory

**Generated:** 2026-03-12
**Source file:** `app/services/admin.ts` (4,756 lines)
**Spec reference:** `docs/superpowers/specs/2026-03-12-admin-hybrid-rewrite-design.md`

---

## Summary

| Metric | Count |
|--------|-------|
| Total service methods (async) | 163 |
| Domain groups (const objects) | 29 |
| GET endpoints | 85 |
| POST endpoints | 41 |
| PUT endpoints | 3 |
| PATCH endpoints | 9 |
| DELETE endpoints | 10 |
| Direct `fetch()` calls (in admin.ts, bypassing axios) | 6 |
| Direct `axiosServer`/`axiosNextGen` calls in admin pages | 16+ |

## Axios Instance Usage

| Instance | Count | Purpose |
|----------|-------|---------|
| `axiosServer` | 159 | JSON API calls, 15s timeout |
| `axiosMultipart` | 1 | File uploads, 30s timeout |
| `axiosNextGen` | 17 | Direct next-gen backend calls, 15s timeout |
| Direct `fetch()` | 6 | Multipart uploads that bypass axios entirely (banners, presets, gems bulk-grant, sometime-articles image, preset upload) |

### Notes on Direct `fetch()` Calls
These 6 methods in `admin.ts` use the native `fetch()` API instead of any axios instance, typically for multipart form uploads where they need fine-grained control over headers. They must be migrated to `axiosMultipart` or a React Query mutation with proper FormData handling:

| Method | Endpoint |
|--------|----------|
| `backgroundPresets.upload` | `POST /admin/background-presets/upload` |
| `backgroundPresets.uploadAndCreate` | `POST /admin/background-presets/upload-and-create` |
| `backgroundPresets.uploadSectionImage` | `POST /admin/background-presets/upload` (section variant) |
| `gems.bulkGrant` | `POST /admin/gems/bulk-grant` |
| `banners.create` | `POST /admin/banners` |
| `sometimeArticles.uploadImage` | `POST /admin/sometime-articles/upload` |

---

## Function Inventory

### auth (line 72)

| # | Method Name | HTTP | Endpoint | Instance |
|---|-------------|------|----------|----------|
| 1 | `auth.cleanup` | — | (localStorage only, no HTTP) | — |

### stats (line 79)

| # | Method Name | HTTP | Endpoint | Instance |
|---|-------------|------|----------|----------|
| 2 | `getTotalUsersCount` | GET | `/admin/stats/users/total` | axiosServer |
| 3 | `getDailySignupCount` | GET | `/admin/stats/users/daily` | axiosServer |
| 4 | `getWeeklySignupCount` | GET | `/admin/stats/users/weekly` | axiosServer |
| 5 | `getDailySignupTrend` | GET | `/admin/stats/users/trend/daily` | axiosServer |
| 6 | `getWeeklySignupTrend` | GET | `/admin/stats/users/trend/weekly` | axiosServer |
| 7 | `getMonthlySignupTrend` | GET | `/admin/stats/users/trend/monthly` | axiosServer |
| 8 | `getCustomPeriodSignupCount` | POST | `/admin/stats/users/custom-period` | axiosServer |
| 9 | `getCustomPeriodSignupTrend` | POST | `/admin/stats/users/custom-period` (trend variant) | axiosServer |
| 10 | `getGenderStats` | GET | `/admin/stats/users/gender` | axiosServer |
| 11 | `getUniversityStats` | GET | `/admin/stats/users/universities` | axiosServer |
| 12 | `getTotalWithdrawalsCount` | GET | `/admin/stats/withdrawals/total` | axiosServer |
| 13 | `getDailyWithdrawalCount` | GET | `/admin/stats/withdrawals/daily` | axiosServer |
| 14 | `getWeeklyWithdrawalCount` | GET | `/admin/stats/withdrawals/weekly` | axiosServer |
| 15 | `getMonthlyWithdrawalCount` | GET | `/admin/stats/withdrawals/monthly` | axiosServer |
| 16 | `getCustomPeriodWithdrawalCount` | POST | `/admin/stats/withdrawals/custom-period` | axiosServer |
| 17 | `getDailyWithdrawalTrend` | GET | `/admin/stats/withdrawals/trend/daily` | axiosServer |
| 18 | `getWeeklyWithdrawalTrend` | GET | `/admin/stats/withdrawals/trend/weekly` | axiosServer |
| 19 | `getMonthlyWithdrawalTrend` | GET | `/admin/stats/withdrawals/trend/monthly` | axiosServer |
| 20 | `getCustomPeriodWithdrawalTrend` | POST | `/admin/stats/withdrawals/trend/custom-period` | axiosServer |
| 21 | `getWithdrawalReasonStats` | GET | `/admin/stats/withdrawals/reasons` | axiosServer |
| 22 | `getChurnRate` | GET | `/admin/stats/withdrawals/churn-rate` | axiosServer |

### userAppearance (line 524)

| # | Method Name | HTTP | Endpoint | Instance |
|---|-------------|------|----------|----------|
| 23 | `getUsersWithAppearanceGrade` | GET | `/admin/users/appearance` (dynamic URL) | axiosServer |
| 24 | `getUnclassifiedUsers` | GET | `/admin/users/appearance` (unclassified variant) | axiosServer |
| 25 | `setUserAppearanceGrade` | PATCH | `/admin/users/appearance/:userId` | axiosServer |
| 26 | `bulkSetUserAppearanceGrade` | PATCH | `/admin/users/appearance/bulk` | axiosServer |
| 27 | `getUserDetails` | GET | `/admin/users/:userId/detail` (dynamic) | axiosServer |
| 28 | `getUserTickets` | GET | `/admin/users/:userId/tickets` (dynamic) | axiosServer |
| 29 | `createUserTickets` | POST | `/admin/users/:userId/tickets` (dynamic) | axiosServer |
| 30 | `deleteUserTickets` | DELETE | `/admin/users/:userId/tickets` (dynamic) | axiosServer |
| 31 | `getUserGems` | GET | `/admin/users/:userId/gems` (dynamic) | axiosServer |
| 32 | `addUserGems` | POST | `/admin/users/:userId/gems` (dynamic) | axiosServer |
| 33 | `removeUserGems` | POST | `/admin/users/:userId/gems/remove` (dynamic) | axiosServer |
| 34 | `updateUserProfile` | POST | `/admin/users/:userId/profile` (dynamic) | axiosServer |
| 35 | `updateAccountStatus` | POST | `/admin/users/detail/status` | axiosServer |
| 36 | `sendWarningMessage` | POST | `/admin/users/detail/warning` | axiosServer |
| 37 | `sendEmailNotification` | POST | `/admin/notification/email` | axiosServer |
| 38 | `sendSmsNotification` | POST | `/admin/notification/sms` | axiosServer |
| 39 | `forceLogout` | POST | `/admin/users/detail/logout` | axiosServer |
| 40 | `sendProfileUpdateRequest` | POST | `/admin/users/detail/profile-update-request` | axiosServer |
| 41 | `setInstagramError` | POST | `/admin/users/detail/instagram-error` | axiosServer |
| 42 | `resetInstagramError` | POST | `/admin/users/detail/instagram-reset` | axiosServer |
| 43 | `getAppearanceGradeStats` | GET | `/admin/users/appearance` (stats variant) | axiosServer |
| 44 | `deleteUser` | DELETE | `/admin/users/:userId` | axiosServer |
| 45 | `getDuplicatePhoneUsers` | GET | `/admin/users/duplicate-phone` | axiosServer |
| 46 | `getVerifiedUsers` | GET | `/admin/users/verified` | axiosServer |
| 47 | `getUniversityVerificationPending` | GET | `/admin/university-verification` (pending) | axiosServer |
| 48 | `approveUniversityVerification` | POST | `/admin/university-verification/approve` | axiosServer |
| 49 | `rejectUniversityVerification` | POST | `/admin/university-verification/reject` | axiosServer |
| 50 | `getBlacklistUsers` | GET | `/admin/users/blacklist` | axiosServer |
| 51 | `releaseFromBlacklist` | PATCH | `/admin/users/:userId/blacklist/release` | axiosServer |
| 52 | `searchUsersForReset` | GET | `/admin/users/search` | axiosServer |
| 53 | `resetPassword` | PATCH | `/admin/users/:userId/reset-password` | axiosServer |
| 54 | `getReapplyUsers` | GET | `/admin/users/approval/reapply` | axiosServer |
| 55 | `getPendingUsers` | GET | `/admin/users/approval/pending` | axiosServer |
| 56 | `getRejectedUsers` | GET | `/admin/users/approval/rejected` | axiosServer |
| 57 | `revokeUserApproval` | PATCH | `/admin/users/approval/:userId/revoke-approval` | axiosServer |

### profileImages (line 1701)

| # | Method Name | HTTP | Endpoint | Instance |
|---|-------------|------|----------|----------|
| 58 | `getPendingProfileImages` | GET | `/admin/profile-images/pending` | axiosServer |
| 59 | `approveProfileImage` | POST | `/admin/profile-images/users/:userId/approve` | axiosServer |
| 60 | `rejectProfileImage` | POST | `/admin/profile-images/users/:userId/reject` | axiosServer |
| 61 | `approveIndividualImage` | POST | `/admin/profile-images/:imageId/approve` | axiosServer |
| 62 | `rejectIndividualImage` | POST | `/admin/profile-images/:imageId/reject` | axiosServer |
| 63 | `setMainImage` | POST | `/admin/profile-images/set-main` (dynamic) | axiosServer |

### userReview (line 1878)

| # | Method Name | HTTP | Endpoint | Instance |
|---|-------------|------|----------|----------|
| 64 | `getPendingUsers` | GET | `/admin/profile-images/pending` | axiosServer |
| 65 | `getUserDetail` | GET | `/admin/user-review/:userId` | axiosServer |
| 66 | `approveUser` | POST | `/admin/profile-images/users/:userId/approve` | axiosServer |
| 67 | `rejectUser` | POST | `/admin/user-review/:userId/reject` | axiosServer |
| 68 | `bulkRejectUsers` | PATCH | `/admin/user-review/bulk-reject` (dynamic) | axiosServer |
| 69 | `updateUserRank` | PATCH | `/admin/user-review/:userId/rank` (dynamic) | axiosServer |
| 70 | `getImageValidation` | GET | `/admin/profile-images/:imageId/validation` | axiosServer |
| 71 | `getReviewHistory` | GET | `/admin/profile-images/review-history` | axiosServer |

### universities (line 2050)

| # | Method Name | HTTP | Endpoint | Instance |
|---|-------------|------|----------|----------|
| 72 | `getRegions` (meta) | GET | `/admin/universities/meta/regions` | axiosServer |
| 73 | `getTypes` (meta) | GET | `/admin/universities/meta/types` | axiosServer |
| 74 | `getFoundations` (meta) | GET | `/admin/universities/meta/foundations` | axiosServer |
| 75 | `getList` | GET | `/admin/universities` | axiosServer |
| 76 | `getById` | GET | `/admin/universities/:id` | axiosServer |
| 77 | `create` | POST | `/admin/universities` | axiosServer |
| 78 | `update` | PUT | `/admin/universities/:id` | axiosServer |
| 79 | `delete` | DELETE | `/admin/universities/:id` | axiosServer |
| 80 | `uploadLogo` | POST | `/admin/universities/:id/logo` | axiosServer |
| 81 | `deleteLogo` | DELETE | `/admin/universities/:id/logo` | axiosServer |
| 82 | `getDepartments` (by univ) | GET | `/admin/universities/:universityId/departments` | axiosServer |
| 83 | `searchDepartments` | GET | `/admin/universities/departments/search` (dynamic) | axiosServer |
| 84 | `createDepartment` | POST | `/admin/universities/departments` (dynamic) | axiosServer |
| 85 | `updateDepartment` | PUT | `/admin/universities/departments/:id` (dynamic) | axiosServer |
| 86 | `deleteDepartment` | DELETE | `/admin/universities/departments/:id` (dynamic) | axiosServer |
| 87 | `uploadDepartmentCsv` | POST | `/admin/universities/departments/csv` (dynamic) | axiosServer |
| 88 | `getClusters` (search) | GET | `/admin/universities/clusters/search` (dynamic) | axiosServer |
| 89 | `createCluster` | POST | `/admin/universities/clusters` (dynamic) | axiosServer |
| 90 | `getUniversities` | GET | `/admin/universities` | axiosServer |
| 91 | `getClusters` | GET | `/admin/universities/clusters` | axiosServer |
| 92 | `getDepartments` | GET | `/universities/departments` | axiosServer |

### matching (line 2749)

| # | Method Name | HTTP | Endpoint | Instance |
|---|-------------|------|----------|----------|
| 93 | `getMatchHistory` | GET | `/admin/matching/match-history` | axiosServer |
| 94 | `getMatchCount` | GET | `/admin/matching/match-count` | axiosServer |
| 95 | `getUserMatchCount` | GET | `/admin/matching/match-count` (user variant) | axiosServer |
| 96 | `getMatcherHistory` | GET | `/admin/matching/match-history` (matcher variant) | axiosServer |
| 97 | `createDirectMatch` | POST | `/admin/matching/direct-match` | axiosServer |
| 98 | `getFailureLogs` | GET | `/admin/matching/failure-logs` | axiosServer |
| 99 | `findMatches` | POST | `/admin/matching/user/read` | axiosServer |
| 100 | `getUnmatchedUsers` | GET | `/admin/matching/unmatched-users` | axiosServer |
| 101 | `processBatchMatching` | POST | `/admin/matching/batch` | axiosServer |
| 102 | `processSingleMatching` | POST | `/admin/matching/user` | axiosServer |
| 103 | `getLikeHistory` | GET | `/admin/matching/like-history` | axiosServer |
| 104 | `getMatchingStats` | GET | `/admin/matching/stats` (commented out) | axiosServer |

### reports (line 3180)

| # | Method Name | HTTP | Endpoint | Instance |
|---|-------------|------|----------|----------|
| 105 | `getProfileReports` | GET | `/admin/reports` (dynamic URL) | axiosServer |
| 106 | `getProfileReportDetail` | GET | `/admin/reports/:reportId` (dynamic) | axiosServer |
| 107 | `updateReportStatus` | PATCH | `/admin/reports/:reportId/status` (dynamic) | axiosServer |
| 108 | `getChatHistory` | GET | `/admin/community/chat/:chatRoomId/messages` | axiosServer |
| 109 | `getUserProfileImages` | GET | `/admin/community/users/:userId/profile-images` | axiosServer |

### pushNotifications (line 3293)

| # | Method Name | HTTP | Endpoint | Instance |
|---|-------------|------|----------|----------|
| 110 | `filterUsers` | POST | `/admin/push-notifications/filter-users` | axiosServer |
| 111 | `sendBulkNotification` | POST | `/admin/notifications/bulk` | axiosServer |

### aiChat (line 3340)

| # | Method Name | HTTP | Endpoint | Instance |
|---|-------------|------|----------|----------|
| 112 | `getSessions` | GET | `/admin/ai-chat/sessions` | axiosServer |
| 113 | `getMessages` | GET | `/admin/ai-chat/messages?sessionId=:id` | axiosServer |

### backgroundPresets (line 3383)

| # | Method Name | HTTP | Endpoint | Instance |
|---|-------------|------|----------|----------|
| 114 | `getActive` | GET | `/admin/background-presets/active` | axiosNextGen |
| 115 | `upload` | POST | `/admin/background-presets/upload` | fetch() |
| 116 | `uploadAndCreate` | POST | `/admin/background-presets/upload-and-create` | fetch() |
| 117 | `create` | POST | `/admin/background-presets` | axiosNextGen |
| 118 | `update` | PUT | `/admin/background-presets/:id` | axiosNextGen |
| 119 | `delete` | DELETE | `/admin/background-presets/:id` | axiosNextGen |
| 120 | `uploadSectionImage` | POST | `/admin/background-presets/upload` | fetch() |

### cardNews (line 3538)

| # | Method Name | HTTP | Endpoint | Instance |
|---|-------------|------|----------|----------|
| 121 | `uploadSectionImage` | POST | (multipart via fetch within backgroundPresets — shared) | — |
| 122 | `create` | POST | `/admin/posts/card-news` | axiosNextGen |
| 123 | `get` | GET | `/admin/posts/card-news/:id` | axiosNextGen |
| 124 | `getList` | GET | `/admin/posts/card-news` | axiosNextGen |
| 125 | `update` | PUT | `/admin/posts/card-news/:id` | axiosNextGen |
| 126 | `delete` | DELETE | `/admin/posts/card-news/:id` | axiosNextGen |
| 127 | `publish` | POST | `/admin/posts/card-news/:id/publish` | axiosNextGen |
| 128 | `getCategories` | GET | `/articles/category/list` | axiosNextGen |

### femaleRetention (line 3683)

| # | Method Name | HTTP | Endpoint | Instance |
|---|-------------|------|----------|----------|
| 129 | `getInactiveUsers` | GET | `/admin/female-retention` | axiosServer |
| 130 | `issueTemporaryPassword` | POST | `/admin/female-retention/:userId` | axiosServer |

### gems (line 3716)

| # | Method Name | HTTP | Endpoint | Instance |
|---|-------------|------|----------|----------|
| 131 | `bulkGrant` | POST | `/admin/gems/bulk-grant` | fetch() |

### gemPricing (line 3784)

| # | Method Name | HTTP | Endpoint | Instance |
|---|-------------|------|----------|----------|
| 132 | `getAll` | GET | `/admin/gem-pricing` | axiosServer |

### deletedFemales (line 3791)

| # | Method Name | HTTP | Endpoint | Instance |
|---|-------------|------|----------|----------|
| 133 | `getList` | GET | `/admin/deleted-females` | axiosServer |
| 134 | `restore` | PATCH | `/admin/deleted-females/:id/restore` | axiosServer |
| 135 | `sleep` | PATCH | `/admin/deleted-females/:id/sleep` | axiosServer |

### banners (line 3829)

| # | Method Name | HTTP | Endpoint | Instance |
|---|-------------|------|----------|----------|
| 136 | `getList` | GET | `/admin/banners` | axiosServer |
| 137 | `create` | POST | `/admin/banners` | fetch() |
| 138 | `update` | PATCH | `/admin/banners/:id` | axiosServer |
| 139 | `delete` | DELETE | `/admin/banners/:id` | axiosServer |
| 140 | `updateOrder` | PATCH | `/admin/banners/order/bulk` | axiosServer |

### dormantLikes (line 3907)

| # | Method Name | HTTP | Endpoint | Instance |
|---|-------------|------|----------|----------|
| 141 | `getDashboard` | GET | `/admin/dormant-likes` (dashboard) | axiosServer |
| 142 | `getPendingLikes` | GET | `/admin/dormant-likes/:userId/pending` | axiosServer |
| 143 | `getCooldownStatus` | GET | `/admin/dormant-likes/:userId/cooldown` | axiosServer |
| 144 | `processLikes` | POST | `/admin/dormant-likes/process` | axiosServer |
| 145 | `getActionLogs` | GET | `/admin/dormant-likes/logs` | axiosServer |
| 146 | `viewProfile` | POST | `/admin/dormant-likes/view-profile` | axiosServer |

### chatRefund (line 3994)

| # | Method Name | HTTP | Endpoint | Instance |
|---|-------------|------|----------|----------|
| 147 | `searchUsers` | GET | `/admin/chat-refund/users` (dynamic) | axiosServer |
| 148 | `getEligibleRooms` | GET | `/admin/chat-refund/:userId/rooms` (dynamic) | axiosServer |
| 149 | `previewRefund` | POST | `/admin/chat-refund/preview` | axiosServer |
| 150 | `processRefund` | POST | `/admin/chat-refund/process` | axiosServer |

### appleRefund (line 4063)

| # | Method Name | HTTP | Endpoint | Instance |
|---|-------------|------|----------|----------|
| 151 | `getList` | GET | `/admin/apple-refund` | axiosServer |
| 152 | `getDetail` | GET | `/admin/apple-refund/:id` | axiosServer |
| 153 | `syncRefundStatus` | POST | `/admin/apple-refund/sync` | axiosServer |

### likes (line 4117)

| # | Method Name | HTTP | Endpoint | Instance |
|---|-------------|------|----------|----------|
| 154 | `getList` | GET | `/admin/likes` | axiosServer |

### sometimeArticles (line 4124)

| # | Method Name | HTTP | Endpoint | Instance |
|---|-------------|------|----------|----------|
| 155 | `uploadImage` | POST | `/admin/sometime-articles/upload` | fetch() |
| 156 | `getList` | GET | `/admin/sometime-articles` | axiosNextGen |
| 157 | `get` | GET | `/admin/sometime-articles/:id` | axiosNextGen |
| 158 | `create` | POST | `/admin/sometime-articles` | axiosNextGen |
| 159 | `update` | PATCH | `/admin/sometime-articles/:id` | axiosNextGen |
| 160 | `delete` | DELETE | `/admin/sometime-articles/:id` | axiosNextGen |

### momentQuestions (line 4260)

| # | Method Name | HTTP | Endpoint | Instance |
|---|-------------|------|----------|----------|
| 161 | `generate` | POST | `/admin/questions/generate` | axiosServer |
| 162 | `bulkCreate` | POST | `/admin/questions/bulk` | axiosServer |
| 163 | `getList` | GET | `/admin/questions` | axiosServer |
| 164 | `getDetail` | GET | `/admin/questions/:id` | axiosServer |
| 165 | `update` | PUT | `/admin/questions/:id` | axiosServer |
| 166 | `delete` | DELETE | `/admin/questions/:id` | axiosServer |
| 167 | `translate` | POST | `/admin/questions/translate` | axiosServer |

### userEngagement (line 4373)

| # | Method Name | HTTP | Endpoint | Instance |
|---|-------------|------|----------|----------|
| 168 | `getStats` | GET | `/admin/stats/user-engagement` | axiosServer |

### forceMatching (line 4393)

| # | Method Name | HTTP | Endpoint | Instance |
|---|-------------|------|----------|----------|
| 169 | `searchUsers` | GET | `/admin/users` | axiosServer |
| 170 | `createForceChatRoom` | POST | `/admin/force-chat-room` | axiosServer |

### kpiReport (line 4440)

| # | Method Name | HTTP | Endpoint | Instance |
|---|-------------|------|----------|----------|
| 171 | `getLatest` | GET | `/admin/kpi-report/latest` | axiosServer |
| 172 | `getByWeek` | GET | `/admin/kpi-report/:year/:week` | axiosServer |
| 173 | `getDefinitions` | GET | `/admin/kpi-report/definitions` | axiosServer |
| 174 | `generate` | POST | `/admin/kpi-report/generate` | axiosServer |

### appReviews (line 4551)

| # | Method Name | HTTP | Endpoint | Instance |
|---|-------------|------|----------|----------|
| 175 | `getList` | GET | `/admin/app-reviews` | axiosServer |
| 176 | `getStats` | GET | `/admin/app-reviews/stats` | axiosServer |
| 177 | `toggleFeatured` | PATCH | `/admin/app-reviews/:pk/featured` | axiosServer |

### communityReviewArticles (line 4585)

| # | Method Name | HTTP | Endpoint | Instance |
|---|-------------|------|----------|----------|
| 178 | `getList` | GET | `/admin/community/articles` | axiosServer |
| 179 | `toggleFeatured` | PATCH | `/admin/community/articles/:id/featured` | axiosServer |

### publicReviews (line 4641)

| # | Method Name | HTTP | Endpoint | Instance |
|---|-------------|------|----------|----------|
| 180 | `getList` | GET | `/public-reviews` | axiosServer |
| 181 | `getFeaturedAppReviews` | GET | `/app-reviews/featured` | axiosServer |

### fcmTokens (line 4713)

| # | Method Name | HTTP | Endpoint | Instance |
|---|-------------|------|----------|----------|
| 182 | `getTokens` | GET | `/admin/fcm-tokens` | axiosServer |

---

## Pages Importing from admin.ts

The following 57 files import from `app/services/admin`:

```
app/admin/ai-chat/page.tsx
app/admin/app-reviews/components/PublicReviewManagement.tsx
app/admin/app-reviews/components/ReviewDashboard.tsx
app/admin/app-reviews/components/ReviewList.tsx
app/admin/banners/page.tsx
app/admin/card-news/components/CardEditor.tsx
app/admin/card-news/components/PresetEditModal.tsx
app/admin/card-news/components/PresetSelectModal.tsx
app/admin/card-news/components/PresetUploadModal.tsx
app/admin/card-news/create/page.tsx
app/admin/card-news/edit/[id]/page.tsx
app/admin/card-news/page.tsx
app/admin/chat/components/ChatManagementTab.tsx
app/admin/chat/components/ChatRefundTab.tsx
app/admin/community/page.tsx
app/admin/dashboard/components/ActionRequired.tsx
app/admin/dashboard/components/UserEngagementStats.tsx
app/admin/dashboard/components/WeeklyTrend.tsx
app/admin/deleted-females/page.tsx
app/admin/dormant-likes/components/BulkProcessModal.tsx
app/admin/dormant-likes/components/PendingLikesModal.tsx
app/admin/dormant-likes/logs/page.tsx
app/admin/dormant-likes/page.tsx
app/admin/fcm-tokens/page.tsx
app/admin/female-retention/page.tsx
app/admin/gems/page.tsx
app/admin/gems/pricing/page.tsx
app/admin/ios-refund/page.tsx
app/admin/kpi-report/page.tsx
app/admin/likes/page.tsx
app/admin/matching-management/components/ForceMatchingTab.tsx
app/admin/matching-management/components/GemsManagement.tsx
app/admin/matching-management/components/LikeHistory.tsx
app/admin/matching-management/components/MatcherHistory.tsx
app/admin/matching-management/components/SingleMatching.tsx
app/admin/matching-management/page.tsx
app/admin/moment/components/QuestionGenerationTab.tsx
app/admin/moment/components/QuestionListTab.tsx
app/admin/moment/components/QuestionTranslationTab.tsx
app/admin/profile-review/components/ImageReviewPanel.tsx
app/admin/profile-review/components/ReviewHistoryTab.tsx
app/admin/profile-review/page.tsx
app/admin/push-notifications/page.tsx
app/admin/reports/page.tsx
app/admin/reset-password/page.tsx
app/admin/sometime-articles/components/ImageUploader.tsx
app/admin/sometime-articles/components/MarkdownEditor.tsx
app/admin/sometime-articles/create/page.tsx
app/admin/sometime-articles/edit/[id]/page.tsx
app/admin/sometime-articles/page.tsx
app/admin/universities/clusters/page.tsx
app/admin/universities/components/DepartmentCsvUpload.tsx
app/admin/universities/components/DepartmentManagement.tsx
app/admin/universities/components/LogoUpload.tsx
app/admin/universities/components/UniversityDetailDialog.tsx
app/admin/universities/components/UniversityFormDialog.tsx
app/admin/universities/page.tsx
app/admin/users/appearance/page.tsx
```

---

## Direct Axios Calls in Admin Pages (Bypass Service Layer)

These calls use `axiosServer` or `axiosNextGen` directly in admin page/component files, bypassing `app/services/admin.ts`. They must be migrated to React Query hooks during their page's rewrite phase.

### app/admin/matching-management/useBatchStatus.ts

| Line | Method | Endpoint | Notes |
|------|--------|----------|-------|
| 18 | GET | `/admin/matching/batch-status` | Custom hook, not in admin.ts |
| 36 | POST | `/admin/matching/batch-status` | Toggle batch status |

### app/admin/matching-management/components/SingleMatching.tsx

| Line | Method | Endpoint | Notes |
|------|--------|----------|-------|
| 282 | GET | `/admin/users/appearance` | Duplicates userAppearance.getUsersWithAppearanceGrade |

### app/admin/matching-management/components/TicketManagement.tsx

| Line | Method | Endpoint | Notes |
|------|--------|----------|-------|
| 71 | GET | `/admin/tickets/user/:userId` | Not in admin.ts |
| 104 | POST | `/admin/tickets` | Not in admin.ts |
| 150 | DELETE | `/admin/tickets` | Not in admin.ts |

### app/admin/matching-management/page.tsx

| Line | Method | Endpoint | Notes |
|------|--------|----------|-------|
| 110 | POST | `/admin/matching/rest-members` | Not in admin.ts |
| 115 | POST | `/admin/matching/vector` | Not in admin.ts |
| 376 | GET | `/admin/users/appearance` | Duplicates service layer |
| 437 | POST | `/admin/matching/user` | Duplicates matching.processSingleMatching |
| 471 | POST | `/admin/matching/user/read` | Duplicates matching.findMatches |
| 504 | GET | `/admin/matching/unmatched-users` | Duplicates matching.getUnmatchedUsers |
| 606 | POST | `/admin/matching/user` | Duplicates matching.processSingleMatching |

### app/admin/lab/components/VisionPhotoTestTab.tsx

| Line | Method | Endpoint | Notes |
|------|--------|----------|-------|
| 378 | POST | `/admin/photo-validation/test` | Lab/test endpoint, not in admin.ts |

### app/admin/users/page.tsx

| Line | Method | Endpoint | Notes |
|------|--------|----------|-------|
| 127 | GET | `/admin/users` | Duplicates forceMatching.searchUsers |

### app/admin/gems/page.tsx

| Line | Method | Endpoint | Notes |
|------|--------|----------|-------|
| 105 | GET | `/admin/users/appearance` | Duplicates service layer |

### app/admin/scheduled-matching/service.ts

This file is a **standalone service module** (not part of admin.ts) with its own axiosServer calls. All endpoints are not in admin.ts and must be migrated to React Query:

| Line | Method | Endpoint | Notes |
|------|--------|----------|-------|
| 25 | GET | `/admin/scheduled-matching` | List schedules |
| 30 | GET | `/admin/scheduled-matching/:country` | Get by country |
| 37 | POST | `/admin/scheduled-matching` | Create schedule |
| 45 | PATCH | `/admin/scheduled-matching/:country` | Update schedule |
| 50 | POST | `/admin/scheduled-matching/trigger` | Manual trigger |
| 55 | GET | `/admin/scheduled-matching/jobs/status` | All job statuses |
| 60 | GET | `/admin/scheduled-matching/jobs/status/:country` | Job status by country |
| 65 | GET | `/admin/scheduled-matching/batches/running` | Running batches |
| 74 | GET | `/admin/scheduled-matching/batches/:country` | Batches by country |
| 85 | GET | `/admin/scheduled-matching/batches/detail/:batchId` | Batch detail |
| 92 | POST | `/admin/scheduled-matching/batches/:batchId/cancel` | Cancel batch |
| 101 | GET | `/admin/stats/matching-pool` | Matching pool stats |
| 110 | POST | `/admin/matching/manual` | Manual matching |
| 115 | POST | `/admin/matching/validate` | Validate match |
| 122 | GET | `/admin/matching/manual` | Manual matching history |

---

## Endpoints Missing from Service Layer

These endpoints are called directly in admin pages but have no corresponding method in `app/services/admin.ts`:

| Endpoint | HTTP | Found In |
|----------|------|----------|
| `/admin/matching/batch-status` | GET/POST | `useBatchStatus.ts` |
| `/admin/matching/rest-members` | POST | `matching-management/page.tsx` |
| `/admin/matching/vector` | POST | `matching-management/page.tsx` |
| `/admin/tickets/user/:userId` | GET | `TicketManagement.tsx` |
| `/admin/tickets` | POST/DELETE | `TicketManagement.tsx` |
| `/admin/photo-validation/test` | POST | `VisionPhotoTestTab.tsx` (lab) |
| `/admin/scheduled-matching/*` | GET/POST/PATCH | `scheduled-matching/service.ts` (15 endpoints) |

---

## Migration Priority Notes

1. **matching-management** pages have the most bypass calls (10+ direct axiosServer calls) — highest migration priority.
2. `scheduled-matching/service.ts` is a complete standalone service that needs to be merged into `admin.ts` or converted to React Query hooks directly.
3. The 6 `fetch()` calls in `admin.ts` itself should be converted to `axiosMultipart` for consistency.
4. `getMatchingStats` (line 3061) has its actual HTTP call commented out — verify if this endpoint is live before migrating.
