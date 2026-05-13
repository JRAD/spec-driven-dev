---
artifact_type: implementation_plan
title: Task-Driven Implementation Command
slug: implement-command
status: approved
source_request: add a feature to this plugin that will work on implementing the project by following the task list and using the other artifacts to guide development
depends_on:
  - docs/specs/implement-command-spec.md
---

# Task-Driven Implementation Command — Implementation Plan

## Summary

The plugin is a directory of markdown files with YAML frontmatter; implementation means authoring the correct files in the correct locations and updating one existing file. This plan delivers two new markdown files (`commands/implement.md` and `agents/implementation-driver.md`) and one targeted update to `skills/spec-driven-dev/SKILL.md`. No build step, no runtime code.

## Scope linkage

Covers [G-001]–[G-006], [FR-001]–[FR-016], and [NFR-001]–[NFR-002] from the spec.

Open questions resolved:
- [OQ-001]: Completion marker format → ` ✓` appended to the task heading (e.g., `### Task 1.1 — Title ✓`). Rationale: survives markdown rendering, is detectable with a simple string-ends-with check, and is human-readable inline with the heading. Does not alter surrounding content.
- [OQ-003]: Specialist agent → included as `agents/implementation-driver.md`, following the established pattern of `request-analyst`, `implementation-architect`, and `task-decomposer`.

Deferred:
- [OQ-002]: `--from <task-id>` flag — out of scope for this version.

## Architecture overview

The `/implement` command follows the same thin-wrapper pattern as all other commands in the plugin:

```
User invokes /implement [path]
        │
        ▼
commands/implement.md         ← thin wrapper: discovery, argument handling, orchestration loop
        │  instructs Claude to act using
        ▼
agents/implementation-driver.md  ← carries behavioral logic: parsing, batching, implementation, marking
        │  reads (in order)
        ▼
docs/tasks/<slug>-tasks.md    ← task list; also written to (completion markers only)
        │  depends_on →
        ▼
docs/plans/<slug>-plan.md     ← read-only context
        │  depends_on →
        ▼
docs/specs/<slug>-spec.md     ← read-only context; AC text resolved for each task
```

**Execution loop (per phase):**

1. Build the ready set: tasks whose `Dependencies:` field is empty or lists only `[T-###]` IDs already marked with ` ✓`.
2. If ready set is empty and incomplete tasks remain → dependency cycle; report and halt.
3. If ready set has one task → sequential path (FR-015): present context, implement, ask for validation, mark on confirmation.
4. If ready set has two or more tasks → parallel path (FR-014): announce batch, implement all in one work session, ask per-task validation, mark each on confirmation, re-evaluate after all confirmations.
5. After each phase's last task is marked complete → display phase definition-of-done, ask to advance (FR-009).
6. After all phases complete → display completion summary, exit (FR-010).

What does NOT change: `commands/spec.md`, `commands/plan.md`, `commands/tasks.md`, `commands/sdd.md`, `commands/spec-review.md`, `commands/plan-review.md`, `agents/request-analyst.md`, `agents/implementation-architect.md`, `agents/task-decomposer.md`, all templates, all examples, all docs artifacts other than the task list being implemented.

## Technology decisions

| ID | Decision | Rationale | Alternatives considered |
|----|----------|-----------|------------------------|
| `[DEC-001]` | Completion marker: ` ✓` appended to task heading | Survives markdown rendering; detectable with `str.endswith(' ✓')`; human-readable inline; does not alter surrounding content | `- [x]` checkbox (requires adding a line before each heading, more disruptive); `status: done` in task body (requires structured task body parsing, fragile) |
| `[DEC-002]` | Specialist agent `implementation-driver.md` included | Keeps `commands/implement.md` thin; concentrates behavioral logic in one document; matches pattern of all other commands | Embedding all logic directly in the command file (inconsistent with plugin conventions; harder to update independently) |
| `[DEC-003]` | Dependency resolution uses `[T-###]` IDs from `Dependencies:` field only | Deterministic; no inference; consistent with the task template and ASM-006 | Inferring dependencies from phase order (implicit; breaks if tasks are reordered or the template changes) |

## Components and files affected

