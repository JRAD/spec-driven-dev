---
artifact_type: task_list
title: Task-Driven Implementation Command
slug: implement-command
status: draft
source_request: add a feature to this plugin that will work on implementing the project by following the task list and using the other artifacts to guide development
depends_on:
  - docs/plans/implement-command-plan.md
---

# Task-Driven Implementation Command Task List

## Phase 1 — Command file `[P-001]`

### Task 1.1 — Author `commands/implement.md` `[T-001]`
- Objective: Produce a valid command file that loads in Claude Code and defines the discovery, artifact-loading, and orchestration loop instructions for the `/implement` command.
- Dependencies: none
- Work: Write `commands/implement.md`. Reference [COMP-001] from the plan. The file must include:
  - YAML frontmatter per [INTF-001]: `description`, `argument-hint: [optional task list path]`, `disable-model-invocation: true`, `allowed-tools: Read Write Edit MultiEdit Glob Grep Bash(mkdir *) Bash(ls *) Bash(find *)`.
  - Argument handling: if `$ARGUMENTS` provides a path, load that file (FR-001); otherwise proceed to auto-discovery.
  - Auto-discovery: scan `docs/tasks/` for `.md` files; if exactly one found, load it (FR-002); if multiple found, present a numbered list and wait for selection (FR-003).
  - Missing-file guard: if the specified or discovered path does not exist, report the missing path and exit (FR-011).
  - Artifact chain loading instruction: read the task list's `depends_on` frontmatter to locate the plan; read the plan's `depends_on` to locate the spec; report any missing artifacts and ask to continue or abort (FR-004, FR-012).
  - Orchestration loop description: at each cycle, delegate to `agents/implementation-driver.md` for task parsing, batch computation, implementation, and completion marking.
  - Termination conditions: all tasks complete → display completion summary, exit (FR-010).
  - Do not embed detailed behavioral logic in this file; that belongs in the agent.
- Validation:
  - Open `commands/implement.md`; confirm YAML frontmatter is valid and contains all four required fields. Covers [AC-001], [NFR-001].
  - Confirm `allowed-tools` matches the set used by `commands/sdd.md` (Read Write Edit MultiEdit Glob Grep Bash-variants). Covers [CON-001].
  - Confirm the body describes: (a) path-provided vs. auto-discovery branches, (b) the numbered-list selection prompt for multiple task lists, (c) the missing-file exit, (d) the `depends_on` chain loading instruction, and (e) a reference to `agents/implementation-driver.md`. Covers [FR-001]–[FR-004], [FR-011].
  - Confirm the file contains no embedded dependency-parsing or batch-computation logic (that belongs in the agent). Covers [DEC-002].
- Done when: `commands/implement.md` exists; frontmatter parses without errors; body describes all entry-point behaviors and delegates to the agent for execution logic; file matches the structure of `commands/tasks.md` and `commands/sdd.md` as pattern reference.

**Phase 1 definition of done:** `commands/implement.md` exists with valid frontmatter and a complete command body. The command entry point — path handling, discovery, artifact loading, and termination — is fully described. Behavioral logic is delegated to the agent (not yet authored).

---

## Phase 2 — Implementation driver agent `[P-002]`

