# ✦ ClearChat

**Remove ads from ChatGPT. Get your clean AI experience back.**

[![CI/CD](https://github.com/clearchat/extension/actions/workflows/ci.yml/badge.svg)](https://github.com/clearchat/extension/actions)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Add%20to%20Chrome-emerald?logo=googlechrome&logoColor=white)](https://chrome.google.com/webstore)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

ChatGPT started showing sponsored ads in conversations. ClearChat removes them instantly — no clutter, no distractions, just clean AI.

## Features

- 🛡️ **Smart 3-Layer Detection** — DOM analysis, text matching, and product card pattern recognition working in parallel
- ⚡ **Real-Time Blocking** — MutationObserver catches ads the instant they're injected
- 📊 **Stats Dashboard** — Beautiful popup with daily/session/all-time counts and a 7-day chart
- 🌗 **Light & Dark Mode** — Follows your OS theme automatically
- 🔄 **Hot-Fix Patterns** — Remote config updates ad patterns without requiring extension updates
- 🔒 **Privacy First** — Zero data collection, no external servers, all local storage

## Install

### Chrome Web Store (Recommended)

👉 [Add to Chrome — Free](https://chrome.google.com/webstore) *(link will be updated after store approval)*

### Manual / Developer Mode

```bash
git clone https://github.com/clearchat/extension.git
cd extension
npm install
npm run build
```

Then load `dist/extension/` as an unpacked extension in `chrome://extensions/`.

## Project Structure

```
clearchat/
├── .github/workflows/   # CI/CD pipeline (lint → build → deploy)
├── src/
│   ├── manifest.json    # Extension manifest (Manifest V3)
│   ├── content.js       # Core ad detection & removal engine
│   ├── content.css      # Styles for hiding detected ad elements
│   ├── background.js    # Service worker for badge & lifecycle
│   ├── popup.html       # Dashboard popup UI
│   ├── popup.js         # Popup logic & chart rendering
│   ├── icons/           # Extension icons (16, 48, 128)
│   └── patterns/
│       └── ad-patterns.json  # Remote-updatable detection config
├── scripts/
│   ├── build.js         # Build script → dist/extension/
│   ├── package.js       # Package into .zip for store upload
│   ├── release.js       # Version bump + git tag + push
│   ├── validate-manifest.js
│   └── validate-patterns.js
├── store-assets/        # Chrome Web Store screenshots & promo tiles
├── docs/                # Landing page & documentation
└── package.json
```

## Development

```bash
# Install dependencies.
npm install

# Build to dist/extension/.
npm run build

# Lint source files.
npm run lint

# Validate manifest and patterns.
npm run validate

# Package for store upload.
npm run package
```

After building, load `dist/extension/` in Chrome via `chrome://extensions/` → Developer mode → Load unpacked.

### Updating Ad Patterns

The fastest way to respond to OpenAI changing their ad format:

1. Edit `src/patterns/ad-patterns.json` with new selectors or text indicators
2. Commit with message containing `[patterns]`: `git commit -m "fix: update ad selectors [patterns]"`
3. Push to `main` → CI automatically deploys updated patterns to CDN
4. All users get the fix within 5 minutes, no extension update needed

### Releasing a New Version

```bash
# Bump patch version (1.0.0 → 1.0.1), build, and create git tag.
node scripts/release.js patch

# Push to trigger Chrome Web Store deployment.
git push origin main --tags
```

## How It Works

ClearChat's content script runs three detection strategies in parallel:

1. **Selector Matching** — CSS selectors targeting known ad container attributes (`[data-testid*="sponsor"]`, `[class*="ad-container"]`, etc.)
2. **Text Scanning** — TreeWalker traversal looking for "Sponsored" text labels in small, standalone elements
3. **Pattern Heuristics** — Product card detection (price regex + image + sponsored text = ad block)

Detected ads are hidden via CSS (`display: none`) rather than removed from the DOM, which is safer and avoids breaking ChatGPT's JavaScript.

A `MutationObserver` watches for dynamically injected content in real-time, and a periodic scan runs every 5 seconds as a safety net.

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and run `npm run lint`
4. Submit a PR against `main`

**Bug reports welcome!** If ChatGPT shows an ad that ClearChat missed, please [open an issue](https://github.com/clearchat/extension/issues) with:
- A screenshot of the ad
- The HTML structure (right-click → Inspect)
- Your browser and extension version

## Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 1** — Browser Extension | ✅ Now | Chrome & Firefox ad removal |
| **Phase 2** — Clean Web Interface | 🔜 Soon | Standalone ad-free chat with BYOK |
| **Phase 3** — Multi-Model AI Hub | 📋 Planned | Unified hub for ChatGPT, Claude, Gemini, and more |

## License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Your AI conversations, without compromise.</strong><br>
  <a href="https://clearchat.dev">clearchat.dev</a> · <a href="https://twitter.com/clearchat">@clearchat</a>
</p>
