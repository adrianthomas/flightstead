# CLAUDE.md

@AGENTS.md

`AGENTS.md` (imported above) is the shared guide for Claude Code and Codex.
Put project guidance there so both tools see it; keep this file to Claude
Code specifics only.

## Delegation

The main Claude Code session is the lead (Sol's role in Codex) and defaults to
Opus via `.claude/settings.json`. The project subagents in `.claude/agents/`
mirror the Codex roles in `.codex/agents/`:

- `explorer` — read-only investigation; reports paths, contracts, and checks.
- `worker` — bounded implementation in files the lead explicitly assigns.

Both run on Sonnet (Luna's role). Keep the Claude and Codex role definitions
in sync when changing either.
