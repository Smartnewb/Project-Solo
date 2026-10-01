"use client";
import { Calendar as HeroCalendar, RangeCalendar } from "@heroui/react";
import {
  CalendarDate,
  getLocalTimeZone,
  type DateValue,
} from "@internationalized/date";
import { I18nProvider } from "react-aria-components";
import type { ComponentProps } from "react";
type DisabledDate =
  | Date
  | Date[]
  | ((date: Date) => boolean)
  | { before?: Date; after?: Date };
type DateRange = { from?: Date; to?: Date };
type CalendarBaseProps = Omit<
  ComponentProps<typeof HeroCalendar<CalendarDate, "single">>,
  | "value"
  | "defaultValue"
  | "onChange"
  | "isDateUnavailable"
  | "selectionMode"
  | "className"
  | "children"
  | "style"
  | "render"
> & {
  className?: string;
  style?: React.CSSProperties;
  locale?: { code?: string };
  initialFocus?: boolean;
  modifiersStyles?: Record<string, React.CSSProperties>;
  disabled?: DisabledDate | DisabledDate[];
};
type CalendarProps = CalendarBaseProps &
  (
    | {
        mode?: "single";
        selected?: Date;
        onSelect?: (date: Date | undefined) => void;
      }
    | {
        mode: "range";
        selected?: DateRange;
        onSelect?: (range: DateRange | undefined) => void;
      }
  );
function toCalendarDate(date: Date) {
  return new CalendarDate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
}
function isDisabled(date: Date, matcher: DisabledDate): boolean {
  if (matcher instanceof Date)
    return date.toDateString() === matcher.toDateString();
  if (Array.isArray(matcher))
    return matcher.some((item) => isDisabled(date, item));
  if (typeof matcher === "function") return matcher(date);
  return Boolean(
    (matcher.before &&
      date <
        new Date(
          matcher.before.getFullYear(),
          matcher.before.getMonth(),
          matcher.before.getDate(),
        )) ||
    (matcher.after &&
      date >
        new Date(
          matcher.after.getFullYear(),
          matcher.after.getMonth(),
          matcher.after.getDate(),
        )),
  );
}
function Calendar({
  mode,
  selected,
  onSelect,
  locale,
  initialFocus,
  autoFocus,
  modifiersStyles: _modifiersStyles,
  disabled,
  ...props
}: CalendarProps) {
  const unavailable = (date: DateValue) => {
    const local = date.toDate(getLocalTimeZone());
    return disabled
      ? Array.isArray(disabled)
        ? disabled.some((item) => isDisabled(local, item))
        : isDisabled(local, disabled)
      : false;
  };
  if (mode === "range") {
    return (
      <I18nProvider locale={locale?.code ?? "ko-KR"}>
        <RangeCalendar<CalendarDate>
          {...props}
          value={
            selected?.from && selected?.to
              ? {
                  start: toCalendarDate(selected.from),
                  end: toCalendarDate(selected.to),
                }
              : null
          }
          defaultFocusedValue={
            selected?.from ? toCalendarDate(selected.from) : undefined
          }
          autoFocus={autoFocus ?? initialFocus}
          onChange={(range) =>
            onSelect?.(
              range
                ? {
                    from: range.start.toDate(getLocalTimeZone()),
                    to: range.end.toDate(getLocalTimeZone()),
                  }
                : undefined,
            )
          }
          isDateUnavailable={unavailable}
          aria-label={props["aria-label"] ?? "기간 선택"}
        >
          <RangeCalendar.Header>
            <RangeCalendar.NavButton slot="previous" />
            <RangeCalendar.Heading />
            <RangeCalendar.NavButton slot="next" />
          </RangeCalendar.Header>
          <RangeCalendar.Grid>
            <RangeCalendar.GridHeader>
              {(day) => (
                <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>
              )}
            </RangeCalendar.GridHeader>
            <RangeCalendar.GridBody>
              {(date) => <RangeCalendar.Cell date={date} />}
            </RangeCalendar.GridBody>
          </RangeCalendar.Grid>
        </RangeCalendar>
      </I18nProvider>
    );
  }
  return (
    <I18nProvider locale={locale?.code ?? "ko-KR"}>
      <HeroCalendar<CalendarDate, "single">
        {...props}
        value={selected ? toCalendarDate(selected) : null}
        autoFocus={autoFocus ?? initialFocus}
        onChange={(date) => {
          if (date) onSelect?.(date.toDate(getLocalTimeZone()));
        }}
        isDateUnavailable={unavailable}
        aria-label={props["aria-label"] ?? "날짜 선택"}
      >
        <HeroCalendar.Header>
          <HeroCalendar.NavButton slot="previous" />
          <HeroCalendar.Heading />
          <HeroCalendar.NavButton slot="next" />
        </HeroCalendar.Header>
        <HeroCalendar.Grid>
          <HeroCalendar.GridHeader>
            {(day) => <HeroCalendar.HeaderCell>{day}</HeroCalendar.HeaderCell>}
          </HeroCalendar.GridHeader>
          <HeroCalendar.GridBody>
            {(date) => <HeroCalendar.Cell date={date} />}
          </HeroCalendar.GridBody>
        </HeroCalendar.Grid>
      </HeroCalendar>
    </I18nProvider>
  );
}
export { Calendar };
