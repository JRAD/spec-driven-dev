---
artifact_type: implementation_plan
title: Spec-Driven-Dev Plugin Quality Improvements Implementation Plan
slug: plugin-quality-improvements
status: draft
source_request: >
  Seven findings from a structural self-review of the spec-driven-dev plugin,
  each treated as a single feature.
depends_on:
  - docs/specs/plugin-quality-improvements-spec.md
---

# Spec-Driven-Dev Plugin Quality Improvements Implementation Plan

## Summary

Wire the single-artifact commands to their specialist agents, deduplicate quality-rule text down to `SKILL.md`, replace `/implement`'s manual completion-marking protocol with a deterministic Node script, align a documentation mismatch on tag formatting, add a `status: complete` transition on task-list completion, correct the guardrail hook's documented behavior, and add an automatic (hook-triggered, non-blocking) consistency check that catches regressions of the agent-delegation and tag-format fixes.

## Scope linkage

Addresses all seven goals from the spec: `[G-001]`–`[G-007]`, and all 17 functional requirements `[FR-001]`–`[FR-017]` plus `[NFR-001]`.

Resolved open questions carried into this plan as technology decisions:
- `[OQ-001]` resolved → `[DEC-001]` (completion marking as a script, not a manual protocol).
- `[OQ-004]` resolved → `[DEC-002]` (automatic enforcement via a new `hooks.json` entry, not hosted CI).

Deferred with the spec's stated default (non-blocking, no plan action needed):
- `[OQ-002]` (full `status` lifecycle) — deferred; only the `complete` transition in `[G-005]` is implemented.
- `[OQ-003]` (per-slug hook scoping) — deferred; only the documentation fix in `[G-006]` is implemented.

## Architecture overview

Today, each of `commands/spec.md`, `plan.md`, and `tasks.md` contains its own inline copy of the drafting logic that `agents/request-analyst.md`, `implementation-architect.md`, and `task-decomposer.md` already encode more thoroughly. This plan does not change what those agents know — it changes who calls them. After this work, the command file's job is: parse `$ARGUMENTS`, invoke the matching agent by name via the Agent tool with the request/path passed through, and report the agent's output location. `commands/sdd.md` gets the same change at Stages 1–3, so the interactive pipeline and the standalone commands invoke the identical agent instead of two hand-maintained copies of the same instructions. This does **not** change: Stage 4 of `/sdd`, `commands/implement.md`, or `agents/implementation-driver.md`'s existing delegation pattern — that path already invokes an agent correctly and is the template this plan follows for the other three.

For `/implement`'s completion marking, today the `implementation-driver` agent locates a heading line, edits it, and manually diffs the file to confirm nothing else changed — entirely through LLM-followed prose (`agents/implementation-driver.md` Section 8). This plan moves the actual mutation into `scripts/mark-task-complete.js`: the agent calls the script via Bash with the task-list path and task ID; the script does the exact-line match, the write, and (new) the frontmatter `status` transition when it's the last task, and reports success or a specific failure by exit code. The agent's job shrinks to "call the script and relay its result" — the guarantee that only one line changes no longer depends on the LLM executing a multi-step verification correctly. This does not change `/implement`'s human-confirmation flow (confirm/skip prompts still happen before the script is ever called).

For consistency enforcement, this plan adds `scripts/check-consistency.js` and a new `PostToolUse` entry in `hooks/hooks.json` matched to `Write|Edit|MultiEdit` (the same matcher the existing guardrail hook uses). After any matching file write, Claude Code runs the script; it re-reads the small fixed set of files this spec's fixes touch and prints `PASS`/`FAIL` lines for each check. This does not change the existing `PreToolUse` guardrail hook, which keeps its current spec-existence check unmodified — the new hook is a separate entry, and the check script always exits `0` so it never blocks a tool call (see `[DEC-003]`).

## Technology decisions