### Task 2.1 — Author `agents/implementation-driver.md` `[T-002]`
- Objective: Produce a specialist agent file that encodes all behavioral logic for artifact chain loading, task structure parsing, execution batch computation, sequential and parallel implementation paths, completion marking, and error handling.
- Dependencies: [T-001]
- Work: Write `agents/implementation-driver.md`. Reference [COMP-002], [INTF-002], [INTF-003], [INTF-004] from the plan. The file must include:
  - YAML frontmatter: `name: implementation-driver`, `description: Drive implementation of a project task list using spec, plan, and task artifacts as context.`, `model: inherit`, `effort: high`.
  - **Artifact chain loading section**: read the task list's `depends_on` to find the plan path; read the plan's `depends_on` to find the spec path; for each, check file existence before loading; if a file is missing, report its path and ask the user to continue without that context or abort (FR-004, FR-012). Per [INTF-003].
  - **Task structure parsing section**: define the expected patterns per [INTF-002] — task headings (`### Task N.M — Title [T-###]`), completion markers (` ✓` appended), `Dependencies:` field (`[T-###]` IDs or `none`), phase headings, phase definition-of-done lines. If any heading or field doesn't match, report the deviation and ask whether to continue.
  - **Execution batch computation**: at each cycle, collect all tasks where every `[T-###]` in the `Dependencies:` field corresponds to a heading that ends with ` ✓` (or the field is `none`). This is the ready set (FR-013). Per [DEC-003].
  - **Dependency cycle detection**: if the ready set is empty but incomplete tasks remain, identify the blocked tasks by name and halt with a report.
  - **Sequential path** (ready set size = 1, FR-015): present the task's Objective, Work, and Validation fields; resolve any `[COMP-###]`, `[INTF-###]` references to their full text from the plan, and any `[AC-###]` references to their full text from the spec (FR-005, FR-006). Implement. After implementation, present the task's Validation steps and ask the user to confirm. On confirmation, append ` ✓` to the task heading line and only that line (FR-007, [INTF-004], [DEC-001]). Display progress: "X of Y tasks complete in Phase N (Z tasks remain overall)" and ask to proceed (FR-008).
  - **Parallel path** (ready set size > 1, FR-014): announce "N tasks can be implemented together: [list titles]". Implement all tasks in the batch within a single work session. Then for each task in the batch, present its Validation steps individually and ask the user to confirm. On confirmation, append ` ✓` to that task's heading; on decline, skip the mark (FR-016). Display per-task progress after each confirmation. After all confirmations, re-evaluate the ready set. Per [RISK-003]: if the batch contains more than 5 tasks, warn the user and offer to split into sub-groups before implementing.
  - **Phase boundary handling** (FR-009): when the last task in a phase is marked, find and display the `**Phase N definition of done:**` line from the task list; ask the user to confirm before loading the next phase.
  - **Completion check** (FR-010): on load, if all task headings already end with ` ✓`, display "All tasks complete — [task list title]" and exit without modifying any files.
  - **Error handling table**: embed the full table from the plan's Error handling section covering all six scenarios.
- Validation:
  - Read `agents/implementation-driver.md`; confirm frontmatter has all four required fields (`name`, `description`, `model`, `effort`). Covers [NFR-001].
  - Confirm the file has dedicated sections for: artifact chain loading, task structure parsing, execution batch computation, dependency cycle detection, sequential path, parallel path (with the >5-task warning per [RISK-003]), phase boundary handling, completion check, and error handling. Covers [FR-004]–[FR-016].
  - Invoke `/implement` (using `commands/implement.md` from Phase 1) with `docs/tasks/plugin-for-claude-code-tasks.md` as the argument. Verify: (a) the command loads the task list and correctly follows `depends_on` to load `docs/plans/plugin-for-claude-code-plan.md` and `docs/specs/plugin-for-claude-code-spec.md`; (b) the first incomplete task is presented with its Objective, Work, and Validation fields. Covers [AC-001], [AC-003], [AC-004].
  - Confirm the agent describes appending ` ✓` to the task heading line and only that line. Read the line-targeting logic to verify it cannot match a non-heading line. Covers [AC-005], [NFR-002], [RISK-001].
  - Confirm the parallel batch announcement includes the word "together" and lists task titles before implementation begins. Covers [AC-011].
  - Confirm the error handling section includes the declined-validation case: task not marked; others in batch confirmed and marked; declined task re-enters ready set. Covers [AC-012], [FR-016].
- Done when: `agents/implementation-driver.md` exists with valid frontmatter; all required behavioral sections are present and consistent with the spec FRs; an end-to-end invocation with `plugin-for-claude-code-tasks.md` loads all three linked artifacts and presents the first task correctly; the ` ✓` marking logic targets only the task heading line.

**Phase 2 definition of done:** `agents/implementation-driver.md` exists with complete behavioral logic. An end-to-end invocation of `/implement` with the plugin's own task list loads all three artifacts, presents the first incomplete task with full context, and would correctly mark it complete upon user confirmation.

---

## Phase 3 — SKILL.md update `[P-003]`

### Task 3.1 — Add `/implement` to `skills/spec-driven-dev/SKILL.md` `[T-003]`
- Objective: Update the skill documentation to reflect the `/implement` command as Step 4 in the artifact flow, so new users understand the full pipeline end-to-end.
- Dependencies: [T-001], [T-002]
- Work: Edit `skills/spec-driven-dev/SKILL.md`. Reference [COMP-003] from the plan. Make two targeted additions — do not modify any existing text:
  1. In the **Artifact flow** section (currently ends at Step 3 — generate task list), append: "4. Implement the project (`/implement`) → follow task list, implement work, validate, mark tasks complete."
  2. In the **Output locations** section, append: "- Task progress: in-file ` ✓` markers on task headings in the task list file."
  No other sections should change. Per [RISK-004].
