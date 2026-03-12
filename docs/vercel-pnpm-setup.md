# Vercel pnpm Build Settings

## Required Vercel Project Settings

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Build Command | `pnpm build` |
| Install Command | `pnpm install` |
| Node.js Version | 18.x |

## Notes

- `.npmrc` with `shamefully-hoist=true` is required for MUI/Emotion compatibility.
- `package-lock.json` has been removed. Only `pnpm-lock.yaml` is used.
- `preinstall` script enforces pnpm-only via `only-allow`.
