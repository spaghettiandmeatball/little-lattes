# Cozy latte art prototype — first-pass build plan

Status: proposal for discussion, October 6, 2026. No game implementation yet.

## Agreed direction

- A cozy game about controlling a milk pour to create latte art.
- Players control position, movement speed, and milk flow, with a finite milk supply.
- Sandbox and progressively harder puzzle modes; later puzzles introduce obstacles.
- Add an endless orders mode using the same pouring, target, and scoring systems. Its detailed rules below are proposed defaults for testing.
- Mouse and touch are equal priorities.
- Portrait is the primary game composition. Wide windows reveal additional decorative background around the centered play area.
- All three feel directions must be available for user testing: drawing-first, accessible fluid behavior, and technique-oriented pouring. Their values are experimental.
- Three.js is the proposed renderer, with support for custom models.

## Recommendation and reference findings

Build a fresh Three.js + TypeScript + Vite project. Use Chonkimals as an architectural reference: focused modules, DOM UI, GLB loading, custom shaders, environment lighting, device pixel-ratio limits, storage helpers, and performance instrumentation.

Inspected reference: E:/chonkimals/camp-chonkimal. Its package declares Three.js ^0.170.0 and Rapier; src/water.ts uses animated surface/flow shaders and ripple rings, rather than a milk transport simulation. src/main.ts combines many unrelated game systems. Its Vite setup serves a previously compiled export, and its global THREE and screenshot rules belong to its original hosting environment. These are reference-document instructions, not requirements for this new game.

Use ordinary module imports and a conventional development server for the new project. Keep rendering, simulation, controls, scoring, level data, audio, and UI separate. Select and pin dependency versions when implementation starts. Add a rigid-body engine only if moving physical props justify it.

## Core experience

1. Choose sandbox, a puzzle, or endless orders, then a pouring preset.
2. See the target, milk allowance, and any obstacle rule before pouring.
3. Move the pitcher over the cup; control flow independently of movement speed.
4. Watch milk spread and push existing patterns, with immediate visual and audio feedback.
5. Release to reposition without spending milk; resume when ready.
6. Submit when satisfied or finish when milk runs out. Allow a short, consistent settling period before scoring.
7. See the finished cup, target comparison, and understandable feedback; retry immediately.

Puzzle attempts have no countdown by default. Milk is the main constraint. Sandbox has a finite pitcher, manual refills, reset, and optional target practice, with no required score. Unlimited milk can be a test setting.

## Controls and camera

Design a portrait gameplay area first: request card above, large cup in the middle, milk and flow controls within comfortable reach below/beside the cup. Treat 9:16 as a starting composition, not a forced device ratio. Accommodate taller phones, tablets, safe areas, and short browser windows without cropping controls or stretching the cup.

On wide screens, center the portrait play area and expand only the decorative cafe background. Keep the cup's apparent size, input mapping, target layout, and gameplay boundaries consistent. The simplest first implementation uses a portrait game canvas inside a full-window decorative background; a continuous wider 3D scene can come later. Extra width must not reveal additional playable space or change obstacle paths. Decorative side regions do not accept pouring input.

Use a stable, nearly overhead camera while pouring, with a more angled presentation view after finishing. Do not orbit the camera during a stroke. Test whether mild perspective or orthographic projection gives better precision.

Desktop: pointer positions the pour; hold the primary button to pour; wheel or an on-screen control adjusts flow. The flow control must remain usable without a wheel. Movement speed comes directly from pointer movement. Add keyboard shortcuts only as optional conveniences.

Touch: one finger positions the pour and a separate thumb control holds/adjusts flow. Support independent pointer IDs, pointer capture, and mirrored left/right-handed layouts. Test an offset pour marker so the finger does not cover the landing point. Allow enough room around the cup to reach the entire surface. Test on real phones and tablets, not only browser emulation.

Technique preset: add a clearly labeled high/low pour control, then evaluate continuous height. Animate pitcher tilt from requested flow at first; independent tilt and cup tilt are later candidates, not initial control requirements.

All presets need immediate landing-point feedback. Light input filtering may reduce jitter, but must not create visible lag. Interpolate fast strokes so sparse input events do not leave dots or gaps. Cancel pouring on lost input, window blur, pause, and pointer cancellation.

## Simulation and rendering

