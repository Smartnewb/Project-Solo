import { expect, test } from '@playwright/test';
import { statSync } from 'fs';

const SCREENSHOT_PATH =
  '/Users/smartnewbie/sometime-central/.omo/evidence/task-5-profile-image-audit-grid.png';

type AuditFixtureItem = {
  readonly profileImageId: string;
  readonly imageId: string;
  readonly imageUrl: string;
  readonly thumbnailUrl: string;
  readonly userId: string;
  readonly profileId: string;
  readonly profileRank: 'A' | 'B';
  readonly age: number;
  readonly gender: 'FEMALE' | 'MALE';
  readonly universityName: string;
  readonly slotIndex: number;
  readonly isMain: boolean;
  readonly reviewStatus: 'approved';
  readonly reviewedType: 'admin';
  readonly reviewedAt: string;
  readonly rejectionReason: null;
  readonly auditStatus: 'unreviewed';
  readonly auditReviewedAt: null;
  readonly auditReviewedBy: null;
  readonly auditDecisionReason: null;
  readonly isBlacklisted: boolean;
  readonly suspendedAt: null;
  readonly approvedImageCount: number;
  readonly totalActiveImageCount: number;
  readonly hasReport: boolean;
  readonly siblingImages: readonly {
    readonly profileImageId: string;
    readonly imageId: string;
    readonly imageUrl: string;
    readonly thumbnailUrl: string;
    readonly slotIndex: number;
    readonly isMain: boolean;
    readonly reviewStatus: 'approved';
  }[];
  readonly validation: {
    readonly totalScore: number;
    readonly autoDecision: 'approved';
    readonly decisionReason: string;
    readonly createdAt: string;
  };
  readonly riskSignals: {
    readonly reportCount: number;
    readonly hasSuspensionHistory: boolean;
    readonly isFirstReview: boolean;
    readonly isUniversityVerified: boolean;
    readonly hasPurchaseHistory: boolean;
  };
  readonly reviewContext: {
    readonly reportCount: number;
    readonly hasSuspensionHistory: boolean;
    readonly userCreatedAt: string;
    readonly isFirstReview: boolean;
    readonly receivedLikeCount: number;
    readonly matchCount: number;
    readonly chatRoomCount: number;
    readonly hasPurchased: boolean;
    readonly totalPurchaseAmount: number;
    readonly isUniversityVerified: boolean;
  };
  readonly rejectionHistory: readonly {
    readonly category: string;
    readonly reason: string;
    readonly createdAt: string;
  }[];
  readonly rejectedImages: readonly {
    readonly id: string;
    readonly imageUrl: string;
    readonly slotIndex: number;
    readonly rejectionReason: string;
    readonly rejectedAt: string;
  }[];
  readonly bio: string;
};

function imageDataUri(label: string): string {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="320"><rect width="100%" height="100%" fill="#e0f2fe"/><text x="24" y="164" font-size="28" fill="#0f172a">${label}</text></svg>`,
  )}`;
}

