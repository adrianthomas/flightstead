# Quick Post theme plan

Quick Posts remain `article` objects with additive `metadata.quickPost: true`.
They use the existing `/articles/:slug` permalink. A retained article headline,
excerpt, and cover stay private while Quick Post mode is enabled; public feeds,
page metadata, RSS, and ActivityPub use the body instead.

The public feed counts visible text (Markdown formatting and link destinations
excluded) in Unicode grapheme clusters. At 500 characters or fewer, it shows
the complete rich body without a “Read more” action. Above 500, it shows a
format-preserving preview ending at a nearby word boundary and links to the
full detail page. Detail pages always show the full body. Inline links remain
independent anchors, and the date/permalink remains available for short posts.

| Theme | Feed treatment | Detail treatment |
|---|---|---|
| Classic | Existing reading card, full or threshold preview | Full body and date permalink |
| Washi | Paper card, full or threshold preview | Full body and date permalink |
| Cards | Compact text card; body links are not wrapped by a card link | Full body in the existing detail flow |
| Prism | Compact text card using Prism's existing color/type tokens | Full body in the existing detail flow |
| Ledger | Compact text card using Ledger's restrained feed styling | Full body in the existing detail flow |
| Cabinet | Thought-like body-first artifact, with the same threshold rule | Full body in Cabinet's detail layout |
| Stream | Body-first inline entry; long posts receive the 500-character preview | Full body in the ordinary permalink page |
| Marquee | Body-first list item; image and headline are omitted | Full body in the existing Marquee detail view |
| Think | Body-first editorial card, without article heading or cover | Full body in the existing detail view |
| Aqua | Body-first article card, without heading or cover | Full body in the existing detail view |

## Review matrix

The focused WebKit test covers all ten themes, a short post and a long post,
retained headline/cover suppression, live inline links, and full detail text.
Review responsive reflow at 320, 390, 560, 768, and 1280 CSS pixels in light
and dark color schemes. Check document width for overflow and capture
representative Classic, Cards, and Cabinet feed/detail renders for visual
review. The automated matrix is the repeatable regression check; it does not
replace manual VoiceOver, keyboard, forced-colors, or real iOS Safari review.

Implementation status: the focused WebKit matrix passes for all ten themes,
including both threshold states and five widths in light/dark mode. A 390px
Cards feed screenshot was inspected: the preview ends cleanly, the date and
action remain aligned, inline links stay readable, and the short post has no
headline or cover. The suite also verifies no horizontal overflow at the
review widths. Manual VoiceOver, forced-colors, and device Safari checks remain
outside this automated pass. The focused Quick Post tests and the existing
Cards/Prism masonry test pass together. A full-suite run under cumulative test
load timed out in that masonry test and hit the API rate limit while cleaning
up a later photo/quote test; the focused masonry run passed immediately after.
No production rate limit was changed for the test run.
