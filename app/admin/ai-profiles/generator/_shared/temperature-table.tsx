'use client';

import { Input } from '@/shared/ui/input';

interface Props {
  value: Record<string, number>;
  onChange: (next: Record<string, number>) => void;
  domains: string[];
  disabled?: boolean;
  /** Optional key -> label map (for displaying Korean labels). */
  domainLabels?: Record<string, string>;
}

export function TemperatureTable({
  value,
  onChange,
  domains,
  disabled,
  domainLabels,
}: Props) {
  const handleChange = (domain: string, raw: string) => {
    const trimmed = raw.trim();
    const next = { ...value };
    if (!trimmed) {
      delete next[domain];
      onChange(next);
      return;
    }
    const parsed = Number(trimmed);
    if (Number.isNaN(parsed)) return;
    next[domain] = parsed;
    onChange(next);
  };

  return (
    <div className="overflow-hidden rounded-md border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="w-1/2 px-3 py-2 text-left font-medium text-slate-600">
              도메인
            </th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">
              temperature
            </th>
          </tr>
        </thead>
        <tbody>
          {domains.map((domain) => {
            const current = value[domain];
            const display =
              current === undefined || current === null
                ? ''
                : String(current);
            return (
              <tr key={domain} className="border-t border-slate-200">
                <td className="px-3 py-1.5 text-slate-700">
                  {domainLabels?.[domain] ?? domain}
                </td>
                <td className="px-3 py-1.5">
                  <Input
                    type="number"
                    step={0.05}
                    min={0}
                    max={2}
                    value={display}
                    onChange={(event) =>
                      handleChange(domain, event.target.value)
                    }
                    placeholder="기본 1.0"
                    disabled={disabled}
                    className="max-w-[120px]"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
