# BE 작업 명세 — Ghost Batch Preview "수동 이미지 부착" 모드

**대상 레포**: `solo-nestjs-api`
**작성일**: 2026-04-26
**우선순위**: High (FE 코드는 이미 머지됨, BE 미구현으로 404)

---

## 1. 배경

기존 Ghost Batch Preview 는 두 모드 존재:
1. `imageSource='generate'` — AI 가 이미지 생성 (Seedream / OpenAI)
2. `imageSource='reference-pool'` — 사전 큐레이션된 `ghost_reference_images` 풀에서 picker 로 선택

본 작업 = **3번째 모드 신규 추가**:
3. `imageSource='manual-upload'` — 어드민이 PC 에서 이미지 파일 직접 업로드 → 슬롯에 부착 → 프로필 텍스트만 자동 생성 → ghost_account 생성

**원래 기획 의도**: 어드민이 외부에서 (예: 스톡 사이트, AI 도구로 직접 생성한 이미지 등) 만든 이미지를 첨부해서 가상 프로필 본문만 자동 생성. 이미지 LLM 호출 자체 없음.

---

## 2. 현재 BE 상태

### 이미 구현된 부분
- `batch-preview.service.ts` — `imageSource: 'generate' | 'reference-pool'` 분기 존재
- `BatchPreviewItem.photos: BatchPreviewItemPhoto[]` 자료구조
- `confirm` 핸들러 — reference-pool 분기에서 `photos[].s3Url` 을 ghost_account 사진으로 사용
- S3 업로드 인프라: `src/chat/service/file-upload.service.ts` (참조 패턴)
- 멀티파일 인터셉터 패턴: `src/admin/fake-user/controllers/fake-user.controller.ts:44` (`FilesInterceptor('images', 3)`)
- 얼굴 검증 옵션: `src/face/services/face-validation.service.ts`

### 누락된 부분 (이번 작업)
- `imageSource='manual-upload'` 분기
- `POST /admin/ghost-injection/upload-photos` 엔드포인트 (멀티파트)
- `CreateBatchPreviewBody.uploadedPhotos` 필드
- `confirm` 핸들러의 manual-upload 분기 (ghost_account 생성 시 photos 직접 INSERT, ghost_reference_images touch 안 함)

### 보너스 (FE 가 이미 호출 중이지만 404 발생)
- `GET /admin/ghost-injection/reference-photos` ← reference-pool 모드용 endpoint (별도 작업, **본 명세 범위 밖**)
- `POST /admin/ghost-injection/reference-photos/auto-match` ← 동일

→ 본 작업은 manual-upload 모드만 다룬다. reference-pool 모드 endpoint 미구현은 별도 이슈.

---

## 3. API 계약

### 3.1 신규: `POST /admin/ghost-injection/upload-photos`

어드민이 PC 에서 사진 파일 N개를 한번에 업로드. 응답으로 S3 URL 배열 반환. 이후 `batch-preview` 호출 시 이 URL 들을 슬롯에 분배해서 전달.

**Request**:
- Method: `POST`
- Path: `/admin/ghost-injection/upload-photos`
- Auth: JWT + `Roles(Role.ADMIN)`
- Content-Type: `multipart/form-data`
- Form field: `files` (반복, 최대 150개 = count 50 × 3 슬롯)

**Validation**:
- 파일 개수: 1 ≤ N ≤ 150
- 각 파일 크기: ≤ 10 MB
- MIME: `image/jpeg`, `image/png`, `image/webp`
- 옵션 (env flag): 얼굴 검출 (`face-validation.service`) — 1장도 얼굴 없으면 422

**Response 201**:
```json
{
  "uploads": [
    {
      "s3Url": "https://<bucket>.s3.<region>.amazonaws.com/ghost-uploads/<uuid>.jpg",
      "filename": "IMG_1234.jpg",
      "sizeBytes": 245678,
      "width": 1024,
      "height": 1280
    }
  ]
}
```

**Response 422 — 얼굴 미검출**:
```json
{
  "errorCode": "manual-upload:no-face-detected",
  "details": { "filename": "IMG_1234.jpg", "index": 2 }
}
```

