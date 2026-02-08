

# Demo Stress Test Plan + Portal Documentation for Gemini App

## Part 1: Fix the Build Error (Blocker)

Before any testing, the TypeScript build error in `src/main.tsx` must be resolved. The `ResizeObserver` override is using a function instead of a class constructor, causing:

```
Type '(callback: ResizeObserverCallback) => ResizeObserver' is not assignable to type '{ new (callback: ResizeObserverCallback): ResizeObserver; prototype: ResizeObserver; }'.
```

**Fix:** Wrap the override with a proper class or use `as any` cast to satisfy TypeScript while preserving the crash-prevention behavior.

---

## Part 2: Demo Stress Test Checklist

Below is a structured walkthrough of every critical pathway, organized by portal zone. Each item should be tested manually end-to-end.

### Zone 1: Public Directory (Unauthenticated)

| # | Test | Route | Expected Result |
|---|------|-------|-----------------|
| 1 | Landing page loads | `/` | Brand Directory renders with search bar, brand cards |
| 2 | Search filters brands | `/` | Typing in search bar filters brand cards in real time |
| 3 | Brand profile loads | `/brands/:id` | Grade badge, trust metrics, disclaimers render correctly |
| 4 | "Shop Verified Product" button | `/brands/:id` | Opens affiliate_link in new tab (falls back to website) |
| 5 | Mobile CTA bar | `/brands/:id` (mobile) | Fixed bottom "Shop" button visible on small viewports |
| 6 | "Back to Directory" works | `/brands/:id` | Returns to `/brands` without errors |
| 7 | Login buttons visible | `/` | "Partner Login" and "Admin Login" buttons route correctly |

### Zone 2: Authentication

| # | Test | Route | Expected Result |
|---|------|-------|-----------------|
| 8 | Admin login | `/admin/login` | Accepts valid credentials, redirects to `/admin` |
| 9 | Admin login rejection | `/admin/login` | Invalid credentials show error toast |
| 10 | Partner login | `/partner/login` | Accepts valid credentials, redirects to `/partner` |
| 11 | Wrong role rejection | `/admin/login` | Partner-only user sees "Access Denied" toast |
| 12 | Sign out from admin | `/admin` | Clears session, redirects to `/admin/login` |
| 13 | Sign out from partner | `/partner` | Clears session, sign out works cleanly |
| 14 | Protected route redirect | `/admin` (unauthenticated) | Redirects to `/admin/login` |

### Zone 3: Admin Command Center

| # | Test | Route | Expected Result |
|---|------|-------|-----------------|
| 15 | Dashboard loads | `/admin` | 6 pillar cards render (Growth, Operations, Intelligence, Medical, Financials, Gateways) |
| 16 | Portal Map menu | `/admin` | Opens via trigger button, all links navigate correctly |
| 17 | Command Palette | `/admin` | Search opens, results are clickable |
| 18 | Breadcrumb navigation | Any admin sub-page | Breadcrumbs render and are clickable |
| 19 | Settings page loads | `/admin/settings` | No crashes, settings render |
| 20 | Medical Review loads | `/admin/medical-review` | Intake Queue and Evaluation Lab tabs render |
| 21 | Deals CRM | `/admin/deals` | Deals list loads, create/edit/delete dialogs work |
| 22 | Brand Directory (admin) | `/admin/brands` | Admin brand list renders |
| 23 | User Management | `/admin/users` | User list renders |
| 24 | Analytics page | `/admin/analytics` | Placeholder or analytics content loads without crash |
| 25 | Finance page | `/admin/finance` | Placeholder or finance content loads without crash |
| 26 | Gateways page | `/admin/gateways` | Loads without crashing (previously had build errors) |
| 27 | Internal Dashboard | `/admin/internal-dashboard` | Tracking bar and channel accordions render |

### Zone 4: Partner Portal

| # | Test | Route | Expected Result |
|---|------|-------|-----------------|
| 28 | Partner dashboard loads | `/partner` | Welcome section, performance cards, deals list render |
| 29 | New submission wizard | `/partner` (click "New Submission") | Onboarding wizard opens and steps are navigable |
| 30 | Role switching | `/partner` | Admin user can switch to admin via button |
| 31 | Admin preview mode | `/partner?preview=true` | Shows yellow "Admin Preview Mode" banner |

### Zone 5: Legacy Redirects

| # | Test | Route | Expected Result |
|---|------|-------|-----------------|
| 32 | `/auth` redirect | `/auth` | Redirects to `/admin/login` |
| 33 | `/auth/admin` redirect | `/auth/admin` | Redirects to `/admin/login` |
| 34 | `/auth/partner` redirect | `/auth/partner` | Redirects to `/partner/login` |
| 35 | `/admin/admin-settings` redirect | `/admin/admin-settings` | Redirects to `/admin/settings` |
| 36 | 404 page | `/nonexistent-route` | NotFound page renders cleanly |

### Zone 6: Error Handling

| # | Test | Expected Result |
|---|------|-----------------|
| 37 | Global error boundary | If a component crashes, "Something went wrong" UI shows with "Reload Page" button |
| 38 | Section error boundaries | A crash in Partner Dashboard does not crash Admin Layout |
| 39 | Network failure graceful handling | If database is unreachable, loading states or error messages appear (not white screen) |

---

## Part 3: Update External Gemini App

Since your Gemini app is an external application, I will prepare a comprehensive **Portal Architecture Brief** that you can copy into your Gemini app's context/knowledge base. This document will cover:

1. **Route Map** -- Every route in the portal with its purpose and access requirements
2. **Database Schema Summary** -- Key tables (partners, medical_reviews, campaign_deals, user_roles, etc.) and their relationships
3. **Authentication Model** -- How roles (admin/partner) are assigned and enforced
4. **Public vs. Admin Separation** -- The architectural boundary between public directory code and internal admin tools
5. **Feature Inventory** -- Medical Review Engine, Deals CRM, Brand Directory, Affiliate Conversion system, etc.
6. **Design System** -- "Pulse & Precision" (0px borders, #1ABC9C teal, healthcare-teal tokens)

This will be output as a structured markdown document you can directly paste into your Gemini app's system prompt or knowledge base.

---

## Implementation Steps

| Step | Description |
|------|-------------|
| 1 | Fix `src/main.tsx` TypeScript build error (ResizeObserver cast) |
| 2 | Generate the Portal Architecture Brief markdown document |
| 3 | Run through the 39-item stress test checklist in the browser |
| 4 | Fix any issues discovered during testing |

---

## Technical Details

### Build Error Fix (main.tsx)

The current code assigns a regular function to `window.ResizeObserver`, but TypeScript expects a constructor (class). The fix uses a TypeScript cast (`as any`) to preserve the crash-prevention wrapper while satisfying the type system. No behavioral change.

### Portal Architecture Brief

Will be created as a standalone markdown file at a path like `docs/portal-architecture-brief.md` containing the full portal specification for your Gemini app.
