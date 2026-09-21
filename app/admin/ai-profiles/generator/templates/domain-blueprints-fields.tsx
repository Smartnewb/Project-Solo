'use client';

import {
  DOMAIN_LABEL,
  FULL_DOMAINS,
  type AiProfileDomain,
  type DomainBlueprint,
} from '@/app/types/ai-profile-generator';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { AdvancedJsonPanel } from '../_shared/advanced-json-panel';
import { Section } from '../_shared/collapsible-section';
import { asStringArray, pickExtra } from '../_shared/policy-utils';
import { StringListInput } from '../_shared/string-list-input';

interface Props {
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  disabled?: boolean;
}

const KNOWN_DOMAIN_KEYS = FULL_DOMAINS as readonly string[];

function asBlueprint(v: unknown): DomainBlueprint {
  if (!v || typeof v !== 'object' || Array.isArray(v)) {
    return { required: [], optional: [] };
  }
  const record = v as Record<string, unknown>;
  return {
    required: asStringArray(record.required),
    optional: asStringArray(record.optional),
    hint: typeof record.hint === 'string' ? record.hint : undefined,
  };
}

function isEmptyBlueprint(bp: DomainBlueprint): boolean {
  return (
    bp.required.length === 0 &&
    bp.optional.length === 0 &&
    (!bp.hint || bp.hint.trim() === '')
  );
}

function pickKnown(value: Record<string, unknown>): Record<string, DomainBlueprint> {
  const out: Record<string, DomainBlueprint> = {};
  for (const key of Object.keys(value)) {
    if (KNOWN_DOMAIN_KEYS.includes(key)) {
      out[key] = asBlueprint(value[key]);
    }
  }
  return out;
}

export function DomainBlueprintsFields({ value, onChange, disabled }: Props) {
  const known = pickKnown(value);
  const extra = pickExtra(value, KNOWN_DOMAIN_KEYS);

  const emit = (nextKnown: Record<string, DomainBlueprint>) => {
    const merged: Record<string, unknown> = { ...extra };
    for (const [domain, bp] of Object.entries(nextKnown)) {
      if (!isEmptyBlueprint(bp)) {
        const serialized: Record<string, unknown> = {
          required: bp.required,
          optional: bp.optional,
        };
        if (bp.hint && bp.hint.trim() !== '') {
          serialized.hint = bp.hint;
        }
        merged[domain] = serialized;
      }
    }
    onChange(merged);
  };

  const updateDomain = (
    domain: AiProfileDomain,
    patch: Partial<DomainBlueprint>,
  ) => {
    const current = known[domain] ?? { required: [], optional: [] };
    const next = { ...current, ...patch };
    const nextKnown = { ...known, [domain]: next };
    emit(nextKnown);
  };

  const removeDomain = (domain: AiProfileDomain) => {
    const nextKnown = { ...known };
    delete nextKnown[domain];
    emit(nextKnown);
  };

  const handleExtraChange = (nextExtra: Record<string, unknown>) => {
    const merged: Record<string, unknown> = { ...nextExtra };
    for (const [domain, bp] of Object.entries(known)) {
      if (!isEmptyBlueprint(bp)) {
        const serialized: Record<string, unknown> = {
          required: bp.required,
          optional: bp.optional,
        };
        if (bp.hint && bp.hint.trim() !== '') {
          serialized.hint = bp.hint;
        }
        merged[domain] = serialized;
      }
    }
    onChange(merged);
  };

  return (
    <div className="space-y-3">
      {FULL_DOMAINS.map((domain) => {
        const bp = known[domain] ?? { required: [], optional: [] };
        const configured = !isEmptyBlueprint(bp);
        const title = configured
          ? `${DOMAIN_LABEL[domain]} (필수 ${bp.required.length} · 선택 ${bp.optional.length})`
          : `${DOMAIN_LABEL[domain]} · 미설정`;
        return (
          <Section key={domain} title={title}>
            <div className="space-y-1.5">
              <Label>필수 필드</Label>
              <StringListInput
                value={bp.required}
                onChange={(next) =>
                  updateDomain(domain, { required: next })
                }
                placeholder="예: name"
                disabled={disabled}
              />
            </div>
            <div className="space-y-1.5">
              <Label>선택 필드</Label>
              <StringListInput
                value={bp.optional}
                onChange={(next) =>
                  updateDomain(domain, { optional: next })
                }
                placeholder="예: hometown"
                disabled={disabled}
              />
            </div>
            <div className="space-y-1.5">
              <Label>힌트</Label>
              <Textarea
                value={bp.hint ?? ''}
                onChange={(event) =>
                  updateDomain(domain, {
                    hint: event.target.value || undefined,
                  })
                }
                rows={3}
                placeholder="이 도메인 생성 시 참고할 가이드"
                disabled={disabled}
              />
            </div>
            {configured && !disabled ? (
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => removeDomain(domain)}
                >
                  이 도메인 블루프린트 제거
                </Button>
              </div>
            ) : null}
          </Section>
        );
      })}

      <AdvancedJsonPanel
        value={extra}
        onChange={handleExtraChange}
        disabled={disabled}
      />
    </div>
  );
}
