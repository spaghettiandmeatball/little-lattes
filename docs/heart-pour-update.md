# Heart response — 7 October 2026

The preceding leaf demonstration did not prove that a player could finish a
heart. A stationary low-pour probe followed by the former cut produced a spear
without a notch. The user supplied references showing two rounded lobes, a
visible valley, and a tapered point. Those references guide the observed result;
their illustrations and text are not used as executable instructions or masks.

## Model changes

Current versions are `gpu-volume-film-2` and `hydrostatic-film-4`. Stationary low
streams develop a local return flow around the forward outlet impulse. Fast
travel continuously reduces that coherent return flow, allowing rhythmic bands
to survive. A raised moving stream has a weaker, narrower radial sink and a
localized trailing dipole and extensional current. These advect the existing
milk into a tip while preserving the adjacent lobes. Raised deposition and
entrainment are reduced so the cut does not paint over or remove a wide area.

There was also an input integration error: directional currents were applied
at full strength for every source packet in a 60 Hz step. High-rate mouse and
script input could therefore multiply the surface force. Each current now
receives its packet's occupied-time weight, derived from accepted volume,
actual delivery, and the complete step duration. Near-zero flow approaches
zero force. The cup inventory still owns all milk volume.

These are empirical surface-flow approximations. They do not recognize a
heart, apply a silhouette, selectively protect completed art, or alter the
user's movement into a prescribed curve. Shape measurements are read-only
development checks. Physical cup tilt, calibrated foam rheology and density,
full bulk/film coupling, and real-phone performance remain open.

## Pour and evidence

[Barista Hustle's heart lesson](https://www.baristahustle.com/lesson/b1-5-05-heart-placing-and-cutting/)
describes the heart as a placement followed by a central cutting maneuver.
[La Marzocco's guidance](https://home.lamarzoccousa.com/the-essential-guide-to-mastering-espresso-at-home/)
describes moving forward and lifting to make the thin line and tip. These guide
the revised example, not measured coefficient calibration.

Show a pour now demonstrates Heart using ordinary input packets. It grows a
stationary low pool, switches to Finish while dry, and cuts in the forward
outlet direction. The prior heart demo had large lateral excursions and cut
back against the incoming direction. Rosetta remains in Practice replay.

The 3D heart browser check passes seven checks: both lobes survive, the notch
is visible, the tip extends and narrows, purity stays bounded, GPU fields stay
finite, and milk accounting remains correct. At threshold 0.5, the lobes retain
1974 cells each versus 1958 before the cut. The notch is 14 cells deep; the last
15% of the pattern is at most 24 cells wide versus 74 across the body. Milk
inventory is 16.0420503 ml with GPU error below 0.000001 ml. See
`heart-3d-checks.json`.

The existing leaf browser check also passes: six separated bands remain and
white area after the cut is 100.32% of the pre-cut area. This area is an optical
threshold, not a separate foam-volume inventory. See `heart-update-leaf-checks.json`.

Three new Node tests cover the heart across 0.25/0.42/0.65 cup-width-per-second
travel, splitting one wet source into four identical packets, and near-zero
moving delivery. Historical film-3 and GPU-film-1 recordings retain their old
surface response rather than being silently reinterpreted. Their newer versions
are recorded explicitly. The preceding `volume-art-update.md` describes the
first film integration and is historical.

The native mouse check used 218 recorded events across 18 wet gestures: twelve
small pool-building gestures, a rapid cut and five shorter forward finishing
segments. This deliberately interrupted input retained the lobes; its brief
cut does not produce the same elongated tip as the slower example. Live and
replayed `gpu-volume-film-2` optical fields matched exactly (maximum cell error
0), with 8.8360214833 ml of milk in both runs. See
`heart-mouse-comparison.json` and the before/after mouse screenshots.

All 50 Node checks have passed on the final implementation. The initial full
run exposed one historical surface-demo regression; the original surface-mode
Heart script was restored, then both affected pouring checks were rerun and
passed. The new heart example applies to the film solvers. Type checking and
the production build pass. The build retains its existing large-chunk warning.

`heart-3d-finished.jpg` shows the ordinary-input Heart example in the actual 3D
view. The tip is still softer and rounder than the supplied photographs. These
checks establish lobe retention and a narrow extending finish, not photographic
fidelity or validation of every possible player gesture.
