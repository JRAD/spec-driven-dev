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

Covers FR-1 through FR-7 and NFR-1 through NFR-2 from the spec. OQ-1 (cap) resolved at 100 invoices enforced server-side. OQ-2 resolved as loading spinner only. OQ-3 (audit log) deferred — treated as advisory for now.

## Architecture overview

```
Browser (invoice list page)
  └─ POST /admin/invoices/export  { ids: [...] }
        │
        ▼
  AdminInvoiceExportController
        │  validates admin role, validates ids (1–100)
        ▼
  InvoiceExportService
        │  iterates ids, calls existing PdfRenderer per invoice
        │  collects results + errors
        ▼
  ZipBuilder (in-memory)
        │  streams ZIP back as application/zip response
        ▼
  Browser downloads file
```

No background jobs. No persistent storage of generated files.

## Components and files affected

| Tag | File / location | Change |
|-----|----------------|--------|
| `[exists]` | `routes/admin.rb` | Add `POST /admin/invoices/export` route |
| `[new]` | `app/controllers/admin/invoice_export_controller.rb` | Export endpoint: auth, param validation, orchestration |
| `[new]` | `app/services/invoice_export_service.rb` | Iterates IDs, calls PDF renderer, collects results + errors |
| `[exists]` | `app/services/pdf_renderer.rb` | No change — called as-is per invoice |
| `[exists]` | `app/views/admin/invoices/index.html.erb` | Add checkbox column and export button to toolbar |
| `[exists]` | `app/javascript/admin/invoice_list.js` | Selection state, button enable/disable, fetch + download trigger |
| `[exists]` | `app/policies/admin_policy.rb` | Verify export action is allowed for admin role |
| `[new]` | `spec/controllers/admin/invoice_export_controller_spec.rb` | Controller spec: auth, validation, response shape |
| `[new]` | `spec/services/invoice_export_service_spec.rb` | Unit tests: happy path, partial failure, all failure |

## Interfaces and contracts

**POST `/admin/invoices/export`**
- Auth: admin session required; returns 403 otherwise.
- Request body: `{ "ids": [1, 2, 3] }` — array of integer invoice IDs, 1–100 items.
- Success (200): `Content-Type: application/zip`, `Content-Disposition: attachment; filename="invoices-export-YYYY-MM-DD.zip"`, body is ZIP stream.
- Validation error (422): JSON `{ "error": "..." }` describing the problem.

**InvoiceExportService**
- Input: array of invoice IDs.
- Output: `{ pdfs: [{ id, bytes }], errors: [{ id, reason }] }`.
- Calls `PdfRenderer.render(invoice)` per invoice; catches per-invoice errors and continues.

**ZipBuilder**
- Wraps the existing zip library. Writes each PDF as `invoice-<id>.pdf`. Appends `errors.txt` if any errors exist.

## Data flow

1. User checks invoices → JS tracks selected IDs in component state.
2. User clicks export → JS POSTs `{ ids }` to endpoint.
3. Controller authenticates, validates, delegates to `InvoiceExportService`.
4. Service iterates IDs, renders PDFs, collects bytes + errors.
5. `ZipBuilder` assembles in-memory ZIP.
6. Controller streams ZIP as response with correct headers.
7. Browser receives response and triggers download.

## Error handling

- Per-invoice PDF render failure: caught, logged, added to `errors` list; processing continues.
- All invoices fail: ZIP still returned with only `errors.txt` inside.
- IDs not found in database: treated as a per-invoice error in `errors.txt`; not a hard failure.
- Zero IDs or >100 IDs submitted: 422 before any rendering starts.
- Unexpected server error: 500 with generic JSON error body; ZIP is not partially sent.

## Testing and validation

- Unit test `InvoiceExportService` with mocked `PdfRenderer`: happy path, partial failure, all failure.
- Controller spec: admin auth succeeds, non-admin returns 403, bad params return 422, success returns ZIP content-type.
- System test: real invoice fixtures → valid ZIP downloaded with correct file names.
- Manual QA: select 1, 50, 100 invoices; verify ZIP contents and naming; verify button disabled at 0 selected.

## Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| PDF generation slow at 100 invoices | Medium | Timeout (violates NFR-1) | Benchmark with realistic fixtures early; add server timeout guard |
| Memory pressure from large in-memory ZIP | Low | OOM on server | Cap at 100 IDs; monitor memory in staging |
| Checkbox state lost on pagination | Medium | UX confusion | Track selection in JS keyed by invoice ID, not DOM position |

## Delivery sequence

1. Backend: route, controller stub, authorization check, 422 validation.
2. Backend: `InvoiceExportService` with unit tests.
3. Backend: `ZipBuilder` integration, stream response, controller tests.
4. Frontend: checkbox column and selection state.
5. Frontend: export button enable/disable logic and POST + download trigger.
6. Integration/system test and QA pass.
