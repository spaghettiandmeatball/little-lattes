# Little Latte — deep fidelity and personal coffee corner pass

Implementation brief for Astra · 7 October 2026

## The intended experience

Make a cup of latte art in a beautiful coffee corner that feels like your own, photograph it, and build a personal collection of finished cups.

The user says pouring now feels good, while final results still need refinement. Preserve that progress. They want more directional control, exceptional material/shader fidelity, a richer cozy world with plants, meaningful customization, and Instagram-inspired photographs and a saved-photo grid. Advanced controls remain the current default by explicit clarification.

This is a substantial implementation and visual iteration brief, not permission to substitute an attractive static mockup for the game. “Perfect” means sustained polish against concrete behavior and visual gates; it is not a claim of physically exact fluid simulation or guaranteed photographic realism.

Read the [latest direction/fidelity/photo audit](fidelity-direction-photo-audit-2026-10-07.md) first. It contains the known defects, rendering and photo architecture, evidence, and acceptance requirements. Read the [original world brief](audit-and-build-plan-2026-10-07.md) for the coffee-corner art direction, while treating its older implementation findings as historical. Inspect the current code before acting: this working tree has substantial uncommitted work and may have advanced since these documents were written.

## Art direction: a personal neighborhood coffee nook

Build one excellent room with coherent proportions and carefully framed depth. Use warm timber, tactile plaster, quiet sage, glazed ceramics, linen and brushed metal. Window light and plants should help define the room's identity. The composition should feel comfortable and lived in, with a few personal objects rather than repeated generic clutter.

The world must look good in three distinct views:

1. **Pour:** stable, precise camera, generous cup size, uncluttered art region, a visible sense of the surrounding room.
2. **Decorate:** wider view with clear selectable locations and immediate material/lighting feedback.
3. **Photo:** clean, cup-focused composition with believable lens, depth and light; saved output contains no gameplay UI.

Do not solve world visibility simply by shrinking the cup. Do not solve photographic realism by blurring the whole room or saturating the scene with bloom. Model silhouettes, material response, reflections, contact shadows and composition must carry the image before finishing effects are added.

## Customization: meaningful choices inside a designed space

Start with an authored room and a small number of usable placement locations. This provides attractive results and keeps the implementation focused. Unrestricted furniture dragging and full architectural editing are later features.

| Category | First-release content | Constraints |
| --- | --- | --- |
| Counter | Three coordinated finishes: honey oak, dark walnut, pale stone | Correct material scale, edge detail and matching normal/roughness response |
| Walls | Three palette families: warm cream, muted sage, dusty clay | Preserve legibility and light balance; no arbitrary neon picker initially |
| Cup/saucer | Three attractive cosmetic collections with controlled glaze options | Same verified inner vessel/capacity in the first release; cosmetics must not silently change the simulation |
| Pitcher | Brushed steel, polished steel and a restrained coated finish | Same verified spout/collision geometry; coating must have its own material response |
| Plants | Trailing pothos, broad-leaf plant and a compact counter plant, with three pot styles | Authored shelf/window/counter locations, believable stems and leaf shapes, clear working area |
| Personal objects | A small curated set: journal, linen cloth, pastry plate, bean jar and framed print | Use surface anchors and tested arrangements; no floating/intersecting props |
| Lighting | Soft morning, golden afternoon and warm evening | Unified light/environment/exposure recipe; avoid turning this into an unbounded lighting editor |

These are starting content targets, not requirements to produce every combinatorial permutation as an asset. Reuse geometry with meaningful material variants and authored arrangements. Implement and validate one complete collection before expanding to all variants.

Provide three one-tap room presets using the same catalog, then let players adjust individual categories. Presets should be coherent starting points, not separate incompatible rooms. A clear **Decorate** action opens the editor. Category choices preview immediately; **Apply** persists the configuration, **Cancel** restores it, and **Reset room** is distinct from **Fresh cup**.

Keep presets and item choices visual: thumbnail swatches for materials and actual prop previews rather than technical sliders. Give a selected plant slot a subtle placement outline only in decorate mode. Do not expose mesh names, shader coefficients or asset paths to players.

