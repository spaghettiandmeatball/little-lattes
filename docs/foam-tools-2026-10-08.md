# Foam tools and surface materials

Cup → Adjust → Surface tool offers Milk pour, Foam pick and Foam spoon. With a foam tool selected, drag directly on the coffee. The fine pick transports a narrow corridor of existing surface pigment; the spoon transports a broader patch. Undo stroke restores the last complete surface field. Switching back to Milk pour clears undo, avoiding restoration over a later pour. Recipe changes also clear undo. Corner camera and decoration gestures remain separate.

Tools are visible during pointer interaction and parked alongside the jug and espresso tools. Captures hide the interaction tool but retain the edited foam. The tool does not add milk or alter volume accounting. This is a bounded optical surface transport model, not a physical submerged-tool simulation. Etching ends an active pour recording; tool strokes are not replay packets. The original legacy surface mode does not support these tools.

The liquid shader adds stable crema variation, sparse bubbles with rims, small surface-normal relief, and differing coffee/foam roughness. Oak, plaster, ceramic and steel use deterministic bump/roughness detail. Room finish choices still supply colors. No external texture downloads or new dependencies are required.

Checks: all 68 automated tests passed, including blank-coffee behavior, bounded/local pick deformation, wider spoon influence and invalid/stationary gestures. Type checking, production build and whitespace checks passed. Browser verification demonstrated pick and spoon deformation, exact stroke undo, portrait and landscape layouts, and a saved photo retaining the two etched tendrils. No browser errors were reported. Real touchscreen hardware remains unverified.

Evidence: [phone foam tools](foam-tools-phone-2026-10-08.jpg).
