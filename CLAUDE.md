# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A multi-game score-tracking web app, built with **Angular** (standalone components + signals, no
NgModules, no NgRx). **Wizard** (3–6 players) is the first game; the architecture is designed so a
second game is one manifest entry + one new lazy route, with zero changes to Wizard's files. No
backend yet — everything persists to `localStorage`, behind an abstraction so a backend can be
swapped in later without a rewrite.

The Angular workspace lives in `web/` (not the repo root), so a future Spring Boot `api/` module can
be added later as a root-level sibling with zero directory churn. The legacy vanilla-JS single-game
version of this app has been decommissioned; there is no `index.html`/`css`/`js` at the repo root
anymore.

Deployed to GitHub Pages on every push to `main` (`.github/workflows/deploy.yml`):
https://arsen69.github.io/Nintendo4/

## Running it

```
cd web
npm install
npm start          # ng serve, dev server with live reload
npm run build       # production build (ng build)
npm test             # unit/component tests — Vitest via the Angular CLI's test builder
npm run e2e          # end-to-end tests — Playwright, starts its own ng serve on a dedicated port
```

## Architecture

### Core abstraction (`web/src/app/core/`)

Two levels, so generic session mechanics stay separate from game-specific rules:

- `game-definition.ts` — `GameMeta` (id, displayName, icon, min/max players — cheap, eagerly
  imported) and `GameDefinition<TRoundData>` (full rules: `totalRounds()`, `roundConfig()`,
  `phases[]`, `computeRoundScores()`, optional `validateRoundInput()`, `ui.phaseComponents` — only
  ever imported from within that game's own lazy-loaded route chunk).
- `game-manifest.ts` — eager `GAME_MANIFEST: GameMeta[]` powering the game-select tile grid at `/`.
- `game-session.ts` — `GameSession<TRoundData>` / `RoundRecord<T>`, the generic in-progress-game
  shape every game persists (players, totalRounds, currentRound, phaseIndex, pendingPhaseData,
  completed rounds with `scores: number[]`).
- `game-state-store.ts` / `local-storage-game-state-store.ts` — `GameStateStore` DI-token
  abstraction with a `LocalStorageGameStateStore` implementation, namespaced per game
  (`scoreboard:<gameId>:session`), with structural validation on load so a corrupt/partial blob is
  treated as "no session" instead of crashing renders. Swapping in a future `HttpGameStateStore` is
  a one-line provider change in `app.config.ts`.
- `ranking.ts` — `cumulativeTotals()` / `rankPlayers()`, pure functions over `scores: number[]`,
  reusable by every game (ties share a rank).
- `setup-draft.ts` — a separate, lighter `scoreboard:<gameId>:setup-draft` key so the setup screen
  survives a reload mid-typing, without polluting the committed session key.

### Routing (`app.routes.ts`)

`/` → `GameSelectComponent` (tile grid from `GAME_MANIFEST`). Each game is lazy-loaded at
`/games/:id` via `loadChildren`. `games/fixture` is a dev-only, non-real game proving the engine
wiring end to end (not listed in `GAME_MANIFEST`, still reachable directly, still covered by tests)
— don't remove it when adding a real second game; it's a regression check on the abstraction itself.

### Shared components (`web/src/app/shared/`)

- `player-setup/PlayerSetupComponent` — count stepper + name inputs + duplicate-name validation +
  setup-draft persistence, parameterized by a game's min/max player count. Reusable across all
  games.
- `confirm-dialog/ConfirmDialogComponent` — destructive-action confirmation (backdrop, Escape to
  cancel). Use this for anything that discards game state; don't reach for the native `confirm()`.

### Wizard (`web/src/app/games/wizard/`)

- `wizard-rules.ts` — pure, DOM-free functions: `wizardTotalRounds` (`floor(60/n)`),
  `wizardCardsDealt` (= round number), `computeWizardScore` (`20 + 10×actual` if the bid matched,
  else `-10×|bid-actual|`), `wizardDealerIndex`/`wizardBiddingOrder` (bidding starts left of the
  dealer and wraps back around, so the dealer always bids last), and
  `wizardValidateRoundInput` (tricks-won total must equal cards dealt; the dealer's bid cannot make
  the bid total equal cards dealt).
- `wizard-state.service.ts` — `WizardStateService` owns the `GameSession<WizardRoundData>` end to
  end: creation, `confirmBids`/`confirmResults` (validate then advance phase/round), persistence,
  `undoLastRound()` (pops the last completed round back into bidding, scoped to the single most
  recent round — not arbitrary history editing), `newGame()`.
- `wizard-page`/`wizard-play`/`wizard-end` components — setup (via the shared
  `PlayerSetupComponent`) → bidding/results/score-table → final ranking. The score table is a single table at all viewport widths (horizontally scrollable
  via `.table-wrap` on narrow screens, not swapped for stacked cards). Bid/actual inputs
  validate live (out-of-range or a rule violation disables the confirm button and shows an
  `aria-live` message) rather than silently clamping.

When modifying scoring, round progression, or validation, `wizard-rules.ts` and
`wizard-state.service.ts` are the two files to touch — the play/end components are purely
presentational over `WizardStateService`'s signals.

## Testing

- Unit/component tests (`*.spec.ts`, run via `npm test`) cover pure logic (`wizard-rules`,
  `ranking`, `player-name-utils`) and component/service behavior via Angular's `TestBed`, using a
  fake `GameStateStore`/`localStorage` rather than the real browser APIs.
- `web/e2e/*.spec.ts` (run via `npm run e2e`) drive a real headless Chromium browser end to end —
  full game playthroughs, the responsive score-table breakpoint, confirm-dialog flows, and asserting
  zero console errors. Bidding/results panels are structurally swapped (`@if`/`@else`), not updated
  in place, so e2e tests must wait for the new phase's heading to appear before interacting with its
  inputs — filling too early can land on the about-to-be-destroyed previous panel and silently lose
  the input.
