## Brewing and milk station — 8 October 2026

Open **Corner → Brew & steam**, or tap the espresso machine or pour-over station. Espresso grinds for a short moment and then extracts into cups; pour-over animates a kettle, bloom and carafe. **Stop & serve** lets you end extraction early; completion prepares a fresh coffee in Cup and replaces its current art. Milk supply carries over. These are short game rituals, with extraction changing coffee appearance rather than a detailed brewing simulation.

**Milk steam** has a separate purge and a start/stop wand. Stop around 5–9 seconds for silky microfoam; early stops give thin milk and longer steaming gives coarse foam. The prepared texture affects foam deposition and surface detail in subsequent pours, and is included in pour recordings. Completing steaming refills your jug. The temperature display is a game gauge. Animated steam clouds, bubbles and user-supplied machine sounds accompany the interaction; **Machine sounds** mutes effects independently of radio. Closing, leaving Corner, hiding the page or losing focus stops the machine and sound.

## Foam tools and material detail — 8 October 2026

In **Cup → Adjust → Surface tool**, choose **Foam pick** for fine pulled lines or **Foam spoon** for broad swirls, then drag directly on the coffee. Tools move the existing milk surface without adding milk or spending the pitcher supply. **Undo stroke** restores the last gesture. Choose **Milk pour** to resume pouring. Tools work in Full 3D and Free surface; they are also displayed beside the jug on the counter.

Coffee now has stable crema mottling, sparse microbubbles, subtle surface relief and distinct wet-coffee/foam reflections. Ceramic glaze, oak, plaster and steel have surface and roughness detail. These are procedural materials; the café remains a stylized scene. Foam etching edits the optical surface rather than simulating a submerged rigid tool, and etching is not included in input replay recordings. Frozen cups and photos retain the edited art. Validation: 68 tests, type checking and production build passed.

## Counter workshop — 8 October 2026

**Actions → Next cup** keeps the finished latte on the counter and prepares another cup, carrying over remaining milk and pouring controls. Up to six finished cups stay in the current session; take a photo before reloading. **Steam & refill** animates the selected milk jug lifting, filling and steaming.

In **Corner → Mug & jug**, choose Small, Standard or Large, jug shape and finish, and whether to hide the jug while pouring. Sizes affect Corner and photos; the pouring vessel retains its calibrated capacity. **Decorate** adds movable plants, flowers, books, candles and lamps, and swaps installed lighting. Drag decorations directly on the counter to place them; the layout saves locally. The counter also displays the selected jug, tamper, portafilter and brush. See [workshop details](docs/counter-workshop-2026-10-08.md).

## Explore the café — 8 October 2026

Use the **Cup / Corner** switch. **Cup** is the pouring view; **Corner** opens directly into free roam with **Decorate**, **My pours**, and **Take photo** available. Closing any option returns to Corner, retaining the camera and mug pose. Choose Cup to resume the preserved pour. Escape also switches between views. Drag the room to orbit, scroll away from the mug to zoom, and right-drag or two fingers on the room to pan. Drag the mug to turn it; scroll over it or pinch it to resize from 65% to 140%. WASD moves the camera, R/F raises or lowers it, and Shift makes smaller steps. Home resets the view/mug; P captures the current composition. Phone pouring actions are under **Actions**. Mug sizes stage viewing/photos; pouring retains the calibrated vessel. Real multitouch remains unverified on phone hardware.

The world now includes counter joinery and pulls, floorboards, a woven runner, stools, shelf brackets and books, a framed print, espresso-station details, towels and glass bean storage. See [world controls and verification](docs/world-exploration-2026-10-08.md). Mug scaling stages the scene; variable physical vessel capacity and cup tilting are still future work.

## Current corner and mobile build — 8 October 2026

Advanced remains the default. The pouring pad now steers the spout; flow and height stay separate. On phones, a minimal dock opens adjustments, cup actions, room/gallery and radio only when needed. Decorate personalizes the room; Take photo freezes the actual cup and saves a 1080px shot into My pours. [Build details, evidence and limits](docs/fidelity-build-2026-10-08.md).

Current default: **3D latte art** with Advanced flow and height controls, the tuned Draw start (4.9 ml/s at 2.8 mm), fine 160² milk-purity surface, tapered Finish response, adaptive pitcher clearance, and High visual quality. **Fresh cup** clears the art and refills milk while keeping the current flow, height, intention, and other controls. If the device cannot run the 3D solver, the game opens in free-surface art. `?mode=cozy` and `?mode=surface` remain available. **Show a pour** demonstrates a heart: a low stationary pool followed by a raised forward cut. See [heart response and validation](docs/heart-pour-update.md). Earlier checkpoint reports below are historical.

