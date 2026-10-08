# Experimental 3D liquid feasibility report

October 7, 2026. The experiment is runnable; keep the existing surface mode as
the default. Bulk circulation and fill are materially better represented, but
the surface response is not ready to become the main latte simulation.

## Run and compare

Start with `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5177`.
Open `http://127.0.0.1:5177/?mode=volume`, or select Experimental 3D liquid in
the visible Simulation selector. Existing surface remains available. Switching
starts fresh; flow/clearance controls retain their settings. Music and the
existing uncommitted features/files were preserved. No dependencies were changed.

Use Studio settings → Liquid response for the six scenarios, or record actual
mouse/touch actions and play the same recording in either mode. The baseline
starts with its existing fixed prepared surface; the experiment starts with
55 ml coffee. Geometric fill is therefore intentionally different.

## Checks and input evidence

- TypeScript and production build pass. Vite retains the existing >500 kB bundle
  advisory. Existing 26 Node tests pass; three new volume/clearance/momentum
  tests pass (29 total). No historical tests or assets were removed.
- 61 GPU/browser feasibility checks pass in [raw results](liquid-3d-results.json).
  They cover all six responses, finite fields, milk/foam ledgers, capacity,
  zero/tiny flow, a first-pour control without its second pour, and an actual
  recording supplied causally versus queued with receipt deadlines.
- All 12 actual-listener checks pass in [control results](liquid-3d-controls.txt).
  These are synthetic two-pointer events with capture stubbed, not real touch.
  Pickup, re-clutch, retained settings, thumb-first dryness, cancellation, blur,
  taps and Finish were exercised. Existing time-based A/D, relative pad, fine
  control and shared clearance implementations were retained.
- Two genuine browser mouse drags with release/reposition/restart produced
  [25 recorded packets](liquid-3d-recorded-mouse.json). Both
  [live](liquid-3d-mouse-live.json) and [UI replay](liquid-3d-mouse-replay.json)
  spent 1.499940 ml. The GPU verifier confirmed identical per-tick solver inputs
  for causally released versus preloaded receipt-gated packets. Relative surface
  L1 difference was 1.23×10⁻⁷; maximum foam-thickness difference was 0.093 µm.
  FP32 field tolerance is used instead of bit equality; the first stricter
  assertion exposed harmless numerical variation in the transported crema field.
  This is not a human pouring playtest or a claim of identical live/rest imagery.
- Off-cup spending is retained and accounted separately. The capacity test
  accepted exactly 65.637158 ml, reached 120.637158 ml total and stopped without
  extra pitcher spending or overflow.

## What the six demonstrations show

All figures are rendered simulated state after input, not injected art.
See the [image gallery](liquid-3d-evidence.html) and [active raised pour](liquid-3d-raised-active.jpg).

| Response | Milk accepted, ml | Surface foam attribute, ml | Observed result / limit |
| --- | ---: | ---: | --- |
| Raised penetration | 16.507 | 0.163 | Jet penetrates, coffee circulates and changes tone. 8.877 ml tracer in lower half at 4 s. Crema develops conspicuous coarse lobes. |
| Low surface pool | 16.507 | 5.333 | Much more foam survives than raised pouring, but it compresses into a small, sometimes star-like patch rather than spreading as a convincing latte pool. |
| Millimeter movement | 15.000 | 5.405 | Approximately ±2.06 mm steering alters position and edges. Fine alternating bands merge; input survives, surface detail does not. |
| Dry move/restart | 18.734 | 8.520 | Source remains dry through the gap and settings persist. Separate deposits can later meet because the first patch continues moving; no wet segment is interpolated across the gap. |
| Second pour | 24.196 | 5.740 | Changes existing foam away from the new source. Compared with first-pour-only control, field L1 difference outside the source exclusion radius is 0.0954. Compression/entrainment dominates attractive displacement. |
| Raised reduced-flow finish | 14.878 | 2.494 | Distinct weaker finishing input moves and entrains the pool. It removes too much readable foam and does not produce a convincing fine finishing stroke. |

