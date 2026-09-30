# Agent orchestration playbook

The lead owns scope, integration, validation, Git and releases. Use independent agents when parallel work reduces uncertainty or avoids a long serial investigation; keep small tasks with one agent.

1. Orient first: inspect status, architecture, relevant code and tests; identify shared contracts and files.
2. Delegate read-only exploration when useful. Ask for observed behavior, exact file references, existing tests, unknowns and a bounded recommendation.
3. Assign workers disjoint files or components. State objective, allowed files, compatibility constraints, required checks and completion criteria. Workers must ask the lead before editing outside ownership.
4. Keep shared models, configuration, migrations and cross-repository interfaces under explicit ownership. Sequence dependent work. Agents share a filesystem; a worktree isolates changes but still requires integration.
5. Require reports covering changed files, behavior, commands/results and blockers. Review the actual diff, not just the report. Resolve integration problems and run final relevant checks.
6. Only the lead commits, pushes and releases by default. Capture the release revision once and use it throughout the push/build/upload flow.

Example assignment:

> Inspect the authentication refresh flow read-only. Read the root guide and architecture first. Trace network errors versus unauthorized responses and identify existing coverage. Report exact paths, observed behavior and risks; do not edit, commit or release.

> Implement the agreed fix only in the assigned networking files. Preserve the API contract and other sessions' edits. Run the focused tests. Report the diff and results to the lead; do not commit, push or release.

Avoid two workers editing the same file, unbounded “improve everything” assignments, simultaneous release uploads, and delegating before the contract is understood. Poll for meaningful updates rather than repeatedly requesting unchanged status.
