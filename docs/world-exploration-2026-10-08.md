# Café exploration and custom captures

8 October 2026.

## Cup / Corner revision

A persistent Cup / Corner switch replaces the leave-view action. Corner immediately enables free roam and exposes Decorate, My pours and Take photo. Its option dialogs close back into Corner; Cup restores the calibrated pouring view without clearing artwork. The redundant mobile Corner entry is hidden; the cup-action dock is labeled Actions. Escape and direct mug/camera gestures remain.

Verified Corner → Decorate → return to Corner, gallery access, and Cup returning to the pouring dock. TypeScript and production build pass.

## Direct gesture revision (earlier checkpoint)

The Explore entry and the movement/mug-adjustment panel have been removed. The existing cup action is now Leave pour view; Escape toggles between pouring and the room. Camera and mug gestures use hit testing automatically: dragging the mug turns it, scrolling over it resizes it, and a two-contact mug gesture scales it. Background drags/scrolling/panning operate the camera. WASD/RF remain; Home resets and P captures. Only Return to pouring and Take photo remain in the room UI.

Verified actual browser mouse rotation, wheel mug resizing, background camera drag, Escape in both directions, and custom 1080px capture. TypeScript and production build pass. The pinch path is implemented but not verified on physical touch hardware.

The following notes describe the initial panel-based checkpoint.


Explore adds a perspective camera with orbit, dolly, pan, WASD/RF translation and touch-friendly movement buttons. The pouring session is paused at the same synchronized boundary as the photo studio. Existing pointer and wheel pouring listeners ignore paused input. Leaving Explore resumes dry and restores the original pouring geometry and camera. Phone adjustments collapse initially so the cup remains reachable.

The mug, saucer, interior and actual latte surface form one scene group. Turning and uniform scaling carry the actual artwork with the cup. Scaling anchors the saucer to the countertop. Mug drag uses capture-phase ray picking and pointer capture; cancellation, blur and leaving clear the drag. Extra contacts during a mug drag cannot start a conflicting camera gesture. Sizes range from 65% to 140% and apply to scene staging, not to liquid volume, calibrated capacity or tilt physics.

Capture this view clones the perspective camera and snapshots the posed scene and liquid textures. The existing offscreen HDR/output conversion produces a 1080×1080 square or 1080×1350 portrait image, including the selected crop and framing. The gallery record retains optional camera metadata without changing the storage schema or existing saved photos. Closing a custom photo returns to exploration with simulation still paused; leaving exploration returns to pouring. Camera translation and mug pose remain available on re-entering Explore. Reset view & mug restores both.

World additions: framed counter fascia and drawer pulls, floorboards and woven runner, stools and foot rails, espresso tray slats/gauge/switches/wand, translucent bean jar with individual beans, folded towels, extra open cups, hollow shelf mugs and handles, lidded/labeled canisters, shelf brackets/book spines and a framed café print. Environment preblur now stays within the renderer's supported sample range.

## Verification

- TypeScript and production build pass.
- Existing solver/input/room suite: 62 tests pass, zero failures.
- Browser: direct mug drag advanced rotation to 39°; sliders exercised 75% and 125% sizing and positive/negative rotation; camera movement button exercised.
- Custom square and portrait captures completed at 1080×1080 and 1080×1350. Saving succeeded; gallery reopened the saved original. The generated verification image was moved to Recently removed, leaving it recoverable.
- Closing custom capture returned to Explore; Back to pouring restored the normal dock and original 4.9 ml/s and 2.8 mm settings.
- Reviewed compact phone framing and the desktop breakpoint. These checks use the desktop browser, not physical phone hardware.
- Actual camera drag changed the perspective while retaining the frozen artwork. Final browser error log is empty.

[Desktop exploration](world-explore-desktop-2026-10-08.jpg) · [Compact mobile exploration](world-explore-mobile-2026-10-08.jpg)

Remaining limits: physical vessel sizes/capacity and tilt are not simulated, camera travel has no collision controller, and real multitouch/performance on mobile hardware remains unverified.
