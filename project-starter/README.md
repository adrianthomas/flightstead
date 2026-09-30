# Reusable project workflow starter

Copy `templates/` into a new repository, including its hidden `.codex` directory. Merge guidance with any existing files rather than overwriting them. Read and customize the templates before asking an agent to work.

This kit extracts the local build/release workflow and agent roles from the server and companion iOS repositories. It adds a portable orchestration playbook and generalizes the iOS lessons documented there. It intentionally excludes product behavior, branding, hosting assumptions, credentials, account identifiers, and historical tool workarounds.

## Setup

1. Copy `templates/AGENTS.md` to the new repository root and replace every `<...>` placeholder.
2. For iOS projects, append `templates/AGENTS.ios.md` to the root guide. Configure project/scheme, release branch, signing, and App Store Connect access as described in `IOS.md`.
3. For server projects, append `templates/AGENTS.server.md` and specify the actual validation and deployment commands.
4. Copy `.codex/` if you want the same lead/explorer/worker setup. These model choices are preferences copied from this project, not universal requirements; adapt them to the models and config supported by your installed agent.
5. Create `ARCHITECTURE.md` using the supplied outline. Record actual behavior and known absences, not planned features.
6. Commit the configured kit. Keep this README and the playbooks wherever you maintain project guidance.

The templates establish your preferred default: complete authorized work, validate, commit and push; for iOS changes on the release branch, also upload TestFlight unless you explicitly opt out. A new repository still needs its own remote, signing, credentials and release setup. Copying these files does not perform a release.

## Contents

- `templates/AGENTS.md`: reusable task, Git, validation and handoff rules.
- `templates/AGENTS.ios.md` and `AGENTS.server.md`: platform additions.
- `ORCHESTRATION.md`: delegation, ownership, review and completion rules.
- `IOS.md`: native UI, lifecycle, authentication, extensions and release setup.
- `templates/scripts/appstore/`: push and clean-revision upload scripts.
- `templates/fastlane/Fastfile`: preflight and TestFlight lane only.
- `templates/.codex/`: generalized project agent configuration.
- `templates/ARCHITECTURE.md`: orientation outline.

Source references: this repository's `AGENTS.md`, `server/ARCHITECTURE.md` and `.codex/`; companion iOS `AGENTS.md`, `ios/ARCHITECTURE.md`, release scripts and Fastlane beta lane. The orchestration playbook synthesizes the existing role instructions; it is not a transcript of previous chats.
