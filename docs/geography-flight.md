# Slide 11: park-to-region map flight

The left-hand diagram on `#scale` is replaced by a Blender-rendered camera flight. The source is four Yandex hybrid-map browser captures centered on Park Skazka, longitude 37.434686 / latitude 55.771473, at zoom levels 17, 14, 11 and 8 (2026-09-16).

The shot holds above the park, tilts to an oblique perspective, pulls back with temporary defocus, then reveals Moscow, western settlements and other regional directions. The existing right-hand narrative remains authoritative. Colored sectors are illustrative marketing priorities, not administrative borders, travel-time isochrones or measured audience reach. They are not a claim about specific campaign targeting.

## Rebuild

1. Capture the same map center at each zoom, preserving map copyright and logo. Remove only the empty browser sidebar. The texture area is 1116×1024 pixels. Save as `OUTPUT/maps/map-z17.png`, `map-z14.png`, `map-z11.png`, `map-z8.png`.
2. Run Blender 5.2 in an isolated background process:
   `blender --background --factory-startup --python scripts/blender/create-geography.py -- OUTPUT`
3. The script saves a packed `.blend`, camera/scale metadata and 480 PNG frames at 1000×760, 24 fps. Identical hold frames reuse an exact rendered frame.
4. Encode an H.264 MP4 in `yuv420p` with faststart. Use frame 0360 for the JPEG poster. Inspect the contact sheet before replacing the public assets.
5. Rebuild the site and offline presentation. Verify both themes, 16:9 framing, playback, pause, re-entry and reduced motion.

`GeoFlight.astro` starts playback only while the slide is visible and motion is enabled. Leaving the slide stops decoding; re-entry restarts the flight. Motion-off/reduced-motion and playback failure use the final overview poster. The video works without a live maps connection. Credits are retained in the card footer and original captures.

Source URL pattern: `https://yandex.ru/maps/213/moscow/hybrid/?ll=37.434686%2C55.771473&z=17` (replace `z` for each scale). The capture center is held fixed in map coordinates. The Blender script maps all scales to the same surface with local Mercator scaling; no screenshot is stretched to match a different area.
