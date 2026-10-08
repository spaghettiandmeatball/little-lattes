# Little Latte: first build slice

7 October 2026. This follows the audit and build plan; it records implementation and verification, not a completed milestone.

## Built

- Launch and Fresh cup now share the 35% Draw setup and centered aim. Fresh cup also restores the two rim settings and clears the previous stroke state. Show a pour starts from this same setup.
- Assisted pouring rotates the pitcher body toward the open center of the cup. The vessel tip and bound use shared dimensions. Rim headroom increases continuously as the vessel approaches an obstruction. Older recordings without an equipment-model field replay with the original binary rim response; new recordings identify the adaptive model.
- Developer measurements expose requested and actual clearance, accepted flow, fill, assistance and equipment-model version.
- The coffee corner is blocked out within the play view and the wider Enjoy cup view: a recessed window with greenery beyond it, plaster and timber structure, shelves, an espresso station, three distinct plant silhouettes, counter props and a warm practical light. Enjoy cup changes camera before the settled presentation; the camera remains fixed during a stroke.

## Checks

- Automated assisted Draw matrix: 3 deliveries × 3 initial fills × center and 4 offset positions = 45 cases. Actual clearance ranged from 2.8 to 3.21 mm in the current geometric model.
- The fixed-yaw rim approach changes by under 0.25 mm between adjacent 0.001 normalized aim samples. A separate check retains the legacy binary response for old replay data.
- All 52 automated tests pass; TypeScript and the Vite production build pass. The existing large bundle warning remains.
- Visually inspected play and Enjoy cup in the in-app browser at a landscape desktop-sized viewport. The room is visible in both. The window and plants are still blockout geometry, and the portrait/device acceptance gate remains open.

## Next work

Pair fixed-state screenshots with numerical field captures, inspect handle/rim contact and endpoint alignment through the full pose range, then tune Draw/Finish on the assisted path. The liquid material, detailed room assets, compact controls and physical-phone performance pass are separate remaining milestones.

## Follow-up: finer finishing cut

The new `hydrostatic-film-5` response strengthens the moving cut's local pinch without changing the poured inventory or applying a target-shape mask. Dry changes from Draw to Finish now reach the requested height before the next wet stroke; old recordings retain their smooth transition and earlier film response. The liquid display uses a tighter cream boundary, and the pitcher leaves the cup unobstructed when the player releases.

In the focused heart probe at the usual cut speed, the measured tip width changed from 24 to 14 film cells while both lobes stayed above 98% of their previous counted area. This is a numerical regression check, not a human success rate. The UI now explicitly prompts players to release while still moving; a paused Finish stream can still round the endpoint.
