# Backlog

## 1. Make the plan command codebase-aware ✓

**Done.** `commands/plan.md`, `agents/implementation-architect.md`, `SKILL.md`, and `templates/plan-template.md` updated.

The plan command now runs a mandatory exploration phase before generating. It detects whether a codebase exists (via Glob for project definition files and source roots) and follows one of two paths:

- **Existing project:** Glob and Grep the areas the spec touches; every component reference must trace to a real path found during exploration.
- **New project:** Identify what technology decisions are specified vs. open; design the initial directory structure explicitly; surface unresolved stack decisions as named blocking items in the plan rather than silent defaults.

Every entry in "Components and files affected" is now tagged `[exists]`, `[new]`, or `[assumed]`. The plan template includes new sections for "Project structure" (new projects) and "Technology decisions" (any decision not captured in the spec). The agent was substantially rewritten with the same exploration-first framing and a self-check before finishing.

---

## 2. Make the skill opinionated about quality within each section ✓

**Done.** `SKILL.md`, `templates/spec-template.md`, `agents/request-analyst.md`, and `examples/example-spec.md` updated.

**Priority: highest**

`SKILL.md` lists required section headings but gives no guidance on what a good answer looks like inside each one. Claude will produce all the right boxes filled with surface-level content that looks complete but can't be relied on. The skill needs to teach Claude how to think, not just how to format.

### Work

Update `SKILL.md` with inline quality heuristics for each section. Specifically:

**Functional requirements**
- Each FR must be testable: a reader should be able to write a test case directly from it.
- Each FR must be implementation-independent: describe what the system does, not how.
- Pattern: "Given [actor], when [action], the system [observable outcome]."
- Flag vague verbs: "support", "handle", "manage" are not requirements.

**Acceptance criteria**
- Each AC should map to at least one FR by number. If an AC has no matching FR, add the FR or remove the AC.
- ACs should be binary: pass or fail, not "should generally work" or "performs well."
- The full set of ACs should be completable as a QA checklist without consulting the rest of the spec.

**Open questions**
- Classify each OQ as *blocking* (would change architecture or scope if answered differently) or *advisory* (can be decided during implementation without risk).
- Blocking OQs should gate the plan — the skill should note that a plan generated over unresolved blocking questions may need to be redone.

**Non-functional requirements**
- Each NFR needs a measurable threshold, not a direction. Not "should be fast" but "p95 response time ≤ 500ms under N concurrent users."
- NFRs without a threshold are assumptions, not requirements — move them there.

**Architecture overview (plan)**
- Must include a concrete data flow description, not just a component list.
- Should explicitly call out what *doesn't* change, not just what does.

**Risks and mitigations (plan)**
- Each risk should include likelihood and impact so readers can prioritize.
- Mitigations should be actionable steps, not reassurances ("monitor in staging" is not a mitigation).

---

## 3. Rewrite the agents with real prompting depth ✓

**Done.** `agents/request-analyst.md` and `agents/implementation-architect.md` were already substantive from prior work. `agents/task-decomposer.md` rewritten with task sizing guidance, explicit dependency discipline, validation specificity requirements, and a self-check.

**Priority: high**

Each agent file is ~10 lines and amounts to a job title plus a short bullet list. This is indistinguishable from asking Claude to do the same work without the plugin. Specialist agents earn their value by carrying domain knowledge and behavioral instructions that the base model wouldn't apply unprompted.

### Work

**`agents/request-analyst.md`**
- Add a structured intake process: before writing anything, the agent should identify what it doesn't know.
- Include a list of clarifying questions it should consider for any request (user journey, definition of done, known constraints, non-users, failure modes, success metrics at 6 months).
- Add heuristics for recognizing when a request is too vague to spec: requests that can't answer "what would make this wrong?" are not ready.
- Add guidance on assumption risk: some assumptions are safe (e.g., the language/framework already in use); others are dangerous (e.g., anything about user behavior or data volume). Dangerous assumptions go into Open Questions.
- Add a self-check before finishing: "Does each AC map to an FR? Are all blocking open questions identified? Could a developer read this spec and know what to build without asking me anything?"

**`agents/implementation-architect.md`**
- Add an explicit codebase-read phase (aligns with item 1): before designing, explore. Document what was found.
- Include guidance on sequencing strategy: prefer task orderings that produce a working (if incomplete) system at each phase, not ones that defer integration to the end.
- Add risk-identification heuristics: shared state, external dependencies, schema changes, and permission boundaries are common sources of underestimated risk.
- Add a self-check before finishing: "Does every component reference a real path? Is the delivery sequence ordered to reduce risk, not just logical grouping? Does every risk have an actionable mitigation?"

**`agents/task-decomposer.md`**
- Add guidance on task sizing: a task is too large if it requires more than one PR or more than one focused coding session. It is too small if the validation step is trivially obvious.
- Add dependency-checking: a task should never have an implicit dependency on another task that isn't listed.
- Add guidance on validation steps: each validation should be specific enough that a different developer could run it. "Tests pass" is not a validation step; "unit tests in `spec/services/export_service_spec.rb` cover happy path, partial failure, and all-failure cases" is.
- Add a self-check: "Could the tasks in Phase 1 be handed to a developer with no other context? Does each done-criteria tell you when to stop, not just what to do?"

---

## 4. Replace the blanket hooks with something useful or remove them ✓

**Done.** `hooks/hooks.json` updated. Removed the `SessionStart` hook entirely. Replaced the blanket `PreToolUse` hook with a spec-existence check: the hook only prints when `docs/specs/` contains no `.md` file, so it fires once at the start of a project and goes silent once a spec exists. Full file-path scoping (to implementation directories only) is not achievable without stdin parsing in the hook command; the spec-existence check is the reliable boundary available in this format.

---

## 5. Add a review/critique command ✓

**Done.** Added `commands/spec-review.md` and `commands/plan-review.md`. Each evaluates an artifact against the quality heuristics in `SKILL.md` and returns a structured critique ending in one of three verdicts: *ready*, *ready with caveats*, or *not ready*. `SKILL.md` artifact flow section updated to position review as the recommended gate before advancing. Both review commands are also integrated into the `/sdd` interactive pipeline as internal checks at each stage.

---

## 6. Make `/sdd` interactive ✓

**Done.** Rewrote `commands/sdd.md` as a four-stage pipeline. Stage 0 assesses request specificity and asks for clarification if the request is underspecified. Stages 1 and 2 generate the artifact, run an internal quality review, surface blocking gaps, and require explicit user approval before proceeding. Stage 3 generates the task list. `README.md` updated with a full description of the interactive flow and a command reference table.
