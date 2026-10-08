Historical v2 checkpoint results. The current art and replay evidence is in [latte-pour-model.md](latte-pour-model.md).

# Cozy checkpoint verification — 7 October 2026

The game runs with the cozy controls and conservative free surface as the
default. This is a **playable checkpoint, with incomplete acceptance gates**.
Pool growth, constituent transport, source accounting and input ownership
improved. Fine alternating bands and recognizable finished heart art do not
yet pass visual review. Cup tilt, local rim outflow and phone performance
remain unfinished. The reduced two-layer interior is not resolved 3D CFD.

## Evidence and provenance

- [Model, equations and approximations](cozy-model.md).
- [New field gallery](cozy-evidence.html), including all six primitive actions,
  pool checkpoints, tagged displacement, three wiggle frequencies and a
  replay reconstructed directly from transported fields.
- [Raw results](cozy-results.json): 64² grid, prepared 55 ml coffee + 8 ml milk,
  60 Hz physical ticks with CFL substeps, fixed recipe, upright cup.
- [Preserved earlier GPU gallery](liquid-3d-evidence.html) and
  [earlier verification](liquid-3d-verification.md). Those are historical
  baseline observations; this delivery did not rerun the entire GPU harness.
- [Real mouse recording](cozy-recorded-mouse.json), [live fields](cozy-mouse-live.json),
  [browser replay fields](cozy-mouse-replay.json) and
  [comparison](cozy-mouse-comparison.json). The final recording uses native
  browser mouse drags, two separated pours, an explicit Finish switch and a
  cut. It has 38 packets over 11.4204 s, no skipped intervals, and emits
  1.6279445914 ml at gentle delivery. It validates the actual mouse route and
  matching endpoints; it is not proof of successful heart art.

Field SVGs are scientific diagnostic reconstructions, not browser screenshots.
Browser captures include [heart attempt](cozy-heart-browser.jpg),
[rhythmic bands](cozy-bands-browser.jpg) and the responsive captures below.
The `cozy-v1-*` files retain an early draft recording for history; they do not
describe the final model. Older real-mouse screenshots are likewise historical.

## Behavior results

Visible area means cells with foam-liquid thickness above 0.2 mm. The foam
RMS radius is inventory weighted. These thresholds and test tolerances are
provisional product checks, not empirical calibration.

| Action | Result | Status |
| --- | --- | --- |
| Stationary low pool | Three 0.8 s checkpoints: area 439 → 818 → 1157 mm²; RMS radius 6.84 → 9.27 → 11.01 mm; foam liquid 3.55 → 7.08 → 10.62 ml | Coherent growth passes |
| Low versus raised | Matched 16.5066 ml: low upper/lower milk 13.680/10.827 ml, raised 3.288/21.218 ml; surface foam 11.356 versus 2.004 ml | Layer separation passes; vertical circulation is parameterized |
| Neighboring pour | Original tagged deposit moves 1.337 mm relative to a resting control; 4.201 versus 4.291 ml tagged liquid survives | Transported displacement passes |
| Dry reposition | Dry input adds exactly zero source volume and impulse; residual fluid continues moving | Numerical source check passes; gallery shows the settled field |
| Raised finish | Test compares a cut against the same pool without a cut, requires a corridor change and ≥70% surrounding foam retention | Numerical check passes; recognizable finished art does not yet pass |
| Rest | Initially flat cup remains motionless. After 10 s pool rest, foam liquid 10.624 → 10.507 ml; area 1157 → 2015 mm² | Material survives; detail spreads significantly |
| Wiggles | 1.4, 2 and 2.8 Hz field captures, plus browser practice replay | Reproducible input, but fine alternating bands merge: visual gate fails |
| Overflow | Tests cover spills, misses, dry pause, empty pitcher, unlimited milk, rim-stop on/off; spilled mixture includes coffee and milk | Stage A accounting passes; local outflow and tilted cases absent |
| Control range | 18 cases: 2/4/6 mm clearance × 25/50/75% flow × 63/95 ml fill | Matrix retained; not reference calibrated |

64² versus 80² low-pool comparison: visible area 1609 versus 1582 mm²,
foam liquid 11.3556 versus 11.3537 ml, RMS radius 12.6896 versus 12.6947 mm.
This supports pool-size stability for this action, not fine-band convergence.

