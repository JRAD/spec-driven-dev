---
artifact_type: task_list
title: Spec-Driven-Dev Plugin Quality Improvements
slug: plugin-quality-improvements
status: complete
source_request: >
  Seven findings from a structural self-review of the spec-driven-dev plugin,
  each treated as a single feature.
depends_on:
  - docs/plans/plugin-quality-improvements-plan.md
---

# Spec-Driven-Dev Plugin Quality Improvements Task List

## Phase 1 — Agent delegation `[P-001]`

### Task 1.1 — Wire `/spec` to invoke `request-analyst` `[T-001]` ✓
- Objective: `/spec` produces the specification by invoking the `request-analyst` agent instead of duplicating its drafting logic inline.
- Dependencies: none
- Work: Edit `commands/spec.md` (`[COMP-001]`). Replace the inline drafting instructions with an explicit instruction to invoke the `request-analyst` agent, passing `$ARGUMENTS` through as the request. Keep the surrounding output-location and scope constraints (write to `docs/specs/<slug>-spec.md`; do not generate a plan or task list).
- Validation: Run `/spec` with a throwaway test request; confirm the `request-analyst` agent is invoked (visible in the run) and a valid spec is written to `docs/specs/`. Covers `[AC-001]`.
- Done when: `commands/spec.md` explicitly names and invokes `request-analyst`; running `/spec` produces a valid spec via that agent.

### Task 1.2 — Wire `/plan` to invoke `implementation-architect` `[T-002]` ✓
- Objective: `/plan` produces the implementation plan by invoking the `implementation-architect` agent instead of duplicating its exploration/drafting logic inline.
- Dependencies: none
- Work: Edit `commands/plan.md` (`[COMP-002]`). Replace the inline exploration and drafting steps with an explicit instruction to invoke `implementation-architect`, passing the spec path through. Keep the output-location constraint (`docs/plans/<slug>-plan.md`) and the "do not generate the task list" scope note.
- Validation: Run `/plan` against an existing spec; confirm `implementation-architect` is invoked and a valid plan is written. Covers `[AC-002]`.
- Done when: `commands/plan.md` explicitly names and invokes `implementation-architect`; running `/plan` produces a valid plan via that agent.

### Task 1.3 — Wire `/tasks` to invoke `task-decomposer` `[T-003]` ✓
- Objective: `/tasks` produces the task list by invoking the `task-decomposer` agent instead of duplicating its decomposition logic inline.
- Dependencies: none
- Work: Edit `commands/tasks.md` (`[COMP-003]`). Replace the inline phase-design and task-writing steps with an explicit instruction to invoke `task-decomposer`, passing the plan path through. Keep the output-location constraint (`docs/tasks/<slug>-tasks.md`).
- Validation: Run `/tasks` against an existing plan; confirm `task-decomposer` is invoked and a valid task list is written. Covers `[AC-003]`.
- Done when: `commands/tasks.md` explicitly names and invokes `task-decomposer`; running `/tasks` produces a valid task list via that agent.

### Task 1.4 — Wire `/sdd` Stages 1–3 to invoke the same agents `[T-004]` ✓
- Objective: `/sdd`'s interactive pipeline invokes the identical agents its standalone-command counterparts do, so the two entry points never diverge.
- Dependencies: `[T-001]`, `[T-002]`, `[T-003]`
- Work: Edit `commands/sdd.md` (`[COMP-004]`). Stage 1: invoke `request-analyst`, mirroring `[T-001]`'s wording. Stage 2: invoke `implementation-architect`, mirroring `[T-002]`'s wording. Stage 3: invoke `task-decomposer`, mirroring `[T-003]`'s wording. Stage 4 is unchanged (it already delegates correctly to `implementation-driver`). Preserve every existing checkpoint (the approve/feedback prompts at the end of Stages 1 and 2, and the implement/done prompt at the end of Stage 3).
- Validation: Run `/sdd` on a throwaway request through Stage 3; confirm each stage invokes the matching agent and that all three approval checkpoints still function (revising on feedback, proceeding on approval). Covers `[AC-004]`.
- Done when: `/sdd` Stages 1–3 each invoke the matching agent with wording consistent with `[T-001]`–`[T-003]`; Stage 4 is unchanged; all checkpoints still gate advancement.

**Phase 1 definition of done:** Running `/spec`, `/plan`, `/tasks`, and each of `/sdd` Stages 1–3 visibly invokes the corresponding agent and still produces a spec/plan/task-list artifact matching the existing template shape. All of `[AC-001]`–`[AC-004]` are verified.

