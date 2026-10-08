# Pour mechanics update — 7 October 2026

This describes the film-3 checkpoint. The current film-4 and GPU-film-2 surface
responses are documented in [heart response](heart-pour-update.md).

The default is now `hydrostatic-film-3`: a conservative 48² two-layer bulk liquid
and a 160² surface milk-purity attribute. The preserved v1/v2 recordings select
their original 64² model. Fresh cup returns to the new model. The existing
surface remains selectable. The 3D mode now uses this fine film over its GPU
bulk as `gpu-volume-film-1`; see [3D art update](volume-art-update.md).

## What real pouring tells us

[La Marzocco's barista demonstration](https://home.lamarzoccousa.com/practicing-latte-art/)
describes tilting the cup and first integrating milk with a narrow stream, then
bringing the spout close and increasing delivery to move milk across the
surface. Small rhythmic pitcher movements fold the pattern; raising the spout
changes the final pull-through. Cup tilt provides access to a low landing point.

[Culinary fluid mechanics](https://arxiv.org/html/2201.12128v2) describes the
pour as an inverted fountain: downward momentum competes with buoyancy, and
stronger penetration mixes the incoming milk more deeply. Height, stream radius,
velocity, and density contrast all matter. These principles motivate this game
model; they do not provide measured calibration for this cup and pitcher.

## Implemented behavior

The shared ballistic stream now includes a forward outlet velocity that varies
with delivery, as well as motion inherited from the pitcher. Gravity increases
its downward speed with height. The rendered spout and impact use that same
trajectory, including local liquid height and the existing rim-clearance assist.
The pitcher faces along the outlet bearing. Raising and delivery are linked by
the Draw/Finish intentions; Advanced still exposes height and flow separately.

The surface attribute represents local undiluted milk purity, not another liquid
inventory. The bulk solver continues to own every ml. It supplies local height,
fill, mixing inventories, spilling, and the milk budget. Surface-purity transport
resolves fine crema boundaries with bounded MacCormack advection rather than the
diffusive 64² first-order wet-foam thickness previously used as white opacity.

Low delivery drives a radial surface current plus the horizontal stream impulse.
A raised stream draws material toward the landing point and produces a wake
following the moving impact. Fresh milk enters through the actual stream
footprint; higher penetration mixes a wider patch while leaving a narrower fresh
core. Residual surface velocity decays over 35 ms. Nothing recognizes a heart,
leaf, completed pattern, or target silhouette. No finished art is stamped or
selectively frozen. Purity is rendered through a nonlinear optical response;
thin mixed milk has less contrast than concentrated surface milk.

The 0.4 mm effective skin, 9 mm clearance transition, surface flux fractions,
wake coupling, and optical response are empirical game parameters. The film is
an advected optical attribute, not a separately conserved foam-volume solver.
Its bounded advection is not exactly mass-conservative. Density and gas volume
remain reduced bulk approximations, and upright cup geometry is still used:
player-controlled cup tilt and measured foam rheology are not implemented.

## Verification

- All 42 preceding tests passed after the bulk investigation was reverted.
- Five additional tests cover height-dependent mixing at equal expenditure,
  ballistic endpoint consistency, separated bands, pull-through deformation,
  ten-second rest, delivery/travel-speed effects, reset/off-cup behavior, and
  native mouse recording across 30/60/120 Hz display schedules.
- TypeScript and the production build pass. Vite reports the existing large
  bundle warning; no packages were added.
- `film-evidence.html` and `film-results.json` show actual source inputs through
  the bulk and film, before the cut, after it, and after ten seconds resting.
  Faster travel and more generous delivery alter the pattern rather than being
  normalized into a preset shape.
- A real browser mouse recording contains 50 packets, four wet gestures,
  5.7788135576 ml emitted, and no skipped intervals. Live versus browser replay
  has exactly matching film floats, with emitted difference below 2e-14 ml.
  Data: `film-recorded-mouse.json`, `film-mouse-live.json`,
  `film-mouse-replay.json`, and `film-mouse-comparison.json`.
- The live Rosetta practice input completes its low pour and raised cut with
  21.84168 ml emitted and no dropped stalls. `film-rosetta-browser.jpg` is its
  rendered result. The practice replay contains only position/flow/height
  packets and uses the same solver as player input. That screenshot and emitted
  amount precede the later Draw/Finish metadata update, which now enables Cozy
  control transitions during Rosetta. Current 3D evidence is in the linked update.
- A Node benchmark of 120 active stationary ticks averaged 7.51 ms per tick
  for the combined model. This is a development measurement, not a guaranteed
  frame rate or phone result. Actual live rosetta completion was verified.

The previous cozy verification report describes the historical v2 checkpoint;
its white-blob art failure and stress timings should not be treated as current
surface evidence. Mobile hardware performance and realistic tilt remain open.
