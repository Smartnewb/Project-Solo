# Design System Status

> **Honest status doc.** This file previously contained a copy of Airbnb's design
> system documentation, which does not describe what this project actually uses.
> This is a short, accurate record of the current state and the known gap.

## Current State: Mixed Stack (No Unified System)

The Project-Solo admin dashboard does **not** have a single, coherent design system.
Three UI libraries coexist in the codebase without a shared component contract:

| Layer | Library | Version | Role |
|-------|---------|---------|------|
| Component library | **Material-UI (MUI)** | 6.4.8 | Heavier data-tables, date pickers, dialogs, complex forms |
| Component primitives | **shadcn/ui** (Radix-based) | — (copied components) | Lighter UI: dialogs, selects, tabs, switches, popovers |
| Styling | **Tailwind CSS** | 3.4.17 | Utility classes, layout, spacing |
| Icons | **lucide-react** + MUI Icons | — | Mixed icon sets |

### What this means in practice

- The same UI surface (a modal, a table, a form field) may be built with either MUI
  or shadcn depending on when the feature was written and who wrote it.
- There is no single source of truth for component appearance. MUI's theme and
  Tailwind/shadcn's CSS variables are independent configuration surfaces.
- Design standardization is **pending** — see the audit plan Phase 3.

## Brand Tokens

Brand color tokens live in **`tailwind.config.js`** under `theme.extend.colors`.
They are defined as CSS custom property references (e.g. `var(--color-primary)`),
with the actual hex values set in `app/globals.css`:

| Token | CSS Variable | Hex |
|-------|-------------|-----|
| Primary (Rausch) | `--color-primary` | `#ff385c` |
| Primary Active | `--color-primary-active` | `#e00b41` |
| Primary Disabled | `--color-primary-disabled` | `#ffd1da` |
| Canvas (background) | `--color-canvas` | `#ffffff` |
| Ink (text) | `--color-text` | `#222222` |
| Body text | `--color-body` | `#3f3f3f` |
| Border (hairline) | `--color-border` | `#dddddd` |
| Surface soft | `--color-surface-soft` | `#f7f7f7` |
| Error | `--color-error` | `#c13515` |
| Success | `--color-success` | `#008a05` |
| Warning | `--color-warning` | `#b26a00` |

The font family stack is configured in `tailwind.config.js` under
`theme.extend.fontFamily` (key `cereal`, aliased to `pretendard` for legacy call-sites).

### shadcn/ui configuration

`components.json` sets:
- **Style:** `new-york`
- **Base color:** `neutral`
- **CSS variables:** enabled
- **Component alias:** `@/shared/ui`
- **Icon library:** lucide

### MUI theme

MUI does not currently have a centralized `ThemeProvider` with custom theme tokens
in this repo; most MUI components use default styling with per-component `sx` props.

## Typography

The primary font is configured as **Airbnb Cereal VF** with fallbacks to Circular,
Inter, and the system stack. In practice the font files may not be bundled; the
system stack (Inter / system-ui) renders in most environments.

## Known Gaps

- **No unified component contract.** MUI and shadcn components coexist. New features
  pick whichever library the developer is most familiar with, leading to visual
  inconsistency.
- **No centralized MUI theme.** MUI styling relies on `sx` props and defaults.
- **Icon duplication.** lucide-react and MUI Icons are both imported across the
  codebase with no convention for when to use which.
- **Design token coverage is partial.** Tailwind tokens exist but MUI components
  don't consume them.

## Roadmap

Design standardization is tracked as **audit Phase 3**. The goal is to converge on a
single component library and a unified token system. Until then, prefer shadcn/ui for
new components (it consumes the Tailwind/CSS-variable tokens directly), and use MUI
only when a needed complex component (e.g., advanced data grid, date-range picker)
has no shadcn equivalent.