**Response 413 — 파일 크기/개수 초과**:
```json
{ "errorCode": "manual-upload:file-too-large" }
```

**S3 키 규칙**:
- 버킷: 기존 `AWS_S3_BUCKET_NAME`
- prefix: `ghost-uploads/<YYYY-MM>/` (월별 디렉토리, cleanup 용이)
- 파일명: `<uuid>.<ext>`
- ContentType: 원본 mimeType

### 3.2 변경: `POST /admin/ghost-injection/batch-preview`

기존 body 에 `uploadedPhotos` 필드 추가. discriminated union.

**Request body (TypeScript)**:
```ts
type CreateBatchPreviewBody = {
  count: number;            // 1..50
  ageHint?: { min: number; max: number };
  schoolHintId?: string;
  dryRun?: boolean;
} & (
  | { imageSource: 'generate'; vendor?: ImageVendor }
  | { imageSource: 'reference-pool'; referenceMatches: ReferenceMatch[] }
  | {
      imageSource: 'manual-upload';
      uploadedPhotos: Array<{
        itemIndex: number;          // 0..count-1
        s3Urls: [string, string, string];   // 정확히 3장
      }>;
    }
);
```

**Validation (manual-upload 모드)**:
- `uploadedPhotos.length === count`
- `itemIndex` unique, 0..count-1 일치
- 각 `s3Urls.length === 3`
- 모든 s3Url 가 `^https://<bucket>.s3.<region>.amazonaws.com/ghost-uploads/` 패턴 (위변조 방지)
- 모든 s3Url flatten 시 unique (한 사진 두 슬롯 사용 금지)

**Response 202**: 기존과 동일 (`BatchPreviewRoot`). `imageSource: 'manual-upload'` echo.

### 3.3 변경: SSE Stream `GET /admin/ghost-injection/batch-preview/:previewId/stream`

`progress.stage` enum 에 `'attach'` 가 이미 존재. manual-upload 모드도 이걸 재사용.

스테이지 흐름:
- generate: `profile → persona → slot-prompt`
- reference-pool: `profile → persona → attach`
- **manual-upload: `profile → persona → attach`** (이미지 생성 단계 없음, 매우 빠름)

`item-ready.item.photos[]` 의 `source` 필드:
- generate → 추후 채워짐 (생성 완료 후)
- reference-pool → `'reference-pool'`
- **manual-upload → `'manual-upload'`** (신규 enum 값)

`item.slotPrompts[]` 는 manual-upload 모드에서 빈 배열 (또는 undefined 허용).

### 3.4 변경: `PATCH /admin/ghost-injection/batch-preview/:previewId/items/:itemId`

기존 `replace-photo` 액션 확장 — manual-upload 모드 전용 분기 추가:

```ts
type PatchBatchPreviewItemBody =
  | { action: 'edit'; slotPrompts: ... }       // 기존
  | { action: 'regenerate'; preserveProfile?: boolean }  // 기존
  | {
      action: 'replace-photo';
      slotIndex: 0 | 1 | 2;
      // reference-pool 모드 (기존)
      newPhotoId?: string;
      // manual-upload 모드 (신규)
      newS3Url?: string;
    };
```

**Validation (manual-upload)**:
- `previewRoot.imageSource === 'manual-upload'` 일 때만 `newS3Url` 허용
- s3Url 패턴 검증 (3.2 와 동일)
- 다른 슬롯에 이미 사용 중인 url 거부

### 3.5 변경: `POST /admin/ghost-injection/batch-preview/:previewId/confirm`

기존 흐름 유지. confirm 핸들러 (`a11-confirm-batch-preview`) 의 `BatchPreviewService.confirm` 메서드 내부에서 분기:

- `imageSource='manual-upload'` 시:
  - ghost_account 생성 + photos 컬럼에 업로드 url 직접 INSERT
  - `ghost_reference_images` 테이블 **touch 안 함** (풀 entry 가 아님)
  - audit `after_state_json.imageSource = 'manual-upload'`
  - audit `after_state_json.uploadedPhotoUrls = [url1, url2, ...]` (감사 추적용)

---

## 4. 파일 변경 목록

### 신규 파일

