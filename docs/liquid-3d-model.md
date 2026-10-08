# Experimental GPU volume: implementation decision

October 7, 2026. Preserve the existing CPU surface mode and all prior work. This
experiment tests connected bulk circulation rather than splash appearance.

Inspected the official [Three.js fluid example](https://threejs.org/examples/webgpu_compute_particles_fluid.html)
and its [source](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_compute_particles_fluid.html).
It uses WebGPURenderer, TSL, five MLS-MPM kernels, integer atomics, a 64³ grid,
up to 131,072 particles, instanced icosahedra, inspector/orbit controls and an HDR
environment. The default count is 32,768. Its water particles have no milk
composition, crema or volume ledger, and its container is a rounded box.
Three.js and its cited [WebGPU-Ocean implementation](https://github.com/matsuoka-601/WebGPU-Ocean)
have MIT licenses. No example or Ocean code/assets were copied. The existing
project uses Three.js 0.180.0 and WebGLRenderer; the current dev example also
depends on newer renderer facilities. Replacing the renderer and tuning MPM
would expand this milestone without solving fine surface patterns.

Choice: an original WebGL2 GPU Eulerian volume solver, inspired by
[Stam's Stable Fluids](https://www.dgp.toronto.edu/public_user/stam/reality/Research/pdf/ns.pdf),
with a finer advected foam layer. Float render targets keep all simulation state
on the GPU. This preserves the existing renderer and makes the bulk/surface
coupling inspectable. This is a feasibility approximation, not validated CFD.

## Fields, scale and boundaries

- XY horizontal, Z up; meters, seconds, ml, kg and N·s. The shared ballistic jet
  remains the sole source of incoming mass and momentum. 1 ml = 10⁻⁶ m³ and
  effective density = 1000 kg/m³ for the single wet-microfoam recipe.
- Cylindrical interior: radius 40 mm, depth 24 mm, capacity 120.64 ml; start with
  55 ml coffee and 150 ml in the pitcher. The experiment uses a matching open
  interior mesh. Fill rises by volume/area. Capacity limits emission before
  spending pitcher milk. Off-cup milk is a reported loss.
- 32×32×20 bulk cells packed into a 640×32 atlas; 256² surface cells, 60 Hz clock.
  The vertical grid stretches with the analytic mean fill level. The lid is level
  and impermeable to solved velocity; uniform geometric expansion represents
  filling. No waves, free-surface breakup, overflow or cup tilt are solved.
- Bulk: three face velocities in m/s and milk fraction. Semi-Lagrangian transport,
  limited explicit viscosity, a pressure projection, cylindrical no-through walls
  and bottom/lid. Coffee moves with this velocity; its brown color is a transported
  coffee/milk mixture, not a static background.
- Impact momentum is distributed through a normalized, resolved Gaussian around
  the impact near the top of the volume. The footprint is wider than the true jet
  because the grid cannot resolve a 1–2 mm stream. Force scales with accepted
  mass times incoming velocity, including lateral momentum, and tends to zero
  continuously with flow. No source force comes from dry pointer movement.
- Milk tracer is transported with the bulk. A GPU reduction and bounded global
  correction enforce total milk mass after numerical transport. This prevents
  silent losses but distributes correction away from the jet; it is an explicit
  approximation that can weaken local penetration contrast.
- Foam amount is thickness in meters, distinct from bulk milk fraction. A smooth
  empirical clearance/impact-speed partition puts part of incoming milk into the
  surface foam. The volume still contains that milk; foam is its surface attribute,
  not additional milk. All foam motion samples the solved top bulk velocity.
  Foam-dependent surface mobility is empirical. There is no independent brush
  velocity, target force, picture injection or generated wiggle.
- Foam and a uniform initial crema film use conservative finite-volume transport
  with minmod reconstruction and eight substeps per tick. Surface mobility samples
  the bulk; the face-speed L1 limit is 45 mm/s for a bounded CFL of 0.30. This
  empirical cap slows fast surface motion rather than introducing any extra force.
  Crema is an areal film amount, initially 1, transported and entrained by the same
  liquid. It modulates the coffee tone and moves under subsequent pours.
  Downward bulk motion entrains foam/crema; drainage is slow. Foam loss and
  transport error are measured independently of the conservative liquid ledger.
- The bulk velocity cap is 650 mm/s. Explicit viscosity is 1.5×10⁻⁶ m²/s,
  reduced if necessary for the vertical cell/timestep stability bound. Linear
  drag is 0.35/s; empirical wet-milk buoyancy is 0.18 m/s² times milk fraction.
  Twenty-four warm-started Jacobi iterations reduce divergence but do not converge
  it to zero. Pressure residual and tracer correction limit physical fidelity.
- The first surface transport trial used semi-Lagrangian advection and lost most
  surface material numerically; it was replaced before final response verification.
  High-rate sources are merged by volume into at most eight quadrature points per
  tick, without creating connecting segments. This bounds cost but filters motions
  much faster than the 60 Hz solver can resolve.
- Sources stop at the simulation input boundary; ballistic flight time is rendered
  but in-flight mass is not queued. The shared spout-to-current-liquid clearance
  is used for physics and rendering without decorative pitcher lag.

## Controls and comparison

The two modes share mouse/touch listeners, relative pad pickup, wheel/Shift fine
clearance, time-based A/D flow, 33 ms causal input buffering and recordings.
Switching modes starts a fresh cup. Playback uses only packets whose receipt
deadlines have arrived. The same recording can be played in either mode;
the older mode has a fixed prepared surface, whereas the volume mode fills.
The old Feel presets remain specific to the CPU mode. GPU recipe/resolution are
fixed and displayed; visual quality changes only rendering resolution.

WebGL2 plus renderable floating point textures are mandatory. Initialization
tests the actual framebuffer and a float readback. Failure disables the experiment
with a compatibility message and retains the existing surface mode. No silent
fallback substitutes a surface-only effect. Mobile browser layout checks do not
verify phone GPU performance or real multitouch.

See liquid-3d-verification.md for measurements, visual evidence and conclusions.
