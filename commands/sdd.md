---
description: Plan non-trivial work at the right weight. Triages the request into no planning, a one-page brief (quick), or the full spec/plan/tasks pipeline, then runs it with human checkpoints. Flags: --quick, --full.
argument-hint: [--quick|--full] [feature request]
allowed-tools: Read Write Edit MultiEdit Glob Grep Bash(mkdir *) Bash(ls *) Bash(find *) Bash(git log *) Bash(git status *) Agent
---

Plan this request at the right weight, then run the matching path. Do not advance past a checkpoint without explicit approval.

$ARGUMENTS

---

## Stage 0 — Triage and assess the request

### 0a. Choose the tier

If `$ARGUMENTS` begins with `--quick` or `--full`, use that tier and skip to 0b. Otherwise choose one, using the "Tiers" table in `skills/spec-driven-dev/SKILL.md`, and state your choice and the reason in one or two lines. The user may override it; proceed unless they do.

- **None** — trivial or obvious (known-cause bug fix, rename, config tweak). Say so and offer to just do it. Stop here.
- **Quick** — one coherent concern or a few small pieces, low ambiguity; or the real work is settling decisions and contracts so other work can start. Go to the **Quick path** below.
- **Full** — large or ambiguous scope, blocking open questions, work spanning sessions or people, or a need for traceable requirements and a driven implementation loop. Continue with the stages below.

When unsure between quick and full, choose quick. A brief that outgrows one page escalates cleanly (see Promotion), whereas an oversized spec is expensive to throw away.

### 0b. Assess the request

Before generating anything, evaluate whether the request is specific enough to spec.

A request is too vague to spec if it cannot answer: "What would make this wrong?" Signs of an underspecified request:
- Fewer than ~10 words with no user or outcome framing
- No indication of who is affected or what they are currently unable to do
- The request is a technology choice ("use Redis for caching") rather than a user or system outcome

If the request is underspecified, ask the user for clarification before generating anything. Specifically:
- Who is the primary user or actor?
- What are they currently unable to do, and why does that matter?
- What would success look like in concrete terms?
- Are there constraints (must use X, cannot change Y) that need to be captured?

Do not generate an artifact until the answers to these questions are clear. If the user provides them inline in the original request, proceed without asking.

---

## Quick path

Follow `commands/brief.md`: ground the brief in the codebase, identify what the pieces of work must agree on (contracts and decisions), write `docs/briefs/<slug>-brief.md` from `skills/spec-driven-dev/templates/brief-template.md`, run its self-check, and stop at one checkpoint ("Reply **approve** to proceed, or give feedback to revise").

After approval, offer these next steps and wait for the user's choice. Do not start any without it:
- **Implement** the work directly from the brief in this session.
- **Split into tickets** — the user files them; offer to draft the text.
- **Promote** to the full tier.

**Promotion.** To promote, treat the brief as the source request for Stage 1: pass its path to the `request-analyst` agent, require that its Decisions become Open questions or Constraints, and set the spec's `source_request` to the brief's path. Then continue from Stage 1 as normal.

---

## Stage 1 — Generate the spec (full tier)

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
