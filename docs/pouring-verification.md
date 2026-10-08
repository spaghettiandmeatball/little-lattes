# Pouring pass — implementation and verification

October 6, 2026 (user's Toronto date). Existing project retained. Implementation and automated/browser checks are in place; **human reproducibility, real-device touch comfort and representative-device performance remain unverified**. This is a playable approximation, not a validated barista simulator or a fully signed-off milestone.

## Behavior and technical choices

The old segment shader added a constant amplitude over the whole segment, so fast movement manufactured visible field without spending more milk. Each input interval now spends from one ledger and distributes that quantity over its full timestamped trajectory using normalized Gaussian quadrature. Off-cup samples spend milk and inject no field; rim-clipped kernel material mixes rather than being clamped back into an edge stroke.

The solver keeps Float32 signed velocity and foam density on a fixed 160² surface. Conservative forward bilinear transport and wall rejection preserve field quantity. Damping and restrained diffusion provide settling. Diffusion falls smoothly with speed to a small residual rate, preserving resting art over minutes instead of dissolving it into fog. Byte quantization applies only to the display texture; the display is never read back into the solver. This deliberately avoids a dependency on float GPU target support and a weaker byte physics fallback. CPU throughput and numerical softness are the trade-offs.

Close pours add visible foam and a broad, intentionally compressible surface source. Motion carries existing material; raised impacts mix foam underneath and entrain it along their travel. The mixing response accounts for contact residence. Whiteness is a saturating visualization of foam density, not fluid volume. No pressure projection is used: the present source deliberately expands the surface pattern, and blindly enforcing zero divergence would cancel that part of the approximation. This is an art-directed transport/deposition model, not an incompressible or volumetric liquid solver.

An observed small brown hole at a stopped stationary impact was traced to the singular unit radial velocity near the source, independently of texture precision. A smooth source core fixes it; the regression checks that a stopped pool keeps a dense center. Axis-aligned ridges and soft boundaries remain visible numerical limitations.

Input events retain coalesced positions, flow/height values and stroke boundaries. Integration splits at transitions so taps and final release motion survive. Every trajectory fragment contributes deposition and ledger quantity. Transport runs once per fixed 60 Hz tick even for 1000 Hz input; momentum uses up to four localized force samples, merging nearby samples within a stroke. In pathological input with more than four new strokes inside one tick, smaller momentum sources are omitted; their deposition and expenditure remain accounted. This is a documented approximation, not dropped curve geometry.

Focus loss cancels pointers and resets timing. Stalls above 150 ms discard pending wet history. Catch-up is bounded to eight ticks, with no delayed burst. Stop hides the stream immediately; emission is modeled as immediate contact, with no in-flight reservoir or residual deposition. The landing point stays immediate while the pitcher animates separately. A reusable tapered stream mesh connects its actual transformed spout to that point.

Drawing/Accessible/Technique share this solver with rebased values. Preset save/import/export and volume/refill behavior remain. Revised local presets use a new storage key; old exports can be explicitly imported. Visual quality changes pixel ratio and leaves the simulation and artwork intact.

## Technique references versus simulation rules

[La Marzocco Home](https://www.lamarzocco.com/uk/en/how-to-pour-latte-art/) describes pouring high to mix, lowering for visible foam, increasing flow with a small side-to-side movement, then lifting and reducing flow for the cut-through. [Ryan Soeder's demonstration/transcript](https://howcast.com/videos/511300-how-to-pour-a-heart-latte-art/) shows a pool followed by the lifted, reduced-flow draw-through. These are the observed gestures used to design the replay and control hints. They do not validate radial velocities, density scales, mixing coefficients or the absence of cup tilt.

## Controls and composition

Mouse: landing point by pointer; primary button holds flow; release for dry repositioning. Wheel up/down raises/lowers height (replacing the original flow mapping). A/D and visible buttons/sliders adjust flow. Field editing does not consume shortcuts.

Touch: a position finger on the cup and a thumb on one two-axis pad. Right increases flow; up raises height; release stops. Either finger can start first, with the thumb alone remaining dry. The position marker defaults to 32 pixels above the finger, adjustable in settings. Left-handed mode mirrors the pad. All presets keep direct continuous height; assistance is modest preset tuning rather than automatic target shaping.

At 390×844 the coffee is approximately 316 pixels wide (81% of the viewport). Controls and hints have their own region. At 320×568 it scales down to keep controls reachable. 768×1024 and 1280×720 layouts preserve the same physical rules and reveal counter space as width grows. The camera is orthographic and stable while pouring. Finish cancels input, hides the pitcher/marker/active controls, settles for one second and exposes Fresh cup.

## Checks performed

TypeScript: pass. Production build: pass. Fifteen Node tests: pass. The build retains a non-failing ~508 kB main-chunk warning, largely Three.js. No dependencies or machine-wide tooling were changed.

| Scenario | Evidence and outcome |
| --- | --- |
| Stationary flows | Low/high flow tests show controlled pool growth, filled centers and exact time-integrated spending. |
| Slow/fast, same duration | Injected quantity and visible injected integral match; faster travel spreads that amount over more path with lower peak density. Field plus sunk-foam accounting closes. |
| Continuous height | Height sweep replay and model comparison show visible foam at low height, subsurface mixing and entrainment at high height. |
| Stop/reposition/restart | Transition test has exactly two wet intervals, no interpolated dry segment and no dry expenditure. Two-pour replay visibly grows interacting pools. |
| Second-pour interaction | Subtracting a matching new-only pour isolates existing foam and confirms that it moves under the later source. This checks transport, not merely added white pixels. |
| Short tap / curved input | Seven-millisecond replay tap and intermediate curved events remain; sub-frame synthetic mouse tap passes through live handlers. |
| High-rate input | A 1000 Hz curved event stream spends exactly 5.2% milk in one second and uses exactly 60 transport passes, with all deposition samples retained. |
| Heart | Generic low pool, side-to-side motion, push, dry lift/reposition, and straight raised cut produce lobes, an open notch, joined body and point. Shape-feature tests and screenshots pass. No finished image, heart outline, morph or target-aware force enters the model. |
| Actual mouse attempt | Native browser drags, visible flow/height sliders and Finish produced a recognizable, imperfect heart. The agent used short captured drags/pulses because of the available UI automation. This is **not a human manual reproduction** or a natural continuous-hand playtest. |
| Rest / wall | Blank fields retain exactly zero velocity. Settling preserves quantity and centroid; no mask-exterior cell receives milk. Off-cup pouring spends without painting. |
| 30 / 60 / 120 rendering cadence | The same event stream at fixed 60 Hz simulation produces identical measured fields and milk totals on this host. |
| Visual quality | High→Standard→High preserves finished field mass and milk budget in the browser. Solver resolution stays fixed. |
| Blur/cancel/resume/empty | Model ledger/reset tests and live synthetic control checks pass, with no stuck flow or delayed burst. |
| Layouts | Actual app embedded at 390×844, 320×568, 768×1024 and 1280×720; screenshots show clear cup/control regions. These are browser layout checks, not real touch hardware. |

The browser probe reports ten passing checks through the actual application listeners: thumb-first remains dry; two fingers start flow; one thumb changes both axes; release and dry move spend nothing; independent cancellation stops; blur/resume cannot burst; editing fields leaves shortcuts alone; a sub-frame tap survives; Finish hides pouring controls; Fresh cup remains available. Synthetic pointer capture is stubbed because fabricated IDs cannot acquire native capture. Actual mouse capture was exercised separately. Probe results are saved in `control-checks.txt`.

Final production browser inspection reported no application warnings/errors. Replay sliders follow the scripted values; deliberately adjusting flow interrupts the replay and returns control immediately. The final browser run matched 78.0272% remaining milk and ended with 26% flow and 60% height. During development, temporary old/new module combinations needed a full reload while the solver interface changed; those are not included as a clean production run.

## Baseline and tolerances

`replay-results.json` records the final input streams and metrics. The six-second heart replay injects 2.7466 flow-seconds, leaving 78.0272% milk. Its foam-density integral is 0.08733153 UV², with 0.00497957 UV² sunk; injected visible integral is 0.09231111 UV². Dense area (density >0.35) is 0.08109375 UV². Its centroid is (0.47952, 0.53999); the side-to-side pour makes it slightly asymmetric. These foam units must not be compared directly with pitcher volume units.

Cadence checks measured zero mean absolute field difference and zero budget difference. Assertions allow 1e-7 mean absolute density/area difference and 1e-9 percentage-point budget difference on this host. Normalized slow/fast visible injection allows 1e-8 UV² difference; conserved field plus sunk material allows 1e-6 UV² rounding error. Rest allows 1e-5 relative field-mass error, 0.001 UV centroid movement and residual speed below 1e-6 UV/s after extended settling. A two-minute rest retains at least 70% of the settled pool peak, without stopping transport abruptly. Cross-device browser/GPU color differences have not been measured, and no bit-identical visual claim is made.

The display counter showed about 144 fps on this desktop during ordinary inspection. A one-second 1000 Hz input replay took roughly 0.43 seconds in an isolated Node run, without rendering, uploads or mobile overhead. These are local diagnostics, not representative-hardware performance sign-off. No phone/tablet has been benchmarked or agreed for a 60 fps claim.

## Evidence and remaining gates

- `before.jpg`, `wide.jpg`: comparable 1280×720 composition evidence from the old and revised scene.
- `portrait.jpg`, `tablet.jpg`, `short-phone.jpg`: responsive layout evidence.
- `heart-replay.jpg`: finished portrait heart from the replay.
- `mouse-attempt.jpg`: actual mouse-control attempt.
- `two-pours.jpg`: separate restart and interaction evidence.
- `control-checks.txt`, `replay-results.json`: repeatable checks and measurements.

Human reproduction of the basic heart using continuous controls, real-device multi-touch capture/occlusion/reach, listening tests, broader GPU visual checks and representative-device performance remain open. The current edges and source response still need subjective calibration. Cup tilt, foam rheology, full subsurface circulation, overflow/capacity and in-flight milk are omitted. The existing optional synthesized audio is retained without a listening-test claim. Puzzles/scoring/endless modes remain future scope.

The runnable production preview is on port 5175 for this session; development is on 5174. Port 5173 was already occupied and was left alone. Nothing was published or pushed.