Advanced controls now open by default: adjust flow and height independently, use the wheel for height, A/D for flow, and Shift for fine control. Cozy controls remain available in Studio settings.

Startup explicitly applies the recommended settings in `src/session-config.ts` on each launch. Simulation choices are labeled **Full 3D · recommended**, **Free surface · compatibility**, and **Original surface · legacy** to distinguish them. High quality is applied to the renderer at startup as well as shown in the selector. Saved room, gallery and radio preferences remain independent; explicit `?mode=` comparison links still override the simulation choice.

# Little Latte

## Cozy free-surface checkpoint — 7 October 2026

At this checkpoint the default was **Cozy free surface**, with prepared coffee and milk, a
locally moving liquid surface, growing carried foam, separate aeration and
constituent spill accounting. This is a conservative 64² two-layer hydrostatic
model, not a full 3D CFD replacement. The original CPU surface and GPU 3D
baseline remain under **Studio settings → Simulation** (`?mode=surface` and
`?mode=volume`). Historical assets, music and recordings remain in place.

- Mouse: aim at the cup, hold to pour, release to stop. Wheel changes delivery;
  the visible slider and −/+ buttons work without a wheel. Choose **Finish**
  explicitly for a raised, narrower pour and trace the entire cut yourself.
- Touch: use the area below the cup to steer the retained marker; hold the
  pour pad with the other thumb. Horizontal pad movement adjusts delivery.
  The pad also starts at the last aim without an aiming finger. Releasing the
  pad stops the pour; lifting the aiming finger retains aim and pouring.
- **Enjoy cup** hides equipment while liquid continues settling. **Fresh cup**
  resets the prepared recipe. Spills spend milk, with no sandbox penalty.
- Settings expose optional Mix, independent Advanced flow/height, rim-stop,
  upright pitcher clearance assistance, left-handed layout, and recordings.
  Advanced wheel controls height. Simulation quality is fixed across devices.

Run `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5178` and open the
printed local URL. `?verify` adds actual-listener checks; GPU checks apply to
the preserved volume baseline. `node --experimental-strip-types tests/cozy-evidence.ts`
rebuilds the new behavior gallery and matrix. Record, replay and **Export
recording comparison** save full fields at matching fixed-tick endpoints.

See [model and approximations](docs/cozy-model.md),
[verification and unfinished gates](docs/cozy-verification.md), and
[before/after field evidence](docs/cozy-evidence.html). Physical cup tilt,
local rim outflow, convincing fine alternating bands and phone hardware/comfort
validation remain unfinished. This is a runnable milestone checkpoint.

## Preserved earlier 3D feasibility notes

**Experimental 3D liquid:** choose **Simulation → Experimental 3D liquid**, or
open `/?mode=volume`. The existing surface mode remains the default. The GPU
experiment adds moving coffee/milk through a 32×32×20 volume, rising cup fill,
quantity-scaled jet momentum, transported crema and a 256² conservative foam
layer driven by the bulk. Both modes use the same mouse/touch controls and local
recordings. Switching modes starts a fresh cup; the experimental wet recipe is
fixed. It requires WebGL2 float render targets and reports incompatibility while
retaining access to the existing mode.

Studio settings → **Liquid response** offers all six feasibility demonstrations.
The cup cross-section shows actual sampled milk concentration and velocity.
**Export liquid measurements** saves frame timings, CPU submission, available
GPU timer measurements, milk accounting and numerical error locally. GPU timing
is per solver tick; CPU rendering time does not measure total GPU rendering.
The 24 mm deep, 80 mm diameter cup starts with 55 ml coffee and stops emission
at 120.64 ml capacity. Spout clearance tracks the current liquid level.

This experiment improves visible bulk circulation and filling, but **is not yet
recommended as the main latte simulation**: low foam remains too concentrated,
fine bands merge and the finishing stroke entrains too much foam. The surface
is a level rising lid, with empirical buoyancy/mobility and global milk-tracer
correction. See [model and solver choice](docs/liquid-3d-model.md) and
[measurements and visual evidence](docs/liquid-3d-verification.md).