| ID | Decision | Rationale | Alternatives considered |
|----|----------|-----------|------------------------|
| `[DEC-001]` | Completion marking and consistency checking are implemented as standalone Node.js scripts under a new `scripts/` directory, invoked via Bash or a hook — not as LLM-executed prose steps. | Resolves `[OQ-001]`. A script removes the guarantee's dependence on the LLM correctly executing a multi-step check every time (durability), and costs one Bash call versus a pre-edit read + edit + post-edit read + comparison (token/compute cost). | Strengthened manual protocol — rejected: same class of failure only mitigated, and more expensive per operation. |
| `[DEC-002]` | Automatic enforcement (`[FR-017]`) is wired through a new entry in the plugin's existing `hooks/hooks.json`, not a hosted CI pipeline or a git pre-commit hook. | Resolves `[OQ-004]`. Reuses the plugin's only existing automatic-execution surface; a git pre-commit hook would depend on the installing user's own repo/git config, which this plugin does not control. Keeps the spec's "no hosted CI" non-goal. | Hosted CI (rejected by non-goal); git pre-commit hook (rejected — not portable across every project this plugin installs into). |
| `[DEC-003]` | `scripts/check-consistency.js` exits `0` (silent) on a clean pass, and exits `2` with failure detail on stderr when a check fails; it never blocks the triggering tool call either way. | Revised after live testing: Claude Code's `PostToolUse` hooks send exit-`0` output (stdout or stderr) only to the debug log — never to Claude — so an always-exit-`0`/stdout design (the original choice here) is invisible by construction, not merely quiet. Exit `2` is the only `PostToolUse` exit code that surfaces stderr to Claude, and per Claude Code's own hook semantics it still does not block, since the triggering edit has already landed. This preserves the non-blocking intent while actually being observable. | Always exit `0` with stdout (original design) — rejected: confirmed live to never reach Claude, making automatic enforcement (`[FR-017]`) unmet in practice despite passing every direct-invocation test. Hard-blocking hook — not applicable to `PostToolUse` regardless (it cannot block a completed edit). |
| `[DEC-004]` | `scripts/mark-task-complete.js` is invoked by the `implementation-driver` agent via Bash with the task-list path and bare task ID as arguments; it is not itself registered as a `hooks.json` hook. | The marking operation is imperative — it happens on explicit human confirmation, not as a passive reaction to a tool-call event — so it fits the "agent calls a script" pattern already used for delegation, not the hook-trigger pattern used for the passive consistency check. | Registering it as a `PostToolUse` hook on the task-list file — rejected: there is no tool-call event that corresponds to "the human just confirmed this task," so a hook has nothing reliable to trigger on. |

## Components and files affected

| ID | Tag | File / location | Change |
|----|-----|----------------|--------|
| `[COMP-001]` | `[exists]` | `commands/spec.md` | Add explicit instruction to invoke the `request-analyst` agent with `$ARGUMENTS`, replacing inline drafting instructions. |
| `[COMP-002]` | `[exists]` | `commands/plan.md` | Add explicit instruction to invoke the `implementation-architect` agent with the spec path, replacing inline drafting/exploration instructions. |
| `[COMP-003]` | `[exists]` | `commands/tasks.md` | Add explicit instruction to invoke the `task-decomposer` agent with the plan path, replacing inline decomposition instructions. |
| `[COMP-004]` | `[exists]` | `commands/sdd.md` | Stage 1, 2, 3 each add the same agent-invocation instruction as `[COMP-001]`–`[COMP-003]`. Stage 4 unchanged (already delegates correctly). |
| `[COMP-005]` | `[exists]` | `skills/spec-driven-dev/SKILL.md` | No rule-content changes. Becomes the sole full statement of the task-sizing rules and the `[PREFIX-###]` reference-tagging table; other files link to its sections instead of restating them. |
| `[COMP-006]` | `[exists]` | `agents/task-decomposer.md` | Replace the duplicated task-sizing paragraph (lines ~20–25) with a link to `SKILL.md`'s "Task sizing" section. |
| `[COMP-007]` | `[exists]` | `agents/request-analyst.md` | Replace the duplicated `[PREFIX-###]` format sentence (line 58) with a link to `SKILL.md`'s "Reference tagging" section; keep its own spec-tag list. |
| `[COMP-008]` | `[exists]` | `agents/implementation-architect.md` | Replace the duplicated `[PREFIX-###]` format sentence (line 51) with a link to `SKILL.md`'s "Reference tagging" section; keep its own plan-tag list. |
| `[COMP-009]` | `[exists]` | `agents/implementation-driver.md` | Section 2 parsing table: add backticks to match `[COMP-011]`/`[COMP-012]`'s actual format. Section 8: replace the manual line-matching/character-count protocol with a call to `[COMP-013]`. Section 7: also check the script's status-transition result. Section 9: replace the "heading line not found" row with rows for the script's ambiguous/not-found exit codes. |
| `[COMP-010]` | `[exists]` | `README.md` | Hooks section: add a sentence stating the guardrail stops firing once any file exists in `docs/specs/`, not per feature; add a short note describing the new consistency-check hook. |
| `[COMP-011]` | `[exists]` | `templates/tasks-template.md` | Unchanged — read as the ground truth for the tag-delimiter format that `[COMP-009]` and `[COMP-014]` must match. |
| `[COMP-012]` | `[exists]` | `skills/spec-driven-dev/examples/example-tasks.md` | Unchanged — read as the ground truth for the tag-delimiter format, same reason as `[COMP-011]`. |
| `[COMP-013]` | `[new]` | `scripts/mark-task-complete.js` | New script implementing `[INTF-001]`. |
| `[COMP-014]` | `[new]` | `scripts/check-consistency.js` | New script implementing `[INTF-002]`. |
| `[COMP-015]` | `[exists]` | `hooks/hooks.json` | Add a new `PostToolUse` entry implementing `[INTF-003]`. Existing `PreToolUse` entry unchanged. |

