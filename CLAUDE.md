# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Himat is a Tauri v2 desktop application with Vue 3 frontend and Rust backend. It provides an AI assistant interface with features including chat, knowledge management, file handling, browser integration, and workflow automation.

## Build & Development Commands

```bash
# Install dependencies
vp install

# Development
vp dev                    # Start Vue dev server
pnpm tauri dev           # Start Tauri app (requires dev server running)

# Build
vp build                 # Build frontend
pnpm tauri build         # Build desktop app

# Platform-specific builds
pnpm build:app:macos     # macOS x64
pnpm build:app:macos-arm # macOS ARM64
pnpm build:app:windows   # Windows
pnpm build:app:linux     # Linux

# Sign updater artifacts
pnpm updater:sign
```

## Architecture

### Frontend (`src/`)

- **Framework**: Vue 3.5 + TypeScript + Vite+
- **State Management**: Pinia with persisted state plugin
- **Router**: Vue Router 5 with modular route config
- **UI**: shadcn-vue (Radix Vue + Tailwind CSS v4)
- **i18n**: vue-i18n with zh-CN, zh-TW, en-US locales

```
src/
├── components/     # UI components (shadcn-vue in ui/, business components in core/)
├── composables/    # Reusable composition functions
├── config/         # App constants and configuration
├── i18n/           # Internationalization (locales/)
├── lib/            # Utility libraries (utils.ts for cn() helper)
├── router/         # Route definitions (modules/)
├── store/          # Pinia stores (modules/)
├── types/          # TypeScript type definitions
├── utils/          # Utilities (tauri.ts, request.ts, proxy.ts, theme.ts)
└── views/          # Page components (apps/, chat/, settings/, etc.)
```

### Backend (`src-tauri/`)

- **Framework**: Tauri v2
- **Key Features**:
  - System tray with native menus
  - Local HTTP proxy server (`proxy_server.rs`)
  - Window management (hidden on close, show on reopen)
  - Auto-updater with signed artifacts

```
src-tauri/
├── src/
│   ├── lib.rs          # Main entry, plugin registration, Tauri builder
│   ├── main.rs         # Binary entry point
│   ├── commands.rs     # Tauri commands (invoke from frontend)
│   ├── proxy_plugin.rs # Proxy management (get/set/clear proxy)
│   ├── proxy_server.rs # Local HTTP proxy implementation
│   └── tray.rs         # System tray and native menu handling
└── tauri.conf.json     # Tauri configuration
```

### Key Tauri Commands

Frontend invokes backend via `tauriInvoke()` from `@/utils/tauri`:

- `get_platform()` - Returns current OS
- `get_app_version()` - Returns app version
- `open_external(url)` - Open URL in default browser
- `update_tray_tooltip(text)` - Update tray icon tooltip
- `update_native_menus(labels)` - Update native menu labels for i18n
- Proxy commands: `get_local_proxy_addr`, `set_proxy`, `clear_proxy`, `get_proxy`, `get_proxy_status`

## Configuration

### Frontend Constants (`src/config/constants.ts`)

- Server URLs, OAuth path, API timeouts
- Storage keys for settings/locale/theme
- Route names, retry configs, proxy settings

### Tauri Config (`src-tauri/tauri.conf.json`)

- Window: 960x600, overlay title bar, transparent background
- Bundle icons in `src-tauri/icons/`
- Updater endpoints and public key

## Important Patterns

### Tauri Detection & Invocation

```typescript
import { isTauriEnvironment, tauriInvoke } from "@/utils/tauri";

if (isTauriEnvironment()) {
  await tauriInvoke("command_name", { arg: value });
}
```

### Pinia Stores

```typescript
import { storeToRefs } from "pinia";
import { useUserStore } from "@/store/modules/user";

const userStore = useUserStore();
const { isLogin, accessToken } = storeToRefs(userStore);
```

### shadcn-vue Components

Components are in `src/components/ui/`. Add new ones via:
```bash
vp dlx shadcn-vue@latest add <component>
```

### i18n

```typescript
import { useI18n } from "vue-i18n";
const { t } = useI18n();
// Usage: {{ t('settings.about.title') }}
```

## Recommended IDE Setup

- VS Code + Vue Official + Tauri + rust-analyzer

## Notes

- Window hides on close (not quit), shows on macOS dock reopen
- Local proxy starts automatically for request handling
- Updater artifacts require signing with `himat.key`
