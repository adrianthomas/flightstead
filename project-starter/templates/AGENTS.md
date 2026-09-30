# Project agent guide

## Orientation

- Product: <PRODUCT_NAME>. Implementation: <SOURCE_DIRECTORY>.
- Read this guide and `ARCHITECTURE.md` before changing code.
- Check `git status --short`, then inspect relevant implementation and tests. Preserve unrelated and unfinished work, including work from concurrent sessions.
- Read focused product/operator docs when relevant. Implementation is the source of truth; roadmap ideas are not approved requirements.
- Validation commands: <BUILD_COMMAND>, <UNIT_TEST_COMMAND>, <INTEGRATION_TEST_COMMAND>.
- Remote: <GIT_REMOTE>. Release branch: <RELEASE_BRANCH>.

## Execution and orchestration

Complete the user's authorized task through implementation, relevant validation, documentation, commit and push. Do not stop at a plan or ask again for routine actions already authorized. Ask when a required product decision is missing, an action exceeds scope, or an irreversible action lacks authorization.

Use subagents for substantial tasks with independent investigation or implementation areas. Give each a bounded objective, explicit file ownership, constraints and expected checks. Keep shared-file edits, integration, Git operations and releases under one lead. Use a single agent for small changes. Follow `ORCHESTRATION.md` if installed; repository configuration enables roles but does not replace explicit task assignments.

Develop, build, test and release locally. Do not add hosted build/deployment services without explicit instruction.

## Validation and contracts

Run focused checks while iterating, then the required build and tests. Test changed behavior rather than mirroring implementation. Use isolated test data; never point automated tests at production data. Verify visual and device behavior manually where automated checks cannot establish it. Report checks that could not run.

Preserve installed-client compatibility. Prefer additive API fields and server-owned capability lists. Gate new closed-enum values before returning them to old clients. Coordinate companion repositories when authentication, metadata, feature negotiation or API contracts change.

Keep secrets, signing keys, tokens, local environment files and machine-specific paths out of tracked files and output. Inspect the staged diff before committing.

## Git and completion

Commit completed work in small logical commits and push to the configured remote by default, unless the user explicitly opts out. Stage only intended files or hunks; do not sweep unrelated edits into commits. Never reset, force-push, discard others' work, or change branches under active sessions to make the checkout clean.

Check branch and upstream before pushing. Push the working branch; do not merge into the release branch merely to trigger a release. Stop and report authentication, protected-branch or remote conflicts rather than bypassing them. If unrelated changes overlap intended hunks, isolate the task or request the necessary decision.

Update architecture and operator documentation alongside changes to behavior, commands, prerequisites, routes, storage or release workflows. Keep speculative ideas separate.

Finish with changed behavior, validation results, commit/push status, release status where applicable, and any concrete blocker. Never describe an upload as processed or available without checking that state.
