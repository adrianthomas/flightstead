# Server additions to the root agent guide

Specify real build, unit-test, browser/integration-test and deployment commands in the root guide. Run build and unit tests for ordinary server changes; run relevant route/browser tests when public rendering, interactive behavior, routing or asset lifecycle changes.

Keep API errors consistent. Preserve stable public-origin and URL helpers rather than reconstructing URLs in each caller. Invalidate affected caches on mutation. Track ownership and cleanup for assets referenced inside metadata as well as formal foreign keys.

Inspect generated migrations and exercise them against isolated data. Never rewrite shipped migrations. Treat URL fetching and imports as SSRF-sensitive; keep historical imports from triggering unintended external side effects. Preserve production authentication requirements.

Keep semantic links, keyboard focus, adequate hit areas, reduced motion, responsive layouts and dark mode intact across all render paths. Use the browser engine relevant to your users and device checks for platform-specific behavior.

Commit and push by default. Production deployment follows this project's separately configured policy; pushing source alone is not evidence of deployment.
