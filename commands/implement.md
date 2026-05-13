---
description: Drive implementation of a project task list using spec, plan, and task artifacts as authoritative context.
argument-hint: [optional task list path]
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Glob Grep Bash(mkdir *) Bash(ls *) Bash(find *)
---

Implement the project task list. Follow these steps in order. Do not skip steps.

$ARGUMENTS

---

## Step 1 — Locate the task list

**If `$ARGUMENTS` provides a path:**
- Attempt to load the file at that path.
- If the file does not exist, output: `Error: task list not found at <path>` and stop. Do not modify any files. Covers [FR-001], [FR-011].

**If `$ARGUMENTS` is empty:**
- Scan `docs/tasks/` for `.md` files using Glob.
- If no files are found: output `No task list found in docs/tasks/. Run /tasks first to generate one.` and stop.
- If exactly one file is found: load it automatically. Covers [FR-002].
- If multiple files are found: output a numbered list of the available files and ask the user to select one by number. Do not begin implementation until the user makes a selection. Covers [FR-003].

---

## Step 2 — Load the artifact chain

Read the task list's `depends_on` frontmatter to find the plan file path. Read the plan file's `depends_on` frontmatter to find the spec file path. Covers [FR-004].

For each artifact in the chain:
- Check that the file exists before loading it.
- If a file is missing, report: `Artifact not found: <path>` and ask: "Continue without this context, or abort?" Wait for the user's answer before proceeding. Covers [FR-012].

Load all available artifacts into context. The spec and plan are read-only inputs — do not modify them.

---

## Step 3 — Check for full completion

After loading the task list, scan all task headings.

If every `### Task N.M` heading already ends with ` ✓`, output:

```
All tasks complete — <task list title>
```

Then stop. Do not modify any files. Covers [FR-010].

---

## Step 4 — Run the implementation loop

Delegate all task parsing, batch computation, implementation, completion marking, and error handling to `agents/implementation-driver.md`. Pass the loaded task list, plan, and spec as context.

The agent will:
1. Parse the task list to build an index of task IDs, completion markers, and dependency fields.
2. Compute the ready set for the current phase (tasks whose dependencies are all satisfied).
3. Implement the ready set — sequentially if one task, as a parallel batch if multiple.
4. After implementation, ask for per-task human confirmation before marking any task complete.
5. After each confirmation, display progress and ask whether to proceed.
6. When the last task in a phase is confirmed, display the phase's definition-of-done before advancing.
7. Re-evaluate the ready set after each confirmation cycle and repeat until the phase is complete.
8. Advance to the next phase and repeat from step 2 of this loop.

---

## Step 5 — Completion

When the agent reports all tasks complete, output a completion summary:

```
Implementation complete — <task list title>
All <N> tasks across <M> phases are marked complete.
```

Stop. Do not modify any files beyond the completion markers already written by the agent.