The cup's work zone remains protected. Any automated arrangement must keep equipment access, UI clearance and photo subject visibility intact. Editing the room ends active pointer gestures and leaves the game dry; returning must not emit buffered milk or cause simulation catch-up.

## World building and shaders as one art pass

### Geometry and atmosphere

Replace the most visible primitive silhouettes first: cup wall/rim/handle, pitcher lip/interior, leaf shapes, window framing and near-counter props. Give the room structural depth through a sill, wall returns, shelf thickness and a visible counter edge. Place repeated ceramics with intentional spacing, rotation and variation.

Use a small set of good-quality, consistently scaled materials. Add restrained plaster detail, directional wood grain, linen weave and subtle ceramic irregularity. Plants need stems, leaf shape and thin-leaf light response, not only more polygons. Record the source/license of any external assets.

Ambient life can include subtle leaf motion, steam, and quiet room ambience. Keep the simulation/camera stable during precise pouring. Optional weather should wait until the window, light and existing room already meet the quality bar.

### Rendering foundation

Use the installed Three.js/WebGL pipeline unless a concrete measured blocker requires a change. Establish one color-management path and coherent window/practical-light environment before adding postprocessing. Factor liquid shading, material catalog, light rigs, environment construction and cameras into manageable modules.

The default GPU liquid and free-surface fallback must both receive the new material treatment. The actual transported milk field controls the art in every view. Design reflection intensity and roughness to preserve white/coffee boundaries. Keep a meaningful distinction between espresso wetness, satin foam, ceramic glaze, polished steel and brushed steel.

Photo quality can use higher resolution, refined shadows and carefully focused depth of field on demand. Live quality tiers should reduce rendering expense without silently changing pouring physics. Avoid per-frame environment rebakes; cache a small bounded set or rebuild only when a lighting preset is committed. Test shader changes with unchanged simulation fields to isolate visual improvements from shape changes.

## Pouring fidelity: targeted corrections, not a restart

Implement the latest audit's known direction and replay-handoff corrections. Orient the outlet impulse with the actual spout pose. Keep hand movement separate so a player can pull back while the spout continues facing the design. Add a clear bearing control and record it with the simulation inputs. Old recordings keep their old interpretation.

Investigate final shape quality with orientation-aware evidence: isolated pool growth, neighboring displacement, fine bands, moving cut, end-of-stroke release and post-pour rest. Include diagonal/off-center patterns and imperfect human gestures. Test finer field resolution as an experiment before committing the permanent performance cost. No template stamping, forced symmetry, target-shape detection or selective protection of finished art.

Keep physical cup tilt separate from cosmetic rotation and camera framing. If added, it must affect gravity, surface/rim geometry, aim intersection and equipment reach consistently. First deliver coherent bearing control and the existing enjoyable feel.

## Photography and the room must work together

Default photo mode should photograph **my cup in my corner**. Carry the selected counter, wall palette, cups, plants and light recipe into its composition. If a user chooses a special photo set, label it as a staging choice and never overwrite their room.

Use curated camera recipes and constrained variation in angle, crop and prop arrangement to keep a grid interesting. The saved image must retain the exact milk pattern, fill state and selected styling from capture time. Do not regenerate or beautify the latte design with an image model. A different camera or background cannot modify the art.

Implement the latest audit's immutable cup snapshot, separate photo presentation, Blob export and IndexedDB gallery. Store a versioned copy of the room configuration/asset IDs with the photo recipe, not a pointer to mutable current preferences. Save the original rendered image as the authoritative artifact. Later room edits and shader upgrades must not alter previously saved photographs.

The gallery is a satisfying part of the game: a simple personal header, cup count, clean three-column grid, favorites, titles/dates and a detail view with download and recoverable deletion. The initial feature is a private on-device collection. No social account, public profile or publishing service is necessary to achieve the requested look.

## Configuration and persistence contract

Use a small versioned room configuration with stable catalog IDs for finishes, cup/pitcher cosmetics, slot contents and lighting preset. Validate every loaded/imported value, provide safe fallback for unavailable IDs, and migrate previous schema versions explicitly. Store transforms only where the corresponding slot allows them; do not deserialize executable asset paths.

Keep four states distinct: gameplay/solver state, applied room preferences, temporary editor draft, and immutable photo records. Fresh cup only resets the intended cup state. Reset room only resets decoration. Cancel photo/editor returns without wiping the cup or changes already committed elsewhere. Refresh restores applied room choices and the photo collection independently.

