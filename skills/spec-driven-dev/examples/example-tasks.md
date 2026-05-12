---
artifact_type: task_list
title: Bulk Invoice Export for Admin Users
slug: bulk-invoice-export
status: draft
source_request: add bulk invoice export for admin users
depends_on:
  - docs/plans/bulk-invoice-export-plan.md
---

# Bulk Invoice Export for Admin Users Task List

## Phase 1 — Backend foundation `[P-001]`

### Task 1.1 — Route and controller stub `[T-001]`
- Objective: Register the export route and controller with auth and param validation so the endpoint exists and rejects bad requests before any generation logic is written.
- Dependencies: none
- Work: Add route entry to `[COMP-001]`. Create `[COMP-002]` with `create` action. Enforce admin role via `[COMP-007]`. Return 422 for zero IDs or >100 IDs (per `[OQ-001]` resolution). Return 200 OK placeholder body.
- Validation: `[COMP-008]` spec — admin gets 200, non-admin gets 403 (covers `[AC-003]`), empty IDs gets 422, >100 IDs gets 422.
- Done when: All four controller spec cases pass. No PDF or ZIP code exists yet.

### Task 1.2 — InvoiceExportService `[T-002]`
- Objective: Service that accepts invoice IDs, renders each to PDF bytes via the existing renderer, and returns collected results and errors.
- Dependencies: `[T-001]`
- Work: Create `[COMP-003]` implementing `[INTF-002]`. Iterate IDs, call `[COMP-004]` per invoice, rescue per-invoice errors. Return `{ pdfs: [{ id, bytes }], errors: [{ id, reason }] }`.
- Validation: `[COMP-009]` unit tests — happy path, partial failure continues and populates errors list, all-failure returns empty pdfs. Covers `[AC-004]`, `[AC-005]`.
- Done when: `[COMP-009]` passes with mocked `[COMP-004]`. No ZIP or HTTP concern inside the service.

### Task 1.3 — ZipBuilder and streaming response `[T-003]`
- Objective: Assemble the in-memory ZIP from service output and stream it as the HTTP response per `[INTF-001]`.
- Dependencies: `[T-002]`
- Work: Implement `[INTF-003]` wrapping the existing zip library. Write each PDF as `invoice-<id>.pdf` (satisfies `[FR-005]`). Append `errors.txt` if errors present (satisfies `[FR-006]`, `[FR-007]`). Wire `[COMP-002]` to call `[INTF-002]` then `[INTF-003]`. Set `Content-Type: application/zip` and `Content-Disposition` headers per `[INTF-001]`. Benchmark with 100 invoices to verify `[NFR-001]`.
- Validation: `[COMP-008]` spec — correct content-type, correct filename header with today's date, body is valid ZIP with expected files. Covers `[AC-001]`, `[AC-004]`, `[AC-005]`. Benchmark covers `[AC-006]`. Mitigates `[RISK-001]`.
- Done when: `[COMP-008]` passes. 100-invoice benchmark completes in ≤ 10 seconds. Manual `curl` of the endpoint downloads a valid ZIP.

**Phase 1 definition of done:** The export endpoint is fully functional server-side. An admin can POST a list of IDs and receive a valid ZIP. Non-admin is rejected with 403. Partial failures produce `errors.txt`. All of `[AC-003]`, `[AC-004]`, `[AC-005]`, `[AC-006]` are verified.

---

## Phase 2 — Frontend `[P-002]`

### Task 2.1 — Checkbox column and selection state `[T-004]`
- Objective: Add multi-select checkboxes to the invoice list table without breaking existing columns, sorting, or filtering.
- Dependencies: `[T-001]`
- Work: Add checkbox input to each row in `[COMP-005]` keyed by invoice ID. Add "select all on page" header checkbox. Track selection state in `[COMP-006]` keyed by invoice ID (not DOM index) to survive pagination.
- Validation: Manual — checking rows, checking "select all", paginating and returning retains correct selection state. Existing columns, sort, and filter are unaffected. Mitigates `[RISK-003]`.
- Done when: Selection state is accurate across pagination. No regressions in existing table behavior.

### Task 2.2 — Export button and download trigger `[T-005]`
- Objective: Show an active "Export selected (N)" button when invoices are selected; POST to `[INTF-001]` and trigger a browser file download.
- Dependencies: `[T-003]`, `[T-004]`
- Work: Render export button in `[COMP-005]` toolbar. Bind to selection count in `[COMP-006]` — disabled at 0 (satisfies `[FR-002]`), label updates with count. On click: POST `{ ids }` to `[INTF-001]`, create blob URL from response bytes, trigger `<a download>` click (satisfies `[FR-003]`, `[FR-004]`). On error: show inline alert without page reload.
- Validation: Manual — button disabled with 0 selected (covers `[AC-002]`), label shows count, clicking downloads ZIP with correct name (covers `[AC-001]`), server error surfaces in UI.
- Done when: Full golden path works in browser. Button disabled state correct. Error state renders without crash.

**Phase 2 definition of done:** Full end-to-end flow works in the browser. `[AC-001]` and `[AC-002]` are verified manually.

---

## Phase 3 — Integration testing and QA `[P-003]`

### Task 3.1 — System test `[T-006]`
- Objective: Automated end-to-end test covering the full flow with real invoice fixtures.
- Dependencies: `[T-003]`, `[T-005]`
- Work: Write a system spec that logs in as admin, selects N invoices, triggers export, asserts a ZIP is returned with the correct file count and naming. Cover the partial-failure case with a fixture that has missing data.
- Validation: Test green in CI. Covers `[AC-001]`, `[AC-003]`, `[AC-004]`, `[AC-005]`.
- Done when: Test passes in CI on the target branch.

### Task 3.2 — QA pass `[T-007]`
- Objective: Manual verification of all acceptance criteria from the spec.
- Dependencies: `[T-006]`
- Work: Verify `[AC-001]` through `[AC-006]` against the staging environment. Test with 1, 50, and 100 invoices. Confirm 403 for non-admin. Confirm partial failure produces `errors.txt`. Confirm ZIP filename includes today's date. Confirm 100-invoice export completes in ≤ 10 seconds.
- Validation: All six acceptance criteria checked off on the QA sign-off checklist.
- Done when: QA sign-off recorded. Any bugs found are filed and fixed before merge.

**Phase 3 definition of done:** All of `[AC-001]`–`[AC-006]` verified. System test passing in CI. Ready to merge.
