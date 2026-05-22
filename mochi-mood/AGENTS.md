# 🤖 Mochi Mood — AI Agent Instructions (Standard AGENTS.md)

> **File Standard**: This file follows the `AGENTS.md` open standard for AI coding assistants.
> **Last Updated**: 2026-05-13

## 🎯 Role & Context
You are an expert Frontend Engineer working on **Mochi Mood**, a premium, high-performance mood tracking PWA. Your goal is to maintain the **10/10 Enterprise-Ready Architecture** established in the latest refactor.

## 🏗️ Architecture & Tech Stack
- **Core**: Vanilla JavaScript (ES Modules), HTML5, Vanilla CSS.
- **State Management**: **Proxy-based Reactive Store** (`src/state.js`). All global state must be accessed and modified via the `state` object.
- **Backend**: Supabase. Use the `supabaseClient` from `src/api.js`.
- **UI**: Premium aesthetics, glassmorphism, smooth animations. No CSS frameworks used.

## 📂 Project Structure
- `/src/state.js`: Single source of truth. Handles auto-persistence to localStorage.
- `/src/api.js`: Centralized Supabase API calls & Auth logic.
- `/src/utils.js`: Shared utility functions and centralized `logger`.
- `/src/modules/`: Feature-specific modules (entry, stats, partner, profile, etc.).
- `/sw.js`: Service Worker for PWA/Offline support.

## 🛠️ Key Commands & Workflow
- **Development**: Open `index.html` via Live Server.
- **Testing**: Manual testing of reactive flows. Check Console for `[Mochi Info]` logs.
- **Security**: Run `SUPABASE_POLICIES.sql` in Supabase SQL Editor if schema changes.

## 📜 Coding Guidelines
1. **Reactivity**: NEVER use manual DOM manipulation to sync data. Update `state.xxx = value` and let the UI render functions (exported from modules) handle the display.
2. **Logging**: Use `logger.info`, `logger.warn`, or `logger.error` from `utils.js`. NEVER use plain `console.log`.
3. **Async**: Always use `try/catch` with `logger.error` for API calls.
4. **Style**: Follow the "Rich Aesthetics" guideline. Use CSS variables for colors.
5. **PWA**: If adding new files, update the `ASSETS` array in `sw.js` to ensure offline availability.

## 🛡️ Boundaries & Guardrails
- **API Keys**: NEVER hardcode keys in `src/config.js`. They must be fetched from meta tags in `index.html`.
- **Database**: Respect Row Level Security (RLS). Ensure `user_id` is always passed correctly.
- **Partner Logic**: Respect privacy between users. Shared data only if `shared: true`.

---
*Note: Before making major architectural changes, always consult the `AUDIT_REPORT.md` to ensure no regressions of the 10/10 health score.*
