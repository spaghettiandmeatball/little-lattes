# Little Latte — Visual Design System

Version 1.0 · 8 October 2026

A styling reference for the current Little Latte game: a quiet, tactile café where the cup and the act of pouring are the focus.

This document records the existing implementation and visual direction. Named tokens below are proposed names for existing values; they are not yet shared CSS variables. Guidance marked **Recommended** describes future consistency improvements, rather than behavior already implemented.

## 1. Visual identity

**Mood:** warm, unhurried, personal, and handmade.

**Style:** softly lit 3D café objects with a compact, translucent interface. Natural materials give the scene character; restrained controls let the coffee surface remain the main visual attraction.

- Use forest green for interface surfaces, sage for pouring controls, and cream or honey for emphasis.
- Pair literary serif headings with practical system sans-serif controls.
- Round panels and buttons gently. Give pottery fuller curves and believable thickness.
- Use grain, glaze, linen, brushed metal, and foliage for texture.
- Keep decorative detail around the cup. Preserve clear space over the art and landing point.
- Express progress through the changing coffee surface, milk quantity, and contextual messages.

The signature combination is **forest-green UI + warm cream lettering + sage ceramic + honey accents + soft window light**. Room customization can change the ceramic and surroundings while retaining this interface identity.

## 2. Color system

### Interface foundations

| Proposed token | Existing value | Role |
| --- | --- | --- |
| `surface.forest` | `#293E34` | Main control-panel and radio base |
| `surface.dock` | `#253B32F5` | Nearly opaque mobile dock |
| `surface.settings` | `#23392FFA` | Expanded settings panel |
| `surface.inset` | `#1C2E2699` | Radio track display |
| `surface.paper` | `#F5EFE3` | Photo, gallery, and decorating dialogs |
| `surface.input` | `#FFFAF1` | Inputs inside paper dialogs |
| `surface.photo` | `#DED6C5` | Photo-preview backing |
| `surface.empty` | `#E8E5D8` | Empty gallery panel |
| `text.cream` | `#FFF3DF` | Main text on dark panels |
| `text.button` | `#FFF1D4` | Standard dark-panel button text |
| `text.muted` | `#DACDB4` | Status and secondary dark-panel text |
| `text.sage` | `#BFCAB9` | Radio secondary information |
| `text.ink` | `#354439` | Main text on paper dialogs |
| `text.paper-muted` | `#6C7667` | Dialog introduction text |
| `accent.honey` | `#E4C28D` | Selected intentions, expanded dock buttons, slider accent |
| `accent.finish` | `#DAB98A` | Enjoy cup action and radio playback accents |
| `accent.photo` | `#EAD7B5` | Take photo action |
| `accent.star` | `#EDC78C` | Title star and radio drop highlight |
| `accent.focus` | `#F2D29B` | Keyboard focus outline |
| `action.paper-primary` | `#344F40` | Primary action on light dialogs |

Eight-digit hex values include alpha. For example, `#253B32F5` is a forest-green dock at approximately 96% opacity.

### Borders and state overlays

| Treatment | Existing value |
| --- | --- |
| Main panel border | `1px solid #E9D7AC30` |
| Standard dark button fill | `#FFFFFF0C` |
| Standard dark button border | `1px solid #FFFFFF35` |
| Standard dark button hover | `#FFFFFF22` |
| Paper dialog border | `1px solid #E2D6BD` |
| Paper button border | `1px solid #B6BAA9` |
| Paper input border | `1px solid #B8BFAD` |
| Selected room option | `#D4DDCC` fill; `2px solid #526A51` border |

**Usage:** honey signals selection or a prominent action. Forest green anchors the interface. Paper backgrounds identify browsing, customization, and photo tools. Keep pure white out of large surfaces so the palette stays warm.

### World and customization palette

These are material or catalog colors, not guaranteed final screen colors. Lighting, textures, reflections, and tone mapping affect their appearance. Plant and light catalog swatches represent choices rather than literal colors applied to every object.

| Category | Available palette |
| --- | --- |
| Counter | Honey oak `#BB9664`; Dark walnut `#70503D`; Pale stone `#D4CDBB` |
| Wall | Warm cream `#E0D4BD`; Muted sage `#99AA92`; Dusty clay `#C69D88` |
| Cup | Oat glaze `#F3E7D3`; Sage glaze `#91A892`; Midnight glaze `#344951` |
| Pitcher | Brushed steel `#BECBCF`; Polished steel `#E4E8E9`; Cream enamel `#DFD5C1` |
| Pots | Terracotta `#B87859`; Chalk pottery `#DCD0B8`; Sage pottery `#7B917B` |
| Plant selection swatches | Leafy corner `#537354`; Window garden `#74926C`; Trailing shelf `#8EAA73` |
| Personal object swatches | Slow morning `#667866`; Linen & coffee `#D4C4A6`; A little treat `#BB8A4E` |
| Light selection swatches | Soft morning `#DCE7E3`; Golden afternoon `#EED2A0`; Warm evening `#C88B5C` |
| Brass details | `#BA9051` |
| Milk stream | `#F8EDDA` |
| Aim marker | `#FFE0A2`, with transparency |

