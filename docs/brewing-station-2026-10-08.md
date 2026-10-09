# Brewing and milk station

Corner → Brew & steam opens Espresso, Pour-over and Milk steam. The espresso machine and pour-over station also respond to a direct click or tap. Opening a station frames that equipment; normal Corner gestures still allow camera movement.

Espresso has a 2.8-second grind followed by a 9-second extraction into two counter cups. Pour-over has a 12-second bloom/pour ritual, raised kettle, water stream and filling carafe. Stop & serve can end either extraction early. Completion prepares a fresh active coffee, with extraction strength affecting its appearance. This replaces current active art, as stated in the panel, while keeping finished cups and remaining milk. These are animated game preparations using the existing calibrated cup recipe, rather than detailed extraction or filter-fluid simulations.

Milk steam runs until the player stops, with a 16-second automatic endpoint. Early stops produce thin milk, 5–9 seconds produces silky microfoam, and later stops produce thick/coarse foam. Completing steaming refills the jug and carries the chosen quality into future pours. Quality changes the optical film's foam deposition and shader surface detail; liquid-volume accounting remains unchanged. Pour recordings store and validate this preparation value, defaulting older recordings to the original quality. Temperature is an accelerated game gauge.

Purge is a separate 2.5-second burst. Steam uses 84 animated textured cloud sprites, a purge jet, soft residual fade, a wand, lifted jug and swirling milk bubbles. All six supplied MP3s are copied into public/sfx and connected to grinding, machine extraction, background preparation, steaming or frothing. Machine sounds are independent of radio and begin only with an action. Closing, switching views, changing stations, hiding the page or losing focus stops operation and sound.

Validation: the full 71-test suite passed before the final recording-metadata addition. The new metadata regression and affected recording/model tests also passed (12 targeted tests). Final type checking and production build passed. Browser checks completed espresso and pour-over, stopped milk at 5.5 seconds with Silky microfoam feedback, showed purge clouds, and opened the station by touching the machine. Phone and desktop layouts were inspected and no browser errors were logged. Physical audio output and real touchscreen hardware were not independently assessed.

Evidence: [steaming](barista-steam-phone-2026-10-08.jpg), [purge](barista-purge-phone-2026-10-08.jpg), [pour-over](barista-pour-over-2026-10-08.jpg).
