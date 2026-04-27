# FE 작업 명세 — Ghost Profile Photo Reorder

**대상 레포**: `Project-Solo` (Next.js 14 admin dashboard)
**작성일**: 2026-04-26
**우선순위**: Medium (BE 머지 후 작업)
**Source**: `requirements/ghost-photo-reorder-spec.md` + `requirements/ghost-photo-reorder-be-spec.md`

---

## 1. 배경

어드민이 가상 프로필 사진 3장 슬롯 순서를 drag-and-drop 으로 재정의. 두 위치:

1. **Batch preview 다이얼로그** (`ghost-preview-card.tsx`) — confirm 전 검수 단계.
2. **Ghost 상세 drawer** (`ghost-detail-drawer.tsx`) — DB 저장된 ghost 의 사진 순서 운영 교정.

대표이미지(slot 0) = 매칭/검색 노출 사진 = 어드민이 가장 신경쓰는 위치.

---

## 2. 현재 FE 상태

### 이미 구현된 부분
- `ghost-preview-card.tsx` — 3 GhostPhotoSlot 렌더링 (정렬: `slotIndex` ASC)
- `ghost-detail-drawer.tsx` — `PHOTO_SLOTS.map((slotIndex) => ...)` 로 3 슬롯 + 교체/재생성/제거 액션
- `ghost-photo-slot.tsx` — 단일 슬롯 카드 (이미지 + slotIndex 라벨 + 액션 버튼)
- `app/services/admin/ghost-injection.ts` — admin API 호출 layer
- `use-batch-preview-stream.ts` — SSE 구독 hook
- `_attach/` 디렉토리 — reference-pool drag-drop 부착 UI (방금 머지)

### 미구현 (본 작업)
- dnd-kit 의존성 (현재 미설치)
- DragSortable 래퍼 컴포넌트
- preview / confirmed 양쪽 mutation hook
- "대표" 배지 (slot 0 시각 강조)
- Optimistic UI + rollback toast
- reorder 버튼/토글 (drag mode 진입/이탈)

---

## 3. 결정 사항 요약 (BE PRD 와 동일)

| Decision | Value |
|----------|-------|
| 라이브러리 | `@dnd-kit/core` + `@dnd-kit/sortable` (~50KB gzipped) |
| 인터랙션 | Drag-and-drop (handle 전체 카드) |
| 제약 | 3장 보유 ghost 만 reorder 가능. 2장 = 버튼 disable + tooltip. |
| Optimistic UI | 즉시 새 순서 표시. 실패 시 rollback + toast error. |
| Slot 0 시각 강조 | "대표" 배지 + border accent. |
| 모바일 | 미지원. md+ breakpoint 에서만 drag 활성. (mobile = 카드 클릭 비활성) |
| X-Country header | 모든 호출에 명시 송신 (admin axiosClient interceptor 의존 X). |
| Reorder mode 진입 | 명시 토글 버튼 ("순서 편집") → drag handle 활성. 일반 모드는 기존 클릭 동작 유지. |

---

## 4. 신규 / 수정 파일

### 신규
- `app/admin/ai-profiles/ghosts/photo-reorder-dnd.tsx` — 공용 drag-drop 컨테이너
- `app/admin/ai-profiles/ghosts/use-photo-reorder.ts` — mutation hook (preview / confirmed 통합)
- `app/admin/ai-profiles/ghosts/photo-reorder-mode-toggle.tsx` — "순서 편집" 토글 버튼
- `__tests__/components/photo-reorder-dnd.test.tsx` — RTL
- `e2e/ghost-photo-reorder.spec.ts` — Playwright 통합

### 수정
- `package.json` — `@dnd-kit/core`, `@dnd-kit/sortable` 추가
- `app/services/admin/ghost-injection.ts` — `reorderBatchPreviewItem` + `reorderGhostPhotos` 함수 추가
- `app/admin/ai-profiles/ghosts/ghost-preview-card.tsx` — Slot 렌더링부에 PhotoReorderDnd 통합
- `app/admin/ai-profiles/ghosts/ghost-detail-drawer.tsx` — Slot 렌더링부에 PhotoReorderDnd 통합
- `app/admin/ai-profiles/ghosts/ghost-photo-slot.tsx` — `isMain` 표시 prop 추가, drag listeners props 수신
- `app/types/` (있으면 ghost 타입 정의) — `PatchBatchPreviewItemBody` 에 reorder-photos variant 추가

---

## 5. 컴포넌트 설계

### 5.1 `PhotoReorderDnd`