Default room: honey oak, warm cream walls, oat glaze, brushed steel, leafy plants, terracotta pots, linen objects, and golden afternoon light. Screenshots may show saved room preferences instead.

## 3. Typography

| Role | Family | Existing size / treatment |
| --- | --- | --- |
| Game title | `Georgia, serif` | 28px desktop; 24px phone; weight 400 |
| Title star | `Georgia, serif` | 18px, honey |
| Desktop eyebrow | `system-ui` | 8px; 2px letter spacing |
| Studio dialog heading | `Georgia, serif` | 29px / 1.15; normal weight |
| Decorating heading | `Georgia, serif` | 24px desktop; 22px mobile sheet |
| Radio track title | `Georgia, serif` | 12.5px; single-line ellipsis |
| Main control labels | `system-ui` | Typically 10–12px |
| Pour-pad title | `system-ui` | 13px in mobile layouts |
| Dialog field text | `system-ui` | 13px desktop; 14px mobile; text inputs 16px |
| Dialog supporting copy | `system-ui` | 12px / 1.6 |
| Status and compact metadata | `system-ui` | 9–10px / approximately 1.35–1.4 |
| Section labels | `system-ui` | 9px; 1.5–2px letter spacing |

Use serif type for atmosphere and titles. Use sans-serif for actions, measurements, settings, and explanations. Reserve uppercase and wide tracking for short labels such as “THE AFTERNOON POUR” or “POURING STUDIO.”

**Recommended:** use 12–14px for new interactive labels and at least 11–12px for new supporting copy. The existing compact 9–10px mobile labels should be treated as a density constraint, not the default for new screens. Verify readability on physical phones.

## 4. Spacing, shape, and depth

The current styles use several closely related values. The following families capture their intent without claiming an existing strict spacing grid.

| Family | Values / application |
| --- | --- |
| Tight spacing | 3–6px between compact controls |
| Standard spacing | 7–12px between controls and rows |
| Panel padding | 13px 16px desktop controls; 8px compact mobile dock |
| Dialog padding | 28px desktop; 16–18px phone |
| Large layout gap | 28px between photo and tools on desktop |
| Viewport margins | Typically 12–16px; mobile dock has 8px side margins |
| Small radius | 5–9px for selects and buttons |
| Medium radius | 10–14px for tiles, pads, radio, and panels |
| Large radius | 18px mobile dock; 22px desktop studio dialog |
| Circular shapes | Aim dots, material swatches, cup, and saucer |

### Depth recipes

- Main controls and radio: `0 8px 30px #17251E33`.
- Mobile dock: `0 12px 50px #14281D33`.
- Expanded mobile radio: `0 14px 60px #13231988`.
- Studio dialog: `0 25px 100px #17251E66`.
- Radio and corner buttons: background blur of 10px.
- Photo/gallery backdrop: `#18281FD9`, with 7px blur.
- Desktop decorating backdrop: light tint `#13201722`, without blur, preserving room visibility.

Use faint warm borders to separate dark surfaces. Shadows should soften the panel’s relationship to the scene rather than create a heavy outline.

**Recommended spacing scale for new components:** 4, 8, 12, 16, 24, 32px. Retain current component dimensions where fitting the available viewport requires them.

## 5. Component recipes

### Pouring studio / dock

Desktop uses a bottom-centered forest panel, at most 480px wide, with a milk meter, intention row, adjustments, pour pad, direction controls, actions, and status. The scene stays visible behind it.

Phone layouts start with a compact toolbar and one full-width pour pad. Adjustments, cup actions, corner tools, and radio are disclosed from the toolbar. Secondary tools open above the dock.

- Desktop panel: 14px radius and a faint warm border.
- Compact phone dock: 18px radius, 8px padding, 6px row gap.
- Mobile toolbar: 38px minimum button height; 9px radius.
- Expanded toolbar state: honey fill with forest text.
- Use live flow and height values as compact contextual information.

### Pour pad

The distinctive control is a sage pad with a faint dotted grid and oval guide.

- Background: `linear-gradient(145deg, #94AA90, #69866F)`.
- Grid: subtle `#B3BF9D22` dots on a 14px repeat.
- Foreground: dark green; centered “Hold to pour” and a short steering instruction.
- Compact phone size: full width, 94px height, 12px radius.
- Very short landscape size: 90px height.
- Active state: cream border and a gentle inset glow.
- Dot: small warm-cream marker with a soft halo on mobile.