---

## Phase 2 — Deterministic completion marking and status lifecycle `[P-002]`

### Task 2.1 — Build `scripts/mark-task-complete.js` `[T-005]` ✓
- Objective: A standalone script that marks a task complete and, when applicable, flips the task list's `status` to `complete` — without relying on an LLM to hand-verify the edit.
- Dependencies: none
- Work: Create `scripts/mark-task-complete.js` implementing `[INTF-001]` (`[COMP-013]`). CLI: `node scripts/mark-task-complete.js <task-list-path> <task-id>`. Match lines starting with `### Task ` containing `[<task-id>]` (with or without backticks) that do not already end in ` ✓`. Exactly one match → append ` ✓`, write. Zero matches or the only match already complete → exit `2`, stderr `NOT_FOUND: [<task-id>]`, no write. More than one match → exit `1`, stderr `AMBIGUOUS: [<task-id>] matched N lines`, no write. After a successful mark, rescan the file: if no `### Task ` line lacks a trailing ` ✓`, also set the frontmatter `status:` value to `complete` in the same write, and print `STATUS complete`. If marking succeeded but no `status:` line exists, print `WARN: status line not found, ✓ still applied` and exit `0` — never revert the ✓ write over a missing status field. On success print `MARKED [<task-id>]`.
- Validation: Using constructed fixture task-list files: (a) an unambiguous target task → run script → exactly that line changes (verify via diff), exit `0`, stdout `MARKED`. (b) a fixture with a duplicated heading matching the same task ID → exit `1`, stderr `AMBIGUOUS`, zero file changes. (c) a nonexistent task ID → exit `2`, stderr `NOT_FOUND`, zero file changes. (d) a fixture where the target is the last incomplete task → after marking, the `status:` line changes to `complete` and no other line besides the heading and status line changes. (e) a fixture with no `status:` frontmatter line → marking still succeeds with a `WARN` printed and exit `0`. Covers `[AC-007]`, `[AC-009]`.
- Done when: `scripts/mark-task-complete.js` exists and produces the documented exit code, stdout/stderr, and file-mutation behavior for all five fixture cases above.

### Task 2.2 — Rewrite `implementation-driver.md`'s marking protocol to use the script `[T-006]` ✓
- Objective: `/implement`'s completion marking is driven by `scripts/mark-task-complete.js` rather than LLM-executed line-matching and character-counting, and its documented tag format matches what templates actually produce.
- Dependencies: `[T-005]`
- Work: Edit `agents/implementation-driver.md` (`[COMP-009]`). Section 2: add backticks to the parsing-table's tag examples so they match `templates/tasks-template.md` and `examples/example-tasks.md` (`[COMP-011]`, `[COMP-012]`). Section 8: replace the manual line-matching/character-count protocol with an instruction to call `node scripts/mark-task-complete.js <path> <task-id>` via Bash, relay `MARKED`/`STATUS complete` stdout to the user on exit `0`, and relay the exact stderr on nonzero exit with no further attempt at fuzzy matching. Section 7: note that the completion check should also reflect the script's status transition. Section 9: replace the "heading line not found" row with two rows covering the script's `AMBIGUOUS` (exit `1`) and `NOT_FOUND` (exit `2`) cases.
- Validation: Confirm Section 2's tag examples are backtick-wrapped, matching `templates/tasks-template.md`. Confirm Section 8 contains no manual character-count instruction and instead calls the script. Confirm Section 9 documents both new exit-code cases. Then run `/implement` end-to-end on a throwaway task list: confirm one task's confirmation invokes the script and marks correctly, and confirming the final task flips `status:` to `complete`. Covers `[AC-007]`, `[AC-008]`, `[AC-009]`.
- Done when: `agents/implementation-driver.md` Sections 2, 7, 8, and 9 reflect the script-based protocol and correct tag format, with no manual line-editing instructions remaining in Section 8; an end-to-end `/implement` run confirms correct marking and status transition via the script.

**Phase 2 definition of done:** `scripts/mark-task-complete.js` correctly marks, rejects ambiguous/missing matches with zero file mutation, and flips `status` on final-task completion when run directly against fixtures; `/implement`, driven by the rewritten `implementation-driver.md`, exhibits the same behavior end-to-end. All of `[AC-007]`, `[AC-008]`, `[AC-009]` are verified.

---

## Phase 3 — Quality-rule deduplication `[P-003]`

