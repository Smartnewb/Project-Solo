'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { useToast } from '@/shared/ui/admin/toast';
import { useAiProfileErrorHandler } from '../_shared-error';
import { DepartmentSearch } from './department-search';
import { UniversitySearch } from './university-search';

interface Props {
  universityId: string | null;
  departmentId: string | null;
  onChange: (
    universityId: string | null,
    departmentId: string | null,
    universityName?: string | null,
    departmentName?: string | null,
  ) => void;
  showSuggest?: boolean;
}

export function SourceDataPicker({
  universityId,
  departmentId,
  onChange,
  showSuggest = true,
}: Props) {
  const toast = useToast();
  const handleError = useAiProfileErrorHandler();
  const [universityName, setUniversityName] = useState<string | null>(null);
  const [departmentName, setDepartmentName] = useState<string | null>(null);
  const [suggestInstruction, setSuggestInstruction] = useState('');

  const suggestMutation = useMutation({
    mutationFn: () =>
      aiProfileGenerator.suggestSchoolMajor({
        instruction: suggestInstruction.trim(),
      }),
    onSuccess: (result) => {
      const top = result.suggestions?.[0];
      if (!top) {
        toast.info('제안 결과가 없습니다.');
        return;
      }
      setUniversityName(top.universityName);
      setDepartmentName(top.departmentName);
      onChange(
        top.universityId,
        top.departmentId,
        top.universityName,
        top.departmentName,
      );
      toast.success(
        `추천: ${top.universityName} · ${top.departmentName}`,
      );
    },
    onError: handleError,
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>대학</Label>
          {universityId && universityName ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-slate-700">
              {universityName}{' '}
              <button
                type="button"
                className="ml-2 text-xs text-slate-500 hover:underline"
                onClick={() => {
                  setUniversityName(null);
                  setDepartmentName(null);
                  onChange(null, null);
                }}
              >
                변경
              </button>
            </div>
          ) : (
            <UniversitySearch
              value={universityId}
              onChange={(id, name) => {
                setUniversityName(name);
                setDepartmentName(null);
                onChange(id, null, name, null);
              }}
            />
          )}
        </div>
        <div className="space-y-1.5">
          <Label>학과</Label>
          {departmentId && departmentName ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-slate-700">
              {departmentName}{' '}
              <button
                type="button"
                className="ml-2 text-xs text-slate-500 hover:underline"
                onClick={() => {
                  setDepartmentName(null);
                  onChange(universityId, null, universityName, null);
                }}
              >
                변경
              </button>
            </div>
          ) : (
            <DepartmentSearch
              universityId={universityId}
              value={departmentId}
              onChange={(id, name) => {
                setDepartmentName(name);
                onChange(universityId, id, universityName, name);
              }}
            />
          )}
        </div>
      </div>

      {showSuggest ? (
        <div className="space-y-1.5 rounded-md border border-dashed border-slate-300 p-3">
          <Label htmlFor="suggest">자연어로 대학·학과 제안받기</Label>
          <div className="flex gap-2">
            <Input
              id="suggest"
              value={suggestInstruction}
              onChange={(e) => setSuggestInstruction(e.target.value)}
              placeholder="예) 서울권 여대, 심리학 계열"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => suggestMutation.mutate()}
              disabled={
                suggestMutation.isPending ||
                suggestInstruction.trim().length === 0
              }
            >
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              {suggestMutation.isPending ? '추천 중…' : '추천'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
