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

## Phase 1 — Backend foundation

### Task 1.1 — Route and controller stub
- Objective: Register `POST /admin/invoices/export` with auth and param validation only (no PDF generation yet).
- Dependencies: none
- Work: Add route entry. Create `AdminInvoiceExportController` with `create` action. Enforce admin role via existing policy. Return 422 for zero IDs or >100 IDs. Return 200 OK placeholder.
- Validation: Controller spec — admin gets 200, non-admin gets 403, empty IDs gets 422, >100 IDs gets 422.
- Done when: All four spec cases pass; no PDF or ZIP code exists yet.

### Task 1.2 — InvoiceExportService
- Objective: Service that accepts invoice IDs, renders each to PDF bytes via the existing renderer, and returns collected results and errors.
- Dependencies: Task 1.1
- Work: Create `InvoiceExportService`. Iterate IDs, call `PdfRenderer.render(invoice)` per invoice, rescue per-invoice errors. Return `{ pdfs: [{ id, bytes }], errors: [{ id, reason }] }`.
- Validation: Unit tests — all succeed, partial failure continues and populates errors, all fail returns empty pdfs list.
- Done when: Unit tests pass with mocked `PdfRenderer`; no ZIP or HTTP concern in the service.

### Task 1.3 — ZipBuilder and streaming response
- Objective: Assemble the in-memory ZIP from service output and stream it as the HTTP response.
- Dependencies: Task 1.2
- Work: Create `ZipBuilder` wrapping existing zip library. Write each PDF as `invoice-<id>.pdf`. Append `errors.txt` if errors present. Wire controller to call service then ZipBuilder. Set correct headers and stream body.
- Validation: Controller spec — correct content-type, correct filename header, body is a valid ZIP containing expected files.
- Done when: Controller spec passes; manual test of the endpoint downloads a valid ZIP.

**Phase 1 definition of done:** Admin can POST a list of IDs and receive a valid ZIP. Non-admin is rejected. Partial failures produce `errors.txt`.

---

## Phase 2 — Frontend

### Task 2.1 — Checkbox column on invoice list
- Objective: Add a multi-select checkbox column to the admin invoice list table without breaking existing columns, sorting, or filtering.
- Dependencies: Phase 1 complete
- Work: Add checkbox input to each row keyed by invoice ID. Add a "select all on page" header checkbox. Track selection state in JS keyed by invoice ID (not DOM index). Retain state across pagination.
- Validation: Manual — checking rows, checking "select all", paginating and returning retains selection; existing columns and sort are unaffected.
- Done when: Selection state correct across pagination; no regressions in existing table behavior.

### Task 2.2 — Export button and download trigger
- Objective: Show an active "Export selected (N)" button when invoices are selected; POST to the endpoint and trigger a browser file download.
- Dependencies: Task 2.1
- Work: Render export button in toolbar. Bind to selection count — disabled at 0, label updates with count. On click: POST `{ ids }` via `fetch`, create blob URL from response, trigger `<a download>` click. On error: show inline alert without page reload.
- Validation: Manual — button disabled with 0 selected, label shows count, clicking downloads ZIP with correct name, server error surfaces in UI.
- Done when: Full golden path works in browser; error state renders without crash.

**Phase 2 definition of done:** Full end-to-end flow works in the browser. Checkboxes, selection state, button, and download all behave correctly.

---

## Phase 3 — Integration testing and QA

### Task 3.1 — System/integration test
- Objective: Automated end-to-end test covering the full flow with real invoice fixtures.
- Dependencies: Phase 1 and Phase 2 complete
- Work: Write a system spec that logs in as admin, selects N invoices, triggers export, asserts a ZIP is returned with the correct file count and naming convention.
- Validation: Test passes in CI.
- Done when: Test green in CI on the target branch.

### Task 3.2 — QA pass
- Objective: Manual verification of all acceptance criteria from the spec.
- Dependencies: Task 3.1
- Work: Verify AC-1 through AC-5. Test with 1, 50, and 100 invoices. Confirm 403 for non-admin. Confirm partial failure produces `errors.txt`. Confirm ZIP filename includes today's date.
- Validation: All acceptance criteria checked off.
- Done when: QA sign-off recorded; any bugs found are filed and fixed before merge.

**Phase 3 definition of done:** All spec acceptance criteria verified. System test passing in CI. Ready to merge.