| 경로 | 역할 |
|------|------|
| `src/ghost-injection/services/manual-photo-upload.service.ts` | S3 PutObject + 검증. `FileUploadService` 패턴 참조 |
| `src/ghost-injection/dto/upload-photos.dto.ts` | Response DTO |
| `src/ghost-injection/__tests__/manual-photo-upload.service.spec.ts` | unit test |

### 수정 파일

| 경로 | 변경 내용 |
|------|----------|
| `src/ghost-injection/dto/batch-preview.dto.ts` | `ImageSource` 에 `'manual-upload'` 추가. `UploadedPhotoMatch` 타입. `CreateBatchPreviewBody` discriminated union 확장. `BatchPreviewItemPhoto.source` 에 `'manual-upload'` 추가. `PatchBatchPreviewItemBody.replace-photo` 에 `newS3Url` |
| `src/ghost-injection/controllers/ghost-injection-admin.controller.ts` | `@Post('upload-photos')` + `FilesInterceptor('files', 150)` |
| `src/ghost-injection/services/batch-preview.service.ts` | `start` 메서드: `'manual-upload'` 분기 (validation). `runPreviewWorker`: 새 분기 (이미지 생성 skip, photos 직접 매핑). `patch`: replace-photo 분기 manual-upload 처리 |
| `src/ghost-injection/services/batch-preview-store.service.ts` | (필요 시) `referenceMatches` 외에 `uploadedPhotos` 도 저장 |
| `src/ghost-injection/ghost-injection.module.ts` | `ManualPhotoUploadService` provider 추가, `MulterModule` import |
| `src/ghost-injection/services/synthetic-ghost-creation.service.ts` | `applyPhotosFromBatchPreview` 분기에서 manual-upload 인식 |
| `src/ghost-injection/__tests__/batch-preview.service.spec.ts` | manual-upload happy path + validation 실패 케이스 |

---

## 5. 코드 스켈레톤

### 5.1 `manual-photo-upload.service.ts`

```ts
import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { BadRequestException, Injectable, Logger, PayloadTooLargeException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 150;

export interface UploadedPhotoResult {
	s3Url: string;
	filename: string;
	sizeBytes: number;
}

@Injectable()
export class ManualPhotoUploadService {
	private readonly logger = new Logger(ManualPhotoUploadService.name);
	private readonly s3: S3Client;
	private readonly bucket: string;
	private readonly region: string;

	constructor(private readonly config: ConfigService) {
		const region = config.get<string>('AWS_REGION');
		const bucket = config.get<string>('AWS_S3_BUCKET_NAME');
		const accessKeyId = config.get<string>('AWS_ACCESS_KEY_ID');
		const secretAccessKey = config.get<string>('AWS_SECRET_ACCESS_KEY');
		if (!region || !bucket || !accessKeyId || !secretAccessKey) {
			throw new Error('AWS 설정 누락');
		}
		this.region = region;
		this.bucket = bucket;
		this.s3 = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
	}

	async uploadMany(files: Express.Multer.File[]): Promise<UploadedPhotoResult[]> {
		if (files.length === 0) throw new BadRequestException('files required');
		if (files.length > MAX_FILES) {
			throw new PayloadTooLargeException(`max ${MAX_FILES} files`);
		}
		for (const f of files) {
			if (!ALLOWED_MIMES.has(f.mimetype)) {
				throw new BadRequestException(`unsupported mime: ${f.mimetype}`);
			}
			if (f.size > MAX_FILE_BYTES) {
				throw new PayloadTooLargeException(`file too large: ${f.originalname}`);
			}
		}

		return Promise.all(files.map((f) => this.uploadOne(f)));
	}

	private async uploadOne(file: Express.Multer.File): Promise<UploadedPhotoResult> {
		const ext = this.extFromMime(file.mimetype);
		const yyyymm = new Date().toISOString().slice(0, 7);
		const key = `ghost-uploads/${yyyymm}/${uuidv4()}.${ext}`;

		await this.s3.send(
			new PutObjectCommand({
				Bucket: this.bucket,
				Key: key,
				Body: file.buffer,
				ContentType: file.mimetype,
				CacheControl: 'public, max-age=31536000, immutable',
			}),
		);

		const s3Url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
		return { s3Url, filename: file.originalname, sizeBytes: file.size };
	}

	private extFromMime(mime: string): string {
		const map: Record<string, string> = {
			'image/jpeg': 'jpg',
			'image/png': 'png',
			'image/webp': 'webp',
		};
		return map[mime] ?? 'jpg';
	}

	isUploadedUrl(url: string): boolean {
		return url.startsWith(`https://${this.bucket}.s3.${this.region}.amazonaws.com/ghost-uploads/`);
	}
}
```

### 5.2 Controller route

```ts
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadedFiles, UseInterceptors } from '@nestjs/common';
// ...

