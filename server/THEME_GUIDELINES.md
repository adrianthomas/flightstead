# Theme and web design guidelines

Required reading for agents changing Flightstead's public themes, layouts,
typography, navigation, media presentation, or interactions. Use these with
`AGENTS.md` and `ARCHITECTURE.md`; they guide design decisions without expanding
the user's requested scope.

## Design intent

Flightstead is a personal publishing site for people with a high bar for taste
and refinement, especially macOS and iOS enthusiasts. Make reading, browsing,
and returning to a person's writing and collections enjoyable. The author's
content and identity should lead the experience.

The Cabinet brief asked for originality, character, thoughtful typography,
content-specific presentation, polished interactions, and repeated refinement.
Apply those qualities to every theme. Cabinet's paper palette, chronological
rail, inventory numbers, and object metaphors belong to Cabinet; they are not
requirements for other themes. References should inform craft and judgment,
rather than lead to copying another site's appearance.

## Principles for every theme

- **Choose a coherent idea.** Describe the theme's visual voice and browsing
  experience in a sentence before implementing. Use a deliberate system of
  type, spacing, alignment, color, borders, and motion. For an existing theme,
  understand its idea and improve within it.
- **Build hierarchy around content.** Make the site identity, primary
  navigation, content title, body, and supporting metadata easy to distinguish.
  Spend space on reading and useful imagery. Keep decorative chrome restrained.
- **Respect content types.** Photos, portrait book covers, square music art,
  essays, quotes, and saved links have different needs. Give them appropriate
  proportions and hierarchy while keeping navigation and interaction meanings
  consistent. Missing artwork must still produce a complete composition.
- **Make character purposeful.** A distinctive detail should improve identity,
  orientation, comprehension, or pleasure. Use asymmetry deliberately, with a
  clear reading order. Avoid random decoration, repetitive oversized heroes,
  and metaphors that conceal ordinary controls.
- **Treat details as part of the system.** Align captions, dates, labels,
  punctuation, icons, and edges. Reuse spacing and color tokens. Every visible
  state should feel intentional, including empty results and loading failures.
- **Refine against rendered content.** Review the actual site, identify the
  weakest part, improve it, and review again. A typecheck or one attractive
  screenshot does not establish design quality.

## Typography, layout, and media

Use a small, purposeful type scale and a restrained set of font families and
weights. Display faces can express identity; sustained reading needs legible
letterforms. Start long-form text around 60–70 characters per line with generous
line height, then tune by rendering the chosen font. These are starting points,
not fixed measurements for every content type. Use relative units and preserve
browser text enlargement. Keep metadata readable in both color schemes.

Use spacing to group related information and separate distinct actions. Reduce
unnecessary padding and oversized headings before shrinking reading text or
controls to solve crowding. Long titles, URLs, translated labels, and captions
must wrap without colliding with artwork, arrows, or buttons. Avoid truncating
information necessary to understand or choose a post.

Design narrow layouts explicitly. Choose breakpoints where content stops
working, and inspect intermediate widths as well as phones and desktops. Fold
secondary navigation into a clearly labeled, accessible control when needed;
show the active filter and keep clearing it easy. Preserve chronological and
semantic order. Sticky headers must earn their screen space and leave content
and focused controls visible. Consider landscape, safe areas, and Safari's
changing viewport height.

Preserve image proportions. A thumbnail crop can be deliberate, but a detail
view must allow the meaningful image to be seen without stretching it. Keep
captions distinct from alt text and respect hidden-cover/artwork/preview
settings across every rendering path.

## Navigation and interaction

Use anchors for destinations and buttons for actions; never nest interactive
elements inside a clickable card link. Keep authored inline links usable.
Support opening links in another tab and ordinary browser navigation. Labels
and visual affordances should explain what opens a detail view and what leaves
the site. Essential controls must work without hover or a drag gesture.

Public content must remain available through its server-rendered URL when
JavaScript is disabled or enhancement fails. For fetched detail panels, keep
direct-load content equivalent and preserve Back/Forward, reload, deep links,
focus restoration, and the reader's exact scroll position on return. Include
clear close controls and handle interrupted transitions, repeated input,
failed fetches, and slow images without stranding the reader.

