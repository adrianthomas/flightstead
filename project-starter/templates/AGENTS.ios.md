# iOS additions to the root agent guide

Configure the build commands and environment in `IOS.md` for this project.

For every app-code change, regenerate the project if using XcodeGen, run a successful Xcode build, and verify the affected flow in Simulator. Use a real device for behavior unavailable there. Run existing relevant tests; do not assume a test suite exists. Build all affected app and extension targets.

When using XcodeGen, `project.yml` is the source of truth. Make source/configuration changes there and regenerate; do not rely on edits to the generated project. Keep shared models/networking and shared UI in explicit reusable modules. Preserve wire formats across OS-specific implementations.

For agent-authored commits on the configured release branch, finish by running `scripts/appstore/push_testflight.sh`. This pushes and uploads that exact revision from a clean source export. Skip upload only when the user explicitly opts out or prerequisites fail; report the reason. Branch work still gets built, committed and pushed; do not automatically merge it to release.

Use command-line App Store Connect tooling. TestFlight upload is the default release action; App Store submission, external tester distribution and metadata publication need their own authorization.
