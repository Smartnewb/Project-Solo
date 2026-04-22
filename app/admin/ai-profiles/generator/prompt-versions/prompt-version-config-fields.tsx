'use client';

import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import {
  DOMAIN_LABEL,
  FULL_DOMAINS,
} from '@/app/types/ai-profile-generator';
import { Section } from '../_shared/collapsible-section';
import { KeyedListInput } from '../_shared/keyed-list-input';
import { TemperatureTable } from '../_shared/temperature-table';

export interface PromptVersionConfigFieldsValue {
  globalInstruction: string;
  domainInstructions: Record<string, string>;
  safetyInstruction: string;
  repairInstruction: string;
  temperatureByDomain: Record<string, number>;
}

interface Props {
  value: PromptVersionConfigFieldsValue;
  onChange: (next: PromptVersionConfigFieldsValue) => void;
  disabled?: boolean;
}

export function PromptVersionConfigFields({
  value,
  onChange,
  disabled,
}: Props) {
  const update = <K extends keyof PromptVersionConfigFieldsValue>(
    key: K,
    next: PromptVersionConfigFieldsValue[K],
  ) => {
    onChange({ ...value, [key]: next });
  };

  return (
    <fieldset disabled={disabled} className="space-y-3 disabled:opacity-60">
      <Section title="글로벌 지시문" defaultOpen>
        <div className="space-y-1.5">
          <Label htmlFor="pvcf-global">글로벌 지시문</Label>
          <Textarea
            id="pvcf-global"
            value={value.globalInstruction}
            onChange={(event) => update('globalInstruction', event.target.value)}
            rows={5}
            placeholder="모든 도메인 생성에 공통으로 적용되는 시스템 프롬프트"
            disabled={disabled}
          />
          <p className="text-xs text-slate-500">필수 항목입니다.</p>
        </div>
      </Section>

      <Section title="도메인별 지시문">
        <KeyedListInput
          value={value.domainInstructions}
          onChange={(next) => update('domainInstructions', next)}
          allowedKeys={[...FULL_DOMAINS]}
          keyLabels={DOMAIN_LABEL as Record<string, string>}
          valuePlaceholder="해당 도메인 생성 시 추가 지시문"
          multiline
          disabled={disabled}
        />
      </Section>

      <Section title="safety 지시문">
        <Textarea
          value={value.safetyInstruction}
          onChange={(event) => update('safetyInstruction', event.target.value)}
          rows={3}
          placeholder="선택 — moderation 강화 지시"
          disabled={disabled}
        />
      </Section>

      <Section title="repair 지시문">
        <Textarea
          value={value.repairInstruction}
          onChange={(event) => update('repairInstruction', event.target.value)}
          rows={3}
          placeholder="선택 — 재생성 시 사용할 복구 지시"
          disabled={disabled}
        />
      </Section>

      <Section title="도메인별 temperature">
        <TemperatureTable
          value={value.temperatureByDomain}
          onChange={(next) => update('temperatureByDomain', next)}
          domains={[...FULL_DOMAINS]}
          domainLabels={DOMAIN_LABEL as Record<string, string>}
          disabled={disabled}
        />
      </Section>
    </fieldset>
  );
}