Motion should explain where something came from and where it goes. Preserve
shared-media geometry; crossfade incompatible shapes or reflowed text instead
of distorting images or scaling glyphs. Keep feedback prompt and avoid delays
before a reader can act. Prefer transform/opacity animation, respect reduced
motion, and avoid unnecessary page-load choreography or perpetual decoration.
Preserve the existing WebKit preparation-frame and backdrop contracts described
in `ARCHITECTURE.md`.

## Accessibility baseline

Target WCAG 2.2 AA for changed surfaces. Use semantic landmarks, logical
headings, accessible names, meaningful alt text, and empty alt text for purely
decorative images. Keep DOM and focus order aligned with reading order.

Verify keyboard operation, a visible unobscured focus indicator, and sufficient
contrast: 4.5:1 for ordinary text, 3:1 for qualifying large text and essential
control boundaries. Color alone must not carry meaning. Honor the project's
44 CSS pixel control-target baseline; enlarging the hit area need not enlarge
the visible icon. Check light, dark, and forced-colors modes.

Support 200% text enlargement and reflow at 320 CSS pixels without losing
content or controls; genuinely two-dimensional content may need its own
scrolling region. Dialogs need appropriate semantics, focus containment,
Escape dismissal, an inert background, and restored focus on close. Check
reduced motion and text-spacing overrides. Automated checks supplement manual
keyboard and assistive-technology review.

## Performance and project boundaries

Keep the server-rendered, progressively enhanced architecture. Public rendering
must not add third-party runtime dependencies, remote fonts, tracking, or
visitor-time media requests to external providers. Serve bundled assets locally
and preserve shared-cacheable HTML. Put UI copy through `render/i18n.ts`.

Reserve image space with intrinsic dimensions or a suitable aspect ratio, use
appropriate responsive variants, and lazy-load below-the-fold imagery. Do not
lazy-load the likely largest above-the-fold image. Keep font payloads small,
provide fallbacks, and avoid layout shifts during loading or interaction.
Measure when changing costly effects, fonts, media, or scripts; do not claim
performance from appearance alone. Where representative field data exists,
aim for Core Web Vitals at the 75th percentile: LCP ≤2.5s, INP ≤200ms,
CLS ≤0.1. Local measurements are diagnostic, not equivalent to field results;
do not add visitor tracking to obtain them.

Use the canonical origin and `PATH_PREFIX` helpers. Preserve page metadata,
asset visibility and ownership policies, and cache invalidation. Scope CSS and
script behavior to the intended theme, and consider classic-style,
cards-derived, and Cabinet rendering paths when touching shared components.
A new theme needs coordinated server catalog and iOS picker work as described
in the repository guides. Design advice does not authorize unrelated API work.

## Review and completion

1. Read the affected implementation and tests. State the design problem and
   intended improvement, with a few concrete acceptance criteria.
2. Render representative mixed content: short and long titles, rich body text,
   portrait/landscape photos, books, music, quotes, links, missing media, sparse
   metadata, empty pages, and translated or unusually long labels.
3. Inspect the changed feed and detail surfaces at 320, 390, 560, 768, and
   1280px, plus any width where the composition changes. Review light/dark,
   keyboard focus, enlarged text, reduced motion, and loading/failure states.
4. Exercise opening, closing, filtering, pagination, direct navigation,
   Back/Forward, and scroll restoration where affected. Inspect animations in
   motion; endpoint screenshots cannot reveal flicker or distortion.
5. Complete at least one rendered critique-and-refinement pass for substantive
   design changes, repeating until the acceptance criteria are met. Verify
   affected sibling themes when shared selectors or templates change.
6. Run the repository's required checks: unit tests and build for ordinary
   server changes, plus Playwright for public rendering or interaction changes.
   Use the existing isolated WebKit setup. Check real iOS Safari when browser
   chrome, touch gestures, or compositor behavior is involved and a device is
   available; report any remaining manual verification clearly.
7. Update architecture docs when theme behavior or pipelines change. Report
   what improved, the checks performed, and any remaining limitations. Never
   present unperformed visual or accessibility checks as passed.

For documentation-only changes, review links and the diff; application tests
are unnecessary unless application behavior also changed.

## References

- [W3C WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/)
  for accessibility criteria and techniques.
- [Web Vitals](https://web.dev/articles/vitals) for performance metrics and
  field measurement thresholds.
- [MDN multimedia performance](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance/Multimedia)
  for image sizing, loading, and layout stability.
