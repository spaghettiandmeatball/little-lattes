# Little Latte — corner, photography and mobile build

8 October 2026. Implemented in the existing Three.js r180 game; no engine migration or generated replacement art.

## Play and input

Advanced is still the default. Wheel changes height, A/D change flow, Shift enables fine control. Explicit pour bearing (slider/buttons, Q/E) rotates spout pose and outlet momentum while hand momentum remains separate. Inputs without bearing preserve historical fixed-axis replay behavior. Angular interpolation takes the short path through ±π.

Replay UI values are converted for the player's selected scheme. The heart demo hands Advanced back 0.137 flow = 1.644 ml/s, displayed as 1.6 ml/s, with 26 mm height. Fresh cup preserves current controls. Imported recordings no longer replace the visible control scheme.

The pad now steers the spout by relative movement: hold to pour, drag to steer, release to stop. Initial contact and re-clutch do not jump the aim. Steering leaves flow/height unchanged. The former flow/height pad is an option in Studio settings. Actual input listeners handle coalesced packets, pointer cancellation, focus/resize cancellation, and keyboard focus protection.

## Mobile

The normal mobile view shows the cup, compact branding/settings access, and a small dock with its pouring pad. Adjust opens flow, height, bearing and intentions. Cup opens Fresh cup, refill, Enjoy and Take photo. Corner opens decoration/gallery; the music button opens the radio. Secondary panels are closed initially and mutually exclusive. Desktop keeps exposed controls. Existing radio features and room choices are preserved.

Verified actual CSS viewport sizes: **320×568, 390×844, 736×414 and 1280×800**. The in-app browser's viewport inputs were divided by its 1.74 device scale; the reported dimensions were checked in the page and corrected before recording evidence. These are browser layout checks, not physical-phone tests.

- [390×844 default](mobile-390x844-2026-10-08.jpg)
- [320×568 default](mobile-320x568-2026-10-08.jpg)
- [320×568 opened adjustments](mobile-adjustments-320x568-2026-10-08.jpg)
- [736×414 landscape](mobile-736x414-2026-10-08.jpg)
- [1280×800 desktop](desktop-1280x800-2026-10-08.jpg)

## Room and rendering

The transported liquid field now drives a pinned-r180 PBR material: coffee/milk pigment, spatial roughness, stable fine surface variation and the free-surface normals. Both GPU art and CPU free-surface modes use it. A cached window reflection environment, softer direct shadows, glazed cup profile and handle, formed open pitcher/spout, lit stream normals, curved leaf blades/stems, linen weave and restrained exterior foliage replace prominent flat/primitive responses.

Decorate previews a validated versioned configuration. Apply persists; Cancel restores; Reset room is a draft until applied. Three presets share the same catalog: counter, wall, cup/pitcher finishes, plant arrangements, pots, personal props and lighting. Cosmetic changes keep vessel capacity and simulation geometry unchanged. Portrait decoration uses a bottom sheet with a separate room composition above it.

## Photography and collection

Take photo copies render textures and material state at one simulation boundary into a separate scene. Live fields, room settings and camera remain independent. Three camera recipes, three optional staged settings, framing and square/4:5 portrait choices share the same frozen art. Exports are 1080×1080 or 1080×1350. HDR scene output receives ACES and sRGB conversion once; the encoded PNG is also the preview and the saved original. No permanent drawing-buffer preservation is enabled.

IndexedDB commits originals, thumbnails and metadata atomically. My pours pages through thumbnails, opens originals on demand, supports titles/favorites/download, and uses a recoverable Recently removed collection. Failed saves retain the preview and download/retry controls. No public account or social integration is included.

Verified save → refresh → open, favorite, remove, restore, and Advanced demo completion in the browser. The test photo was moved to Recently removed; existing user photos were left intact.

The developer photo verification made a snapshot, reset the live cup, rendered nine setting/angle combinations, and restored the original composition. PNG hashes matched both before/after Fresh cup and before/after all nine variants. Both dimensions passed. Warm 1080px renders/encoding measured **59.9–106.3 ms on this desktop browser run**, not a phone performance promise. Texture count rose by one when the stone texture cache first warmed. Repeated-cycle/context-loss memory recovery still needs deeper device testing.

- [Nine compositions, screenshot review](photo-contact-sheet-review-2026-10-08.jpg)
- [Verification values](photo-verification-2026-10-08.json)
- [Fallback photo mode](photo-fallback-2026-10-08.jpg)

Use `?verify` → Studio settings → Verify photo snapshots + contact sheet to regenerate native images and the report. This explicit developer check resets the live cup while proving the snapshot remains unchanged.

## Shape experiments and remaining limits

Orientation-aware diagnostics now measure terminal apex width and the last millimeter independently of the old terminal-band metric. The assisted 0°/45°/90° comparison retained equivalent volume and nearly equivalent canonical shape. 240² took about 2.7× the 160² probe time and did not improve terminal widths. An experimental stronger finishing strain narrowed the aligned apex but weakened the notch and did not consistently improve diagonal/terminal measurements. Neither experiment becomes the default; the current tapered response and 160² field remain.

[Resolution comparison](direction-resolution-evidence.json) · [Experimental finishing comparison](direction-fine-evidence.json)

This pass does **not** claim perfected heart tips or photographic realism. Real-phone frame-time/battery profiling, systematic human gesture success rates, final-shape refinement, quota-denied fault injection, long-collection migration testing and WebGL context-loss/low-memory recovery remain unverified. Photos currently have no depth-of-field pass, saved cups cannot be reopened as fluid simulations, plant/prop selection uses swatches rather than rendered catalog thumbnails, and physical cup tilt remains deferred. Private local storage is not a backup; originals can be downloaded.

## Checks

The automated solver/input suite and focused bearing/trackpad/room-validation checks pass. See [complete run](fidelity-build-tests-2026-10-08.txt). All **25 browser input-listener checks pass**, including both pad modes: [results](mobile-control-checks-2026-10-08.txt). TypeScript checking and the production build pass. No shader/browser errors were observed in the GPU or free-surface photo checks.

The global npm launcher is broken on this host; validation used the installed Node executable with the repository's local TypeScript/Vite entry points. All pre-existing uncommitted work was preserved; unrelated radio changes that arrived during this pass were retained.