@Post('upload-photos')
@UseInterceptors(FilesInterceptor('files', 150))
@HttpCode(201)
@ApiOperation({ summary: '수동 업로드 사진을 S3 에 저장하고 URL 반환' })
async uploadPhotos(
	@UploadedFiles() files: Express.Multer.File[],
): Promise<{ uploads: UploadedPhotoResult[] }> {
	const uploads = await this.manualPhotoUploadService.uploadMany(files);
	return { uploads };
}
```

### 5.3 batch-preview.service.ts 분기

`start` 메서드 (현재 L99 근처):
```ts
const imageSource: ImageSource = body.imageSource ?? 'generate';

if (imageSource === 'reference-pool') {
	// 기존 referenceMatches 검증
}

if (imageSource === 'manual-upload') {
	if (!body.uploadedPhotos || body.uploadedPhotos.length !== body.count) {
		throw new BadRequestException('uploadedPhotos.length must equal count');
	}
	const seen = new Set<number>();
	const allUrls = new Set<string>();
	for (const m of body.uploadedPhotos) {
		if (m.itemIndex < 0 || m.itemIndex >= body.count) {
			throw new BadRequestException(`itemIndex out of range: ${m.itemIndex}`);
		}
		if (seen.has(m.itemIndex)) {
			throw new BadRequestException(`duplicate itemIndex: ${m.itemIndex}`);
		}
		seen.add(m.itemIndex);
		if (m.s3Urls.length !== 3) {
			throw new BadRequestException(`itemIndex=${m.itemIndex} must have 3 s3Urls`);
		}
		for (const url of m.s3Urls) {
			if (!this.manualPhotoUploadService.isUploadedUrl(url)) {
				throw new BadRequestException(`invalid s3Url: ${url}`);
			}
			if (allUrls.has(url)) {
				throw new BadRequestException(`duplicate s3Url across slots: ${url}`);
			}
			allUrls.add(url);
		}
	}
}
```

`runPreviewWorker` 분기 (현재 L181 근처):
```ts
let slotPrompts: BatchPreviewItem['slotPrompts'];
let photos: BatchPreviewItemPhoto[] | undefined;

if (imageSource === 'manual-upload') {
	this.emit(subject, {
		type: 'progress',
		data: { completed: i, total, stage: 'attach' },
	});
	const match = body.uploadedPhotos!.find((m) => m.itemIndex === i)!;
	photos = match.s3Urls.map((s3Url, slotIdx) => ({
		slotIndex: slotIdx as 0 | 1 | 2,
		s3Url,
		source: 'manual-upload' as const,
	}));
	slotPrompts = []; // manual-upload 는 프롬프트 없음
} else if (imageSource === 'reference-pool') {
	// 기존
} else {
	// 기존 generate
}
```

### 5.4 confirm 시 photos 매핑

`confirm` 메서드 (현재 L461 근처):
```ts
const itemPhotos =
	(root.imageSource === 'reference-pool' || root.imageSource === 'manual-upload') &&
	item.photos
		? item.photos.map((p) => ({ slotIndex: p.slotIndex, s3Url: p.s3Url }))
		: undefined;
