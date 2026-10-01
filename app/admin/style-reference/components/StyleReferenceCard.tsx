'use client';
import { Button, Chip } from '@heroui/react';
import { EyeOff as VisibilityOffIcon, RotateCcw as RestoreIcon } from 'lucide-react';
import type { StyleReferenceItem } from '@/app/services/admin';
import { getKeywordMeta, CATEGORY_LABELS, GENDER_LABELS } from '../constants';
interface StyleReferenceCardProps {
    item: StyleReferenceItem;
    onDeactivate: (id: string) => void;
    onReactivate: (id: string) => void;
    isLoading?: boolean;
}
export function StyleReferenceCard({ item, onDeactivate, onReactivate, isLoading, }: StyleReferenceCardProps) {
    return (<div style={{ opacity: item.isActive ? 1 : 0.5, position: 'relative' }} className="rounded-xl border p-4">
      <img height={120} alt={`${GENDER_LABELS[item.gender]} ${CATEGORY_LABELS[item.category]}`} style={{ objectFit: 'cover', backgroundColor: "#f3f4f6" }} src={item.thumbnailUrl ?? item.imageUrl}/>

      {!item.isActive && (<div style={{ position: 'absolute', top: 8, left: 8, backgroundColor: "#dc2626", color: 'white', paddingInline: 6, paddingBlock: 2, borderRadius: 1, fontSize: 10, fontWeight: 600 }}>
          비활성
        </div>)}

      <div style={{ padding: 8 }} className="p-4">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
          {item.tags.slice(0, 3).map((tag) => {
            const meta = getKeywordMeta(tag);
            return (<Chip key={tag} size="sm">{meta ? `${meta.emoji} ${meta.nameKo}` : tag}</Chip>);
        })}
          {item.tags.length > 3 && (<Chip size="sm">{`+${item.tags.length - 3}`}</Chip>)}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p>
            {GENDER_LABELS[item.gender]} · {CATEGORY_LABELS[item.category]}
          </p>

          {item.isActive ? (<span title={"비활성화"}>
              <span>
                <Button isDisabled={isLoading} onPress={() => onDeactivate(item.id)} variant="tertiary" isIconOnly={true} aria-label={"비활성화"}>
                  <VisibilityOffIcon></VisibilityOffIcon>
                </Button>
              </span>
            </span>) : (<span title={"재활성화"}>
              <span>
                <Button isDisabled={isLoading} onPress={() => onReactivate(item.id)} variant="tertiary" isIconOnly={true} aria-label={"재활성화"}>
                  <RestoreIcon></RestoreIcon>
                </Button>
              </span>
            </span>)}
        </div>
      </div>
    </div>);
}
