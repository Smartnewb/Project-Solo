# Admin Design System

## Migration status

The admin UI uses HeroUI 3.2.6 with Tailwind CSS 4.3.3. MUI, Radix UI, Shadcn and the previous date-picker dependencies have been removed. Shared controls, page controls and the interactive app preview compose actual HeroUI components. Semantic layout, tables, charts and hidden native file inputs remain appropriate. The initial migration was deployed to Vercel production on 2026-10-02. Follow-up modal and navigation corrections require the deployment verification recorded below.

Local verification on 2026-10-02: the admin typecheck (including app/components/admin), lint with zero errors, all 122 Jest suites / 481 tests, and the production Next.js build passed. A source audit covered 546 UI files and found no exposed native form controls, legacy UI imports, displaced client directives or empty imports. Aside browser checks used a read-only fixture gateway for the X marketing theme and text entry, notice/HTML editor transition and named priority selection, and keyboard UTM tab navigation. Real backend mutations and device-specific browser testing were not performed.

Use actual `@heroui/react` components for new interactive UI and `lucide-react` for icons. Semantic HTML remains appropriate for layout, text and tables. Shared controls in `shared/ui/` compose HeroUI while keeping existing application props; they are not a MUI compatibility layer. Do not introduce new MUI or Radix controls.

## Brand and surfaces

The source of truth is `app/globals.css`. `postcss.config.js` uses `@tailwindcss/postcss`; the CSS imports Tailwind before `@heroui/styles`. The existing Tailwind configuration retains project font, spacing and utility tokens.

| Token | CSS variable | Value |
|---|---|---|
| Primary | `--accent`, `--color-primary` | `#7A4AE2` |
| Primary active | `--color-primary-active` | `#6334C4` |
| Primary disabled | `--color-primary-disabled` | `#E6DCF8` |
| Primary foreground | `--accent-foreground` | `#ffffff` |
| Focus | `--focus` | `#7A4AE2` |
| Canvas | `--color-canvas` | `#ffffff` |
| Title | `--color-text` | `#222222` |
| Body | `--color-body` | `#3f3f3f` |
| Border | `--color-border` | `#dddddd` |
| Soft surface | `--color-surface-soft` | `#f7f7f7` |
| Radius | `--radius`, `--field-radius` | `0.75rem` |

Primary actions use a purple surface with white text. Action buttons use 12px corners and secondary button text is black. Secondary actions and data surfaces stay neutral; status colors retain their distinct meaning. Form fields have a visible border. Legacy HSL helpers use `--legacy-*` names so they cannot overwrite HeroUI color variables.

The font stack remains configured in `tailwind.config.js`: Cereal/Circular/Inter/system, with the existing `pretendard` alias. App preview simulations are examples, not evidence of the current mobile design.

## Interaction contract

- Use compound labels, descriptions and errors with HeroUI fields. Icon buttons need a useful accessible name.
- Use ComboBox for searchable selection; converting autocomplete to a plain Select loses search behavior.
- Render programmatic dialogs with controlled `Modal.Backdrop`; a `Modal` root without a trigger creates an empty PressResponder. Restore focus on dismissal, and disable dismissal while an irreversible request is pending.
- Put Radio/Checkbox/Switch controls inside their Content slots so the visible control and label activate the same input.
- Preserve service calls, country separation, filters, pagination, unsaved changes and confirmation flows.
- Keep Date and range conversions in the intended local timezone. A single-date test does not verify a date-range consumer.
- Remove old dependencies only after all callers are migrated. Import removal alone is not proof: verify real control behavior, layout, typecheck and build before release.

## Modal and navigation corrections (2026-10-02)

HeroUI md/lg are not MUI md/lg widths. Specify the intended Dialog max-width; the global Container fills the viewport so the limit can take effect. Drawer.Content owns positioning and Drawer.Dialog owns panel width. Inside-scrolling forms need a flex/min-height chain; headers and footers remain outside the body scroll. Shared dialogs without a Body use outside scrolling. Horizontal tab lists scroll within their available width.

The sidebar has top search, compact favorites, collapsible categories, 40px desktop/44px coarse-pointer rows and Lucide category icons. Hidden favorite actions remain accessible on focus and on touch. Active groups open without overwriting saved preferences.

Aside checks used a read-only local fixture gateway: desktop user detail width 1076px, 390px iframe user detail and birthday dialogs 354px without horizontal overflow, sidebar row height 40px/font 14px, and cancel/focus restoration. Source size restoration covered 78 admin files and four Drawer callsites. Real account changes, messages and publishing were not performed. The iframe verifies a narrow browser viewport, not a physical mobile device.

Follow-up local verification: 140 suites / 557 tests passed; the final search-field change passed seven targeted tests and the admin typecheck. Lint has zero errors with existing warnings.
