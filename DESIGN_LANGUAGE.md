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
3. **One clear subject.** At icon size, the yellow aircraft is the mark. Do not
   add a hangar, webpage, clouds, or other secondary symbols.
4. **Grounded and credible.** When parked, both main wheels and the tailwheel
   must visibly meet one ground plane with tight contact shadows. Never let the
   aircraft appear to float accidentally.
5. **Warm restraint.** Texture may add tactility, but shapes and contrast must
   remain clear. Avoid glossy 3D, neon, baby blue, or busy scenic detail.

## Color palette

Colors are specified in sRGB. Product UI may use semantic system colors where
they improve accessibility, but branded surfaces and illustrations should begin
with these values.

| Token | Hex | Role |
|---|---:|---|
| Smoky navy | `#163247` | Primary aircraft-image field; dark branded surfaces |
| Trainer yellow | `#F5C252` | Aircraft, primary action, short emphasis rule |
| Warm apron | `#9A8F7A` | Ground plane and neutral illustration support |
| Ink | `#203D4B` | Primary light-mode brand text and dark aircraft detail |
| Paper | `#F7F8F5` | Main light canvas |
| Surface | `#FFFFFF` | Raised light surfaces and cards |
| Petrol | `#28586D` | Links, controls, and secondary branded emphasis |
| Pale field | `#E2EFF3` | Quiet UI selection fields only; not a hero/icon background |
| Signal red | `#AE493B` | Windsock and sparing status/detail accents |
| Linen | `#F7FAF5` | Warm light detail and windsock stripe |

### Color use

- Smoky navy and trainer yellow form the primary identity pair.
- Warm apron grounds aircraft artwork; it should occupy less visual weight than
  the navy field.
- Petrol is the interaction accent. Do not substitute a bright cyan or royal
  blue.
- Pale field is acceptable for small UI fills, but must not dominate marketing
  or icon artwork; large baby-blue fields make the identity feel juvenile.
- Signal red is an accent, never a competing primary color.
- Check text and control combinations against WCAG AA. Illustration colors do
  not replace semantic system colors for errors, warnings, or disabled states.

## Aircraft artwork

The canonical aircraft is a sunny-yellow, high-wing civilian taildragger shown
from a front three-quarter viewpoint. It has deep-navy windows, one navy fuselage
stripe, dark wheels, and a restrained golden-age aviation-poster finish.

### App icon and compact emblem

- Use the aircraft alone on smoky navy over a warm-apron ground band.
- Keep the complete silhouette inside the iOS safe area.
- Preserve a clear read at 48–60 px: wing, fuselage, propeller hub, two main
  wheels, and tail.
- Remove scenery, buildings, text, browser metaphors, clouds, and decorative
  props.
- Use tight shadows at the tire contact points; avoid a detached diffuse shadow.
- Do not bake rounded corners into source artwork. Platform masks own the final
  icon shape.

### Wide hero

- Use the same aircraft, viewpoint, colors, and grounded stance in a 3:2 crop.
- Extend the smoky navy and warm apron rather than adding scenery.
- Leave calm negative space around the subject for responsive cropping.
- Do not reintroduce a hangar simply to communicate “website”; product copy and
  surrounding layout carry that meaning.

### Dark and tinted variants

- The standard smoky-navy artwork is already suitable for dark appearance.
- Tinted artwork is grayscale: charcoal field, silver-white aircraft,
  medium-grey apron, near-black details.
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
- Is smoky navy—not baby blue—the dominant image field?
- Does the artwork remain readable at its smallest real size?
- Are UI controls still native, accessible, and semantically colored?
- Are icon, dark, tinted, in-app, and website assets derived from retained
  source artwork rather than independently restyled copies?
