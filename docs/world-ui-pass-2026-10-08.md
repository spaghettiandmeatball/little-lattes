# Compact UI and brewing in the world

Brewing no longer opens a panel of tabs and commands. In Corner, tap the machine to grind and extract, tap the kettle to pour over, and tap the wand to steam milk. Equipment labels are attached to their positions in the world. Tap the same equipment again to stop and serve, or use the small active status strip. E interacts with the selected or hovered equipment. The camera moves toward the station, and the milk jug eases under the wand. Purging happens at the wand with the existing steam effects and audio.

The Corner toolbar now contains Decorate, Take photo and More. More contains the collection, mug options and shortcuts to move to each station when it is outside the view. Shortcuts position the camera; interaction with the equipment begins preparation. Cup's Steam milk and Coffee station actions also bring the user to the equipment.

Decorate separates Equipment, Room and Objects, uses smaller swatches and buttons, and keeps Apply and Cancel nearby. Its initial equipment category includes the optional imported machine and kettle. Shared settings styles are scoped to the main settings panel so nested menus and model credits are not clipped.

Rendering changes: display pixel ratio is capped at 1.5; scene shadows update at most eight times per second; the dense imported kettle no longer renders into the shadow map; hidden tabs skip main-frame work; Corner uploads paused liquid display textures at five times per second rather than each frame. Station positions and status DOM updates are limited to ten times per second. Exports retain their fixed 1080-pixel dimensions and force fresh photo shadows.

Validation: TypeScript and production build pass. All eight targeted brewing/workshop tests pass. Browser checks covered desktop and narrow screens, grouped decoration choices, shortcuts, keyboard espresso, clicking the machine body, stopping by tapping its world label, direct pour-over and tapping the wand to start and stop steaming. Temporary viewport changes were restored. FPS improvement has not been benchmarked; these changes reduce known render and upload work.

Screenshot: world-brewing-ui-2026-10-08.jpg.
