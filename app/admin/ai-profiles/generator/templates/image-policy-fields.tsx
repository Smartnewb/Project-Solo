'use client';

import {
  IMAGE_ASPECT_RATIOS,
  IMAGE_PROVIDERS,
  IMAGE_QUALITIES,
  IMAGE_RESOLUTIONS,
  MODERATION_STRICTNESS,
  type ImageAspectRatio,
  type ImageProviderHint,
  type ImageQuality,
  type ImageResolution,
  type ModerationStrictness,
} from '@/app/types/ai-profile-generator';
import { Label } from '@/shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { AdvancedJsonPanel } from '../_shared/advanced-json-panel';
import {
  asString,
  asStringArray,
  pickExtra,
  pruneEmpty,
} from '../_shared/policy-utils';
import { StringListInput } from '../_shared/string-list-input';

interface Props {
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  disabled?: boolean;
}

const KNOWN_KEYS = [
  'providerHint',
  'resolution',
  'aspectRatio',
  'quality',
  'moderationStrictness',
  'negativePrompts',
  'requiredTags',
  'styleBias',
] as const;

const UNSET = 'unset';

export function ImagePolicyFields({ value, onChange, disabled }: Props) {
  const providerHint = asString(value.providerHint);
  const resolution = asString(value.resolution);
  const aspectRatio = asString(value.aspectRatio);
  const quality = asString(value.quality);
  const moderationStrictness = asString(value.moderationStrictness);
  const negativePrompts = asStringArray(value.negativePrompts);
  const requiredTags = asStringArray(value.requiredTags);
  const styleBias = asString(value.styleBias);

  const extra = pickExtra(value, KNOWN_KEYS);

  const emitKnown = (patch: Record<string, unknown>) => {
    const known: Record<string, unknown> = {
      providerHint: providerHint || undefined,
      resolution: resolution || undefined,
      aspectRatio: aspectRatio || undefined,
      quality: quality || undefined,
      moderationStrictness: moderationStrictness || undefined,
      negativePrompts,
      requiredTags,
      styleBias: styleBias || undefined,
      ...patch,
    };
    onChange(pruneEmpty({ ...extra, ...known }));
  };

  const handleExtraChange = (nextExtra: Record<string, unknown>) => {
    const known: Record<string, unknown> = pruneEmpty({
      providerHint: providerHint || undefined,
      resolution: resolution || undefined,
      aspectRatio: aspectRatio || undefined,
      quality: quality || undefined,
      moderationStrictness: moderationStrictness || undefined,
      negativePrompts,
      requiredTags,
      styleBias: styleBias || undefined,
    });
    onChange({ ...nextExtra, ...known });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Provider 힌트</Label>
        <Select
          value={providerHint || UNSET}
          onValueChange={(next) =>
            emitKnown({
              providerHint:
                next === UNSET ? undefined : (next as ImageProviderHint),
            })
          }
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Provider 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNSET}>지정 안 함</SelectItem>
            {IMAGE_PROVIDERS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>해상도</Label>
        <Select
          value={resolution || UNSET}
          onValueChange={(next) =>
            emitKnown({
              resolution:
                next === UNSET ? undefined : (next as ImageResolution),
            })
          }
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="해상도 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNSET}>지정 안 함</SelectItem>
            {IMAGE_RESOLUTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>비율</Label>
        <Select
          value={aspectRatio || UNSET}
          onValueChange={(next) =>
            emitKnown({
              aspectRatio:
                next === UNSET ? undefined : (next as ImageAspectRatio),
            })
          }
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="비율 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNSET}>지정 안 함</SelectItem>
            {IMAGE_ASPECT_RATIOS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>품질</Label>
        <Select
          value={quality || UNSET}
          onValueChange={(next) =>
            emitKnown({
              quality:
                next === UNSET ? undefined : (next as ImageQuality),
            })
          }
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="품질 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNSET}>지정 안 함</SelectItem>
            {IMAGE_QUALITIES.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Moderation 엄격도</Label>
        <Select
          value={moderationStrictness || UNSET}
          onValueChange={(next) =>
            emitKnown({
              moderationStrictness:
                next === UNSET
                  ? undefined
                  : (next as ModerationStrictness),
            })
          }
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Moderation 엄격도 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNSET}>지정 안 함</SelectItem>
            {MODERATION_STRICTNESS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>금지 표현</Label>
        <StringListInput
          value={negativePrompts}
          onChange={(next) => emitKnown({ negativePrompts: next })}
          placeholder="예: nsfw"
          disabled={disabled}
        />
      </div>

      <div className="space-y-1.5">
        <Label>필수 태그</Label>
        <StringListInput
          value={requiredTags}
          onChange={(next) => emitKnown({ requiredTags: next })}
          placeholder="예: university-student"
          disabled={disabled}
        />
      </div>

      <div className="space-y-1.5">
        <Label>스타일 힌트</Label>
        <Textarea
          value={styleBias}
          onChange={(event) =>
            emitKnown({ styleBias: event.target.value || undefined })
          }
          rows={2}
          placeholder="예: soft natural lighting, editorial style"
          disabled={disabled}
        />
      </div>

      <AdvancedJsonPanel
        value={extra}
        onChange={handleExtraChange}
        disabled={disabled}
      />
    </div>
  );
}