Use a 3D cup, pitcher, and milk stream with a two-dimensional fluid field on the coffee surface. This is a controllable approximation of latte art, not a promise of physically complete milk/coffee simulation.

Track surface velocity and visible milk concentration in GPU textures. Inject milk and momentum at the stream landing point, transport the fields, constrain flow at the cup boundary, and apply tunable damping and limited diffusion. Add a stylized deposition model for foam visibility and pour height: a generic fluid solver alone will not produce convincing latte art.

Tune flow rate, deposition radius, milk opacity, lateral spreading, viscosity/damping, height response, and settling. Milk expenditure is based on flow integrated over time, independent of frame rate; off-cup pouring also consumes milk. Keep a single volume ledger distinct from apparent white coverage. Reserve cup capacity for the full pitcher in the first build; overflow is later scope.

Use a fixed simulation step, bounded catch-up, and interpolated input. Start by benchmarking 256 and 512 square simulation grids, with render quality and simulation quality controlled separately. Preserve thin strokes and score stability when lowering quality. GPU numerical results need tolerances across hardware; do not assume bit-identical replay.

The stream can use a procedural mesh with flow-dependent width, subtle motion, and a clear landing point. Add local ripples, restrained foam detail, and audio tied to flow. Import GLB cups/pitchers through an asset layer with documented scale, pivot, spout location, and coffee-surface height.

## User-test presets

| Preset | Intended experience | Initial tuning direction |
| --- | --- | --- |
| Drawing-first | Precise, approachable shape making | Minimal drift/spread, predictable width, fixed height |
| Accessible | Believable milk with manageable technique | Moderate displacement/spread, assisted height, gentle settling |
| Technique | Greater mastery and experimentation | Manual height, stronger flow/height interaction, less assistance |

Keep the same levels and milk budgets available in all presets, with scores labeled by preset. Store a parameter snapshot with each attempt. Provide a developer tuning panel with named preset save/reset and JSON export/import. No custom tuning affects another preset silently.

These presets test different experiences; technique mode is not a validated barista simulator. Compare enjoyment, perceived precision, learning time, frustration, and repeatability, not scores alone.

## Scoring

Score the simulation's milk field in cup coordinates, not a screenshot affected by reflections, shadows, and camera angle. Begin with approximately 70% shape accuracy and 30% finish quality; validate weights in playtests.

Accuracy considers missing target coverage and excess milk outside the target, using soft edge tolerance. Quality considers continuity, edge definition, and intended negative space. Only score symmetry on targets that are meant to be symmetric. Do not penalize individual strokes when they form the desired final image.

Use fixed comparison resolution and a defined settling interval. Optional small alignment tolerance should be explicit; avoid unconstrained rotation/translation that defeats placement puzzles. Avoid rewarding unused milk strongly enough that incomplete art wins. Keep milk remaining as feedback initially.

Obstacle outcomes are shown separately, with the level specifying whether contact lowers a rating or prevents a challenge badge. Early contact should not abruptly end a cozy attempt. Show an optional difference overlay and specific feedback, such as excess milk around the outline.

Verify blank cups, fully white cups, accurate shapes, shifted shapes, broken outlines, and known obstacle contacts. Prevent trivial scoring exploits before tuning star thresholds.

## Puzzle progression

First playable slice: eight authored puzzles plus sandbox.

1. Centered dot: start/stop and milk flow.
2. Straight stroke: movement speed versus width.
3. Curve: direction and consistent deposition.
4. Simple heart: outline/fill or free-pour approach, depending on preset.
5. Paired shapes: placement, balance, and repositioning.
6. Layered motif: pushing existing milk deliberately.
7. Static no-pour area: route planning with a visible keep-out zone.
8. Slowly moving overhead blocker: timing and stopping the pour.

These are candidate targets. Author final shapes from successful recorded pours so each is achievable with the actual mechanics and milk allowance. A drawn heart and a free-poured heart may require different target construction and tutorials.

Distinguish obstacle types: an overhead blocker intercepts the stream; a no-pour zone restricts direct deposition; a floating surface obstacle alters fluid flow. The first slice includes the first two. Floating obstacles come later because they can destroy existing art and complicate fluid boundaries. Every rule needs a visible, understandable cue.

Level data includes target field, budget, supported presets, obstacle configuration, tutorial hint, and rating thresholds. Store best results locally by level and preset.

## Endless orders mode

