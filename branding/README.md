# Flightstead brand assets

These are the canonical web-ready exports for the pool-blue aircraft identity
defined in [`DESIGN_LANGUAGE.md`](../DESIGN_LANGUAGE.md).

- `flightstead-icon.png` — opaque 1024 × 1024 icon for website header, favicon,
  app callout, and other compact emblem uses.
- `airfield.webp` — opaque 1536 × 1024 detailed airfield hero: the yellow
  taildragger parked on grass/apron in front of the open green hangar.

The retained full-resolution iOS sources and their default, dark, and tinted
exports live in the companion iOS repository under `ios/Branding/Source/` and
`ios/Shareblog/Assets.xcassets/`.

The website maps these files to `assets/flightstead-icon.png` and
`assets/airfield.webp`. Keep the existing filenames when publishing so every
header, hero, callout, and footer usage updates together.

## Sharing graphic

- `flightstead-social-de.png` — German 1536 × 1024 marketing graphic for blog
  posts, email, and social sharing, with the app, published site, and
  `flightstead.com` URL. Generated using the built-in image tool from the
  canonical icon and existing product screenshots; its prompt is retained in
  `flightstead-social-de.prompt.txt`.
- `flightstead-social-en.png` — matching English 1536 × 1024 sharing graphic,
  localized with the built-in image tool from the German version. Its prompt
  is retained in `flightstead-social-en.prompt.txt`.
- `flightstead-social-de-uberspace.png` — German 1536 × 1024 sharing graphic
  with an explicit Uberspace mention and straighter sans-serif typography.
  Edited with the built-in image tool; its prompt is retained in
  `flightstead-social-de-uberspace.prompt.txt`.
