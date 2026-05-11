---
description: Critique an existing spec against quality heuristics and return a readiness verdict.
argument-hint: [path to spec file]
disable-model-invocation: true
allowed-tools: Read Glob Grep
---

Read the spec at the path provided and evaluate it against the quality rules in `skills/spec-driven-dev/SKILL.md`. Do not modify the spec.

$ARGUMENTS

## What to check

**Functional requirements**
- Are any FRs missing? A section that only describes goals or use cases without explicit FR-N entries is missing FRs.
- Does each FR describe one observable behavior? Flag FRs that contain "and" connecting two distinct behaviors.
- Is each FR testable? A tester should be able to write a test case directly from it without asking questions.
- Is each FR implementation-independent? Flag FRs that describe a mechanism ("using a dropdown", "via REST endpoint") rather than a behavior.
- Flag any FR using vague verbs: "support", "handle", "manage", "allow" — these describe categories, not behaviors.

**Acceptance criteria**
- Does each AC cite at least one FR by number?
- Is each FR covered by at least one AC? List any FR-N with no corresponding AC.
- Is each AC binary — unambiguously pass or fail? Flag ACs with subjective language.
- Could the AC set be executed as a standalone QA checklist without reading the rest of the spec?

**Open questions**
- Is each OQ classified as `[blocking]` or `[advisory]`?
- Are there any unclassified OQs?
- Are there blocking OQs that should prevent plan generation? Name them explicitly.

**Non-functional requirements**
- Does each NFR have a measurable threshold and conditions?
- Flag any NFR stating a direction without a threshold ("should be fast", "must scale").
- NFRs without thresholds belong in Assumptions — note if any should be moved.

**Assumptions**
- Is each assumption falsifiable? Flag assertions that are not stated in a form that could be proved wrong.
- Are there dangerous assumptions (about user behavior, data volume, or the existence of things not verified) that should be open questions instead?

**Coverage gaps**
- Are there use cases listed with no corresponding FR?
- Are there goals with no traceability to any FR or AC?

## Output format

Return a structured critique with one section per area above. For each finding, cite the specific section or item by identifier (e.g., "FR-3", "AC-2", "NFR-1").

End with an explicit readiness verdict:

- **Ready for planning** — no blocking gaps found.
- **Ready with caveats** — minor gaps that should be noted but do not block planning. List each caveat.
- **Not ready** — one or more blocking gaps must be resolved before planning. List each blocking gap explicitly.
