import { Button, Modal, Select, ListBox, TextArea } from '@heroui/react';
import { Controller } from 'react-hook-form';
import { useAdminForm } from '@/app/admin/hooks/forms';
import { rejectReasonSchema, RejectReasonFormValues } from '@/app/admin/hooks/forms/schemas/profile-review.schema';
interface RejectReasonModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (category: string, reason: string) => void;
}
const REJECTION_CATEGORIES = [
    { value: 'INAPPROPRIATE_PROFILE_IMAGE', label: '부적절한 프로필 이미지' },
    { value: 'FAKE_PROFILE', label: '허위 프로필' },
    { value: 'INAPPROPRIATE_BIO', label: '부적절한 자기소개' },
    { value: 'INCOMPLETE_PROFILE', label: '프로필 미완성' },
    { value: 'DUPLICATE_ACCOUNT', label: '중복 계정' },
    { value: 'OTHER', label: '기타' }
];
const PRESET_REASONS: Record<string, string[]> = {
    'INAPPROPRIATE_PROFILE_IMAGE': [
        '얼굴 식별 불가',
        '부적절한 노출',
        '도용 의심',
        '화질 불량',
        '동물 사진',
        '동일 사진'
    ],
    'FAKE_PROFILE': [
        '연예인/유명인 사진',
        '타인 사진 도용',
        '허위 정보'
    ],
    'INAPPROPRIATE_BIO': [
        '부적절한 내용 포함',
        '광고성 내용',
        '욕설 포함'
    ],
    'INCOMPLETE_PROFILE': [
        '필수 정보 미입력',
        '프로필 사진 부족'
    ],
    'DUPLICATE_ACCOUNT': [
        '이미 가입된 계정 존재'
    ],
    'OTHER': []
};
const commonTemplates = [
    { category: 'INAPPROPRIATE_PROFILE_IMAGE', reason: '얼굴 식별 불가', label: '얼굴 식별 불가' },
    { category: 'INAPPROPRIATE_PROFILE_IMAGE', reason: '화질 불량', label: '화질 불량' },
    { category: 'INAPPROPRIATE_PROFILE_IMAGE', reason: '동물 사진', label: '동물 사진' },
    { category: 'INAPPROPRIATE_PROFILE_IMAGE', reason: '동일 사진', label: '동일 사진' },
    { category: 'FAKE_PROFILE', reason: '타인 사진 도용', label: '사진 도용' },
    { category: 'INCOMPLETE_PROFILE', reason: '필수 정보 미입력', label: '정보 미입력' },
];
export default function RejectReasonModal({ open, onClose, onConfirm }: RejectReasonModalProps) {
    const { control, handleFormSubmit, watch, setValue, reset } = useAdminForm<RejectReasonFormValues>({
        schema: rejectReasonSchema,
        defaultValues: { category: '', reason: '' },
    });
    const selectedCategory = watch('category');
    const selectedReason = watch('reason');
    const currentPresetReasons = selectedCategory ? PRESET_REASONS[selectedCategory] || [] : [];
    const handleCategoryChange = (category: string) => {
        setValue('category', category);
        setValue('reason', '');
    };
    const handleReasonSelect = (reason: string) => {
        setValue('reason', reason);
    };
    const handleTemplateSelect = (category: string, reason: string) => {
        setValue('category', category);
        setValue('reason', reason);
    };
    const handleClose = () => {
        reset({ category: '', reason: '' });
        onClose();
    };
    const onSubmit = handleFormSubmit(async (data) => {
        onConfirm(data.category, data.reason);
        reset({ category: '', reason: '' });
    });
    return (<Modal.Backdrop isOpen={open} onOpenChange={next => {
            if (!next)
                handleClose();
        }}><Modal.Container size="lg"><Modal.Dialog>
      <Modal.Header><Modal.Heading>
          반려 사유 선택
        </Modal.Heading>
        <p style={{ marginTop: 4 }}>
          회원에게 전달될 반려 카테고리와 사유를 선택해주세요.
        </p>
      </Modal.Header>

      <Modal.Body>
        {/* 빠른 템플릿 */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ marginBottom: 8, fontWeight: 500, color: "var(--accent)" }}>
            ⚡ 빠른 선택
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {commonTemplates.map((template, index) => (<Button key={index} variant="secondary" onPress={() => handleTemplateSelect(template.category, template.reason)}>{template.label}</Button>))}
          </div>
        </div>

        <hr style={{ marginBottom: 24 }}>
          <p>
            또는 직접 선택
          </p>
        </hr>

        {/* 카테고리 선택 */}
        <Controller name="category" control={control} render={({ field, fieldState }) => (<div style={{ marginBottom: 24 }}>
              <label>반려 카테고리</label>
              <Select {...field} aria-label={"반려 카테고리"} onChange={(key) => {
                const value = String(key ?? "");
                handleCategoryChange(value);
            }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
                {REJECTION_CATEGORIES.map((cat) => (<ListBox.Item key={cat.value} id={cat.value} textValue={String(cat.label)}>
                    {cat.label}
                  </ListBox.Item>))}
              </ListBox></Select.Popover></Select>
              {fieldState.error && (<p>{fieldState.error.message}</p>)}
            </div>)}></Controller>

        {/* 프리셋 사유 선택 */}
        {selectedCategory && currentPresetReasons.length > 0 && (<div style={{ marginBottom: 24 }}>
            <p style={{ marginBottom: 8, fontWeight: 500 }}>
              세부 사유 선택
            </p>
            <div style={{ display: 'grid', gap: 12 }}>
              {currentPresetReasons.map((reason) => (<Button key={reason} aria-pressed={selectedReason === reason} variant={selectedReason === reason ? "primary" : "secondary"} onPress={() => handleReasonSelect(reason)}>{reason}</Button>))}
            </div>
          </div>)}

        {/* 직접 입력 */}
        {selectedCategory && (<Controller name="reason" control={control} render={({ field, fieldState }) => (<div>
                <p style={{ marginBottom: 8, fontWeight: 500 }}>
                  {currentPresetReasons.length > 0 ? '또는 직접 입력' : '반려 사유 입력'}
                </p>
                <TextArea aria-label="반려 사유 직접 입력" value={field.value} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => field.onChange(e.target.value)} placeholder="반려 사유를 자세히 입력해주세요..." style={{ width: '100%', minHeight: 100, padding: 12, borderRadius: 1, border: fieldState.error ? '1px solid #d32f2f' : '1px solid #ddd', fontSize: '0.875rem' }}></TextArea>
                {fieldState.error && (<p style={{ marginTop: 4, display: 'block' }}>
                    {fieldState.error.message}
                  </p>)}
              </div>)}></Controller>)}
      </Modal.Body>

      <Modal.Footer style={{ paddingInline: 24, paddingBottom: 16 }}>
        <Button onPress={handleClose} variant="tertiary">
          취소
        </Button>
        <Button variant="primary" onPress={() => void onSubmit()}>
          반려하기
        </Button>
      </Modal.Footer>
    </Modal.Dialog></Modal.Container></Modal.Backdrop>);
}
