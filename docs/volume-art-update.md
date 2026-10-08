# 3D art update — 7 October 2026

Historical film-1 integration. The current heart and input-force correction is
documented in [heart response](heart-pour-update.md).

The user was using the 3D baseline, whose previous coarse bulk-driven foam
could merge bands and entrain too much milk during a finishing stroke. That
mode now appears as **3D latte art**, with solver version `gpu-volume-film-1`.
Open `/?mode=volume`. It retains the 32×32×20 GPU liquid and cup inventory,
and uses the existing 160² milk-purity film for the visible art.

## Behavior and controls

The shared ballistic jet now supplies outlet direction, clearance, impact speed
and pitcher motion in both art modes. Accepted cup deposits drive the film:
low pours spread existing milk outward, while a higher, thinner moving stream
draws it inward along a wake. Bounded MacCormack transport preserves fine
boundaries. Bilinear display filtering, where float filtering is supported,
removes nearest-neighbor blocks. No heart/leaf recognition or shape masks are
used. The example is a sequence of input packets through the player solver.

Fresh cup and entering an art mode select Draw at 35% delivery. Finish sets a
raised, thinner stream in both Cozy and Advanced controls. Advanced retains
independent sliders; cycling intentions preserves the preferred delivery.
At the fresh settings, Advanced Draw is flow 0.410 / height 0.101; Finish is
flow 0.137 / height 0.555. Release, choose Finish, reposition dry, then pull
through once and release before the rim. Show a pour demonstrates this.

Rosetta practice packets now include Draw/Finish metadata and use the same
Cozy control transition as manual input. Older `gpu-volume` recordings select
the original jet and foam model; new recordings store the new solver version.
Fresh cup restores the current art model.

## Verification

- Production build and TypeScript pass. The existing large bundle warning
  remains; no dependencies were added.
- Eight Node film and cup-volume tests pass, covering bands, raised cuts,
  rest, height, delivery, travel speed, dry/off-cup input, capacity and recording
  schedules at 30/60/120 Hz.
- The browser GPU integration check passes five checks. Before the cut it
  resolves eight bands; after the cut its white area retains 65.02% of the
  pre-cut area. Purity remains bounded, GPU fields are finite, and represented
  milk differs from the 22.0843963 ml cup inventory by less than 0.000001 ml.
  See `volume-art-checks.json`.
- Actual-listener control checks pass 20 Advanced and 18 Cozy checks, including
  intention switching, preserved delivery and Fresh returning to Draw.
  See `volume-art-advanced-controls.txt`, `volume-art-cozy-controls.txt`, and
  `volume-art-intentions.json`. Synthetic touch uses stubbed pointer capture;
  physical multitouch has not been verified.
- A native browser mouse recording has 50 packets, four wet gestures,
  2.5223196641 ml emitted and no skipped intervals. Browser replay matches
  all 25,600 film values exactly, with zero milk and remaining-budget difference.
  See `volume-art-recorded-mouse.json`, `volume-art-mouse-live.json`,
  `volume-art-mouse-replay.json`, and `volume-art-mouse-comparison.json`.
- Show a pour was checked in the actual 3D mode. The finished screenshot is
  `volume-art-rosetta.jpg`; its leaf comes from the low wiggles and raised cut.

## Limits

This is an empirical game approximation. The film is a passive optical milk
attribute driven by accepted incoming jets, not a separately conserved foam
volume and not fully coupled to the GPU bulk velocity. The GPU still computes
bulk mixing and transported crema; the cup ledger owns all milk volume. The
surface is a level rising lid; physical cup tilt, measured foam density and
rheology, waves and real-phone performance remain unverified. Earlier
`liquid-3d-model.md` and `liquid-3d-verification.md` describe the preserved
baseline, not the new visible film.