```tsx
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';

interface Photo {
  slotIndex: 0 | 1 | 2;
  imageId?: string;
  url: string;
}

interface PhotoReorderDndProps {
  photos: Photo[];                                // 항상 length === 3 expected
  enabled: boolean;                               // reorder mode toggle 결과
  onReorder: (newOrder: [number, number, number]) => Promise<void>;
  renderSlot: (photo: Photo, dragHandle: { listeners: any; attributes: any; isDragging: boolean }) => ReactNode;
}

export function PhotoReorderDnd({ photos, enabled, onReorder, renderSlot }: PhotoReorderDndProps) {
  const [localPhotos, setLocalPhotos] = useState(photos);
  // photos prop 외부 변경 sync (SSE update / refetch)
  useEffect(() => { setLocalPhotos(photos); }, [photos]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  if (!enabled || photos.length !== 3) {
    // 일반 모드 또는 reorder 불가 — drag 비활성, 정적 렌더
    return (
      <div className="grid grid-cols-3 gap-3">
        {photos.map((p) => renderSlot(p, { listeners: {}, attributes: {}, isDragging: false }))}
      </div>
    );
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localPhotos.findIndex((p) => p.imageId === active.id);
    const newIndex = localPhotos.findIndex((p) => p.imageId === over.id);
    const reordered = arrayMove(localPhotos, oldIndex, newIndex)
      .map((p, idx) => ({ ...p, slotIndex: idx as 0 | 1 | 2 }));
    setLocalPhotos(reordered);

    // BE order semantic: order[k] = source slot for new slot k
    const order = reordered.map((p) => photos.findIndex((orig) => orig.imageId === p.imageId)) as [number, number, number];

    try {
      await onReorder(order);
    } catch (err) {
      setLocalPhotos(photos);  // rollback
      toast.error('사진 순서 변경 실패. 다시 시도해주세요.');
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={localPhotos.map((p) => p.imageId!)} strategy={horizontalListSortingStrategy}>
        <div className="grid grid-cols-3 gap-3">
          {localPhotos.map((photo) => (
            <SortableSlot key={photo.imageId} photo={photo} renderSlot={renderSlot} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableSlot({ photo, renderSlot }: { photo: Photo; renderSlot: PhotoReorderDndProps['renderSlot'] }) {
  const { listeners, attributes, isDragging, setNodeRef, transform, transition } = useSortable({ id: photo.imageId! });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style}>
      {renderSlot(photo, { listeners, attributes, isDragging })}
    </div>
  );
}
```

### 5.2 `usePhotoReorder` hook

```tsx
type ReorderMode = { kind: 'preview'; previewId: string; itemId: string }
                 | { kind: 'confirmed'; ghostAccountId: string };

export function usePhotoReorder(mode: ReorderMode) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (order: [number, number, number]) => {
      if (mode.kind === 'preview') {
        return reorderBatchPreviewItem(mode.previewId, mode.itemId, order);
      }
      return reorderGhostPhotos(mode.ghostAccountId, order, '어드민 슬롯 재정렬');
    },
    onError: (err) => {
      console.error('[reorder] failed', err);
    },
    onSuccess: () => {
      if (mode.kind === 'confirmed') {
        queryClient.invalidateQueries({ queryKey: ['ghost-detail', mode.ghostAccountId] });
      }
      // preview 의 경우 SSE update 가 이미 처리
    },
  });
}
```

### 5.3 Service layer (`ghost-injection.ts`)

```ts
export async function reorderBatchPreviewItem(
  previewId: string,
  itemId: string,
  order: [number, number, number],
): Promise<BatchPreviewItem> {
  const country = getCurrentCountry();  // shared helper
  const res = await adminAxios.patch(
    `/admin/ghost-injection/batch-preview/${previewId}/items/${itemId}`,
    { action: 'reorder-photos', order },
    { headers: { 'X-Country': country } },
  );
  return res.data;
}

export async function reorderGhostPhotos(
  ghostAccountId: string,
  order: [number, number, number],
  reason: string,
): Promise<{ ghostAccountId: string; before: SlotMap; after: SlotMap }> {
  const country = getCurrentCountry();
  const res = await adminAxios.patch(
    `/admin/ghost-injection/ghosts/${ghostAccountId}/photos/reorder`,
    { order, reason },
    { headers: { 'X-Country': country } },
  );
  return res.data;
}
```

### 5.4 `ghost-photo-slot.tsx` 수정

기존 props 에 추가:
```ts
interface GhostPhotoSlotProps {
  // ...기존
  isMain?: boolean;                  // slot 0 = true
  dragListeners?: any;               // dnd-kit listeners spread
  dragAttributes?: any;              // dnd-kit attributes
  isDragging?: boolean;
}
```