```

`SyntheticGhostCreationService` 가 `itemPhotos` 를 ghost_account 생성 시 사진 INSERT 에 사용. 기존 reference-pool 경로와 동일 구조이므로 추가 변경 최소.

audit `after_state_json`:
```ts
{
  imageSource: root.imageSource,
  itemIds: confirmed,
  createdGhostAccountIds: [...],
  uploadedPhotoUrls: root.imageSource === 'manual-upload'
    ? Array.from(new Set(items.flatMap(i => i.photos?.map(p => p.s3Url) ?? [])))
    : undefined,
}
```

---

## 6. 모듈 등록

`ghost-injection.module.ts`:
```ts
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Module({
	imports: [
		// ...
		MulterModule.register({
			storage: memoryStorage(),
			limits: {
				fileSize: 10 * 1024 * 1024,
				files: 150,
			},
		}),
	],
	providers: [
		// ...
		ManualPhotoUploadService,
	],
})
export class GhostInjectionModule {}
```

(이미 다른 곳에서 MulterModule 등록되어 있으면 중복 X. fake-user 모듈 패턴 참조)

---

## 7. 데이터 모델 영향

**테이블 변경 없음.**

- `ghost_accounts` — 사진은 기존 컬럼 그대로 사용
- `ghost_reference_images` — manual-upload 는 INSERT 안 함 (1회용)
- `ghost_audit_events` — `after_state_json` 에 `imageSource`, `uploadedPhotoUrls` 추가만 (스키마 변경 X)

---

## 8. 환경 변수

기존 변수 재사용:
- `AWS_REGION`
- `AWS_S3_BUCKET_NAME`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

신규 (옵션):
- `GHOST_MANUAL_UPLOAD_FACE_VALIDATION` — `'true'` 일 때 얼굴 검출 강제. 기본 `false` (어드민이 외부에서 만든 이미지가 정면 얼굴이 아닐 수 있음)
- `GHOST_MANUAL_UPLOAD_MAX_FILES` — 기본 150 (count 50 × 3)

---

## 9. S3 객체 cleanup

업로드 후 `confirm` 안 하고 다이얼로그 닫는 케이스 → orphan S3 객체 발생.

**옵션 A (간단)**: S3 lifecycle rule — `ghost-uploads/` prefix 30일 후 자동 삭제. AWS 콘솔/Terraform 설정.

**옵션 B (정밀)**: `confirm` 시 사용된 url 만 DB 에 기록 → 별도 cron 으로 미사용 객체 삭제. MVP 에서는 A 권장.

---

## 10. 보안

- **CSRF**: 어드민 JWT + Roles guard 로 보호. cookie 기반 BFF proxy 통과.
- **MIME spoofing**: `mimetype` 신뢰 X. 첫 바이트 magic number 검증 권장 (`file-type` 패키지 또는 `sharp` metadata 검증). 옵션.
- **S3 url 위변조**: `isUploadedUrl()` 로 prefix 검증. 다른 버킷/외부 URL 거부.
- **Path traversal**: S3 키는 uuid 생성. 사용자 입력 미반영.
- **Rate limit**: 어드민 한정이므로 별도 제한 불필요. 다만 한번에 150장 업로드는 동시 PutObject 부하 → `Promise.all` 보다 `p-limit(10)` 권장.

---

## 11. 검증 시나리오

### 11.1 Happy path
1. 어드민이 9장 (3×3) 파일 선택 → `POST /upload-photos` → 201 + 9 URL 반환
2. FE 가 슬롯에 분배 후 `POST /batch-preview` body `{ count: 3, imageSource: 'manual-upload', uploadedPhotos: [{itemIndex:0, s3Urls:[...]}, ...] }`
3. 202 응답 + previewId. SSE 스트림 연결 → `attach` stage 만 발생, 5초 내 완료
4. 각 item 의 `photos[]` 는 업로드 URL 그대로 매핑됨
5. confirm → 3개 ghost_account 생성, photos 컬럼에 업로드 url INSERT

### 11.2 Validation 실패
- s3Url 외부 도메인 → 400 `manual-upload:invalid-url`
- count=3 인데 uploadedPhotos.length=2 → 400
- 같은 url 두 슬롯 → 400 `manual-upload:duplicate-url`
- 11MB 파일 업로드 → 413
- mimetype `image/svg+xml` → 400

### 11.3 Audit 검증
```sql
SELECT action_type, after_state_json->>'imageSource' AS src,
       jsonb_array_length(after_state_json->'uploadedPhotoUrls') AS url_count