### Task 3.1 — Deduplicate task-sizing rules out of `task-decomposer.md` `[T-007]` ✓
- Objective: The task-sizing rule text exists in exactly one place (`SKILL.md`); `task-decomposer.md` links to it.
- Dependencies: `[T-003]`, `[T-004]`
- Work: Edit `agents/task-decomposer.md` (`[COMP-006]`). Replace the duplicated task-sizing paragraph with a link to `SKILL.md`'s "Task sizing" section. Do not change the rule's substance — `SKILL.md`'s text is unchanged (`[COMP-005]`).
- Validation: A text search for the task-sizing rule paragraph across the repo returns exactly one full-text match, in `SKILL.md`; `agents/task-decomposer.md` contains a link/reference to that section instead. Covers `[AC-005]`.
- Done when: the task-sizing rule text appears once, in `SKILL.md`; `task-decomposer.md` references it by section instead of restating it.

### Task 3.2 — Deduplicate the tagging scheme out of `request-analyst.md` `[T-008]` ✓
- Objective: The `[PREFIX-###]` tagging table exists in exactly one place (`SKILL.md`); `request-analyst.md` links to it while keeping its own spec-tag list.
- Dependencies: `[T-001]`, `[T-004]`
- Work: Edit `agents/request-analyst.md` (`[COMP-007]`). Replace the duplicated `[PREFIX-###]` format sentence with a link to `SKILL.md`'s "Reference tagging" section. Keep the agent's own list of which tags it produces (goals, use cases, FRs, etc.).
- Validation: A text search for the full `[PREFIX-###]` tagging table returns exactly one full reproduction, in `SKILL.md`; `agents/request-analyst.md` links to that section by name. Covers `[AC-006]`.
- Done when: the full tagging table appears once, in `SKILL.md`; `request-analyst.md` references it instead of restating it, and still lists its own tag types.

### Task 3.3 — Deduplicate the tagging scheme out of `implementation-architect.md` `[T-009]` ✓
- Objective: The `[PREFIX-###]` tagging table exists in exactly one place (`SKILL.md`); `implementation-architect.md` links to it while keeping its own plan-tag list.
- Dependencies: `[T-002]`, `[T-004]`
- Work: Edit `agents/implementation-architect.md` (`[COMP-008]`). Same change as `[T-008]`, applied to this file: replace the duplicated format sentence with a link to `SKILL.md`'s "Reference tagging" section; keep its own list of plan-tag types.
- Validation: A text search for the full `[PREFIX-###]` tagging table returns exactly one full reproduction, in `SKILL.md`; `agents/implementation-architect.md` links to that section by name. Covers `[AC-006]`.
- Done when: `implementation-architect.md` references `SKILL.md`'s tagging section instead of restating it, and still lists its own tag types.

### Task 3.4 — Regression-check `/spec`, `/plan`, `/tasks`, and `/sdd` after deduplication `[T-010]` ✓
- Objective: Confirm removing the duplicated rule text did not remove anything load-bearing — the delegated commands still produce correct, correctly-tagged artifacts.
- Dependencies: `[T-007]`, `[T-008]`, `[T-009]`
- Work: Re-run `/spec`, `/plan`, `/tasks`, and `/sdd` Stages 1–3 with throwaway inputs, now that the agents rely on `SKILL.md` links instead of inline duplicated text. Compare each output's section structure and reference-tag format against the templates.
- Validation: Each command's output still matches its template's section shape and uses correctly-formatted `[PREFIX-###]` tags; no agent-invocation errors occur. Covers `[AC-005]`, `[AC-006]`.
- Done when: all four entry points produce artifacts indistinguishable in shape and tagging correctness from before the deduplication.

**Phase 3 definition of done:** The task-sizing rule text and the full `[PREFIX-###]` tagging table each appear in exactly one file (`SKILL.md`); re-running `/spec`, `/plan`, and `/tasks` still produces valid, correctly-tagged artifacts. All of `[AC-005]`, `[AC-006]` are verified.

---

## Phase 4 — Automatic consistency enforcement and hook documentation `[P-004]`