## Interfaces and contracts

**`[INTF-001]` — `scripts/mark-task-complete.js`**
- Invocation: `node scripts/mark-task-complete.js <task-list-path> <task-id>`, where `<task-id>` is the bare ID (e.g. `T-004`, no brackets/backticks).
- Matching: scans lines starting with `### Task ` for one containing `[<task-id>]` (with or without surrounding backticks) that does not already end in ` ✓` after trimming.
- Exactly one match → append ` ✓` to that exact line; write the file.
- Zero matches, or the only match already ends in ` ✓` → exit `2`, stderr: `NOT_FOUND: [<task-id>]`. No write.
- More than one match → exit `1`, stderr: `AMBIGUOUS: [<task-id>] matched N lines`. No write.
- After a successful mark, re-scan the whole file: if no line starting with `### Task ` lacks a trailing ` ✓`, also replace the frontmatter `status:` line's value with `complete` in the same write. If marking succeeded but no `status:` line is found, log `WARN: status line not found, ✓ still applied` to stdout and exit `0` — the cosmetic status field never blocks or reverts the ✓ write.
- stdout on success: `MARKED [<task-id>]`, plus `STATUS complete` if the status transition applied.
- Never alters any line other than the matched task heading and, when applicable, the status line.

**`[INTF-002]` — `scripts/check-consistency.js`**
- Invocation: `node scripts/check-consistency.js` (no arguments).
- Check A (tag format): compares the tag-delimiter pattern in `agents/implementation-driver.md`'s Section 2 parsing table against the literal tag rendering in `[COMP-011]` and `[COMP-012]`.
- Check B (agent delegation): confirms `commands/spec.md`, `commands/plan.md`, and `commands/tasks.md` each contain the name of their corresponding agent (`request-analyst`, `implementation-architect`, `task-decomposer`).
- On a clean pass: stdout `PASS all checks`, exit `0`.
- On any failure: one `PASS <check-name>` or `FAIL <check-name>: <detail>` line per check, written to **stderr**, exit `2` (per `[DEC-003]`) — this is the only combination `PostToolUse` actually surfaces to Claude; exit `0`/stdout is silently discarded to the debug log regardless of content.

**`[INTF-003]` — `hooks/hooks.json` new `PostToolUse` entry**
- Matcher: `Write|Edit|MultiEdit` (same as the existing `PreToolUse` guardrail entry).
- Command: `node scripts/check-consistency.js`.
- Fires after the tool's write lands, so the check observes the new file content, not the pre-edit state.

## Data flow

1. **Command → agent (`[G-001]`).** User runs `/spec`, `/plan`, or `/tasks` (or `/sdd` Stage 1–3) → the command file resolves `$ARGUMENTS`/the input artifact path → invokes the matching agent via the Agent tool, passing that argument through → the agent runs its existing investigation/self-check logic → writes the output artifact to `docs/{specs,plans,tasks}/<slug>-*.md` → the command reports the path back to the user.
2. **Task confirmation → script (`[G-003]`, `[G-005]`).** User confirms a task in `/implement` → `implementation-driver` calls `node scripts/mark-task-complete.js <path> <task-id>` via Bash → script mutates the file (heading + possibly status) or exits nonzero with no mutation → agent relays the script's stdout/stderr to the user and updates its in-memory ready-set computation from the file's new state.
3. **File write → consistency check (`[G-007]`).** Any `Write`/`Edit`/`MultiEdit` in this repo → `PostToolUse` hook fires → `check-consistency.js` reads the fixed file set → prints `PASS`/`FAIL` lines, visible to the model in the tool result, without anyone invoking a command.

## Error handling

- `mark-task-complete.js` ambiguous or not-found: agent reports the exact stderr line to the user and makes no further attempt at fuzzy matching, mirroring today's Section 9 policy but now backed by a real exit code instead of LLM judgment.
- `mark-task-complete.js` missing `status:` line: warns via stdout, still completes the ✓ write — a missing status field never blocks task completion.
- Agent invocation (`[G-001]`) failure (the Agent tool call itself errors, or the subagent reports it cannot proceed): the command reports the failure and stops. It does not fall back to a duplicated inline drafting path — recreating that fallback would reintroduce `[G-001]`'s problem. If `[ASM-001]` turns out false for a given agent, the fix is to update that agent's content (see `[COMP-006]`–`[COMP-008]`), not to keep a parallel inline path in the command.
- `check-consistency.js` never errors the calling tool call (always exits `0`); a check that itself throws (e.g., a file it expects is missing) is caught and reported as `FAIL <check-name>: <error message>` rather than crashing the hook.