UI 변경:
- `isMain === true` → 우상단 "대표" 배지 (primary color, rounded-full pill)
- `dragListeners` 존재 → 카드 hover 시 grab cursor + slight elevation (drag mode 인디케이터)
- `isDragging` → opacity-50 + scale-105

### 5.5 `PhotoReorderModeToggle`

```tsx
export function PhotoReorderModeToggle({ enabled, onToggle, disabled }: Props) {
  return (
    <Button
      variant={enabled ? 'default' : 'outline'}
      size="sm"
      onClick={() => onToggle(!enabled)}
      disabled={disabled}
      title={disabled ? '사진이 3장이어야 순서 편집 가능' : ''}
    >
      {enabled ? '편집 종료' : '순서 편집'}
    </Button>
  );
}
```

`disabled` = photos.length !== 3.

---

## 6. 통합 위치

### 6.1 Batch preview dialog

`ghost-preview-card.tsx` — 기존 photo 렌더링 부분:

```tsx
// before:
<div className="grid grid-cols-3 gap-3">
  {photos.sort((a, b) => a.slotIndex - b.slotIndex).map((slot) => (
    <GhostPhotoSlot ... />
  ))}
</div>

// after:
const [reorderMode, setReorderMode] = useState(false);
const reorderMutation = usePhotoReorder({ kind: 'preview', previewId, itemId });

<div className="flex justify-end mb-2">
  <PhotoReorderModeToggle
    enabled={reorderMode}
    onToggle={setReorderMode}
    disabled={photos.length !== 3 || reorderMutation.isPending}
  />
</div>
<PhotoReorderDnd
  photos={photos}
  enabled={reorderMode}
  onReorder={(order) => reorderMutation.mutateAsync(order)}
  renderSlot={(photo, drag) => (
    <GhostPhotoSlot
      slotIndex={photo.slotIndex}
      url={photo.url}
      imageId={photo.imageId}
      isMain={photo.slotIndex === 0}
      dragListeners={drag.listeners}
      dragAttributes={drag.attributes}
      isDragging={drag.isDragging}
      // 기존 props (onSave, onReplacePhoto 등)
    />
  )}
/>
```

### 6.2 Ghost detail drawer

`ghost-detail-drawer.tsx` — 기존 PHOTO_SLOTS.map 부분 동일 패턴 적용.

mode 만 다름:
```tsx
const reorderMutation = usePhotoReorder({ kind: 'confirmed', ghostAccountId });
```

---

## 7. UX 디테일

### 7.1 Drag mode 진입 흐름

1. 어드민이 batch preview 카드 / ghost 상세 drawer 열음
2. "순서 편집" 버튼 클릭 → `reorderMode=true`
3. 카드 hover 시 grab cursor + 약간 들뜬 그림자
4. 카드 drag → 다른 슬롯 위로 drop → optimistic UI 즉시 반영
5. mutation pending → spinner overlay (전체 grid)
6. 성공 → toast "순서가 변경되었습니다"
7. 실패 → 원래 순서로 rollback + toast error
8. "편집 종료" 클릭 → `reorderMode=false`, 일반 모드 복귀

### 7.2 시각 인디케이터

- **Slot 0 = "대표" 배지** — primary color (예: `bg-blue-500 text-white`), 우상단 absolute
- **Drag mode** — 카드 border-2 dashed, hover 시 cursor: grab
- **Dragging** — opacity-50, scale-105, z-50
- **Drop target hover** — 슬롯 placeholder ring-2 ring-blue-400
- **Disabled (2장 ghost)** — 토글 버튼 회색 + tooltip "사진이 3장이어야 순서 편집 가능"

### 7.3 모바일

`md:` breakpoint 미만에서는:
- "순서 편집" 버튼 hidden (`hidden md:inline-flex`)
- DndContext 자체 mount 안 함 → 정적 grid

### 7.4 Drag 중 SSE update 처리

Preview 모드만 해당. SSE update 가 도착해도 `localPhotos` 외부 prop 변경 → useEffect 가 sync.
하지만 drag in-progress 일 때 sync 가 race condition 유발 가능.

**MVP 정책**: drag in-progress (`isDragging` 참조) 일 때는 외부 update sync 보류. drag 종료 후 mutation 성공 응답으로 final state 결정.

코드:
```tsx
const isDraggingRef = useRef(false);
useEffect(() => {
  if (!isDraggingRef.current) setLocalPhotos(photos);
}, [photos]);
```

---

## 8. 테스트 계획 (12 케이스)

### 8.1 RTL `__tests__/components/photo-reorder-dnd.test.tsx`

1. enabled=false → 정적 grid, drag listeners 없음
2. photos.length !== 3 → 정적 grid 강제
3. drag end → onReorder 호출, order 정확
4. mutation 실패 → 원래 순서 rollback
5. mutation pending → spinner overlay 표시 (또는 disabled 상태)
6. SSE update mid-drag → drag 종료까지 sync 보류

