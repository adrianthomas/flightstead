# Reusable iOS practices and release setup

These are lessons extracted from this app's architecture, not a claim that every new project needs the same architecture.

## Development

Prefer native SwiftUI navigation, forms, controls and semantic colors. Preserve Dynamic Type, VoiceOver labels, dark mode, keyboard safe areas and Reduce Motion. Use explicit loading, success, empty and recoverable failure states. Keep destructive actions behind clear confirmation dialogs.

Give navigation and compose sessions clear state ownership. Share compose UI between the app and extension rather than duplicating it. Return explicit outcomes for cancellation, local queueing and successful creation. Preserve feed pagination and scroll position across navigation. Treat task cancellation as lifecycle behavior, not a user-facing network error. Keep UI state changes on the appropriate actor and avoid blocking UI work.

Store credentials in Keychain; use App Groups for deliberately shared app/extension state. Keep entitlements and signing aligned across targets. A connectivity failure should not erase a valid session; explicit unauthorized responses should drive invalidation. Make offline persistence and retry outcomes clear, with durable media ownership and cleanup. Prevent duplicate submits and define retry behavior.

Keep server-owned identifiers extensible and round-trip unknown values where possible. Closed enums for locally implemented behavior require capability negotiation before the server sends new cases. Keep Markdown or other wire formats stable across OS-specific editor implementations. Release builds should retain transport security; local Debug exceptions must not leak into distribution builds.

Verify keyboard, large text, reduced motion, offline/retry, error states and app/extension entry points as applicable. Simulator builds cannot prove real-device share-source behavior. Never commit temporary preview entry points or test credentials.

## Configure the copied release templates

Use macOS with Xcode and the project's required SDK, Git, XcodeGen if applicable, and Fastlane. Pin the project's Fastlane dependencies with a Gemfile/lockfile. The scripts use `bundle exec fastlane` when a Gemfile exists. Install dependencies before release. Configure signing and an existing App Store Connect app.

Set these in your local shell or secret management, never tracked credentials:

- `IOS_PROJECT`: repository-relative `.xcodeproj` path.
- `IOS_SCHEME`: shared scheme; `IOS_TARGET`: app target for version lookup.
- `IOS_PROJECT_SPEC`: repository-relative XcodeGen spec, only if using XcodeGen.
- `IOS_APP_IDENTIFIER`, `APPLE_TEAM_ID`: this app's identity and signing team.
- `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_PATH`: App Store Connect API credentials and absolute path to the private key.
- `RELEASE_BRANCH` and `RELEASE_REMOTE`: default `main` and `origin`.

Add the root build command, for example `xcodebuild -project "$IOS_PROJECT" -scheme "$IOS_SCHEME" -destination 'generic/platform=iOS Simulator' build`. Regenerate first if needed. If your project uses a workspace or a different generator, adapt both build and Fastlane inputs. The supplied lane assumes an Xcode project.

Run `chmod +x scripts/appstore/*.sh` after copying. Commit intended changes, then run `scripts/appstore/push_testflight.sh`. The wrapper captures one revision, pushes it and passes that same revision into a clean temporary source export. Dirty unrelated files are excluded. Submodules, Git LFS assets and ignored build inputs need project-specific materialization; plain `git archive` does not include them.

The lane checks App Store Connect access, selects the next build number for the marketing version, archives, and uploads. Serialize releases to avoid build-number races. Upload acceptance does not prove processing, tester availability or successful installation. Check those separately and report them accurately. An upload failure after a successful push means source is pushed but the release is incomplete.

Archive/build output is temporary in this template. Configure persistent artifact storage if you need to retain IPA, archive, symbols or logs. Do not copy product-specific listing, purchase configuration or tool-version monkey patches into new projects.
