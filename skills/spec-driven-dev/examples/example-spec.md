---
artifact_type: spec
title: Bulk Invoice Export for Admin Users
slug: bulk-invoice-export
status: draft
source_request: add bulk invoice export for admin users
depends_on: []
---

# Bulk Invoice Export for Admin Users

## Summary

Allow admin users to select multiple invoices and download them as a single ZIP archive of PDFs in one operation.

## Problem statement

Admins export invoices one at a time today. For month-end reporting and audits, this means repeating the same export action dozens of times. A single bulk export for 50 invoices currently takes 10–15 minutes of manual work, is interrupted by pagination, and produces no record of what was exported. This is the most common manual task reported in admin support requests.

## Goals

- `[G-001]` Admin users can export any set of invoices in a single operation instead of repeating it per invoice.
- `[G-002]` Exports arrive as immediate file downloads without disrupting the admin's current session.
- `[G-003]` The feature covers the realistic range of admin workloads (month-end batches, audit requests) without requiring workarounds.

## Non-goals

- Exporting invoices in formats other than PDF.
- Scheduled or emailed exports.
- Bulk export access for non-admin roles.
- Real-time per-invoice progress tracking (a loading state is sufficient for now).

## Primary users / actors

- **Admin users** — need to export multiple invoices quickly for reporting and audit purposes.
- **Export service** — the backend component that renders PDFs and assembles the archive; interacts with the existing PDF renderer and the HTTP response stream.

## Use cases

- `[UC-001]` An admin selects 10–100 invoices via checkboxes on the invoice list page and clicks "Export selected". The browser downloads a ZIP of PDFs.
- `[UC-002]` An admin filters invoices by date range, uses "Select all on page", and exports the filtered result.
- `[UC-003]` One invoice in a batch fails PDF generation (e.g., missing required data). The remaining invoices export successfully and an error summary is included in the ZIP.

## Functional requirements

- `[FR-001]` When an admin user views the invoice list, a checkbox column is present allowing individual invoice selection.
- `[FR-002]` When at least one invoice is selected, an "Export selected (N)" button is active. When zero invoices are selected, the button is disabled.
- `[FR-003]` When the export button is clicked, the system shows a loading state and begins generating the export.
- `[FR-004]` When the export completes, the browser downloads a file named `invoices-export-<YYYY-MM-DD>.zip`.
- `[FR-005]` Each PDF inside the ZIP is named `invoice-<id>.pdf`.
- `[FR-006]` When one or more invoices fail PDF generation, the ZIP includes an `errors.txt` listing each failed invoice ID and the reason for failure.
- `[FR-007]` When all invoices in a batch fail PDF generation, the ZIP still downloads and contains only `errors.txt`.

## Non-functional requirements

- `[NFR-001]` Export generation completes in ≤ 10 seconds for batches of up to 100 invoices on production hardware.
- `[NFR-002]` Requests to the export endpoint from users without the admin role receive a 403 response with no ZIP generated.

## Constraints

- `[CON-001]` Must use the existing PDF rendering library; no new rendering dependency may be introduced.
- `[CON-002]` Cannot introduce a background job queue; generation must be synchronous.
- `[CON-003]` Must not require changes to the invoice data model.
- `[CON-004]` Generated ZIPs must not be written to persistent storage; they must be streamed directly to the response.

## Assumptions

- `[ASM-001]` The existing invoice list table component supports adding a checkbox column without a rewrite.
- `[ASM-002]` The admin role is already defined and enforced in existing middleware; this feature does not need to define or manage roles.
- `[ASM-003]` The existing single-invoice PDF renderer can be called per-invoice without modification; bulk export reuses that code path.
- `[ASM-004]` The existing app is tested against and supports current-version Chrome, Firefox, and Safari; this feature inherits that browser target.

## Open questions

- `[OQ-001]` `[blocking]` Is 100 invoices the right hard cap, or should it be lower (e.g., 50) or higher? The cap affects `[NFR-001]` and server resource planning. Owner: product + infra.
- `[OQ-002]` `[advisory]` Is a loading spinner sufficient, or does the product team want a per-invoice progress indicator? Does not affect architecture. Owner: product.
- `[OQ-003]` `[blocking]` Is an audit log entry required when a bulk export occurs? If yes, this requires a persistence step and may touch the data model, affecting `[CON-003]`. Owner: compliance / product.

## Acceptance criteria

- `[AC-001]` `covers [FR-001], [FR-002], [FR-003], [FR-004], [FR-005]` An admin user selects 3 invoices, clicks "Export selected", and the browser downloads `invoices-export-<today's date>.zip` containing three files named `invoice-<id>.pdf`.
- `[AC-002]` `covers [FR-002]` With zero invoices selected, the "Export selected" button is present but disabled and cannot be clicked.
- `[AC-003]` `covers [NFR-002]` A user without the admin role POSTs to the export endpoint and receives a 403 response. No ZIP is generated.
- `[AC-004]` `covers [FR-006], [FR-007]` A batch where one invoice has missing required data produces a ZIP that includes `errors.txt` naming the failed invoice ID and reason. All other invoices in the batch are present as PDFs.
- `[AC-005]` `covers [FR-007]` A batch where every invoice fails produces a ZIP containing only `errors.txt`. The download still occurs (no server error response).
- `[AC-006]` `covers [NFR-001]` Exporting 100 invoices from the staging dataset completes in ≤ 10 seconds measured from button click to download start.
