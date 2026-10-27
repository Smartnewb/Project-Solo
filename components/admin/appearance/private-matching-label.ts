import { formatDateWithoutTimezoneConversion } from "@/app/utils/formatters";

const NO_EXPIRY_YEAR = 9999;

export function getPrivateMatchingLabel(
  until: string | null | undefined,
  enabledAt: string | null | undefined,
  now: Date = new Date(),
): string | null {
  if (!until) return null;
  const untilTime = new Date(until).getTime();
  if (Number.isNaN(untilTime) || untilTime <= now.getTime()) return null;

  if (new Date(until).getUTCFullYear() >= NO_EXPIRY_YEAR) {
    return enabledAt
      ? `프라이빗 매칭 (${formatDateWithoutTimezoneConversion(enabledAt)}부터)`
      : "프라이빗 매칭";
  }
  return `프라이빗 매칭 (~${formatDateWithoutTimezoneConversion(until)})`;
}
