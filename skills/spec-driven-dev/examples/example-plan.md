---
artifact_type: implementation_plan
title: Bulk Invoice Export for Admin Users
slug: bulk-invoice-export
status: draft
source_request: add bulk invoice export for admin users
depends_on:
  - docs/specs/bulk-invoice-export-spec.md
---

# Bulk Invoice Export for Admin Users Implementation Plan

## Summary

Add a server-side bulk export endpoint and extend the invoice list UI with multi-select and an export button. PDF generation reuses the existing single-invoice renderer; the backend zips the results in memory and streams the archive to the browser.

## Scope linkage

Covers `[FR-001]`–`[FR-007]` and `[NFR-001]`–`[NFR-002]` from the spec. Goals addressed: `[G-001]`, `[G-002]`, `[G-003]`.

Resolved open questions:
- `[OQ-001]` cap set at 100 invoices, enforced server-side
- `[OQ-002]` loading spinner only — no per-invoice progress

Deferred:
- `[OQ-003]` audit log — treated as advisory for this iteration; no persistence step included

## Architecture overview

```
Browser (invoice list page)
  └─ POST /admin/invoices/export  { ids: [...] }
        │
        ▼
  AdminInvoiceExportController
        │  validates admin role ([NFR-002]), validates ids (1–100, per [OQ-001])
        ▼
  InvoiceExportService
        │  iterates ids, calls existing PdfRenderer per invoice ([CON-001])
        │  collects results + errors ([FR-006], [FR-007])
        ▼
  ZipBuilder (in-memory, per [CON-004])
        │  streams ZIP back as application/zip response ([FR-004], [FR-005])
        ▼
  Browser downloads file ([FR-003], [G-002])
```

No background jobs (per `[CON-002]`). No persistent storage of generated files (per `[CON-004]`).

## Components and files affected

| ID | Tag | File / location | Change |
|----|-----|----------------|--------|
| `[COMP-001]` | `[exists]` | `routes/admin.rb` | Add `POST /admin/invoices/export` route |
| `[COMP-002]` | `[new]` | `app/controllers/admin/invoice_export_controller.rb` | Export endpoint: auth, param validation, orchestration |
| `[COMP-003]` | `[new]` | `app/services/invoice_export_service.rb` | Iterates IDs, calls PDF renderer, collects results + errors |
| `[COMP-004]` | `[exists]` | `app/services/pdf_renderer.rb` | No change — called as-is per invoice (per `[CON-001]`) |
| `[COMP-005]` | `[exists]` | `app/views/admin/invoices/index.html.erb` | Add checkbox column and export button to toolbar |
| `[COMP-006]` | `[exists]` | `app/javascript/admin/invoice_list.js` | Selection state, button enable/disable, fetch + download trigger |
| `[COMP-007]` | `[exists]` | `app/policies/admin_policy.rb` | Verify export action is allowed for admin role |
| `[COMP-008]` | `[new]` | `spec/controllers/admin/invoice_export_controller_spec.rb` | Controller spec: auth, validation, response shape |
| `[COMP-009]` | `[new]` | `spec/services/invoice_export_service_spec.rb` | Unit tests: happy path, partial failure, all failure |

## Interfaces and contracts

**`[INTF-001]` — POST `/admin/invoices/export`**
- Auth: admin session required; returns 403 otherwise (enforces `[NFR-002]`).
- Request body: `{ "ids": [1, 2, 3] }` — array of integer invoice IDs, 1–100 items.
- Success (200): `Content-Type: application/zip`, `Content-Disposition: attachment; filename="invoices-export-YYYY-MM-DD.zip"`, body is ZIP stream.
- Validation error (422): JSON `{ "error": "..." }` describing the problem.

**`[INTF-002]` — InvoiceExportService**
- Input: array of invoice IDs.
- Output: `{ pdfs: [{ id, bytes }], errors: [{ id, reason }] }`.
- Calls `PdfRenderer.render(invoice)` per invoice; catches per-invoice errors and continues (supports `[FR-006]`, `[FR-007]`).

**`[INTF-003]` — ZipBuilder**
- Input: output of `[INTF-002]`.
- Writes each PDF as `invoice-<id>.pdf` (satisfies `[FR-005]`). Appends `errors.txt` if any errors exist (satisfies `[FR-006]`).
- Returns in-memory ZIP bytes; never writes to disk (enforces `[CON-004]`).

## Data flow

1. User checks invoices → `[COMP-006]` tracks selected IDs in component state.
2. User clicks export → `[COMP-006]` POSTs `{ ids }` to `[INTF-001]`.
3. `[COMP-002]` authenticates, validates, delegates to `[INTF-002]`.
4. `[COMP-003]` iterates IDs, calls `[COMP-004]`, collects bytes + errors.
5. `[INTF-003]` assembles in-memory ZIP.
6. `[COMP-002]` streams ZIP as response with headers per `[INTF-001]`.
7. Browser receives response and triggers download (satisfies `[FR-003]`, `[FR-004]`).

## Error handling

- Per-invoice PDF render failure: caught in `[COMP-003]`, added to errors list; processing continues (supports `[FR-006]`).
- All invoices fail: ZIP still returned with only `errors.txt` (satisfies `[FR-007]`).
- IDs not found in database: treated as per-invoice error in `errors.txt`.
- Zero IDs or >100 IDs: 422 before any rendering starts (enforces `[OQ-001]` resolution).
- Unexpected server error: 500 with generic JSON body; ZIP not partially sent.

## Testing and validation

- Unit test `[COMP-003]` with mocked `[COMP-004]`: happy path, partial failure, all-failure — covers `[AC-004]`, `[AC-005]`.
- Controller spec for `[COMP-002]`: admin auth succeeds, non-admin returns 403 (covers `[AC-003]`), bad params return 422, success returns ZIP content-type.
- System test: real invoice fixtures → valid ZIP with correct file names — covers `[AC-001]`.
- Performance test: 100 invoices complete in ≤ 10 seconds — covers `[AC-006]`.
- Manual QA: button disabled at 0 selected (covers `[AC-002]`); ZIP filename includes today's date (covered by `[AC-001]`).

## Risks and mitigations

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|-----------|--------|-----------|
| `[RISK-001]` | PDF generation slow at 100 invoices, violating `[NFR-001]` | Medium | Export timeout | Benchmark with realistic fixtures in Phase 1; add server timeout guard |
| `[RISK-002]` | Memory pressure from large in-memory ZIP | Low | OOM on server | Cap enforced at 100 IDs per `[OQ-001]`; monitor memory in staging |
| `[RISK-003]` | Checkbox selection state lost on table pagination | Medium | User exports wrong set of invoices | Track selection in `[COMP-006]` keyed by invoice ID, not DOM position |

## Delivery sequence

1. `[COMP-001]`, `[COMP-002]` — route and controller stub with auth and validation; no generation yet.
2. `[COMP-003]`, `[COMP-009]` — `InvoiceExportService` with unit tests; validates `[INTF-002]` contract.
3. `[INTF-003]`, `[COMP-008]` — ZipBuilder integration, stream response via `[INTF-001]`; controller tests pass.
4. `[COMP-005]` — checkbox column and selection state in view.
5. `[COMP-006]` — export button, POST to `[INTF-001]`, download trigger.
6. System test and QA pass against `[AC-001]`–`[AC-006]`.