- Validation:
  - Read `skills/spec-driven-dev/SKILL.md`; confirm the Artifact flow section now lists four steps and Step 4 references `/implement`. Covers [COMP-003].
  - Confirm the Output locations section includes the progress marker entry. Covers [COMP-003].
  - Diff the file against the pre-edit version (via `git diff`); confirm the diff contains only additions, zero deletions to existing content. Covers [RISK-004].
  - Invoke `/spec-driven-dev:spec` with the request "add a user login page" in a scratch directory; confirm a spec file is created at `docs/specs/add-a-user-login-page-spec.md` with valid frontmatter. This verifies the SKILL.md update did not break the spec command. Covers [RISK-004].
- Done when: SKILL.md references `/implement` in the artifact flow and output locations; the diff is additions-only; the existing `/spec` command produces correct output with no regression.

**Phase 3 definition of done:** `SKILL.md` documents the full four-step pipeline including `/implement`. The diff is additions-only. All existing commands continue to produce correct output.

---

## Phase 4 — Validation `[P-004]`

### Task 4.1 — Verify all acceptance criteria `[T-004]`
- Objective: Confirm that AC-001 through AC-012 from the spec all pass, and mark the implementation complete.
- Dependencies: [T-001], [T-002], [T-003]
- Work: For each acceptance criterion, run the specific check described below. Record pass/fail. All 12 must pass.

  | AC | Check |
  |----|-------|
  | [AC-001] | Run `/implement` in a directory with exactly one task list in `docs/tasks/`; confirm it starts without error and displays the first incomplete task's Objective, Work, and Validation. |
  | [AC-002] | Create a second task list file in `docs/tasks/` (copy any existing one, rename it); run `/implement` without a path argument; confirm a numbered selection list is displayed and implementation does not start until a selection is made. Remove the copy after the check. |
  | [AC-003] | After loading via AC-001, confirm the command output shows it resolved the plan path from the task list `depends_on` and the spec path from the plan `depends_on`. |
  | [AC-004] | Confirm the task context includes the task's Objective and Work fields, the Validation steps, and at least one resolved `[COMP-###]` or `[AC-###]` reference shown as full text from the plan or spec. |
  | [AC-005] | After confirming a task complete, open the task list file; confirm the target task heading ends with ` ✓`; confirm the character counts of all other lines are unchanged. |
  | [AC-006] | After AC-005, confirm the command output contains a string matching "X of Y tasks complete in Phase N". |
  | [AC-007] | Advance through all tasks in Phase 1 of the test task list; confirm the phase's definition-of-done text is displayed before the prompt to advance to Phase 2. |
  | [AC-008] | Mark all tasks in the task list as complete (append ` ✓` to every task heading manually); run `/implement`; confirm output contains "All tasks complete" and no file modification occurs (verify via `git diff`). |
  | [AC-009] | Run `/implement docs/tasks/this-file-does-not-exist.md`; confirm an error message naming the missing file is displayed and no files are modified. |
  | [AC-010] | Edit a task list's `depends_on` to reference a non-existent plan path; run `/implement` with that task list; confirm the command reports the missing plan file and asks whether to continue or abort. Restore the original `depends_on` after the check. |
  | [AC-011] | Create a minimal three-task test list: T1 (Dependencies: none), T2 (Dependencies: none), T3 (Dependencies: [T-001]); run `/implement`; confirm the announcement includes both T1 and T2 before implementation begins, and T3 is only presented after T1 is confirmed. |
  | [AC-012] | Using the three-task test list from AC-011, confirm T1, then decline T2; confirm T1 has ` ✓` and T2 does not; confirm T2 is re-presented in the next cycle. |

- Validation: All 12 ACs pass as recorded above. `git status` shows no unexpected file modifications after the edge-case checks (AC-008, AC-009). Covers all [AC-001]–[AC-012].
- Done when: All 12 acceptance criteria pass; no unexpected file modifications from any check; the implementation is ready for use.

**Phase 4 definition of done:** All 12 acceptance criteria from `docs/specs/implement-command-spec.md` are verified and pass. The `/implement` command is fully functional: it loads artifacts, drives implementation, tracks progress, handles parallel batches, and respects all edge cases.