For GPU checks use `/?mode=volume&verify=controls`, expand Studio settings and
click **Run GPU feasibility checks**. This runs receipt-gated input through the
same solver and compares the same packets against the existing surface mode.
An actual recording without skipped intervals also gets an independent causal
versus preloaded-with-deadlines comparison. **Run control checks** exercises the
actual DOM listeners using synthetic pointers with capture stubbed. Real-phone
GPU performance and real multitouch remain unverified.

Run the additional volume tests with
`node --experimental-strip-types --test tests/volume.test.ts`.

The documentation below describes the preserved existing surface mode.

A cozy Three.js, TypeScript and Vite pouring sandbox. This physics-and-precision pass fixes thumb pickup, makes force depend on emitted milk, shares one physical jet between the scene and solver, adds connected surface transport, and records actual input for causal replay. It remains an empirical approximation. Fine separated bands and convincing heart formation are unresolved; human reproduction and real-phone performance are separate gates.

## Run locally

The installed dependencies work. The machine's ordinary npm launcher points to a missing file; use Node directly without changing global tooling:

```powershell
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174
node node_modules/typescript/bin/tsc
node node_modules/vite/bin/vite.js build
node --experimental-strip-types --test tests/model.test.ts tests/pouring.test.ts tests/physics.test.ts
node --experimental-strip-types tests/evidence.ts
```

Requires Node 22.12+ for Vite; the tests use Node's type stripping, verified on Node 24.12. Open the URL Vite prints when the requested port is occupied. The current verification server uses port 5176. Package scripts remain available on systems with working npm. Dependencies and build output remain ignored.

## Controls

- **Mouse:** move to set the landing point; hold the primary button to pour. Release before repositioning. Wheel up raises the pitcher, down lowers it. Hold A/D to decrease/increase flow over time; keyboard repeats do not add separate impulses. Sliders and −/+ buttons also work. Shortcuts leave editable fields alone, and browser modifier wheel gestures remain available.
- **Touch:** one finger steers on the cup; the other thumb holds the pour pad. Drag that thumb right for more flow, up for more height. Pickup anchors the current settings wherever you press. Release retains them; pick up elsewhere to re-clutch. Either finger can start first; the thumb alone stays dry. Settings mirror the pad for left-handed use and adjust the default 32-pixel landing-marker offset.
- **Precision:** Shift or the Fine motion setting reduces steering and adjustment gain to 20%. Flow is shown in ml/s and spout clearance in mm. The 2–80 mm height range gives more control travel near the surface; a compact side cue shows the gap.
- **Milk:** a full pitcher contains 150 ml. Off-cup pours spend milk. Refill keeps artwork; Fresh cup clears it and refills. Unlimited milk is optional. The canvas surface level is fixed; cup filling and overflow are not modeled.
- **Finish:** cancels input, hides active controls and pitcher, settles for one second, then holds artwork still. Fresh cup remains visible.

## Practice and recordings

Studio settings → Practice replay includes Growing pool, Small rhythmic bands, Three neighboring pours, Heart, Two pours, Height sweep and Fast curve + tap. Generic position/flow/height trajectories are sampled at 120 Hz and fed through the same 33.3 ms buffered input path. They contain no pictures, target-specific forces or automatic art. Heart describes the intended gesture; the current result is an oval with a thin finishing stroke, not a verified heart.

Use **Record fresh pour**, make a pour with stops/restarts, then **Stop recording** and **Play recording**. Export/import keeps everything local: initial canvas/settings, recipe, finite/unlimited budget, input packets, event and receipt times, stroke transitions, cancellations and skipped pause intervals. Export also exposes copyable JSON when downloads are unavailable. Imported recordings are validated and limited to ten minutes. Recipe changes, refill, fresh cup and finish end recording so initial conditions stay reproducible.

## Music

Studio settings → Music includes Afternoon Rush at Café Veloce, Raindrop Latte and Rainy Cafe Window. Press play to start; the player supports pause, seek and volume, and the selector switches tracks. The playlist repeats all three in order. Track and volume preferences are saved locally; music starts paused on page load. Fresh cup and Finish keep music playing. Original MP3s remain bundled in `public/music`. The existing optional synthesized pouring sound is retained; no listening-test claim is made.

## Model and tuning

The authoritative CPU surface is Float32 at 160² with a fixed 60 Hz clock. Foam is a scaled milk-equivalent amount, distinct from whiteness. Semi-Lagrangian velocity transport, pressure coupling and foam-dependent viscosity move existing material. Limited conservative finite-volume scalar transport reduces grid ridges from forward splats. Curved boundaries confine material; numerical errors and intentional mixing are reported separately. A byte texture displays the result without feeding quantization back into physics.

