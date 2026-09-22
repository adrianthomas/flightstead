# Flightstead design language

Flightstead should feel like a modern personal publishing tool seen through the
visual language of a small civil aerodrome: practical, optimistic, independent,
and quietly characterful. Aviation is atmosphere and identity, not decoration.
The app and website should feel like the same product even when they use
different layouts or native platform controls.

## Core principles

1. **Publishing first.** Interfaces stay calm, legible, and native. Brand
   details support the task rather than competing with it.
2. **Civil aviation, not novelty aviation.** Prefer grounded trainer aircraft,
   logbook labels, painted metal, windsocks, and airfield colors. Avoid airline
   clichés, military markings, cartoons, badges, stamps, or faux nostalgia.
3. **One clear subject at compact sizes.** At icon size, the yellow aircraft is
   the mark. Do not add a hangar, webpage, clouds, or other secondary symbols.
   Wide editorial artwork may establish the airfield with grass, an open
   Quonset hangar, and a windsock.
4. **Grounded and credible.** When parked, both main wheels and the tailwheel
   must visibly meet one ground plane with tight contact shadows. Never let the
   aircraft appear to float accidentally.
5. **Warm restraint.** Texture may add tactility, but shapes and contrast must
   remain clear. Avoid glossy 3D, neon, childish pastel blue, or busy scenic
   detail. Pool blue is a deliberate brand color, not a generic sky gradient.

## Color palette

Colors are specified in sRGB. Product UI may use semantic system colors where
they improve accessibility, but branded surfaces and illustrations should begin
with these values.

| Token | Hex | Role |
|---|---:|---|
| Pool blue | `#3FA6C4` | App icon field and bold branded fills |
| Smoky navy | `#163247` | Dark branded surfaces and aircraft-window detail |
| Trainer yellow | `#F5C252` | Aircraft, primary action, short emphasis rule |
| Warm apron | `#9A8F7A` | Ground plane and neutral illustration support |
| Ink | `#203D4B` | Primary light-mode brand text and dark aircraft detail |
| Paper | `#F7F8F5` | Main light canvas |
| Surface | `#FFFFFF` | Raised light surfaces and cards |
| Petrol | `#28586D` | Links, controls, and secondary branded emphasis |
| Coastal tint | `#D9EEF5` | Quiet UI fields and large soft background transitions |
| Signal red | `#AE493B` | Windsock and sparing status/detail accents |
| Linen | `#F7FAF5` | Warm light detail and windsock stripe |

### Color use

- Pool blue and trainer yellow form the primary identity pair.
- Smoky navy provides mature contrast in windows, type, and dark surfaces.
- Warm apron and grass ground wide airfield artwork without becoming primary
  brand colors.
- Petrol is the interaction accent. Do not substitute a bright cyan or royal
  blue.
- Coastal tint is acceptable for quiet UI fills and marketing gradients. Use
  exact pool blue for compact brand fields; do not drift toward pastel baby
  blue.
- Signal red is an accent, never a competing primary color.
- Check text and control combinations against WCAG AA. Illustration colors do
  not replace semantic system colors for errors, warnings, or disabled states.

## Aircraft artwork

The canonical aircraft is a sunny-yellow, high-wing civilian taildragger shown
from a front three-quarter viewpoint. It has deep-navy windows, dark wheels,
and a restrained modern interpretation of golden-age aviation-poster artwork.

### App icon and compact emblem

- Use the aircraft alone on an uninterrupted pool-blue `#3FA6C4` field.
- Keep the complete silhouette inside the iOS safe area.
- Preserve a clear read at 48–60 px: wing, fuselage, propeller hub, two main
  wheels, and the small grounded tailwheel.
- Park the stopped two-blade propeller horizontally, parallel to the main wing,
  so it does not merge with the landing gear at Home Screen size.
- Remove scenery, buildings, text, browser metaphors, clouds, and decorative
  props.
- Use tight shadows at the tire contact points; avoid a detached diffuse shadow.
- Do not bake rounded corners into source artwork. Platform masks own the final
  icon shape.

### Wide hero

- Use the more detailed yellow aircraft in a credible three-point parked stance
  in front of an open green Quonset hangar.
- Grass, a pale apron, a simple windsock, and clear coastal sky establish a small
  civil aerodrome. Keep the scene calm and uncluttered.
- Leave useful negative space and keep the aircraft/hangar readable in wide,
  rounded responsive crops.
- This scenic treatment belongs on the website hero and spacious welcome, Help,
  and empty-state moments. Never shrink it into a compact emblem.

### Dark and tinted variants

- The standard pool-blue artwork is already suitable for dark appearance.
- Tinted artwork is a mechanical grayscale conversion of the same composition.
- Variants may change color only. Silhouette, scale, stance, and crop stay fixed.

## Typography and graphic details

- Use rounded system typography for friendly product headings and native body
  typography for long reading.
- Use compact monospaced uppercase labels with generous tracking for occasional
  logbook-like section markers.
- Prefer a short trainer-yellow rule, restrained borders, and broad painted
  shapes over badges or ornamental frames.
- A windsock is the one recurring secondary aviation motif. Use it sparingly,
  and animate it only to communicate real activity while respecting Reduce
  Motion.

## Product consistency checklist

Before shipping a branded surface:

- Does the plane match the canonical yellow taildragger and viewpoint?
- If parked, are all wheels visibly grounded?
- Does the compact mark use exact pool blue rather than a pastel approximation?
- Is scenic hangar artwork reserved for surfaces large enough to read it?
- Does the artwork remain readable at its smallest real size?
- Are UI controls still native, accessible, and semantically colored?
- Are icon, dark, tinted, in-app, and website assets derived from retained
  source artwork rather than independently restyled copies?
