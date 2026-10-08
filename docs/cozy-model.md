Historical v2 checkpoint. The current default is documented in [latte-pour-model.md](latte-pour-model.md).

# Cozy free surface — model decision, 7 October 2026

This checkpoint uses a conservative two-layer hydrostatic height field rather
than modifying the preserved rigid-lid GPU baseline. It is an alternative,
reduced interior model, not full 3D Navier–Stokes or calibrated milk CFD.

XY is horizontal, Z is world up. Meters, seconds and liquid ml are used. Cell
centres hold column depth and constituent inventories; faces hold horizontal
velocity. The upright cylindrical cup retains the 40 mm radius and 24 mm depth.
Raster cell area is normalized to the exact circular area. The prepared recipe
starts with 55 ml coffee and 8 ml mixed milk, no painted pattern, and transported
crema. The old surface and 32×32×20 GPU modes and evidence remain available.

The shipping grid is 64×64 with two depth layers (1.289 mm horizontal cells).
The 80×80 sensitivity run is a comparison, not a hidden device quality switch.
The height field owns **all** occupied liquid volume. Upper and lower milk are
disjoint inventories inside that volume. Surface foam is an attribute of upper
milk; it is not another addition to cup volume. Aeration is a separate passive
gas-volume-equivalent tracer. Gas does not expand occupied volume in this
checkpoint; reduced-density effects are represented by bounded surface-layer
pressure, not unconditional buoyancy of milk. Fixed temperature and recipe.

Wetness is derived from surface foam liquid / (foam liquid + surface gas tracer).
Opacity is reduced when its gas inventory is inadequate. Foam liquid drainage
and bubble-induced attribute loss leave total milk intact; gas loss is separate.

Local incoming liquid raises its source columns. Depth gradients accelerate
face velocities through hydrostatic pressure g h. The surface is the actual
column top, with atmospheric pressure there; there is no sealed lid. A thin
upper layer also responds to foam inventory gradients. Its compensating lower
return flow preserves the shared column-volume equation. Both layers transport
their milk and aeration conservatively; foam and crema follow upper flow.
The lower layer represents penetrating/mixed liquid. Vertical circulation is
parameterized material exchange, not a resolved vertical velocity field.

Every face flux is donor limited and exchanged equally between neighbors.
Walls have zero normal flux. No global constituent correction is used. Local
upper capacity is enforced by transfer to the lower inventory, never deletion.
Gas can entrain with foam, rise back with surviving milk, and be lost; drainage
removes the foam attribute while retaining its liquid milk. These exchanges
have separate ledgers. The display derives coverage continuously from thickness.

The same ballistic jet supplies flow, footprint, clearance, momentum and visual
stream. New-mode exit speed is fixed at 0.28 m/s; changing Q changes area through
Q=A U. Gravity adds drop speed. Deposition radius is max(impact radius, 1.5 cells),
normalized at walls. The penetration/entrainment partition and vertical energy
dissipation are empirical approximations; instantaneous arrival is retained
for both live input and replay. Dry movement supplies no source or impulse.

Explicit fixed 60 Hz ticks use gravity/CFL substeps, damping and bounded face
speeds. Donor transport is diffusive; fine bands need visual verification.
Pressure is hydrostatic, so a Jacobi residual is inapplicable; rest, height
relaxation and resolution sensitivity replace the baseline convergence check.

The numerical equations are ∂h/∂t = −div(h u) + s and
∂u/∂t = −9.81 grad(h) − 45 u at faces, omitting nonlinear momentum advection.
The upper layer has hT=min(h,1.5 mm+foam liquid inventory). Its flux is
hT(0.22 u/resistance + shear); the lower flux is h u minus upper flux.
Resistance is 1+0.4 min(3,(fA+fB)/1 mm). Surface pressure mobility is 4.5 mm/s
times the dimensionless inventory gradient, divided by resistance. A bounded
1.2 mm/s yield, weighted by min(1,(fA+fB)/1.6 mm), arrests weak crowded-film
creep. This affects only the upper foam pressure term: active liquid flow,
settling, second-pour displacement and lower circulation continue. It is not a
shape mask, art protection or whole-pitcher yield stress. Surface shear is
bounded at 12 mm/s, body velocity at 90 mm/s, each face withdraws at most 20%
of the donor layer per substep, and gravity CFL uses a 0.36 safety factor.

Provisional exchanges: surface fraction = 0.92/(1+(clearance/12 mm)²), bounded
to [0.025,0.92]; injected foam-liquid attribute = 0.85 times that fraction.
The local entrainment exponent is injected column thickness / top thickness
times (0.04 + 3(1−surface fraction)²). Gas source = 0.25 liquid volume,
upper/lower partition as above. Drainage 0.006/s, surface bubble loss 0.004/s,
deep gas loss 0.035/s, resurfacing 0.07/s with milk availability/capacity limits.
These are engineering coefficients, not measured milk viscosity or bubble sizes.

Stage A overflow is deliberate: emission continues with stop-at-rim off. Excess
liquid is withdrawn proportionally from the cup's current constituent mixture,
and booked as rim spill, separately from direct misses. It is not local rim
outflow. The exterior cue is indicative; physical tilt and accessible tilted
pitcher geometry are unfinished and manual tilt is not exposed. An independently
switchable upright access assist bounds the preserved pitcher cylinder about
its actual posed spout. It raises clearance above liquid or rim when that bound
would intersect them, displays the change, and keeps the landing point fixed.
This conservative geometry bound is not a measured 150 ml pitcher; that asset
remains illustrative. Surface picking
iterates against sampled height. Render normals use the same field.

Draw, Finish and optional Mix map a normalized preferred delivery into one
configuration, transitioning over 0.12 s. They only change physical height and
flow, never inject a shape. Advanced controls feed the same solver and jet.
Recordings include solver/recipe/assist metadata and intention-tagged packets.

Coefficients are provisional product tuning, not measured rheology. Qualitative
references: [Mathijssen et al.](https://arxiv.org/html/2201.12128v2) on inverted
fountains and [La Marzocco / Babinski](https://home.lamarzoccousa.com/practicing-latte-art/)
on low drawing and raised finishing. Neither supplies the numerical coefficients.
No reference-vessel video or real-phone calibration was available.