Store image Blobs and gallery metadata in IndexedDB; small room preferences may share that database. Handle blocked storage and quota failure honestly, with preview preservation and download/retry. A gallery success message must follow a successful transaction. Dispose resources when changing variants or closing previews. Local storage is not a cross-device backup; provide exports before promising permanence.

## Implementation sequence

### A. Revalidate and preserve the baseline

Inspect instructions/current code and identify existing modifications. Capture current play, finish and Enjoy views plus representative pours. Run current checks and document actual results. Preserve work through the repository's normal workflow; do not clean away uncommitted files. Convert audit findings into a short actionable list, separating confirmed defects from aesthetic hypotheses.

### B. Establish one excellent vertical slice

Correct directional coherence and demo/Advanced handoff. Build one refined cup and pitcher under one convincing window light in one decorated corner. Add Take photo with a fixed good composition, save it, and show it in a grid after refresh. This first slice must prove the entire experience before catalog expansion.

### C. Expand directional and final-shape fidelity

Add user-controlled bearing with comfortable mouse/touch access, appropriate interpolation and replay versioning. Refine finishing using the real input route. Retain numerical protections and evaluate rotated designs in their own frame. Compare scripts with manual attempts.

### D. Add the customization catalog and editor

Implement versioned room configuration, category controls, anchored plant/prop choices, presets and Apply/Cancel. Expand the material and asset catalog once state handling is solid. Verify that changes are visible from play, decorate and photo views.

### E. Complete photo art direction and gallery polish

Add bounded angle/setting variation, square/portrait export, safe framing, snapshot room styling, captions/favorites and robust storage behavior. Review a nine-photo contact sheet for variety, continuity and faithful art preservation.

### F. Refine, profile and deliver

Iterate on material detail, plant silhouettes, light balance, framing and UI. Validate real device performance and repeated capture/customization cycles. Keep a live before/after gallery and a concise report of remaining limitations. Finish with a playable result rather than only revised documentation.

## Acceptance gates

- **Feel:** the user's existing useful gestures remain responsive; no new forced motion, accidental pour, height/flow jump or unexpected reset.
- **Direction:** spout pose, outlet impulse, rendered stream and solver agree; deliberate pullback, sideways and diagonal gestures work; orientation survives record/replay.
- **Art:** recognizably improved tips, bands and boundaries across multiple gestures and orientations; improvements survive ten seconds of legitimate settling and are visible in neutral lighting.
- **World:** room depth, plants, materials and lighting are clearly improved from the actual play camera; interactive cup size remains useful.
- **Customization:** every supplied option is visually meaningful and compatible; Apply/Cancel/reset behave distinctly; applied choices survive refresh; room changes never erase the pour or rewrite saved photos.
- **Photography:** identical art snapshot across variants, clean no-UI output, correct color/orientation/crop, saved file matches preview, and curated variation produces a coherent nine-shot collection.
- **Gallery:** saved images survive refresh and Fresh cup; thumbnails load without replaying physics; quota/error paths retain an unsaved preview; repeated saves/deletes do not leak resources.
- **Devices:** validate compact portrait, landscape, tablet and desktop layouts; distinguish real-phone results from emulation. Aim for smooth 60 fps live play on named target hardware; measure and report the actual envelope.
- **Evidence:** current tests/type check/build pass, with focused new tests for meaningful behavior changes. Deliver screenshots from live gameplay and photo mode, recordings, a contact sheet, and concise measured limits. Do not substitute a generated concept image for actual application evidence.

## Working instructions for the Astra pass

Treat this as sustained implementation with visual review, not a one-pass code generation exercise. Reassess source and previous evidence before tuning. Use the current audit as the starting hypothesis, not an infallible specification. Keep improvements in reviewable stages and report decisions that materially change interaction or scope. Ask only when a missing product decision blocks meaningful work; use the art direction and curated first-release scope above for ordinary decisions.

Do not begin with new levels, currencies, unlock systems, online accounts, an unrestricted building editor or a wholesale engine/solver migration. Prioritize the coherent loop: **pour well → personalize the corner → compose a beautiful shot → collect it**.
