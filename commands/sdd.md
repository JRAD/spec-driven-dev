---
description: Run the full spec-driven development flow with human checkpoints between each artifact.
argument-hint: [feature request]
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Glob Grep Bash(mkdir *) Bash(ls *) Bash(find *)
---

Run the spec-driven development pipeline for this request. Proceed in stages. Do not advance to the next stage without explicit approval.

$ARGUMENTS

---

## Stage 0 — Assess the request

Before generating anything, evaluate whether the request is specific enough to spec.

A request is too vague to spec if it cannot answer: "What would make this wrong?" Signs of an underspecified request:
- Fewer than ~10 words with no user or outcome framing
- No indication of who is affected or what they are currently unable to do
- The request is a technology choice ("use Redis for caching") rather than a user or system outcome

If the request is underspecified, ask the user for clarification before generating the spec. Specifically:
- Who is the primary user or actor?
- What are they currently unable to do, and why does that matter?
- What would success look like in concrete terms?
- Are there constraints (must use X, cannot change Y) the spec needs to capture?

Do not generate a spec until the answers to these questions are clear. If the user provides them inline in the original request, proceed without asking.

---

## Stage 1 — Generate the spec

Invoke the `spec-driven-dev:request-analyst` agent (via the Agent tool) to generate a specification for this request. Pass the agent a prompt that includes: the request, the requirement to write the output to `docs/specs/<slug>-spec.md` using the shape of `skills/spec-driven-dev/templates/spec-template.md`, and the requirement to list any required assumptions explicitly. If the agent invocation fails or the agent reports it cannot proceed, report that failure and stop rather than drafting the spec directly.

Once written, surface the spec to the user. Then run an internal spec review — evaluate it against the quality rules in `SKILL.md`:
- Are there FRs missing or untestable?
- Are there ACs without a matching FR?
- Are there unclassified or blocking open questions?
- Are there NFRs without measurable thresholds?

**Present to the user:**
1. The spec (or its file path if long).
2. Any blocking gaps found in the internal review — named explicitly, not summarized.
3. Ask: "Does this spec look correct? Reply **approve** to continue to the plan, or provide feedback to revise."

Do not proceed to Stage 2 until the user approves. If they provide feedback, revise the spec and repeat Stage 1's review and checkpoint.

---

## Stage 2 — Generate the plan

Invoke the `spec-driven-dev:implementation-architect` agent (via the Agent tool) to generate an implementation plan from the spec written in Stage 1. Pass the agent a prompt that includes: the spec path, the requirement to explore the codebase (or identify greenfield decisions) before designing, per the agent's own instructions, and the requirement to write the output to `docs/plans/<slug>-plan.md` using the shape of `skills/spec-driven-dev/templates/plan-template.md`, tagging every "Components and files affected" entry `[exists]`, `[new]`, or `[assumed]`. The plan's `depends_on` frontmatter must reference the spec from Stage 1. If the agent invocation fails or the agent reports it cannot proceed, report that failure and stop rather than drafting the plan directly.

Once written, run an internal plan review:
- Verify `[exists]` file references via Glob.
- Check that the delivery sequence produces a working system at each phase boundary.
- Check that each risk has an actionable mitigation.

**Present to the user:**
1. The plan (or its file path if long).
2. Any invented file paths or blocking gaps found.
3. Ask: "Does this plan look correct? Reply **approve** to continue to tasks, or provide feedback to revise."

Do not proceed to Stage 3 until the user approves. If they provide feedback, revise the plan and repeat Stage 2's review and checkpoint.

---

## Stage 3 — Generate the task list

Invoke the `spec-driven-dev:task-decomposer` agent (via the Agent tool) to generate a task list from the plan written in Stage 2. Pass the agent a prompt that includes: the plan path, the requirement to also read the plan's source spec (via its `depends_on` frontmatter) to extract acceptance criteria for validation-step mapping, and the requirement to write the output to `docs/tasks/<slug>-tasks.md` using the shape of `skills/spec-driven-dev/templates/tasks-template.md`. The task list's `depends_on` frontmatter must reference the plan from Stage 2. If the agent invocation fails or the agent reports it cannot proceed, report that failure and stop rather than drafting the task list directly.

Once written, present the task list to the user. Then ask: "Reply **implement** to begin implementation, or **done** to stop here."

Do not proceed to Stage 4 unless the user replies **implement**.

---

## Stage 4 — Implement

Load the task list written in Stage 3. Then follow the behavioral rules in `agents/implementation-driver.md` to drive implementation:

- Load the artifact chain by following `depends_on` frontmatter links from the task list to the plan to the spec.
- Compute the execution batch for the current phase (tasks whose dependencies are all satisfied).
- Implement tasks — sequentially if one task is ready, as a parallel batch if multiple are ready.
- After each implementation, present validation steps and ask for per-task human confirmation before marking any task complete.
- On confirmation, append ` ✓` to the task heading line and only that line.
- Display progress after each confirmation and ask whether to proceed.
- When the last task in a phase is confirmed, display that phase's definition-of-done before advancing.
- Continue until all tasks are complete or the user halts.

Refer to `agents/implementation-driver.md` for the full behavioral specification covering error handling, dependency cycle detection, parallel batch limits, and completion marking protocol.