One shared jet uses meters, seconds and milliliters. Actual budget-limited emitted quantity determines mass, flow, stream area and momentum; gravity determines impact speed. The desired landing point solves a compatible spout and ballistic path. The transformed vessel tip, stream, contact marker and solver use that state. Empirical energy-dependent partition and sinking distinguish low deposition from raised mixing. Starts and stops are immediate at the simulation boundary; there is no in-flight queue. See the [model note](docs/physics-model.md) for units, calibration and stability bounds.

Drawing, Accessible and Technique tune the same fixed-grid model. Local save, reset, JSON import/export and validation remain; opacity changes display contrast only. Coalesced events and explicit stroke transitions preserve curves/taps without bridging dry gaps. Receipt deadlines prevent preloaded future information from changing recorded playback. Focus loss and stalls over 150 ms cancel pending wet input and discard catch-up history; catch-up otherwise stays bounded to eight ticks.

The nearly overhead camera stays stable while pouring. Short phones scale the cup down to preserve controls; extra width reveals the counter. Settings expose a velocity view, accounting and separate simulation, display-preparation and render timings. Display timing measures CPU texture preparation; GPU upload executes within rendering and is not independently timed. Weak-device cost needs measurement.

## Verification and limits

See the new [physics verification report](docs/physics-verification.md), [response measurements](docs/physics-response-results.json), [behavior fields](docs/physics-fields.html), [browser control checks](docs/physics-controls.txt), and [actual mouse packet recording](docs/recorded-mouse.json). Previous [pouring verification](docs/pouring-verification.md) and screenshots remain historical evidence; their exact heart assertions do not describe this solver.

The suite covers controls, quantity/momentum response, clearance, smooth height response, material response, conservation, boundaries, dry gaps, taps, input rates, jitter, pauses and 30/60/120 display cadence. Actual browser mouse recording and playback were exercised. Two-pointer checks are synthetic and stub pointer capture; layout checks use the real app inside dimensioned browser frames. Neither is a human or real-phone test.

The response set shows round pool growth, smooth mixing and modest displacement by later pours. Oscillations survive input but merge into a scalloped column; fine striations and convincing art formation need more fluid calibration. The approximation omits cup tilt, aeration, gas fraction, realistic rheology, subsurface circulation, capacity/overflow and in-flight milk. Do not treat it as a scientific latte simulation.

For browser control checks open `/?verify=controls`, expand settings and click **Run control checks**. `docs/layout-check.html?size=phone` embeds the app at 390×844; `short`, `tablet` and `wide` cover 320×568, 768×1024 and 1280×720. These are development checks, not touch certification. The [verification report](docs/physics-verification.md) specifies the next human/device playtest.

Sandbox remains the scope; puzzle, scoring and endless modes are future work. Music, cafe assets and unrelated existing work were preserved. No remote content was published.

## References

- [Culinary fluid mechanics, section VII.4](https://arxiv.org/html/2201.12128v2) informed the qualitative jet/mixing interpretation.
- [La Marzocco: Practicing Latte Art](https://home.lamarzoccousa.com/practicing-latte-art/) informed rhythmic and raised finishing gestures.
- [Barista Hustle: The Second Half](https://www.baristahustle.com/lesson/b1-5-02-the-second-half/) informed near-surface resolution.
- [Völp et al., milk-foam rheology](https://publikationen.bibliothek.kit.edu/1000134510/119182192) informed testing limited material-dependent viscosity, not transplanting experimental values.

These primary written sources support qualitative expectations, not measured frame-by-frame agreement or scientific calibration. No reference-video comparison was completed. The original proposal remains in `docs/build-plan.md`; the physics guide supplies current milestone context.


Optional counter upgrades: in Corner → Decorate, choose La Marzocco or Fellow electric, or add a movable Pothos. The classic machine, kettle and plant layout remain defaults. Imported models load on selection and retain credits under Upgrade model credits; see public/models/README.md.

## Moving 3D surface and direct tools — 9 October 2026

Full 3D now couples bulk circulation to a moving hydrostatic surface, with foam damping, transported milk, a wet ceramic edge and finer surface detail. The pitcher, pick and spoon above the cup are clickable: the selected tool leaves the table. Dock tool buttons remain available. Rim assist turns the jug into the cup before lifting it. [Implementation, evidence and revert instructions](docs/liquid-realism-2026-10-09.md). The boundary is a reduced model; real-phone performance still needs testing.
