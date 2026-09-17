# WISE Game — Episode 1 Prototype

Devon: *Make It Through the Month* — WISE Dimension 1, Unit 1, Lesson 1.1 (Introduction to Budgeting).

Design authority: [`WISE_Game_World_Bible_v1_0.md`](../WISE_Game_World_Bible_v1_0.md) (one level up). This prototype is the Bible's §20/§21 "Next Build" — a reusable engine plus Episode 1 as its first playable content.

## Running it

No install, no build step. Just open `index.html` in a browser (double-click it, or drag it into a browser window). Everything is plain HTML/CSS/JS with no dependencies except a Google Fonts stylesheet link (Playfair Display + Poppins), so it needs internet access for fonts but nothing else.

## How it's organized

- `index.html` — page shell: top bar, app mount point, Educator View drawer.
- `css/styles.css` — WISE brand tokens (Navy `#001943` / Leaf Green `#018037` / Brand Red `#EA1E25`) and all layout/component styles.
- `js/engine.js` — **reusable, episode-agnostic.** State machine, scene rendering (story / planning / auto / outcome scene types), the generic "recovery" safety net that triggers whenever a choice would drop the balance below $0, and the Educator View data plumbing. Knows nothing about Devon specifically.
- `js/content-devon-1.js` — **all of Devon's episode content**: scene text, choices, dollar effects, branching, the two randomized variants for the Day 22 event. This is the file a writer edits to change the story; it never needs to touch `engine.js`.
- `js/app.js` — boots the start card, wires the Educator View toggle, hands off to the engine on Play.

## Adding Episode 2

Copy `content-devon-1.js` as a template, register it as `window.WISE_CONTENT["<new-id>"]` with the same `meta` / `income` / `fixed` / `savingsGoal` / `scenes` shape, and point a new start card at it in `app.js`. `engine.js` should not need to change unless a new *scene type* is introduced.

## What this prototype intentionally does not include yet

- Character illustrations (by design — see the plan; UI/typography first, art once finalized).
- A hub/world screen with multiple story cards (only Devon exists so far).
- Persistent "Continue on this device" save (Bible §13 describes this as an opt-in anonymous local save; this build is Quick Play only — nothing is written to storage, which is the simpler/safer default and satisfies the Bible's privacy rules on its own).
- Node/React tooling — deliberately skipped; this machine has no Node.js/npm/Python installed, and a dependency-free build means the game runs by opening a file, no server required.

## Verifying against the Bible's Prototype Acceptance Test (§21)

- [ ] Understandable with no teacher instructions
- [ ] Never resembles a workbook/form
- [ ] At least 3 consequential choices that visibly change later state
- [ ] A shortfall produces another decision, not failure
- [ ] Replay produces a meaningfully different month
- [ ] No login/personal info requested anywhere
- [ ] Works with mouse, touch, and keyboard-only navigation
- [ ] Educator View clearly separated from student view