### Task 4.1 — Build `scripts/check-consistency.js` `[T-011]` ✓
- Objective: A script that automatically detects the two classes of drift this work fixes (tag-format mismatch, missing agent-delegation reference), reporting `PASS`/`FAIL` without ever blocking the triggering action.
- Dependencies: `[T-001]`, `[T-002]`, `[T-003]`, `[T-006]`
- Work: Create `scripts/check-consistency.js` implementing `[INTF-002]` (`[COMP-014]`). Check A: compare the tag-delimiter format in `agents/implementation-driver.md`'s Section 2 parsing table against the literal tag rendering in `templates/tasks-template.md` and `examples/example-tasks.md`. Check B: confirm `commands/spec.md`, `commands/plan.md`, and `commands/tasks.md` each contain their corresponding agent's name (`request-analyst`, `implementation-architect`, `task-decomposer`). Print one `PASS <check>` or `FAIL <check>: <detail>` line per check; on a clean run print a single `PASS all checks` line instead of per-check detail (per `[RISK-001]`'s mitigation). Always exit `0`; catch internal errors (e.g., a missing file) and report them as `FAIL <check>: <error>` rather than crashing.
- Validation: Run the script against the current, fixed repo state — both checks `PASS`. Temporarily remove backticks from one tag occurrence in `templates/tasks-template.md`, rerun — Check A reports `FAIL` naming the mismatch — then revert. Temporarily remove the agent name from `commands/tasks.md`, rerun — Check B reports `FAIL` naming that file — then revert. Covers `[AC-011]`, `[AC-012]`.
- Done when: `scripts/check-consistency.js` exists, always exits `0`, and both checks correctly `PASS` on the fixed repo and `FAIL` when a regression is deliberately introduced (each verified, then reverted).
- Fix note (post-completion, found during `[T-012]`'s live verification): the original "always exit `0`, report via stdout" design is invisible to Claude under Claude Code's actual `PostToolUse` semantics — exit-`0` output never leaves the debug log. Corrected to: exit `0` silent on a clean pass; on failure, write detail to **stderr** and exit `2` (still non-blocking for `PostToolUse`, since the edit already landed — exit `2` only surfaces stderr, it does not undo anything). Re-verified with the same fixture cases; see `[DEC-003]` in the plan for the updated rationale.

### Task 4.2 — Wire `check-consistency.js` into `hooks/hooks.json` `[T-012]` ✓
- Objective: The consistency check runs automatically after any relevant file write, with no manual invocation required.
- Dependencies: `[T-011]`
- Work: Add a new `PostToolUse` entry to `hooks/hooks.json` implementing `[INTF-003]` (`[COMP-015]`): matcher `Write|Edit|MultiEdit`, command `node scripts/check-consistency.js`. Leave the existing `PreToolUse` entry unchanged.
- Validation: Trigger a `Write`/`Edit`/`MultiEdit` tool call in this repo (a trivial scratch edit is sufficient) and confirm the hook fires automatically, with its `PASS`/`FAIL` output appearing in the tool result — without running any command by hand. Covers `[AC-013]`.
- Done when: `hooks/hooks.json` contains both the original `PreToolUse` entry and the new `PostToolUse` entry; a file write visibly and automatically triggers the consistency check.
- Verification note (superseded): automatic firing was initially accepted via manual-invocation stand-in, pending a `/reload-plugins`. After reloading, live testing surfaced a real bug (see `[T-011]`'s fix note) — the hook was firing, but its exit-`0`/stdout output was structurally invisible to Claude. After the script fix, a live test (deliberately removing `commands/tasks.md`'s agent reference, then reverting) confirmed the `PostToolUse` hook fires automatically and its `FAIL` detail is surfaced to Claude without any manual command, with the edit-and-revert cycle leaving no trace in the file. `[AC-013]` is now genuinely confirmed live, not just accepted on a stand-in.

### Task 4.3 — Fix `README.md`'s Hooks section `[T-013]` ✓
- Objective: `README.md` accurately describes both hooks' real behavior, including the guardrail's "fires once" limitation.
- Dependencies: `[T-012]`
- Work: Edit `README.md`'s Hooks section (`[COMP-010]`): state explicitly that the guardrail stops firing once any file exists in `docs/specs/`, not on a per-feature basis; add a short description of the new consistency-check hook (what it checks, and that it is advisory/non-blocking).
- Validation: Read `README.md`'s Hooks section and confirm it states the guardrail's real firing behavior and describes the new hook's purpose and non-blocking nature. Covers `[AC-010]`.
- Done when: `README.md`'s Hooks section makes no claim about either hook that the hook's actual behavior doesn't support.

**Phase 4 definition of done:** Editing any file covered by `[T-011]`'s checks to reintroduce a tag-format or agent-delegation regression triggers an automatic `FAIL` report with no command run by hand; the current, fixed state reports `PASS`; `README.md` accurately describes both hooks. All of `[AC-010]`, `[AC-011]`, `[AC-012]`, `[AC-013]` are verified.
