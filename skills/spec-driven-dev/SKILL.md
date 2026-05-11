---
name: spec-driven-dev
description: Generate and maintain spec-driven development artifacts. Use when the user wants a specification, implementation plan, or task list for a feature, project, plugin, or workflow.
argument-hint: [request or artifact path]
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Glob Grep Bash(mkdir *) Bash(ls *) Bash(find *)
---

# Spec-driven development workflow

You generate three artifacts in sequence:

1. Specification: what we are building.
2. Implementation plan: how we will build it.
3. Task list: logical work breakdown.

## Artifact flow

1. Generate spec (`/spec`) → review it (`/spec-review`) → address blocking gaps → proceed.
2. Generate plan (`/plan`) → review it (`/plan-review`) → address blocking gaps → proceed.
3. Generate task list (`/tasks`).

- Do not create a plan until the spec is concrete enough and `/spec-review` returns *ready for planning* or *ready with caveats* you accept.
- Do not create a task list until the plan is reviewed and `/plan-review` returns *ready for task decomposition*.
- Preserve traceability between files with frontmatter fields.
- The `/sdd` command runs this full pipeline interactively with human checkpoints at each stage.

## Output locations

- Specs: `docs/specs/<slug>-spec.md`
- Plans: `docs/plans/<slug>-plan.md`
- Tasks: `docs/tasks/<slug>-tasks.md`

## Quality rules

### Specification

The spec must include all of the following sections. Quality requirements for each:

**Problem statement**
- Describe the current situation and why it is inadequate. Identify who is affected and how.
- A good problem statement makes the Goals section feel inevitable. If a reader is surprised by the goals, the problem statement isn't specific enough.
- No solution language. The problem statement describes what is broken or missing, not what will be built.

**Goals**
- State outcomes, not features. "Admins can complete a bulk export in one operation" is a goal. "Add a bulk export button" is a feature.
- Each goal should be traceable to a specific pain in the problem statement.
- 3–7 goals is typical. More than 7 suggests the scope is too broad or goals are too granular.

**Non-goals**
- A non-goal earns its place by ruling out something a reader might reasonably assume is included given the goals.
- Do not list obvious exclusions. If no one would expect it, it doesn't need to be ruled out.

**Primary users / actors**
- Name the role and describe what they need from this feature specifically, not in general.
- Include non-human actors (background jobs, external services) when they interact with the system boundary.
- If actors have conflicting interests, note the tension.

**Use cases**
- Each use case: actor + goal + observable outcome.
- Cover the happy path and at least one failure or edge case.
- Use cases should span the realistic range of usage, not just the ideal scenario.

**Functional requirements**
- Each FR must be testable: a reader should be able to write a test case directly from it without asking questions.
- Each FR must be implementation-independent: describe what the system does, not how it does it.
- Each FR must be atomic: one observable behavior per requirement.
- Preferred pattern: "When [actor] [action], the system [observable outcome]."
- Flag and rewrite FRs containing vague verbs: "support", "handle", "manage", "allow" — these describe categories, not behaviors.
- Number every FR as FR-N for cross-reference with acceptance criteria.

**Non-functional requirements**
- Every NFR must have a measurable threshold, not a direction.
  - Wrong: "The system should be fast."
  - Right: "p95 response time ≤ 500ms under 100 concurrent users."
- Include the conditions (load level, data volume, user count) under which the threshold must hold.
- NFRs without a threshold are aspirations, not requirements — move them to Assumptions.

**Constraints**
- Things that limit *how* you can build, not *what* you can build (that's non-goals).
- Examples: must use existing library X, cannot introduce service Y, must remain backwards-compatible with Z.
- Constraints not captured here become hidden implementation risks that surface during planning.

**Assumptions**
- Beliefs about the world that have not been verified and could be wrong.
- State them as falsifiable assertions: "The existing table component supports custom columns" not "the UI is flexible."
- If an assumption is wrong, some part of the spec should change. If that's not true, it's not an assumption — it's a constraint or a non-goal.

**Open questions**
- Classify every OQ as one of:
  - `[blocking]` — if answered differently, it would change architecture, data model, scope, or a functional requirement
  - `[advisory]` — can be decided during implementation without risk to the design
- Include who can answer each question.
- Unresolved `[blocking]` OQs should keep the spec at `status: draft`. Do not proceed to plan generation until blocking questions are resolved or explicitly deferred with a documented default assumption.

**Acceptance criteria**
- Each AC must cite the FR(s) it verifies by number (e.g., "covers FR-1, FR-3").
- Each AC must be binary: pass or fail. No subjective language ("fast", "smooth", "correct" without a measurable definition).
- The full set of ACs must be executable as a standalone QA checklist — no other spec section should be needed to run them.
- Every FR must have at least one AC. An FR with no AC is either untestable or incomplete.

### Implementation plan

Before generating a plan, assess the codebase:
- Run Glob and Grep to determine whether source files exist
- If they do: explore the relevant areas and ground every component reference in a real path
- If they do not: identify what technology decisions must be made explicitly; design the initial project structure as a named decision

The plan must include:
- Summary
- Scope linkage back to the spec
- Architecture overview (data flow, not just component list)
- Project structure (new projects only — directory layout to be created)
- Components and files affected — every entry tagged `[exists]`, `[new]`, or `[assumed]`
- Interfaces and contracts
- Data flow
- Error handling
- Testing and validation strategy
- Risks and mitigations (each with likelihood, impact, and actionable mitigation)
- Delivery sequence (ordered to produce a working system at each phase boundary)
- Technology decisions (any decision not captured in the spec must be named here explicitly)

### Task list

The task list must include:
- Phases
- Ordered tasks
- Dependencies
- Validation step for each task
- Definition of done for each phase

## Generation rules

- If the request is ambiguous, surface open questions inside the spec instead of inventing decisions.
- Prefer deterministic filenames derived from the request title.
- Add YAML frontmatter to every artifact with:
  - `artifact_type`
  - `title`
  - `slug`
  - `status`
  - `source_request`
  - `depends_on`
- Keep tasks sized for one focused coding session or one PR where possible.
- Reference templates and examples in this directory when formatting output.

## Supporting files

- Templates: [templates/spec-template.md](templates/spec-template.md), [templates/plan-template.md](templates/plan-template.md), [templates/tasks-template.md](templates/tasks-template.md)
- Examples: [examples/example-spec.md](examples/example-spec.md), [examples/example-plan.md](examples/example-plan.md), [examples/example-tasks.md](examples/example-tasks.md)