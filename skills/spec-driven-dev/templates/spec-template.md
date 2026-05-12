---
artifact_type: spec
title: <title>
slug: <slug>
status: draft
source_request: <original request>
depends_on: []
---

# <title>

## Summary

<!-- One or two sentences: what is being built and for whom. -->

## Problem statement

<!-- Current situation + why it is inadequate + who is affected.
     No solution language. A reader should feel the goals are inevitable after reading this. -->

## Goals

<!-- Outcomes, not features. Each goal must trace to a specific pain in the problem statement.
     If it can't, sharpen it or remove it. More than 7 is a signal to pare back. -->

- `[G-001]` ...
- `[G-002]` ...

## Non-goals

<!-- Only list things a reader might reasonably assume are included. Obvious exclusions don't need to be here. -->

## Primary users / actors

<!-- Role name + what they need from this feature specifically.
     Include non-human actors that interact with the system boundary. -->

## Use cases

<!-- Actor + goal + observable outcome. Cover the happy path and at least one failure or edge case. -->

- `[UC-001]` ...
- `[UC-002]` ...

## Functional requirements

<!-- One observable behavior per FR. Testable and implementation-independent.
     Pattern: "When [actor] [action], the system [observable outcome]."
     Avoid: "support", "handle", "manage" — these describe categories, not behaviors. -->

- `[FR-001]` When ...
- `[FR-002]` When ...

## Non-functional requirements

<!-- Every NFR needs a measurable threshold and the conditions under which it applies.
     Pattern: "[quality attribute] ≤/≥ [threshold] under [conditions]."
     NFRs without a threshold belong in Assumptions, not here. -->

- `[NFR-001]` ...

## Constraints

<!-- Things that limit how you can build (not what — that's non-goals).
     Examples: must use library X, cannot introduce service Y, must be backwards-compatible with Z. -->

- `[CON-001]` ...

## Assumptions

<!-- Falsifiable beliefs that haven't been verified. If one is wrong, part of the spec changes.
     State as assertions: "The table component supports custom columns" not "the UI is flexible." -->

- `[ASM-001]` ...

## Open questions

<!-- Tag each as [blocking] or [advisory].
     [blocking]: if answered differently, changes architecture, data model, scope, or an FR.
     [advisory]: can be decided during implementation without design risk.
     Include who can answer each question.
     Do not proceed to plan generation while blocking OQs are unresolved. -->

- `[OQ-001]` `[blocking]` ... Owner: ...
- `[OQ-002]` `[advisory]` ... Owner: ...

## Acceptance criteria

<!-- Each AC: binary pass/fail, cites FR(s) it verifies by number.
     Full set must be runnable as a standalone QA checklist.
     Every FR must have at least one AC. -->

- `[AC-001]` `covers [FR-###]` ...
- `[AC-002]` `covers [FR-###]` ...