## Testing and validation

No test framework exists in this repo and none is introduced. Validation is direct: run each new/changed command by hand and observe behavior; invoke each script directly with constructed fixture files (including a deliberately ambiguous heading and a deliberately mismatched tag format) and check stdout/exit code; inspect file diffs after each operation. Each task in the task list maps its validation step to one of this spec's acceptance criteria.

## Risks and mitigations

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|-----------|--------|-----------|
| `[RISK-001]` | The new `PostToolUse` hook adds output to every `Write`/`Edit`/`MultiEdit` in this repo, including unrelated future edits, and could clutter normal work. | Medium | Low | `check-consistency.js` only prints per-check detail on failure; on a clean pass it prints a single `PASS all checks` line, keeping normal-case noise minimal. |
| `[RISK-002]` | `mark-task-complete.js`'s heading-matching regex becomes a second place (besides `agents/implementation-driver.md`'s documentation) that encodes the task-heading format — a future template change could silently break marking. | Medium | Medium | The script's match is deliberately lenient (tolerates backtick-wrapped or bare tags), and `check-consistency.js`'s Check A independently verifies the documented tag format stays aligned with the templates, catching drift the script's leniency might otherwise mask. |
| `[RISK-003]` | Delegating `/spec`, `/plan`, `/tasks` to subagents (`[G-001]`) changes latency and context-sharing versus today's inline generation; an agent invoked without the command's `$ARGUMENTS` properly passed through would silently regress quality. | Medium | Medium | Each command's agent-invocation instruction explicitly must include the resolved argument/path in the prompt passed to the agent (verified per task in Phase 1); no dual inline-logic fallback is kept (see Error handling), so a broken invocation fails loudly instead of silently falling back to unmaintained duplicate logic. |
| `[RISK-004]` | The `status: complete` transition (`[G-005]`) depends on frontmatter parsing; a task list with missing or malformed frontmatter could cause the script to fail unexpectedly. | Low | Low | The script only attempts the status update after the ✓ write already succeeded, and treats a missing `status:` line as a non-fatal warning rather than an error — the cosmetic field never blocks the substantive completion marking. |

## Delivery sequence

**Phase 1 — Agent delegation.** Wire `commands/spec.md`, `plan.md`, `tasks.md`, and `sdd.md` Stages 1–3 to invoke `request-analyst`, `implementation-architect`, and `task-decomposer` respectively (`[COMP-001]`–`[COMP-004]`). This is the plan's riskiest assumption (`[ASM-001]`, `[RISK-003]`) and is tested first: each command is run by hand after the change and must still produce a valid artifact.
**Phase 1 definition of done:** running `/spec`, `/plan`, `/tasks`, and each of `/sdd` Stages 1–3 visibly invokes the corresponding agent and still produces a spec/plan/task-list artifact matching the existing template shape.

**Phase 2 — Deterministic completion marking and status lifecycle.** Build `scripts/mark-task-complete.js` (`[COMP-013]`, `[INTF-001]`); rewrite `agents/implementation-driver.md` Sections 2, 7, 8, 9 (`[COMP-009]`) to call it and to surface the status transition.
**Phase 2 definition of done:** running the script directly against a fixture task list marks the correct task and only that line; an ambiguous or missing task ID produces the documented exit code with zero file mutation; marking the last remaining task also flips `status:` to `complete` with no other line changed.

**Phase 3 — Quality-rule deduplication.** Trim `agents/task-decomposer.md`, `request-analyst.md`, and `implementation-architect.md` (`[COMP-006]`–`[COMP-008]`) to link to `SKILL.md` instead of restating task-sizing and tagging rules. Sequenced after Phase 1 so the agents are confirmed working end-to-end before their prose is edited, reducing the chance of trimming content that was secretly load-bearing.
**Phase 3 definition of done:** the task-sizing rule text and the full `[PREFIX-###]` table each appear in exactly one file (`SKILL.md`); re-running `/spec`, `/plan`, and `/tasks` from Phase 1 still produces valid, correctly-tagged artifacts.

**Phase 4 — Automatic consistency enforcement and hook documentation.** Build `scripts/check-consistency.js` (`[COMP-014]`, `[INTF-002]`); add the `PostToolUse` entry to `hooks/hooks.json` (`[COMP-015]`, `[INTF-003]`); fix `README.md`'s Hooks section (`[COMP-010]`). Sequenced last because its checks encode the "correct" state established in Phases 1 and 2.
**Phase 4 definition of done:** editing any covered file to reintroduce a Phase-1-style (missing agent reference) or Phase-2-style (tag-format mismatch) regression triggers an automatic `FAIL` report with no command run by hand; the current, fixed state reports `PASS`; `README.md` accurately describes both hooks.
