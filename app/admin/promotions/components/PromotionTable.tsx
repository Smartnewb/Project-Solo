'use client';
import { Button, Chip, Checkbox } from '@heroui/react';
import { Pencil as EditIcon, Trash2 as DeleteIcon } from 'lucide-react';
import type { Promotion } from '@/types/admin';
const IAP_72H_OFFER_SKUS = new Set(['gem_sale_10', 'gem_25', 'gem_50']);
interface PromotionTableProps {
    promotions: Promotion[];
    onEdit: (p: Promotion) => void;
    onDelete: (id: string) => void;
    onToggleActive: (id: string, isActive: boolean) => void;
    loadingIds?: Set<string>;
}
export function PromotionTable({ promotions, onEdit, onDelete, onToggleActive, loadingIds, }: PromotionTableProps) {
    const formatDate = (iso: string) => new Date(iso).toLocaleDateString('ko-KR');
    return (<div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left">
          <tr className="border-b">
            <th scope="col" className="border-b px-4 py-3">순서</th>
            <th scope="col" className="border-b px-4 py-3">이미지</th>
            <th scope="col" className="border-b px-4 py-3">제목</th>
            <th scope="col" className="border-b px-4 py-3">할인율</th>
            <th scope="col" className="border-b px-4 py-3">기간</th>
            <th scope="col" className="border-b px-4 py-3">상태</th>
            <th scope="col" className="border-b px-4 py-3">액션</th>
          </tr>
        </thead>
        <tbody>
          {promotions.length === 0 ? (<tr className="border-b">
              <td colSpan={7} className="border-b px-4 py-3">
                <p>
                  프로모션이 없습니다.
                </p>
              </td>
            </tr>) : (promotions.map((p) => {
            const deleted = !!p.deletedAt;
            const loading = loadingIds?.has(p.id);
            return (<tr key={p.id} style={{ opacity: deleted ? 0.5 : 1 }} className="border-b">
                  <td className="border-b px-4 py-3">{p.sortOrder}</td>
                  <td className="border-b px-4 py-3">
                    <img src={p.imageUrl} alt={p.title} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}></img>
                  </td>
                  <td className="border-b px-4 py-3">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p>{p.title}</p>
                      {p.badge && (<Chip size="sm">{p.badge}</Chip>)}
                      {p.targetAppleSku && IAP_72H_OFFER_SKUS.has(p.targetAppleSku) && (<Chip size="sm">{"72H 오퍼 에셋"}</Chip>)}
                    </div>
                    {p.targetAppleSku && (<p>
                        {p.targetAppleSku}
                      </p>)}
                  </td>
                  <td className="whitespace-nowrap border-b px-4 py-3">{(p.derivedDiscountRate ?? p.discountRate) != null ? `${p.derivedDiscountRate ?? p.discountRate}%` : "—"}</td>
                  <td className="border-b px-4 py-3">
                    <p>
                      {formatDate(p.startsAt)} ~ {formatDate(p.expiresAt)}
                    </p>
                  </td>
                  <td className="border-b px-4 py-3">
                    {deleted ? (<Chip size="sm">{"삭제됨"}</Chip>) : (<Checkbox isSelected={p.isActive} isDisabled={loading} onChange={checked => onToggleActive(p.id, checked)}><Checkbox.Content><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control><span className="whitespace-nowrap text-sm">{p.isActive ? "활성" : "비활성"}</span></Checkbox.Content></Checkbox>)}
                  </td>
                  <td className="border-b px-4 py-3">
                    <Button onPress={() => onEdit(p)} isDisabled={deleted} variant="tertiary" isIconOnly={true}>
                      <EditIcon></EditIcon>
                    </Button>
                    <Button onPress={() => onDelete(p.id)} isDisabled={deleted} variant="tertiary" isIconOnly={true}>
                      <DeleteIcon></DeleteIcon>
                    </Button>
                  </td>
                </tr>);
        }))}
        </tbody>
      </table>
    </div>);
}