### 8.2 Component integration

7. `PhotoReorderModeToggle` disabled 조건 (photos < 3)
8. `GhostPhotoSlot` isMain=true → "대표" 배지 렌더
9. `GhostPhotoSlot` isDragging=true → opacity 적용

### 8.3 E2E `e2e/ghost-photo-reorder.spec.ts`

10. Preview 다이얼로그 open → 순서 편집 → drag → 즉시 새 순서 → SSE 일치
11. Ghost 상세 drawer → 순서 편집 → drag → API 200 → 새로고침 후 영속
12. 2장 ghost → 순서 편집 버튼 disabled

---

## 9. dnd-kit 통합 주의사항

- Next.js App Router + RSC 호환: `'use client'` 명시 (PhotoReorderDnd 파일 상단).
- SSR hydration mismatch 방지: `useId` 또는 `useMemo` 로 sortable id 안정화.
- `@dnd-kit/sortable` 의 `arrayMove` 는 immutable — 직접 splice 금지.
- accessibility: drag handle 에 `aria-label="슬롯 ${idx} 사진 drag"` 명시.

---

## 10. 출시 / 롤백

### 10.1 의존성 추가
```bash
pnpm add @dnd-kit/core @dnd-kit/sortable
```
- 두 패키지 모두 BSD-3-Clause license, MIT-compatible.
- ~50KB gzipped (admin bundle 만 영향, user-facing bundle 무영향).

### 10.2 Feature flag
- 본 기능은 admin 전용 → 별도 flag 불필요.
- BE 가 미배포 상태에서 FE 만 배포되면 reorder 호출 시 404. 배포 순서: **BE 먼저 → FE 머지**.

### 10.3 롤백
- `PhotoReorderModeToggle` 렌더링 조건부 false → 모든 reorder 버튼 사라짐.
- 또는 dnd-kit import 제거 + revert.
- 데이터 영구 변경 발생했어도 DB 는 그대로 (다시 reorder API 로 원복 가능).

---

## 11. Out of scope (참고)

- 모바일 reorder (별도 PR — 모바일 Sortable touch sensor)
- 4슬롯+ ghost reorder (BE 도 미지원)
- 슬롯 추가/삭제 (기존 replace/remove 액션 유지)
- 동시 두 어드민 reorder 시 conflict UI (BE 가 lock 으로 처리, FE 는 일반 mutation 에러 처리)
- 키보드 reorder (a11y 보조 — 향후 dnd-kit Sortable Keyboard sensor 활용)

---

## 12. 작업량 추정

| Group | Tasks | 시간 (CC+gstack) |
|-------|-------|------|
| F1 | dnd-kit 설치 + service layer 함수 + 타입 | 0.5h |
| F2 | PhotoReorderDnd + usePhotoReorder hook | 1.5h |
| F3 | GhostPhotoSlot 수정 + ModeToggle | 0.5h |
| F4 | Preview dialog 통합 + Ghost detail drawer 통합 | 1h |
| F5 | RTL 테스트 + E2E 시나리오 | 1h |
| F6 | 수동 QA (drag UX, optimistic, rollback) | 0.5h |
| **합계** | **~5h** |

**의존성**: BE PRD 의 G1 (preview action) 머지 후 F4 preview 통합 가능. BE G3 (controller route) 머지 후 F4 confirmed 통합 가능. F1-F3 는 BE 와 무관 (mock 으로 개발 가능).

**Lane**:
- Lane 1: F1-F3 (BE 와 병렬 가능)
- Lane 2: F4 (BE 머지 의존)
- Lane 3: F5-F6 (F4 후)

---

## 13. Open Risks

1. **Optimistic UI rollback** — mutation 실패 시 정확한 직전 순서로 복귀해야. 두 번 빠르게 drag 후 첫번째 실패 시 두번째도 같이 rollback 되어야 (또는 두번째는 retry). MVP 정책: 첫번째 실패 시 즉시 모든 pending state revert + 두번째 시도 무시.
2. **dnd-kit + Material-UI 6 호환** — admin shell 이 MUI 사용. dnd-kit 은 MUI 와 무관 (헤드리스). 충돌 없음.
3. **Tailwind class 일관성** — 기존 admin 컴포넌트 Tailwind 사용. dnd-kit 은 inline style 만 (transform). 충돌 없음.
4. **preview SSE event** = `update` (item 단위 broadcast). drag 중 다른 slot 의 다른 액션 (regenerate 등) SSE 가 와서 photos prop 변경 → drag race. MVP 정책 (7.4) 로 보호.
