# SOA Queue Components — Analysis Report

**Date:** 2026-03-10
**Scope:** All components related to the SOA Queue pages in the ai-paraplanner app

---

## 1. Data Source

**No dummy/hardcoded data.** Both queue pages hit the real PrimeSolve API through the entity proxy layer.

The call chain is:
```
Page → base44.entities.SOARequest.filter(...) → createEntityProxy('advice-requests') → axiosInstance.get('/advice-requests', { params })
```

- **AdviserSOARequests** (line 37): `SOARequest.filter({ created_by: currentUser.email }, '-created_date')`
- **AdviceGroupSOARequests** (line 41): `SOARequest.filter({ advice_group_id: groupId }, '-created_date')`

Client names in the Adviser page are resolved with a secondary call per row:
`Client.filter({ id: req.client_id })` or `Client.filter({ email: req.client_email })` (lines 46–53).

The AdviceGroup page uses `req.client_name` directly from the API response without resolution.

---

## 2. View Button Behaviour

### AdviserSOARequests (lines 327–357)
Uses a dedicated `AdviserViewButton` sub-component:
1. Calls `SoaDocument.filter({ soa_request_id })` to check for a generated SOA document.
2. If a `SoaDocument` exists → navigates to `/SOABuilder?id={doc.id}`
3. If no document exists (or the call errors) → navigates to `/SOARequestWelcome?id={soaRequestId}`

### AdviceGroupSOARequests (line 233)
**Dead button.** Renders `<button>View</button>` with **no `onClick` handler** — clicking it does nothing.

---

## 3. Entity / API Mapping

| Entity (Base44 name) | API Endpoint | Used By |
|-|-|-|
| `SOARequest` | `advice-requests` | Primary entity for both queue pages |
| `SoaDocument` | `soa-documents` | Checked on View click (Adviser page only) |
| `AdviceRecord` | `advice-records` | Created when a new SOA request is submitted via `NewSOARequestModal` |
| `Client` | `clients` | Client name resolution (Adviser page) |
| `AdviceGroup` | `tenants` | Group name resolution (AdviceGroup page) |
| `FactFind` | `advice-requests` | Fact Find status checked in `NewSOARequestModal` |

All entity proxies are defined in `src/api/primeSolveClient.js` (lines 234–252).

---

## 4. Table Columns Per Page

### AdviserSOARequests — 7 columns

| Column | Source Field | Notes |
|-|-|-|
| Client | `client_name` | Resolved from `Client` entity via `client_id` or `client_email` |
| Type | `req.type` | Falls back to `'Comprehensive'` |
| Status | `req.status` | Values: `draft`, `in_progress`, `submitted`, `completed` |
| Priority | `req.priority` | Values: `high`, `normal`, `low` (defaults to `normal`) |
| Submitted | `req.submitted_date` | Formatted via `formatDate()` |
| Due | `req.completed_date` | Formatted via `formatDate()`, colour-coded red/green |
| Actions | — | View button + Download (if completed) + dropdown (Edit / Delete) |

### AdviceGroupSOARequests — 7 columns

| Column | Source Field | Notes |
|-|-|-|
| Checkbox | — | Static `<Checkbox />`, no state wired |
| SOA Request | `req.id` | Displays request ID |
| Client | `req.client_name` | Raw from API, not resolved like the adviser page |
| Status | `req.status` | Broader set: `submitted`, `in_progress`, `in_review`, `completed`, `on_hold`, `revision_requested` |
| Progress | `req.completion_percentage` | Renders a progress bar, defaults to `0` |
| Submitted | `req.created_date` | Formatted via `formatDate()` |
| Actions | — | Dead "View" button (no onClick handler) |

---

## 5. Issues & Gaps Identified

| # | Issue | Location | Severity |
|-|-|-|-|
| 1 | **View button is non-functional** on AdviceGroup page | `AdviceGroupSOARequests.jsx:233` | High |
| 2 | **Checkbox column has no state** — cannot select rows | `AdviceGroupSOARequests.jsx:209` | Medium |
| 3 | **Pagination is non-functional** on AdviceGroup page — hardcoded to page 1, Prev/Next buttons have no handlers | `AdviceGroupSOARequests.jsx:247-255` | Medium |
| 4 | **Stats are calculated but never reflected** — `stats` is a `const` object mutated after render, so the UI always shows zeros | `AdviceGroupSOARequests.jsx:21-26, 54-56` | High |
| 5 | **N+1 client name resolution** — Adviser page makes one API call per row to resolve client names | `AdviserSOARequests.jsx:42-63` | Low (perf) |
| 6 | **Download button is non-functional** — renders but has no `onClick` | `AdviserSOARequests.jsx:251` | Medium |
| 7 | **Edit/Delete dropdown items are non-functional** — no `onClick` handlers | `AdviserSOARequests.jsx:262-267` | Medium |
| 8 | **`FactFind` and `SOARequest` map to same endpoint** (`advice-requests`) | `primeSolveClient.js:240-241` | Info |

---

## 6. File Inventory

### Queue Pages
- `src/pages/AdviserSOARequests.jsx` — Adviser's SOA queue (357 lines)
- `src/pages/AdviceGroupSOARequests.jsx` — Advice Group's SOA queue (261 lines)

### API Layer
- `src/api/primeSolveClient.js` — Entity proxy definitions & API adapters (508 lines)
- `src/api/base44Client.js` — Re-export wrapper
- `src/api/axiosInstance.js` — Axios instance with auth interceptors

### Supporting Components
- `src/components/adviser/NewSOARequestModal.jsx` — Modal to create new SOA requests
- `src/components/RoleContext.jsx` — Role-based context (used by AdviceGroup page)
- `src/utils/dateUtils.js` — Date formatting utilities (`formatDate`, `formatRelativeDate`)
- `src/utils/adviceRecordHelpers.js` — AdviceRecord creation helpers

### SOA Builder Flow (downstream from View button)
- `src/pages/SOARequestWelcome.jsx` — Entry point when no SoaDocument exists
- `src/pages/SOABuilder.jsx` — Full SOA document builder (when SoaDocument exists)
- Plus 10 additional SOA step pages (Prefill, Scope, Products, Insurance, Transactions, Portfolio, Strategy, Assumptions, Details, Review)
