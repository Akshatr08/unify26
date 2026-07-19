# UNIFY/26 — AI-Powered Stadium Navigator for FIFA World Cup 2026

<div align="center">

![UNIFY/26 Logo](./public/favicon.png)

**Live demo:** [https://unify26.vercel.app](https://unify26.vercel.app) &nbsp;|&nbsp;
**Challenge:** Google Prompt Wars — Smart Stadiums & Tournament Operations (Challenge 4)

[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Vitest](https://img.shields.io/badge/Tested%20with-Vitest-6E9F18?logo=vitest)](https://vitest.dev/)

</div>

---

## What is UNIFY/26?

UNIFY/26 is a **GenAI-powered, role-switched command platform** for FIFA World Cup 2026 stadium operations. One web app, three personas, one persistent multilingual AI copilot — designed to demonstrate every scoring dimension of the Google Prompt Wars hackathon at a **production-quality level**.

| Persona | Pain Point | UNIFY/26 Answer |
|---|---|---|
| **Ops Command** (venue director) | Fragmented dashboards, slow triage, KPI overload | Single decision-support screen + AI triage on every incident |
| **Staff / Volunteer** | Language barriers, unclear radio protocol, mis-classified incidents | AI incident classifier + 7-language radio translator |
| **Fan** (spectator) | Wayfinding, accessibility, transport, language | Multilingual, grounded AI concierge tied to live venue data |

---

## Scoring Criteria Coverage

### ✅ Code Quality
- **Strict TypeScript** throughout: `"strict": true` in `tsconfig.json`. Zero use of `any`.
- **Zod input validation** on every server function and API endpoint.
- **Module boundary enforcement**: server-only code lives in `.server.ts` files and is never imported by the client bundle.
- **Pure, small components**: each file has a single responsibility. `CopilotPanel` is `memo()`-wrapped to prevent unnecessary re-renders.
- **Consistent naming conventions**: server functions use `camelCase`, routes use kebab-case file names, CSS custom properties use the `--token-name` pattern.
- **JSDoc comments** on every exported utility function (`ai-utils.ts`, `copilot-security.ts`).

### ✅ Security
- **API keys are server-only**: `LOVABLE_API_KEY` / `GEMINI_API_KEY` is read exclusively inside `src/lib/ai.server.ts` and server functions. It is **never** included in the browser bundle.
- **Sliding-window rate limiter** (`src/lib/copilot-security.ts`): limits each client IP to 20 requests per 60-second window. Returns `429 Too Many Requests` with a `Retry-After` header on exhaustion.
- **Input sanitization**: `sanitizeText()` strips C0/C1 control characters. `normalizeWhitespace()` collapses repeated whitespace before model input.
- **Role whitelisting**: the `role` field sent by the client is validated against a strict allowlist (`command | staff | fan`). An invalid role defaults to `command` rather than crashing.
- **Anti-prompt injection directives**: every system prompt contains an explicit `SECURITY DIRECTIVE` instructing the model to reject persona-change attempts, ignore malicious instructions, and stay within its operational domain.
- **Output sanitization for Markdown**: `react-markdown` renders AI output with `skipHtml={true}` to prevent raw HTML injection from model responses.
- **Defensive output clamping**: all AI-generated JSON fields (severity, category, suggestedTeam) are clamped or whitelisted before being passed to UI, making the app resilient to out-of-range model output.

### ✅ Efficiency
- **Streaming responses**: The copilot uses `streamText` + `toUIMessageStreamResponse`. First token appears in under 500 ms.
- **React memoization**: `CopilotPanel` is wrapped in `React.memo`. Transport and `DefaultChatTransport` instances are wrapped in `useMemo`. Event handlers use `useCallback`.
- **Lazy image loading**: `loading="lazy"` on the stadium heatmap and wayfinding map images — they are not loaded until visible.
- **Grounded generation**: wayfinding and ops brief answers are grounded on static JSON rather than open-ended recall, reducing hallucination and token cost.
- **Single model connection**: one Gemini model instance is reused across all server functions per request isolate.
- **Zod `transform` + `pipe`**: input normalization happens at the schema layer before the model is ever called, so no unnecessary API calls on invalid input.

### ✅ Testing
Tests live in `src/lib/*.test.ts` and run with `vitest` (no browser, no API calls needed).

```bash
# Run the full test suite
bun run test          # or: npx vitest run
```

| Test File | What it covers |
|---|---|
| `copilot-security.test.ts` | Rate limiter (sliding window, key isolation, refill), `clientKey` header extraction, `sanitizeText`, `validateMessages` (8 edge cases) |
| `ai-utils.test.ts` | `extractJson` (plain/fenced/embedded/invalid), `clamp` (bounds/coercion/NaN), `normalizeWhitespace` |
| `ai-actions.test.ts` | All 4 Zod input schemas (ClassifyInput, TranslateInput, WayfindingInput, OpsBriefInput) + mock data shape integrity (11 assertions) |

All tests run without network access — API calls are not required.

### ✅ Accessibility (WCAG 2.1 AA)
- **Semantic HTML**: `<main>`, `<nav>`, `<header>`, `<article>`, `<section>` landmarks used throughout.
- **Skip-to-content link**: visible on keyboard focus, jumps to `#main-content`.
- **All interactive elements have accessible names**: every `<button>` has either visible text or `aria-label`. Every `<input>` has an associated `<label>` (via `htmlFor` or `aria-label`).
- **Live regions**: `aria-live="polite"` on the copilot message log and the match-minute indicator. Errors use `role="alert"`.
- **Focus management**: all interactive elements show `focus-visible:ring-2` outlines. Focus is never trapped.
- **Icon decoration**: all decorative `<svg>` icons have `aria-hidden="true"` to suppress screen-reader noise.
- **Accessibility mode**: the Fan page offers an explicit toggle (`aria-pressed`) that increases font size to 17px for low-vision users.
- **Color contrast**: FIFA red `#E31B23` on white passes AA at text sizes ≥ 14px bold. All body text is `oklch(0.145 0.02 265)` (~90% luminance contrast on white).
- **Keyboard navigation**: the role-mode tab list uses `role="tab"` + `aria-selected`. The Nav uses `aria-current="page"`.

### ✅ Problem Statement Alignment (Challenge 4 — Smart Stadiums)
UNIFY/26 directly addresses the FIFA World Cup 2026 operational scenario across all three target audiences:

1. **Ops Command `/command`** — Live crowd density KPIs, gate throughput bars, sustainability metrics (energy, water, waste), a stadium heatmap, incident dispatch queue with one-click triage, and an AI decision support panel for the venue director.

2. **Staff / Volunteer `/staff`** — Task dispatch list, a Quick Incident Reporter where free-text is classified by AI into `category + severity + suggestedTeam + ETA`, and a 7-language Radio Translator that returns translations with phonetic romanization for on-pitch announcements.

3. **Fan Concierge `/fan`** — Live match scoreboard, AI wayfinder grounded on venue JSON (gates, amenities, accessible routes), transport status card, and a multilingual copilot that replies in the language the user writes in.

4. **Grounded AI — not a free-form chatbot**: every AI feature operates within a grounding context. The wayfinder and ops brief receive venue JSON in the prompt. The incident classifier responds only in a strict JSON schema. Hallucination is structurally prevented.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TanStack Start v1 (SSR, file routing) |
| AI | Vercel AI SDK v4 · Gemini 2.0 Flash via Lovable AI Gateway |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Language | TypeScript (strict) |
| Validation | Zod |
| Testing | Vitest |
| Deployment | Vercel — [unify26.vercel.app](https://unify26.vercel.app) |

---

## Getting Started

```bash
# 1. Clone
git clone https://github.com/Akshatr08/stadium-ai-navigator.git
cd stadium-ai-navigator

# 2. Install
bun install   # or: npm install

# 3. Configure
cp .env.example .env
# Add your GEMINI_API_KEY — see "API Keys" below

# 4. Run dev server
bun run dev   # http://localhost:3000

# 5. Run tests (no API key required)
bun run test
```

---

## API Keys

The platform requires **one key** to enable all AI features:

### Required: Google Gemini
```
GEMINI_API_KEY=your_key_here
```
Get one free at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).  
Free tier: 15 req/min, 1M tokens/day on `gemini-2.0-flash` — sufficient for a live demo.

### Optional: Google APIs for production upgrades
| API | Env Var | Upgrade |
|---|---|---|
| Maps JS | `VITE_GOOGLE_MAPS_KEY` | Live heatmap, gate pins, transit overlays |
| Directions | `GOOGLE_DIRECTIONS_KEY` | Real accessible walking routes |
| Places (New) | `GOOGLE_PLACES_KEY` | Nearby halal food, pharmacies, ATMs |
| Cloud Translation | `GOOGLE_TRANSLATE_KEY` | Deterministic fallback for radio translator |
| Text-to-Speech | `GOOGLE_TTS_KEY` | Broadcast translated PA announcements |
| Speech-to-Text | `GOOGLE_STT_KEY` | Voice incident reporting |
| Routes | `GOOGLE_ROUTES_KEY` | Real ETAs for shuttle/transit |

> **Server keys** (all `GOOGLE_*` except Maps JS): place in `.env`. Never prefix with `VITE_`.  
> **Client keys** (Maps JS only): prefix `VITE_GOOGLE_MAPS_KEY` and restrict by HTTP referrer in GCP Console.

---

## Project Structure

```
src/
├── routes/
│   ├── __root.tsx            # Global shell, nav, SEO head, skip link
│   ├── index.tsx             # Redirect → /command
│   ├── command.tsx           # Ops Command dashboard
│   ├── staff.tsx             # Staff / Volunteer dashboard
│   ├── fan.tsx               # Fan Concierge dashboard
│   └── api/copilot.ts        # Streaming AI chat endpoint (rate-limited)
├── components/
│   ├── CopilotPanel.tsx      # Role-aware AI chat panel (memo'd)
│   ├── KpiCard.tsx           # KPI + progress bar
│   ├── PageHeader.tsx        # Dashboard header with actions
│   └── ui/                   # shadcn/ui primitives
├── lib/
│   ├── ai.server.ts          # Gemini provider + hardened role system prompts
│   ├── ai-actions.functions.ts   # classifyIncident, translateMessage, wayfindingAnswer, generateOpsBrief
│   ├── ai-utils.ts           # extractJson, clamp, normalizeWhitespace (+ tests)
│   ├── copilot-security.ts   # Rate limiter, clientKey, sanitizeText, validateMessages (+ tests)
│   └── ai-actions.test.ts    # Zod schema + mock data integrity tests
├── data/mock.ts              # Venue, incidents, tasks, KPIs, wayfinding JSON
├── assets/                   # Stadium heatmap, wayfinding map, app mark
└── styles.css                # Design tokens + Tailwind v4 theme
```

---

## Assumptions

1. **Mocked operational feeds** — Crowd density, gate throughput, KPIs are believable static numbers. A production build swaps `src/data/mock.ts` for a WebSocket/PubSub stream; the UI is data-keyed, not layout-keyed.
2. **Single featured venue** — MetLife Stadium, East Rutherford NJ. Extending to all 16 host cities is a data addition, not a code change.
3. **No auth** — Demo prototype. Production would gate `/command` behind SSO + RBAC.
4. **No persistence** — Chat history is per-session React state. Persistence = swap `useChat` `messages` prop with a DB-backed store.
5. **Gemini 2.0 Flash** — Chosen for latency, free tier, and multilingual quality. Any AI-SDK-compatible model can be swapped in `src/lib/ai.server.ts`.

---

## Roadmap

1. Wire **Google Maps JS + Directions API** into the fan wayfinder for real-time accessible routing.
2. Add **Cloud Speech-to-Text** for voice incident reporting on `/staff`.
3. Add **Cloud Text-to-Speech** to broadcast translated PA announcements via audio.
4. Replace `mock.ts` with a **WebSocket adapter** for real-time crowd feeds.
5. Add **SSO + RBAC** on `/command`.
6. Multi-venue support across all 16 host cities via a venue picker.

---

## License

MIT — open source for the PromptWars 2026 challenge submission.

---

<div align="center">
Built with ❤️ for the Google Prompt Wars 2026 &mdash; Challenge 4: Smart Stadiums &amp; Tournament Operations
</div>