FROM ghost_audit_events
WHERE target_id = '<previewId>'
ORDER BY created_at;
```
- `ConfirmBatchPreviewCommand` row 1개
- `src = 'manual-upload'`
- `url_count = 9` (count 3 × 3 slots)

---

## 12. 작업 순서 (제안)

1. DTO 확장 (`batch-preview.dto.ts`) + 컴파일 통과
2. `ManualPhotoUploadService` 신규 + unit test
3. Controller `upload-photos` route + e2e (curl multipart)
4. `batch-preview.service.start` validation 분기
5. `batch-preview.service.runPreviewWorker` attach 분기
6. `confirm` audit + photos 매핑
7. `replace-photo` PATCH manual-upload 분기 (선택, MVP 후)
8. 통합 테스트: count=3 manual-upload happy path
9. S3 lifecycle rule 설정 (DevOps)
10. 배포 + FE 통합 테스트

---

## 13. FE 변경 (참고용)

이 BE 작업과 병렬로 FE 도 변경됨 (별도 plan 으로 진행). FE 변경 요약:

- `pool-browser` → `upload-zone` 으로 swap (드래그앤드롭 + 파일 선택)
- 라디오 라벨: "참조 풀에서 선택" → "수동 이미지 부착"
- `aiProfileReferences.uploadPhotos(files)` 신규 service
- `imageSource='manual-upload'` 일 때 createBatchPreview body 에 `uploadedPhotos` 동봉
- 기존 reference-pool 모드 코드는 hide 또는 후속 작업 보존

→ FE 가 호출하는 endpoint: `/admin/ghost-injection/upload-photos`, `/batch-preview`, `/batch-preview/:id/stream`, `/batch-preview/:id/confirm`. 4개 모두 본 명세에서 다룸.

---

## 14. 미해결 결정사항 (BE 측 확정 필요)

1. **얼굴 검출 강제 여부** — env flag 로 분리 권장. 디폴트 off.
2. **S3 lifecycle vs DB 기반 cleanup** — A (lifecycle 30일) 권장.
3. **얼굴 정합 (한 페르소나의 3장이 같은 사람인지)** — 검증 안 함. 어드민 책임.
4. **count=1, 3장만 업로드** — 정상 케이스. 페르소나 1개.
5. **업로드 후 미확정 시 url 회수** — lifecycle 으로 충분. 별도 회수 API 안 만듦.
6. **업로드 사진을 ghost_reference_images 풀에 자동 promote** — 안 함 (1회용). 풀 등록은 별도 페이지에서.

---

## 15. Out of scope

- presigned URL 방식 (직접 S3 업로드) — multipart 통한 BE 경유 방식 확정. 향후 대용량 시 검토.
- 업로드 진행률 SSE — multipart 응답 한번에 받음. 클라이언트는 XHR upload progress 사용.
- 이미지 리사이즈/최적화 (sharp) — MVP 에서 원본 저장. 향후 thumbnail 변환 필요 시 추가.
- `ghost_reference_images` promote-from-upload 커맨드 — 별도 PR.
- mixed mode (한 batch 안에서 슬롯별로 generate/upload 혼합) — 단일 모드 전제. 향후 확장.

---

## 16. 참고 파일 (BE 엔지니어용)

- 패턴 참조: `src/chat/service/file-upload.service.ts` (S3 업로드)
- 패턴 참조: `src/admin/fake-user/controllers/fake-user.controller.ts:44` (FilesInterceptor)
- 기존 분기 위치: `src/ghost-injection/services/batch-preview.service.ts:99, 181, 411, 461`
- 기존 DTO: `src/ghost-injection/dto/batch-preview.dto.ts`
- 컨트롤러: `src/ghost-injection/controllers/ghost-injection-admin.controller.ts:243-297`
- Confirm handler: `src/ghost-injection/commands/a11-confirm-batch-preview/confirm-batch-preview.handler.ts`

---

## 17. 작업량

- 코어 구현: 2일
- 테스트 + 검증: 1일
- 배포 + FE 통합 디버깅: 0.5-1일
- **총 ~3-4일**
