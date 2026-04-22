'use client';

import { ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/ui/collapsible';
import { Label } from '@/shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import {
  DOMAIN_LABEL,
  FULL_DOMAINS,
} from '@/app/types/ai-profile-generator';
import { KeyedListInput } from '../_shared/keyed-list-input';
import { StringListInput } from '../_shared/string-list-input';
import { DomainBlueprintsFields } from './domain-blueprints-fields';
import { ImagePolicyFields } from './image-policy-fields';
import { SourceDataPolicyFields } from './source-data-policy-fields';

export interface TemplatePolicyFieldsValue {
  domainInstructions: Record<string, string>;
  randomizationPolicy: Record<string, unknown>;
  safetyPolicy: Record<string, unknown>;
  sourceDataPolicy: Record<string, unknown>;
  imagePolicy: Record<string, unknown>;
  domainBlueprints: Record<string, unknown>;
}

interface Props {
  value: TemplatePolicyFieldsValue;
  onChange: (next: TemplatePolicyFieldsValue) => void;
  disabled?: boolean;
}

type RandomizationStrategy = 'balanced' | 'realistic' | 'random' | '';

function Section({
  title,
  description,
  defaultOpen = false,
  children,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className="rounded-md border border-slate-200"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium hover:bg-slate-50">
        <span>{title}</span>
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 border-t border-slate-200 p-3">
        {description ? (
          <p className="text-xs text-slate-500">{description}</p>
        ) : null}
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function TemplatePolicyFields({ value, onChange, disabled }: Props) {
  const update = <K extends keyof TemplatePolicyFieldsValue>(
    key: K,
    next: TemplatePolicyFieldsValue[K],
  ) => {
    onChange({ ...value, [key]: next });
  };

  const strategy = (
    (value.randomizationPolicy.strategy as string | undefined) ?? ''
  ) as RandomizationStrategy;
  const pools =
    (value.randomizationPolicy.pools as
      | Record<string, string>
      | undefined) ?? {};

  const banned =
    (value.safetyPolicy.banned as string[] | undefined) ?? [];
  const requiredTags =
    (value.safetyPolicy.requiredTags as string[] | undefined) ?? [];

  const updateStrategy = (next: RandomizationStrategy) => {
    const nextPolicy = { ...value.randomizationPolicy };
    if (!next) {
      delete nextPolicy.strategy;
    } else {
      nextPolicy.strategy = next;
    }
    update('randomizationPolicy', nextPolicy);
  };

  const updatePools = (next: Record<string, string>) => {
    const nextPolicy = { ...value.randomizationPolicy };
    if (Object.keys(next).length === 0) {
      delete nextPolicy.pools;
    } else {
      nextPolicy.pools = next;
    }
    update('randomizationPolicy', nextPolicy);
  };

  const updateBanned = (next: string[]) => {
    const nextPolicy = { ...value.safetyPolicy };
    if (next.length === 0) {
      delete nextPolicy.banned;
    } else {
      nextPolicy.banned = next;
    }
    update('safetyPolicy', nextPolicy);
  };

  const updateRequiredTags = (next: string[]) => {
    const nextPolicy = { ...value.safetyPolicy };
    if (next.length === 0) {
      delete nextPolicy.requiredTags;
    } else {
      nextPolicy.requiredTags = next;
    }
    update('safetyPolicy', nextPolicy);
  };

  return (
    <fieldset disabled={disabled} className="space-y-3 disabled:opacity-60">
      <Section title="도메인 지시문" defaultOpen>
        <KeyedListInput
          value={value.domainInstructions}
          onChange={(next) => update('domainInstructions', next)}
          allowedKeys={[...FULL_DOMAINS]}
          keyLabels={DOMAIN_LABEL as Record<string, string>}
          valuePlaceholder="해당 도메인에 적용할 지시문"
          multiline
          disabled={disabled}
        />
      </Section>

      <Section title="랜덤화 정책">
        <div className="space-y-1.5">
          <Label>전략</Label>
          <Select
            value={strategy || 'unset'}
            onValueChange={(next) =>
              updateStrategy(next === 'unset' ? '' : (next as RandomizationStrategy))
            }
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="전략 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unset">미지정</SelectItem>
              <SelectItem value="balanced">balanced</SelectItem>
              <SelectItem value="realistic">realistic</SelectItem>
              <SelectItem value="random">random</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>풀(pools)</Label>
          <p className="text-xs text-slate-500">
            키는 풀 이름, 값은 JSON 배열 또는 콤마 구분 문자열을 입력하세요.
          </p>
          <KeyedListInput
            value={pools}
            onChange={updatePools}
            keyPlaceholder="풀 이름"
            valuePlaceholder='["옵션1", "옵션2"]'
            multiline
            disabled={disabled}
          />
        </div>
      </Section>

      <Section title="안전 정책">
        <div className="space-y-1.5">
          <Label>금지 키워드</Label>
          <StringListInput
            value={banned}
            onChange={updateBanned}
            placeholder="예: 폭력"
            disabled={disabled}
          />
        </div>
        <div className="space-y-1.5">
          <Label>필수 태그</Label>
          <StringListInput
            value={requiredTags}
            onChange={updateRequiredTags}
            placeholder="예: verified"
            disabled={disabled}
          />
        </div>
      </Section>

      <Section title="원본 데이터 정책">
        <SourceDataPolicyFields
          value={value.sourceDataPolicy}
          onChange={(next) => update('sourceDataPolicy', next)}
          disabled={disabled}
        />
      </Section>

      <Section title="이미지 정책">
        <ImagePolicyFields
          value={value.imagePolicy}
          onChange={(next) => update('imagePolicy', next)}
          disabled={disabled}
        />
      </Section>

      <Section title="도메인 블루프린트">
        <DomainBlueprintsFields
          value={value.domainBlueprints}
          onChange={(next) => update('domainBlueprints', next)}
          disabled={disabled}
        />
      </Section>
    </fieldset>
  );
}