Preserve the visual distinction between the touch pad and ordinary click buttons. Its surface should feel like an area to move within.

### Buttons and selection

| Variant | Recipe |
| --- | --- |
| Secondary on dark | Transparent white tint, cream text, fine translucent border |
| Selected intention | Honey fill, forest text, honey border |
| Enjoy cup | Warm tan fill `#DAB98A`, brown text `#392D20` |
| Take photo | Pale cream fill `#EAD7B5`, forest text |
| Primary on paper | Forest fill `#344F40`, cream text |
| Secondary on paper | Light translucent fill, ink text, sage-gray border |
| Disabled paper button | 50% opacity, default cursor |

Selected states use `aria-pressed`; disclosure states use `aria-expanded`. Keep these states distinct in behavior even when both use honey emphasis.

### Sliders and milk meter

- Sliders use a warm honey accent on dark panels and green `#496650` in light dialogs.
- Show measurements adjacent to their controls: flow in `ml/s`, height in `mm`, direction in degrees.
- Milk meter: slim 4px desktop track, 3px phone styling; honey fill over a translucent white track.
- The compact mobile dock hides the standalone milk meter and status during normal pouring.

### Café radio

Use a small forest panel with rounded edges, a compact brand row, serif track title, muted metadata, playback controls, and volume. An inset display provides a second depth level.

Playback receives tan accents. The equalizer uses narrow honey bars. On compact mobile layouts, radio remains behind its music toolbar button until opened.

### Photo and gallery studio

Use warm paper surfaces, ink text, serif headings, and generous image space.

- Desktop photo layout: image column plus a 230px tools column; 28px gap.
- Phone photo layout: image above tools; tools use two columns where space permits.
- Gallery: three-column grid of square thumbnails, 12px gaps desktop and 7px phone.
- Thumbnail corners: 10px; captions stay single-line with ellipsis.
- Empty gallery: a quiet inset panel with a brief invitation to take a photo.
- Close button: 44px wide, visually subordinate to the heading.

### Decorating studio

Desktop uses a narrow paper panel on the right, 350px wide, with room presets, material choices, and a sticky action row. Each material option combines a circular swatch with a text label. Selection uses a stronger green border and pale sage fill.

On phones, decorating becomes a bottom sheet approximately 52% of the viewport height. Keep the upper room view visible so choices have immediate visual context.

## 6. Responsive composition

| Viewport condition | Existing composition |
| --- | --- |
| Width ≥650px and height >650px | Bottom-centered full studio; title centered; radio/corner tools upper left; settings upper right |
| Width ≤649px | Left-aligned 24px title; compact settings button upper right; minimal bottom dock; secondary tools disclosed |
| Width ≥650px and height ≤650px | Right-side controls at approximately 304px; more scene space to the left |
| Width ≥650px and height ≤500px | Compact right-side dock at 240px; stacked adjustments; 90px pour pad |
| Width <359px | Reduced spacing and compact labels to preserve fit |

Photo dialogs also have a separate 600px breakpoint for their stacked layout. These thresholds reflect the current cascade; there is not yet one unified breakpoint system.

- Fill the viewport with the café scene using dynamic viewport height.
- Account for safe-area insets at top, bottom, and landscape edges.
- Frame the cup inside the space left by the controls.
- Recompute composition when panels expand; keep the cup’s art readable.
- Keep settings and optional tools out of the primary pouring area.
- Enjoy cup removes pouring equipment and active adjustments, leaving cup actions available.

**Recommended review sizes:** 320×568, 390×844, 736×414, 768×1024, and 1280×800. Check default, expanded adjustments, open radio, decorating, gallery, photo, and finished-cup states.

## 7. 3D art direction

### Composition and camera

The gameplay camera is orthographic and nearly overhead. The cup dominates the center; windows, plants, shelves, café equipment, and personal objects frame its surroundings. Keep camera movement restrained during precision pouring.

Photo framing offers three perspectives: **Art study**, **Cup portrait**, and **Coffee corner**. Photos should preserve the actual cup artwork and chosen room styling. Hide aiming rings, milk stream, contact indicators, and steam in the captured scene; keep interface overlays outside the image.

### Materials

| Material | Existing rendering treatment |
| --- | --- |
| Ceramic glaze | Roughness 0.24; clearcoat 0.65; clearcoat roughness 0.18 |
| Wood counter | Fine grain; roughness 0.48; subtle bump scale 0.006 |
| Stone counter | Fine procedural texture; roughness 0.72; bump scale 0.003 |
| Brushed pitcher | Metalness 1; roughness 0.30 |
| Polished pitcher | Metalness 1; roughness 0.13 |
| Enamel pitcher | Metalness 0.12; roughness 0.28 |
| Brass details | Roughness 0.30; metalness 0.65 |
| Coffee and milk | Physical liquid shading; roughness varies approximately 0.19–0.43 with milk |

