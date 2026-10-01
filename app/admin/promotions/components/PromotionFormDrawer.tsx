'use client';
import { Drawer, Button, Spinner, TextField, Label, Input, Description, Select, ListBox, Checkbox } from '@heroui/react';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PromotionImageUpload } from './PromotionImageUpload';
import { useUploadPromotionImage, useDeletePromotionImage, } from '@/app/admin/hooks';
import { useToast } from '@/shared/ui/admin/toast';
import AdminService from '@/app/services/admin';
import type { Promotion, CreatePromotionRequest, AdminGemProduct, } from '@/types/admin';
interface PromotionFormDrawerProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CreatePromotionRequest) => Promise<void>;
    editPromotion: Promotion | null;
}
const DEFAULT_FORM = {
    title: '',
    subtitle: '',
    badge: '',
    imageUrl: '',
    backgroundColor: '#FFFFFF',
    originGemProductId: '',
    saleGemProductId: '',
    startsAt: '',
    expiresAt: '',
    sortOrder: 0,
    ctaText: '지금 받기',
    targetFirstPurchaseOnly: false,
    isActive: true,
};
const IAP_72H_OFFER_SKUS = new Set(['gem_sale_10', 'gem_25', 'gem_50']);
function formatProductLabel(p: AdminGemProduct): string {
    const sku = p.appleSku ? ` · ${p.appleSku}` : '';
    const display = p.applePrice?.displayPrice ?? `${p.price.toLocaleString()} ${p.currency}`;
    return `${p.productName} (${p.totalGems}구슬, ${display})${sku}`;
}
export function PromotionFormDrawer({ open, onClose, onSubmit, editPromotion, }: PromotionFormDrawerProps) {
    const toast = useToast();
    const [form, setForm] = useState(DEFAULT_FORM);
    const [s3Key, setS3Key] = useState<string>('');
    const [oldS3Key, setOldS3Key] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const uploadMutation = useUploadPromotionImage();
    const deleteImageMutation = useDeletePromotionImage();
    const productListQuery = useQuery({
        queryKey: ['admin', 'gem-products', 'list'],
        queryFn: () => AdminService.gemProducts.getList(),
        enabled: open,
    });
    const products = useMemo(() => productListQuery.data ?? [], [productListQuery.data]);
    const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
    useEffect(() => {
        if (open && editPromotion) {
            setForm({
                title: editPromotion.title,
                subtitle: editPromotion.subtitle ?? '',
                badge: editPromotion.badge ?? '',
                imageUrl: editPromotion.imageUrl,
                backgroundColor: editPromotion.backgroundColor,
                originGemProductId: editPromotion.originGemProductId ?? '',
                saleGemProductId: editPromotion.saleGemProductId ?? editPromotion.targetGemProductId ?? '',
                startsAt: editPromotion.startsAt.slice(0, 16),
                expiresAt: editPromotion.expiresAt.slice(0, 16),
                sortOrder: editPromotion.sortOrder,
                ctaText: editPromotion.ctaText,
                targetFirstPurchaseOnly: editPromotion.targetFirstPurchaseOnly,
                isActive: editPromotion.isActive,
            });
            setS3Key('');
            setOldS3Key('');
        }
        else if (open && !editPromotion) {
            setForm(DEFAULT_FORM);
            setS3Key('');
            setOldS3Key('');
        }
        setErrors({});
    }, [open, editPromotion]);
    const handleFileSelected = async (file: File) => {
        try {
            const result = await uploadMutation.mutateAsync(file);
            if (s3Key)
                setOldS3Key(s3Key);
            setForm((prev) => ({ ...prev, imageUrl: result.imageUrl }));
            setS3Key(result.s3Key);
        }
        catch {
            toast.error('이미지 업로드에 실패했습니다.');
        }
    };
    const validate = () => {
        const errs: Record<string, string> = {};
        if (!form.title.trim())
            errs.title = '제목을 입력하세요.';
        if (!form.imageUrl)
            errs.imageUrl = '이미지를 업로드하세요.';
        if (!form.backgroundColor)
            errs.backgroundColor = '배경색을 선택하세요.';
        if (!form.saleGemProductId)
            errs.saleGemProductId = '할인 상품(SKU)을 선택하세요.';
        if (!form.originGemProductId)
            errs.originGemProductId = '원가 상품(SKU)을 선택하세요.';
        if (form.originGemProductId &&
            form.saleGemProductId &&
            form.originGemProductId === form.saleGemProductId) {
            errs.saleGemProductId = '원가 상품과 할인 상품은 달라야 합니다.';
        }
        if (!form.startsAt)
            errs.startsAt = '시작일을 입력하세요.';
        if (!form.expiresAt)
            errs.expiresAt = '종료일을 입력하세요.';
        if (form.startsAt && form.expiresAt && form.expiresAt <= form.startsAt)
            errs.expiresAt = '종료일은 시작일 이후여야 합니다.';
        return errs;
    };
    const origin = form.originGemProductId
        ? productMap.get(form.originGemProductId)
        : undefined;
    const sale = form.saleGemProductId
        ? productMap.get(form.saleGemProductId)
        : undefined;
    const isIap72hOfferAsset = Boolean(sale?.appleSku && IAP_72H_OFFER_SKUS.has(sale.appleSku));
    const originPrice = origin?.applePrice?.price ?? origin?.price ?? 0;
    const salePrice = sale?.applePrice?.price ?? sale?.price ?? 0;
    const derivedDiscountRate = origin && sale && originPrice > 0 && salePrice >= 0 && originPrice > salePrice
        ? Number((((originPrice - salePrice) / originPrice) * 100).toFixed(1))
        : null;
    const handleSubmit = async () => {
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }
        setSubmitting(true);
        try {
            const data: CreatePromotionRequest = {
                title: form.title,
                subtitle: form.subtitle || undefined,
                badge: form.badge || undefined,
                imageUrl: form.imageUrl,
                backgroundColor: form.backgroundColor,
                originGemProductId: form.originGemProductId || undefined,
                saleGemProductId: form.saleGemProductId || undefined,
                // Keep targetGemProductId for backwards compat with older API field
                targetGemProductId: form.saleGemProductId || undefined,
                startsAt: new Date(form.startsAt).toISOString(),
                expiresAt: new Date(form.expiresAt).toISOString(),
                sortOrder: form.sortOrder,
                ctaText: form.ctaText || undefined,
                targetFirstPurchaseOnly: form.targetFirstPurchaseOnly,
                isActive: form.isActive,
            };
            await onSubmit(data);
            if (oldS3Key) {
                deleteImageMutation.mutate(oldS3Key);
            }
        }
        catch {
            // parent handles toast
        }
        finally {
            setSubmitting(false);
        }
    };
    const set = (field: string, value: unknown) => setForm((prev) => ({ ...prev, [field]: value }));
    const productsLoading = productListQuery.isLoading;
    const productsError = productListQuery.isError;
    return (<Drawer.Backdrop isOpen={open} onOpenChange={(v) => !v && onClose()}>
      <Drawer.Content placement="right" className="w-full max-w-[480px]"><Drawer.Dialog className="overflow-y-auto">
        <Drawer.Header>
          <Drawer.Heading>{editPromotion ? '프로모션 수정' : '프로모션 등록'}</Drawer.Heading>
        </Drawer.Header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          <TextField isInvalid={!!errors.title} className="mb-4"><Label>{"제목 *"}</Label><Input value={form.title} onChange={(e) => set('title', e.target.value)} {...{ maxLength: 50 }}></Input><Description>{errors.title}</Description></TextField>

          <TextField className="mb-4"><Label>{"부제목"}</Label><Input value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} {...{ maxLength: 100 }}></Input></TextField>

          <TextField className="mb-4"><Label>{"배지"}</Label><Input value={form.badge} onChange={(e) => set('badge', e.target.value)} placeholder="예: HOT, NEW" {...{ maxLength: 20 }}></Input></TextField>

          <div>
            <p>
              프로모션 이미지 *
            </p>
            <PromotionImageUpload imageUrl={form.imageUrl || null} uploading={uploadMutation.isPending} onFileSelected={handleFileSelected} onError={(msg) => toast.error(msg)}></PromotionImageUpload>
            {errors.imageUrl && (<p>{errors.imageUrl}</p>)}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div>
              <p>
                배경색 *
              </p>
              <Input type="color" value={form.backgroundColor} onChange={(e) => set('backgroundColor', e.target.value)} style={{ width: 48, height: 36, cursor: 'pointer', border: 'none', borderRadius: 4 }}></Input>
            </div>
            <TextField isInvalid={!!errors.backgroundColor} className="mb-4"><Label>{"배경색 (HEX) *"}</Label><Input value={form.backgroundColor} onChange={(e) => set('backgroundColor', e.target.value)} placeholder="#FFFFFF"></Input><Description>{errors.backgroundColor}</Description></TextField>
          </div>

          <hr></hr>

          <p>
            구슬 SKU 페어
          </p>
          <p>
            할인 상품의 Apple SKU가 gem_sale_10, gem_25, gem_50이면 앱 72시간 오퍼 카드의
            이미지/문구/CTA 에셋으로도 사용됩니다.
          </p>

          {productsError && (<p>
              구슬 상품 목록을 불러오지 못했습니다.
            </p>)}

          <div>
            <label id="origin-gem-product-label">원가 상품 *</label>
            <Select value={form.originGemProductId} isDisabled={productsLoading} aria-label={"원가 상품 *"} onChange={(key) => {
            const value = String(key ?? "");
            set('originGemProductId', value);
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
              <ListBox.Item id={""} textValue={"\uC120\uD0DD\uD558\uC138\uC694"}>
                선택하세요
              </ListBox.Item>
              {products.map((p) => (<ListBox.Item key={p.id} id={p.id} textValue={String(formatProductLabel(p))}>
                  {formatProductLabel(p)}
                </ListBox.Item>))}
            </ListBox></Select.Popover></Select>
            {errors.originGemProductId && (<p>{errors.originGemProductId}</p>)}
          </div>

          <div>
            <label id="sale-gem-product-label">할인 상품 *</label>
            <Select value={form.saleGemProductId} isDisabled={productsLoading} aria-label={"할인 상품 *"} onChange={(key) => {
            const value = String(key ?? "");
            set('saleGemProductId', value);
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
              <ListBox.Item id={""} textValue={"\uC120\uD0DD\uD558\uC138\uC694"}>
                선택하세요
              </ListBox.Item>
              {products.map((p) => (<ListBox.Item key={p.id} id={p.id} textValue={String(formatProductLabel(p))}>
                  {formatProductLabel(p)}
                </ListBox.Item>))}
            </ListBox></Select.Popover></Select>
            {errors.saleGemProductId && (<p>{errors.saleGemProductId}</p>)}
          </div>

          {isIap72hOfferAsset && (<p>
              이 프로모션은 {sale?.appleSku} 72시간 오퍼 에셋으로 연결됩니다.
            </p>)}

          <div style={{ padding: 12, borderRadius: 1, backgroundColor: '#f9fafb', border: '1px solid' }}>
            <p>
              파생 할인율 (자동 계산)
            </p>
            <p>
              {derivedDiscountRate !== null
            ? `${derivedDiscountRate}%`
            : '— (원가/할인 상품을 모두 선택하세요)'}
            </p>
            {origin && sale && (<p>
                원가 {origin.applePrice?.displayPrice ?? `${origin.price.toLocaleString()} ${origin.currency}`}
                {' → '}
                할인가 {sale.applePrice?.displayPrice ?? `${sale.price.toLocaleString()} ${sale.currency}`}
              </p>)}
          </div>

          <hr></hr>

          <TextField isInvalid={!!errors.startsAt} className="mb-4"><Label>{"시작일 *"}</Label><Input type="datetime-local" value={form.startsAt} onChange={(e) => set('startsAt', e.target.value)}></Input><Description>{errors.startsAt}</Description></TextField>

          <TextField isInvalid={!!errors.expiresAt} className="mb-4"><Label>{"종료일 *"}</Label><Input type="datetime-local" value={form.expiresAt} onChange={(e) => set('expiresAt', e.target.value)}></Input><Description>{errors.expiresAt}</Description></TextField>

          <TextField className="mb-4"><Label>{"정렬 순서"}</Label><Input type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value))}></Input></TextField>

          <TextField className="mb-4"><Label>{"CTA 텍스트"}</Label><Input value={form.ctaText} onChange={(e) => set('ctaText', e.target.value)} placeholder="지금 받기" {...{ maxLength: 20 }}></Input></TextField>

          <hr></hr>

          <Checkbox isSelected={form.targetFirstPurchaseOnly} onChange={checked => set('targetFirstPurchaseOnly', checked)} className="inline-flex items-center gap-2 mr-4"><Checkbox.Content><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control>{"첫 구매자만"}</Checkbox.Content></Checkbox>

          <Checkbox isSelected={form.isActive} onChange={checked => set('isActive', checked)} className="inline-flex items-center gap-2 mr-4"><Checkbox.Content><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control>{"활성화"}</Checkbox.Content></Checkbox>

          <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
            <Button onPress={onClose} isDisabled={submitting} fullWidth variant="secondary">
              취소
            </Button>
            <Button isDisabled={submitting || uploadMutation.isPending} fullWidth variant="primary" onPress={() => void handleSubmit()}>
              {submitting ? <Spinner size="sm"></Spinner> : editPromotion ? '수정' : '등록'}
            </Button>
          </div>
        </div>
      </Drawer.Dialog></Drawer.Content>
    </Drawer.Backdrop>);
}