function buildAuditItem(index: number): AuditFixtureItem {
  const number = index + 1;
  const siblingOne = imageDataUri(`S${number}-1`);
  const siblingTwo = imageDataUri(`S${number}-2`);

  return {
    profileImageId: `profile-image-${number}`,
    imageId: `image-${number}`,
    imageUrl: imageDataUri(`P${number}`),
    thumbnailUrl: imageDataUri(`T${number}`),
    userId: `user-${number}`,
    profileId: `profile-${number}`,
    profileRank: index % 2 === 0 ? 'A' : 'B',
    age: index === 0 ? 24 : 30 + index,
    gender: index % 2 === 0 ? 'FEMALE' : 'MALE',
    universityName: index === 0 ? '서울대학교' : '연세대학교',
    slotIndex: index % 4,
    isMain: index === 0,
    reviewStatus: 'approved',
    reviewedType: 'admin',
    reviewedAt: '2026-06-10T03:12:00.000Z',
    rejectionReason: null,
    auditStatus: 'unreviewed',
    auditReviewedAt: null,
    auditReviewedBy: null,
    auditDecisionReason: null,
    isBlacklisted: false,
    suspendedAt: null,
    approvedImageCount: 2,
    totalActiveImageCount: 3,
    hasReport: index === 0,
    siblingImages: [
      {
        profileImageId: `profile-image-${number}`,
        imageId: `image-${number}`,
        imageUrl: siblingOne,
        thumbnailUrl: siblingOne,
        slotIndex: 0,
        isMain: true,
        reviewStatus: 'approved',
      },
      {
        profileImageId: `profile-image-${number}-sibling`,
        imageId: `image-${number}-sibling`,
        imageUrl: siblingTwo,
        thumbnailUrl: siblingTwo,
        slotIndex: 1,
        isMain: false,
        reviewStatus: 'approved',
      },
    ],
    validation: {
      totalScore: 88,
      autoDecision: 'approved',
      decisionReason: 'face_detected',
      createdAt: '2026-06-10T03:10:00.000Z',
    },
    riskSignals: {
      reportCount: index === 0 ? 1 : 0,
      hasSuspensionHistory: false,
      isFirstReview: index === 0,
      isUniversityVerified: true,
      hasPurchaseHistory: true,
    },
    reviewContext: {
      reportCount: index === 0 ? 1 : 0,
      hasSuspensionHistory: false,
      userCreatedAt: '2026-06-01T00:00:00.000Z',
      isFirstReview: index === 0,
      receivedLikeCount: 7,
      matchCount: 3,
      chatRoomCount: 2,
      hasPurchased: true,
      totalPurchaseAmount: 12000,
      isUniversityVerified: true,
    },
    rejectionHistory: [
      {
        category: '사진',
        reason: '얼굴 식별 불가',
        createdAt: '2026-05-20T02:00:00.000Z',
      },
    ],
    rejectedImages: [
      {
        id: `rejected-${number}`,
        imageUrl: imageDataUri(`R${number}`),
        slotIndex: 1,
        rejectionReason: '화질 불량',
        rejectedAt: '2026-05-21T02:00:00.000Z',
      },
    ],
    bio: '테스트 소개글입니다.',
  };
}

test('admin profile image audit read grid opens detail drawer with 16 image rows', async ({
  context,
  page,
}, testInfo) => {
  const baseURL = String(testInfo.project.use.baseURL ?? 'http://127.0.0.1:32211');
  const cookieHost = new URL(baseURL).hostname;
  const items = Array.from({ length: 16 }, (_, index) => buildAuditItem(index));

  await context.addCookies([
    {
      name: 'admin_session_meta',
      value: 'playwright-session',
      domain: cookieHost,
      path: '/',
    },
  ]);
  await page.route('**/api/admin/session', async (route) => {
    await route.fulfill({
      json: {
        user: { id: 'admin-1', email: 'admin@test.local', roles: ['admin'] },
        selectedCountry: 'kr',
        issuedAt: Date.now(),
      },
    });
  });
  await page.route('**/api/admin-proxy/admin/v2/profile-image-audit/images**', async (route) => {
    if (route.request().url().includes('/bulk-reject')) {
      await route.fulfill({
        json: {
          data: {
            requested: 1,
            failed: 0,
          },
        },
      });
      return;
    }

    await route.fulfill({
      json: {
        data: items,
        meta: { page: 1, limit: 16, total: 16, totalPages: 1 },
      },
    });
  });

  await Promise.all([
    page.waitForResponse((response) =>
      response.url().endsWith('/api/admin/session') && response.ok(),
    ),
    page.goto(`${baseURL}/admin/profile-image-audit`),
  ]);

  await expect(page.getByRole('heading', { name: '프로필 이미지 전수검사' })).toBeVisible();
  await expect(page.getByTestId('profile-image-audit-card')).toHaveCount(16);
  await expect(page.getByText('서울대학교')).toBeVisible();
  await expect(page.getByText('24세 · 여성')).toBeVisible();
  await expect(page.getByText('대표 사진', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: '심사 상세 보기' }).first().click();

  await expect(page.getByRole('heading', { name: '심사 상세' })).toBeVisible();
  await expect(page.getByText('연관 사진')).toBeVisible();
  await expect(page.getByAltText('연관 사진 2')).toBeVisible();
  await expect(page.getByText('신고 1회')).toBeVisible();
  await page.getByRole('button', { name: '닫기' }).click();

  await page.getByRole('checkbox', { name: 'profile-image-1 선택' }).click();
  await page.getByRole('button', { name: '사진 변경 요청' }).click();
  await page.getByRole('button', { name: '처리' }).click();

  await expect(page.getByText('선택한 1장을 처리했습니다.')).toBeVisible();
  await expect(page.getByText("Cannot read properties of undefined")).toHaveCount(0);
  await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });
  expect(statSync(SCREENSHOT_PATH).size).toBeGreaterThan(0);
});