Pottery has rounded lips, a substantial handle, and a softly curved saucer. Metal should reflect the broad window light. Texture variation should remain subtle enough to let the coffee pattern carry detail.

The coffee shader blends deep espresso browns into warm milk tones, with restrained microtexture. These are lighting-dependent shader colors; do not substitute flat UI palette swatches for the liquid material.

### Lighting

- Broad warm window light from the upper-left side.
- Soft hemisphere fill and a small warm lamp contribution.
- Muted shadows with softened edges.
- ACES filmic tone mapping; current exposure 1.2.
- Room presets adjust light temperature and intensity while preserving the café mood.

Keep highlights broad and readable on ceramics and metal. Avoid letting bright reflections obscure the milk pattern.

## 8. Motion and feedback

Current interface motion is brief and gentle: radio transitions use approximately 220ms with `cubic-bezier(.2,.8,.2,1)`; radio buttons use 150ms ease. Playing equalizer bars animate over roughly 0.5–0.8 seconds. Liquid motion and faint steam supply ambient movement.

- Let interaction states change immediately enough to make controls clear.
- Use soft color shifts and restrained glow for hover, selection, and pouring.
- Keep panels stable while the player draws.
- Respect reduced-motion preferences: existing radio and corner transitions and equalizer animation are disabled under `prefers-reduced-motion`.

**Recommended:** use the same reduced-motion treatment for future decorative UI animations. Preserve direct functional feedback and essential simulation behavior.

## 9. Icons, copy, and accessibility

The current interface uses small typographic symbols: `✦`, `♫`, `↶`, `↷`, `↑`, `−`, `+`, and an ellipsis-style settings button. Their weight and scale should remain modest. Provide accessible names for symbol-only controls.

Copy should be short, calm, and concrete. Existing examples establish the voice:

- “Fresh cup”
- “Enjoy cup”
- “Take photo”
- “My pours”
- “Hold to pour”
- “Slide to steer the spout”
- “Gentle ↔ generous”

Use familiar café language for actions and precise units for adjustments. Avoid competitive or punitive language in this sandbox.

Current keyboard focus: `2px solid #F2D29B`, offset 3px. Preserve visible focus on buttons, inputs, selects, and settings summaries. Status messages use a status role.

**Recommended accessibility improvements:**

- Aim for 44×44px touch targets for new controls. Existing compact controls sometimes use 28–39px heights; those remain review items.
- Verify text contrast against the composited scene, especially translucent panels and small metadata. No formal contrast audit is claimed here.
- Pair selection color with labels, border treatment, and programmatic state.
- Keep labels and units available when a responsive layout compresses controls.
- Review light-dialog focus contrast separately from dark-panel focus contrast.

## 10. Extension rules

When adding a screen or component:

1. Choose a forest surface for in-scene tools or a paper surface for browsing and editing.
2. Reuse the existing serif-heading / sans-serif-control pairing.
3. Select colors by role from this palette; reserve honey for emphasis and state.
4. Use the matching button, border, corner, and shadow recipe.
5. Start with the compact phone layout, preserving cup visibility and the pour pad.
6. Add explicit focus, selected, expanded, disabled, and active treatments where relevant.
7. Review the component with all three room presets and reduced motion enabled.

Keep decorative motifs understated: a small star, a warm swatch, subtle grain, an oval guide. Avoid adding competing visual centers beside the cup.

## 11. Source of truth and visual references

Implementation references:

- [Base interface styles](../src/style.css)
- [Mobile styles and compact dock overrides](../src/mobile.css)
- [Interface structure and labels](../src/main.ts)
- [Room palette and presets](../src/room-config.ts)
- [Room materials and lighting variants](../src/room-materials.ts)
- [Scene composition, camera, and materials](../src/scene.ts)
- [Liquid appearance](../src/liquid-material.ts)
- [Photo scene and camera presets](../src/photo-scene.ts)

Visual references from 8 October 2026:

- [Desktop café and full controls](desktop-1280x800-2026-10-08.jpg)
- [Phone café and compact dock](mobile-390x844-2026-10-08.jpg)
- [Small phone layout](mobile-320x568-2026-10-08.jpg)
- [Landscape phone layout](mobile-736x414-2026-10-08.jpg)

For current styling, read `style.css` together with the later `mobile.css` overrides. Older screenshots and historical build reports may show earlier control layouts. This document describes styling and extension guidance; it does not certify device usability or accessibility compliance.