## Numerical and input checks

All **42 automated tests pass**: 29 preserved model/pouring/physics/volume
tests and 13 new cozy tests. [Complete output](cozy-test-results.txt).
New accounting assertions require constituent-ledger error below 1e-7 ml,
finite nonnegative inventories, local coffee depth above −1e-10 m and foam
liquid contained in upper milk. Local-capacity failures found during development
were corrected by conservative interlayer transfers before transport and after
withdrawal. There is no global mass correction.

The final primitive liquid errors are below 3e-12 ml. Raised/lowered exchanges,
foam drainage, gas loss, resurfacing, direct misses and mixture spill each have
separate ledgers. Walls have zero normal flux. Pressure is hydrostatic rather
than iteratively projected, so no Jacobi residual is claimed; the flat-rest
test and grid comparison are the relevant reduced-model checks.

The browser live/replay maximum field discrepancy is below 6e-15 m, with milk
budget discrepancy 4.3e-14 percentage points. Replay waits for the matching
fixed simulation endpoint, including when rendering is slower. Recorded events
remain gated by their receipt times. Preloaded and 30/60/120 Hz scheduled
replays produce bit-identical foam and height in the automated checks.

[Cozy actual-listener checks](cozy-controls.txt) and
[Advanced actual-listener checks](cozy-advanced-controls.txt) each pass 17
checks: dry aim, retained aim without a second finger, pad pickup/re-clutch,
separate pointer ownership, aim lift, delivery reversal at saturation,
cancellation, blur/resume, resize, intention switch, keyboard editing,
small mouse tap and Enjoy/Fresh controls. Touch events are synthetic and
pointer capture is stubbed in this harness. Native mouse recording exercises
real browser capture. Physical multitouch comfort remains unverified.

## Layout, device and performance

Checked CSS viewports in Windows Chrome 154, Codex in-app browser, reported
device pixel ratio 1.74:
[320×568](cozy-layout-320x568.jpg), [360×640](cozy-layout-360x640.jpg),
[390×844](cozy-layout-390x844.jpg), [768×1024](cozy-layout-768x1024.jpg),
[1280×720](cozy-layout-1280x720.jpg), [736×414](cozy-layout-736x414.jpg).
Main buttons remain inside each viewport, no horizontal document overflow,
nominal 44 CSS px targets (43.992 px measured due to browser rounding).
[Raw bounds](cozy-layouts.json). These are responsive desktop tests, not phones.
Temporary viewport overrides were reset afterward.

[Recorded desktop timing samples](cozy-live-performance.json) include an
extended full-cup run and export interval before the final overflow remap.
They remain a conservative stress observation rather than a claim for final
phone hardware. Full-frame mean 53.28 ms, median 48.70 ms, p95 90.30 ms,
p99 111.20 ms, maximum 145.90 ms: roughly 19 fps average. Simulation CPU
ticks average 9.62 ms, p95 11.80 ms; render CPU submission averages 0.47 ms,
p95 0.60 ms; asynchronous render GPU timing averages 1.24 ms, p95 3.24 ms.
GPU timings describe rendering; this new solver runs on the CPU. No per-frame
synchronous field readbacks are used. **The 60 fps target does not pass this
stress capture, and phone performance is unverified.** Node solver timings in
the raw behavior report must not be interpreted as browser frame timings.

## Build and reproduction

Commands executed successfully from the project directory:

```powershell
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vite/bin/vite.js build
node --experimental-strip-types --test tests/model.test.ts tests/pouring.test.ts tests/physics.test.ts tests/volume.test.ts tests/cozy.test.ts
node --experimental-strip-types tests/cozy-evidence.ts
```

Production build succeeds with the existing Vite large-bundle warning
(approximately 568 kB entry before compression). Dependencies were not upgraded.
The live server is `http://127.0.0.1:5178/`. Studio settings exposes cozy,
original surface, GPU baseline, Advanced controls, scripts and recordings.
Use `?verify` for the listener harness. Existing work and assets were retained.

The next required work is retaining spatial detail while carrying foam,
improving finishing into readable art, reducing CPU integration cost, then
implementing physical tilted geometry/local overflow and testing real phones.
The game is runnable; the complete build-guide milestone is not yet achieved.