| ID | Tag | File / location | Change |
|----|-----|----------------|--------|
| `[COMP-001]` | `[new]` | `commands/implement.md` | New command file; thin wrapper over implementation-driver; handles path argument, discovery, and orchestration loop |
| `[COMP-002]` | `[new]` | `agents/implementation-driver.md` | New specialist agent; carries all behavioral logic for artifact loading, dependency parsing, batch computation, task implementation, and completion marking |
| `[COMP-003]` | `[exists]` | `skills/spec-driven-dev/SKILL.md` | Append `/implement` to the artifact flow section; add it to the output locations table |
| `[COMP-004]` | `[exists]` | `commands/spec.md` | No change — referenced for pattern conformance only |
| `[COMP-005]` | `[exists]` | `commands/tasks.md` | No change — referenced for pattern conformance only |
| `[COMP-006]` | `[exists]` | `agents/task-decomposer.md` | No change — referenced for pattern conformance only |

## Interfaces and contracts

**`[INTF-001]` — Command frontmatter contract**

Every command file must have:
```yaml
description: <one-line description>
argument-hint: [optional task list path]
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Glob Grep Bash(mkdir *) Bash(ls *) Bash(find *)
```
`allowed-tools` matches the existing set used by `commands/sdd.md`. Project-specific tools (e.g., `npm`, `python`) will be prompted by Claude Code as they are needed during implementation.

**`[INTF-002]` — Task list structure contract**

The agent relies on task lists following the structure produced by the plugin's task template:

| Element | Expected pattern |
|---------|-----------------|
| Task heading | `### Task N.M — Title [T-###]` |
| Completion marker | `### Task N.M — Title [T-###] ✓` (` ✓` appended) |
| Dependencies field | `- Dependencies: [T-###], [T-###]` or `- Dependencies: none` |
| Phase heading | `## Phase N — Title [P-###]` |
| Phase boundary | `**Phase N definition of done:** <text>` |

If the task list does not match this structure, the agent reports the deviation and asks whether to continue.

**`[INTF-003]` — Artifact chain loading contract**

- The task list's `depends_on` frontmatter must contain the path to the plan file.
- The plan's `depends_on` frontmatter must contain the path to the spec file.
- If either link points to a missing file: report the missing path, ask user to continue without that context or abort (FR-012).

**`[INTF-004]` — Completion marking contract**

Writing a completion marker modifies exactly one line in the task list file: the `### Task N.M` heading line. The agent appends ` ✓` to that line and makes no other changes. NFR-002 is enforced by this constraint.

## Data flow

```
/implement [path]
    │
    ├─ path provided? → load that file (FR-001)
    ├─ no path, one task list in docs/tasks/? → load it (FR-002)
    └─ no path, multiple task lists? → present numbered list, wait for selection (FR-003)
           │
           ▼
    Load task list → read depends_on → load plan → read depends_on → load spec
    (report any missing artifacts; ask to continue or abort) (FR-004, FR-012)
           │
           ▼
    Parse task list: build index of [T-###] IDs, completion markers, Dependencies fields
           │
    ┌──────▼──────────────────────────────────────┐
    │  Execution loop (per phase)                  │
    │                                              │
    │  ready_set = tasks with all deps satisfied   │
    │                                              │
    │  if len(ready_set) == 0 and incomplete → halt│
    │  if len(ready_set) == 1 → sequential path   │
    │  if len(ready_set) > 1  → parallel path     │
    │                                              │
    │  Sequential: present context → implement →  │
    │    ask validation → mark ✓ on confirm →     │
    │    show progress → ask to proceed            │
    │                                              │
    │  Parallel: announce batch → implement all → │
    │    per-task: ask validation → mark ✓ on     │
    │    confirm; skip mark on decline →           │
    │    show progress after each → recalculate   │
    │                                              │
    │  Phase complete? → show definition-of-done  │
    │    → ask to advance                         │
    └──────────────────────────────────────────────┘
           │
           ▼
    All tasks complete? → display completion summary, exit (FR-010)
    All tasks already complete on load? → display "All tasks complete", exit (FR-010)
```

## Error handling

| Scenario | Behavior |
|----------|----------|
| Path provided, file not found | Report missing file path; exit without modifying any files (FR-011) |
| No path, no task lists in `docs/tasks/` | Report that no task list was found; suggest running `/tasks` first |
| `depends_on` link points to missing artifact | Report which artifact is missing; ask continue without context or abort (FR-012) |
| Dependency cycle detected (no tasks in ready set, incomplete tasks remain) | Report the cycle identifying which tasks are mutually blocked; halt |
| Declined validation on a task in parallel batch | Task stays incomplete; other confirmed tasks are marked; declined task re-enters ready set (FR-016) |
| All tasks already complete on load | Display completion summary; exit without modifying any files (FR-010) |