Proposed loop: show one pattern request, pour a fresh cup with its own finite milk allowance, submit, reveal a short score breakdown, and immediately offer the next request. Track cups served, average quality, and a streak for meeting the request's quality threshold. A missed threshold resets the streak but does not end the session in the initial cozy version. Allow players to finish and save/resume between cups. Timers, lives, and survival rules are optional later experiments.

Use authored, validated target families and a seeded order selector with recent-repeat avoidance. Start easy, introduce more complex families gradually, and cap difficulty at a tested level. An endless sequence need not contain infinitely unique patterns: restrained rotation, scale, or placement variants can add variety only after validation against milk budgets, bounds, and pouring presets. Do not generate arbitrary outlines and assume they can be poured.

All modes share an attempt lifecycle: prepare cup, accept input, settle, score, show result, reset. Mode rules control target selection, refill/reset behavior, progression, and which score UI appears. Keep obstacle selection separate so endless orders can begin without obstacles.

The incremental implementation should be relatively small once the puzzle loop works: request selection, run state, a compact request/results interface, and local run persistence. The larger ongoing costs are achievable target variety, difficulty tuning, scoring fairness, and preventing repetition. Prototype this with the existing six obstacle-free targets before authoring a large catalog.

## Visual direction

Proposed direction: warm ceramics, espresso browns, creamy whites, softly colored accents, natural wood, and afternoon window light. The cup and milk surface get the detail budget. Keep the play surface readable with restrained reflections and no depth-of-field blur over the artwork. Use soft ceramic contact sounds, flowing milk, and subtle cafe ambience.

One polished countertop composition is enough initially. Build primitive cup/pitcher placeholders with an asset replacement path before commissioning or generating custom models.

## Build sequence and gates

| Stage | Deliverable | Acceptance gate |
| --- | --- | --- |
| 1. Pouring experiment | One cup, milk field, stream, milk budget, mouse/touch controls, three presets, debug tuning | Clear flow response; reliable stops; continuous fast strokes; repeatable dot/line/curve; no uncontrolled blur |
| 2. Playable sandbox | Reset/refill, preset switching, settings, audio, better materials | Comfortable on phone/tablet/desktop; restart is immediate; losing focus never drains milk |
| 3. Puzzle and scoring slice | First six targets, target preview, submission, score breakdown, local progress | Recorded valid pours can succeed; empty/flooded cups score poorly; comparable scores across quality settings |
| 3b. Endless orders slice | Reuse six targets, request selector, streak/average quality, fresh milk per cup, save between cups | Fast cup-to-cup transitions; correct resets; no immediate repeats; players voluntarily continue |
| 4. Obstacles | Two obstacle puzzles, previews, contact feedback | Visual and collision behavior agree; failures are legible and avoidable |
| 5. Presentation and user test | Cohesive scene/UI, completed-cup view, performance pass, local attempt records | Both input types receive real-device testing; choose default preset from observed play |

Reassess the simulation after stage 1 before investing in many levels or art assets. If patterns smear or input feels indirect, fix the core first. Do not disguise poor control with target snapping.

Target 60 fps on agreed representative devices; select those devices before performance sign-off. Record frame times, latency observations, and score variation. Validate repeatable scripted pours at different render rates, pause/resume behavior, milk accounting, boundary handling, and resource stability after repeated resets.

Verify portrait and wide layouts at phone, tablet, and desktop sizes: all controls remain reachable, pointer coordinates match the visible cup, aspect changes do not alter gameplay, and side backgrounds remain decorative.

Initial scope excludes multiplayer, cafe management, economies, accounts, full-volume liquid simulation, and large content libraries. Playtest logs remain local and exportable unless external analytics is separately requested.

## Outstanding design decisions

- Accept or revise the proposed cozy ceramic/cafe art direction.
- Decide how strongly puzzle progression should emphasize recognizable traditional latte art versus playful shape drawing after the pouring experiment.
- Select representative phone, tablet, and desktop hardware for testing.
- Test touch offset/flow placement and height controls before committing to them.

## Technical references

- Three.js render targets: https://threejs.org/docs/pages/WebGLRenderTarget.html
- NVIDIA GPU Gems, Fast Fluid Dynamics Simulation on the GPU: https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-38-fast-fluid-dynamics-simulation-gpu

These establish the rendering/simulation approach; they do not validate the proposed latte behavior, scoring weights, or performance targets. Those require the prototype and playtests.