The surface foam volume is an attribute of milk already in the bulk, not extra
liquid. Baseline foam/mixing amounts use that older model's separate partition;
the report includes them for comparison but they are not equivalent quantities.
Across the six scenarios, total milk error is below 0.000004 ml. Foam ledger
error stays below 0.003 ml; explicit entrainment is recorded separately.

## Performance and layouts

Windows desktop, Chromium 154 in the in-app browser; hardware-specific results,
not a phone benchmark. Fixed quality: 32×32×20 bulk, 256² foam/crema, 24 pressure
iterations, eight conservative surface substeps, 60 simulation ticks/s; no particles.

| Response | CPU submission mean, ms/tick | GPU timer mean, ms/tick | GPU p95, ms/tick |
| --- | ---: | ---: | ---: |
| Raised | 0.576 | 0.306 | 0.980 |
| Low | 0.589 | 0.299 | 0.711 |
| Small movement | 0.439 | 0.301 | 0.830 |
| Dry/restart | 0.574 | 0.360 | 1.354 |
| Second pour | 0.669 | 0.348 | 1.023 |
| Finish | 0.506 | 0.275 | 0.665 |

The asynchronous EXT_disjoint_timer_query_webgl2 timer measures GPU solver
passes; unsupported/disjoint timers are reported as unavailable. CPU submission
is not GPU duration. The verifier's frame numbers include running the CPU
baseline and periodic readback, and are not normal gameplay frame times.
[Normal desktop telemetry](liquid-3d-live-performance.json) recorded 144 fps
(approximately 6.94 ms/frame), 0.1 ms CPU simulation submission per display frame,
0.2 ms CPU rendering submission and 0.3 ms GPU per solver tick while settled.
These are bounded observations, not a worst-case guarantee. Inspecting fields
costs about 2–4 ms synchronous readback, once per second, with occasional larger
spikes. Full rendering GPU time was not separately measured.

Verified application layouts in exact CSS browser frames:
[1280×720 desktop](liquid-3d-wide.jpg), [390×844 portrait](liquid-3d-portrait.jpg),
and [320×568 short phone](liquid-3d-short-phone.jpg). Controls remain inside their
frames; the short-phone control panel ends at y=556, below the 568 px limit.
The cross-section overlaps part of the upper cup in portrait; it does not consume
pointer input. The browser's existing zoom was accounted for when capturing
fixed-size frames. These are desktop browser layouts, not physical phone tests.
Real phone GPU cost, real multitouch/capture and two-thumb comfort are unverified.

Initialization checks float rendering/readback and retains a clear compatibility
message plus the original mode on failure. This passed on this desktop; an
actual unsupported device/context-loss test was not available.

## Recommendation and next work

Keep this experiment behind the switch. The useful improvements are connected
coffee/milk motion, an actual interior/fill budget, shared height and momentum,
and deformation of a carried crema layer. Desktop cost is acceptable at this
resolution. The limiting factor is currently behavior, not measured desktop cost.

The rigid lid pulls surface material toward a downward jet; finite pressure
iterations, coarse resolved impact and global tracer correction weaken the
inverted-fountain distinction. Low pours also circulate deeply (6.979 ml in
the lower half in the matched test), too close to raised pouring. Foam and
crema form numerical lobes, concentrate and entrain excessively. The finishing
stroke does not preserve readable art. Raising texture resolution alone will
not solve those problems.

Next investigate a localized resurfacing/free-surface volume source with
conservative composition transport and better pressure convergence, calibrated
against low/raised reference footage. Keep the current evidence as a baseline;
do not tune one heart to hide these defects. Then run the same actions on a
representative phone and with human users. No reference-video calibration,
barista realism, bubble rheology or scientific accuracy is claimed here.

The [model note](liquid-3d-model.md) records the solver investigation, licenses,
units, empirical choices and unresolved physics. Prior work is preserved.