## Testing and validation

- **Load test**: invoke `/implement` in the current project directory (which contains `docs/tasks/plugin-for-claude-code-tasks.md`); verify the command loads and identifies the task list without error. Covers NFR-001.
- **Structure parsing**: manually inspect that the agent correctly identifies task headings, Dependencies fields, and completion markers in `docs/tasks/plugin-for-claude-code-tasks.md`.
- **Parallel batch detection**: create a minimal three-task test list (T1: no deps, T2: no deps, T3: depends on T1); verify the agent identifies T1+T2 as the first batch and presents T3 only after T1 is confirmed. Covers AC-011.
- **Completion marking**: after confirming a task, open the task list file and verify (a) the task heading has ` ✓` appended, (b) no other lines changed. Covers AC-005, NFR-002.
- **Decline handling**: decline validation on one task in a two-task batch; verify only the other task is marked, and the declined task is re-presented. Covers AC-012.
- **SKILL.md regression**: after updating SKILL.md, invoke `/spec`, `/plan`, and `/tasks` with simple requests; verify output is unchanged from pre-update behavior.

## Risks and mitigations

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|-----------|--------|-----------|
| `[RISK-001]` | Completion marker appended to the wrong line, corrupting task list content | Medium | High — task list becomes unparseable; progress is lost | Agent must target the exact `### Task N.M` heading line by matching the full heading text before writing; verify the line before and after appending |
| `[RISK-002]` | Task list uses a `Dependencies:` format that doesn't match the expected pattern (e.g., free text instead of `[T-###]` IDs) | Low | Medium — batch computation silently treats tasks as independent when they are not | Agent validates the `Dependencies:` field format before parsing; if the format is unrecognized, it reports and asks the user to confirm the dependency resolution it intends to apply |
| `[RISK-003]` | Parallel batch is too large to implement in a single context window (e.g., 10+ independent tasks) | Low | High — implementation fails mid-batch, leaving partial work | Agent warns when batch size exceeds 5 tasks and offers to work through the batch in sub-groups of the user's chosen size |
| `[RISK-004]` | SKILL.md update inadvertently alters the behavior of existing commands | Low | Medium — existing commands behave unexpectedly | The update is append-only: only the artifact flow section and output locations table are touched; existing text is not modified; smoke test all existing commands after the update |

## Delivery sequence

**Phase 1 — Command file**

Author `commands/implement.md`. This is the entry point and can be tested for load behavior independently of the agent.

Includes: command frontmatter, argument handling, auto-discovery logic, the orchestration loop description, and references to `agents/implementation-driver.md` for detailed behavioral rules.

Phase 1 definition of done: `commands/implement.md` exists with valid frontmatter matching [INTF-001]; invoking `/implement` in Claude Code loads the command without error.

---

**Phase 2 — Implementation driver agent**

Author `agents/implementation-driver.md`. This is the riskiest artifact — it encodes artifact chain loading, dependency parsing, batch computation, per-task implementation flow, completion marking, and all error handling.

Includes: agent frontmatter, artifact chain loading instructions, task structure parsing rules, execution loop (sequential and parallel paths), completion marking protocol ([DEC-001]), and all error handling cases from the table above.

Phase 2 definition of done: `agents/implementation-driver.md` exists with valid frontmatter; a full end-to-end test with `docs/tasks/plugin-for-claude-code-tasks.md` loads all three artifacts, identifies the first incomplete task, and presents its context correctly.

---

**Phase 3 — SKILL.md update**

Update `skills/spec-driven-dev/SKILL.md`:
- Add `/implement` as Step 4 in the artifact flow section.
- Add `implement-command-tasks.md` path pattern to the output locations section.

Phase 3 definition of done: SKILL.md references `/implement` in the artifact flow; invoking `/spec` and `/tasks` with a simple request still produces correct output (no regression).

---

**Phase 4 — Validation**

Run the full validation suite from the Testing and validation section. Verify AC-001 through AC-012 against the spec.

Phase 4 definition of done: All acceptance criteria AC-001 through AC-012 are verified. The plugin's self-referential task list (`docs/tasks/plugin-for-claude-code-tasks.md`) loads cleanly under `/implement`.
