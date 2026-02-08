# Portal Architecture Brief — Gemini App Knowledge Base

> **Last Updated:** 2026-02-08
> **Purpose:** Comprehensive reference for an external Gemini app to understand the full portal architecture, database schema, authentication model, and feature set.

---

## 1. Route Map

### Public Zone (Unauthenticated)

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `PublicBrandDirectory` | Public-facing brand directory with search, grade badges, and login buttons |
| `/brand-application` | `BrandIntegrityPortal` | Public brand application/onboarding form |

### Authentication Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin/login` | `AdminLogin` | Admin sign-in with email/password, Zod validation, role verification |
| `/partner/login` | `PartnerLogin` | Partner sign-in with email/password, role verification |

### Partner Zone (Requires `partner` role)

| Route | Component | Description |
|-------|-----------|-------------|
| `/partner` | `PartnerDashboard` | Partner command center: performance snapshot, deals, resource center, submissions |
| `/partner/onboarding` | `OnboardingWizard` | Multi-step campaign onboarding wizard |

### Admin Zone (Requires `admin` role, wrapped in `AdminLayout`)

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin` | `AdminDashboard` | 6-pillar command center: Growth, Operations, Intelligence, Medical, Financials, Gateways |
| `/admin/queue` | `AdminQueue` | Campaign submission queue |
| `/admin/submission/:id` | `SubmissionReview` | Individual submission review page |
| `/admin/stakeholders` | `StakeholderDashboard` | Stakeholder management |
| `/admin/users` | `UserManagement` | User list with role management (admin/partner toggle) |
| `/admin/brands` | `BrandDirectory` | Admin brand directory with 360° expansion, manager assignment, deal values, medical status |
| `/admin/deals` | `DealsManagement` | Deals CRM: create/edit/delete deals, stats cards, partner linking |
| `/admin/native` | `NativeView` | Native content channel management |
| `/admin/paid-social` | `PaidSocialView` | Paid social channel management |
| `/admin/media` | `MediaView` | Media channel management |
| `/admin/newsletter` | `NewsletterView` | Newsletter channel management |
| `/admin/content-marketing` | `ContentMarketingView` | Content marketing channel management |
| `/admin/settings` | `AdminSettings` | App configuration management: dropdowns, taxonomies, CSV import/export, drag-to-reorder |
| `/admin/external-hub` | `ExternalAccessHub` | External access management |
| `/admin/medical-review` | `MedicalReviewPage` | Medical review engine: Intake Queue + Evaluation Lab tabs |
| `/admin/analytics` | `AdminAnalyticsPage` | Intelligence placeholder (coming soon) |
| `/admin/finance` | `AdminFinancePage` | Financials placeholder (coming soon) |
| `/admin/gateways` | `AdminGatewaysPage` | External gateways: public directory CMS, partner access management, API integrations |
| `/admin/internal-dashboard` | `InternalDashboard` | Internal tracking dashboard with channel accordions |

### Legacy Redirects

| Old Route | Redirects To |
|-----------|-------------|
| `/auth` | `/admin/login` |
| `/auth/admin` | `/admin/login` |
| `/auth/partner` | `/partner/login` |
| `/internal-dashboard` | `/admin/internal-dashboard` |
| `/admin/admin-settings` | `/admin/settings` |

### Error Handling

| Route | Component | Description |
|-------|-----------|-------------|
| `*` (catch-all) | `NotFound` | 404 page with "Return to Home" link |

---

## 2. Database Schema Summary

### Core Tables

#### `partners`
Primary entity representing a brand/company in the system.
- `id` (UUID, PK)
- `user_id` (UUID) — links to auth.users
- `company_name` (text, required)
- `primary_contact_name`, `primary_contact_email` (text)
- `secondary_contact_name`, `secondary_contact_email` (text)
- `category` (text)
- `website`, `affiliate_link` (text)
- `assigned_manager_id` (UUID) — internal team member
- `submission_date`, `target_launch_date` (timestamptz)

#### `user_roles`
Role-based access control table.
- `id` (UUID, PK)
- `user_id` (UUID)
- `role` (enum: `admin` | `partner`)
- `created_at` (timestamptz)

#### `profiles`
Extended user profile data (mirrors auth.users).
- `id` (UUID, PK) — matches auth.users.id
- `email`, `full_name`, `company_name` (text)
- `created_at`, `updated_at` (timestamptz)

### Campaign & Deals

#### `campaign_deals`
Tracks commercial deals linked to partners.
- `id` (UUID, PK)
- `partner_id` (UUID, FK → partners)
- `deal_name` (text, required)
- `deal_value` (numeric)
- `contract_status` (enum: `draft` | `signed` | `expired`)
- `funnel_stage` (enum: `prospecting` | `qualification` | `proposal` | `negotiation` | `closed_won` | `closed_lost`)
- `start_date`, `end_date` (date)
- `assigned_internal_manager` (text)
- `notes` (text)

#### `campaign_status`
Tracks campaign stage/priority per partner (one-to-one with partners).
- `partner_id` (UUID, FK → partners, unique)
- `stage`, `priority` (text)
- `next_meeting_date`, `campaign_conclusion_date` (timestamptz)

#### `campaign_analytics`
Performance metrics per deal per period.
- `campaign_id` (UUID, FK → campaign_deals)
- `impressions`, `clicks`, `conversions` (int)
- `spend`, `revenue`, `cac` (numeric)
- `period_start`, `period_end` (date)

### Medical Review Engine

#### `medical_reviews`
Core medical evaluation records.
- `id` (UUID, PK)
- `partner_id` (UUID, FK → partners)
- `deal_id` (UUID, FK → campaign_deals, nullable)
- `status` (enum: `pending_bd_approval` | `in_medical_review` | `approved` | `rejected` | `requires_revision`)
- `clinical_evidence_score`, `safety_score`, `transparency_score` (numeric 0-100)
- `overall_grade` (text: A/B/C/D/F)
- `clinical_claims`, `safety_concerns`, `required_disclaimers` (text[])
- `medical_reviewer_id`, `bd_approved_by`, `final_decision_by` (UUID)
- `medical_notes`, `bd_notes`, `final_decision_notes` (text)
- `estimated_revenue` (numeric)

#### `brand_applications`
Public brand application submissions.
- `brand_name`, `contact_name`, `contact_email` (text, required)
- `brand_url`, `category`, `primary_health_goal` (text)
- `coa_file_urls`, `ingredient_docs_urls`, `clinical_trial_links` (text[])
- `payment_status`, `status` (text)
- `tracker_id` (text, unique tracking code)
- `medical_review_id` (UUID, FK → medical_reviews)

### Creative Assets

#### `creative_assets`
Channel-specific creative content submitted by partners.
- `partner_id` (UUID, FK → partners)
- `deal_id` (UUID, FK → campaign_deals, nullable)
- `channel` (text: native, paid-social, media, newsletter, content-marketing)
- `copy_text`, `promo_copy`, `affiliate_link` (text)
- `file_urls` (text[])
- `driver_types` (text[])
- `is_complete`, `is_draft` (boolean)

#### `asset_feedback`
Review feedback on creative assets.
- `asset_id` (UUID, FK → creative_assets)
- `reviewer_id` (UUID)
- `status` (text: approved, needs_revision)
- `comments` (text)

### Content Inventory (4-level hierarchy)

```
content_verticals
  └── content_sub_verticals
        └── content_categories
              └── content_k1_clusters
                    └── content_articles
                          └── content_ad_units
```

#### `content_placements`
Ad placement bookings with scheduling.
- `name`, `placement_type`, `property` (text)
- `deal_id` (UUID, FK → campaign_deals)
- `status` (enum: `available` | `pitched` | `booked` | `upcoming`)
- `scheduled_date`, `end_date` (date)
- `rate` (numeric), `rate_type` (text)

### Operations & Supply Chain

#### `inventory_items`
Physical inventory tracking.
- `sku` (text, required)
- `name`, `category`, `warehouse_location` (text)
- `current_stock`, `reorder_level`, `reorder_quantity` (int)
- `unit_cost` (numeric)
- `supplier_id` (UUID, FK → suppliers)

#### `suppliers`
Vendor/supplier records.
- `name` (text, required)
- `contact_name`, `contact_email`, `contact_phone`, `address` (text)
- `payment_terms` (text)

#### `purchase_orders` / `purchase_order_items`
Purchase order management with line items.
- `po_number` (text, required)
- `supplier_id` (UUID, FK → suppliers)
- `status` (enum: `draft` | `submitted` | `approved` | `ordered` | `partially_received` | `received` | `cancelled`)
- `subtotal`, `tax`, `shipping`, `total` (numeric)

### Financials

#### `monthly_billables`
Monthly billing reconciliation per brand per network.
- `master_brand_id` (UUID, FK → master_brands)
- `billing_month` (text: YYYY-MM)
- `network` (text)
- `conversions` (int)
- `gross_revenue`, `network_reported_payout`, `internal_tracked_payout` (numeric)
- `is_approved` (boolean)
- `dispute_status`, `dispute_notes` (text)

#### `master_brands`
Brand identity normalization across networks.
- `common_id` (text) — canonical identifier
- `name` (text)

#### `network_brand_mappings`
Maps network-specific brand names to master brands.
- `master_brand_id` (UUID, FK → master_brands)
- `network` (text)
- `network_brand_name`, `network_brand_id` (text)

#### `network_api_status`
API connection health monitoring.
- `network` (text)
- `is_connected` (boolean)
- `last_sync_at` (timestamptz)
- `last_error` (text)

### Sales Pipeline

#### `prospects`
Pre-partner lead tracking.
- `company_name`, `contact_name`, `contact_email` (text, required)
- `stage` (enum: `prospecting` | `initial_pitch` | `negotiation` | `contract_sent` | `closed_won` | `closed_lost`)
- `estimated_deal_value` (numeric)
- `source`, `industry` (text)
- `assigned_to`, `created_by` (UUID)

### Miscellaneous

#### `stakeholders` — contacts linked to partners
#### `brand_comments` — internal notes on partners
#### `admin_reviews` — step-level review tracking for campaigns
#### `operational_insights` — weekly ops snapshots per partner
#### `app_configurations` — system-wide dropdown/taxonomy management
#### `public_review_requests` — public brand review request tracking

---

## 3. Authentication Model

### Technology
- **Supabase Auth** (email/password)
- **Role-based access** via `user_roles` table (not Supabase built-in roles)

### Roles
| Role | Access |
|------|--------|
| `admin` | Full access to `/admin/*` routes, can preview partner portal via `?preview=true` |
| `partner` | Access to `/partner/*` routes only |
| Both | User sees role selector, can switch between admin and partner portals |

### Auth Flow
1. User signs in via `/admin/login` or `/partner/login`
2. `AuthContext` fetches roles from `user_roles` table
3. `ProtectedRoute` component enforces role requirements
4. If user has wrong role, they get "Access Denied" toast and are signed out
5. If user has multiple roles, `activeRole` is stored in localStorage

### Key Components
- `AuthContext` (`src/contexts/AuthContext.tsx`) — provides `user`, `session`, `roles`, `activeRole`, `signIn`, `signOut`, `setActiveRole`
- `ProtectedRoute` (`src/components/ProtectedRoute.tsx`) — route guard that checks roles and redirects
- `RoleRouter` (`src/pages/RoleRouter.tsx`) — multi-role selector (legacy, currently unused in routing)

---

## 4. Public vs. Admin Separation

### Architectural Boundary
- **Public code**: `src/pages/public/*` — completely independent, no admin imports
- **Admin code**: `src/pages/admin/*`, `src/components/admin/*` — internal tools
- **Partner code**: `src/pages/partner/*` — partner-facing portal

### Design Intent
The admin side is architecturally isolated so it could eventually be packaged and sold as a SaaS product to other healthcare media companies without coupling to the public brand directory.

### Shared Layer
- `src/contexts/AuthContext.tsx` — authentication (used by both)
- `src/components/ui/*` — shadcn/ui design system components
- `src/hooks/*` — shared data hooks
- `src/integrations/supabase/*` — database client and types

---

## 5. Feature Inventory

### 5.1 Medical Review Engine (`/admin/medical-review`)
- **Intake Queue**: View pending medical reviews, approve/reject for medical evaluation
- **Evaluation Lab**: Score brands on clinical evidence, safety, and transparency (0-100 scales)
- **Grade Calculation**: Weighted average → letter grade (A/B/C/D/F)
- **Status Flow**: `pending_bd_approval` → `in_medical_review` → `approved`/`rejected`/`requires_revision`

### 5.2 Deals CRM (`/admin/deals`)
- CRUD operations on campaign deals
- Link deals to partners
- Stats cards: total deals, total value, signed contracts, drafts
- Search and filter
- Contract status tracking (draft/signed/expired)

### 5.3 Brand Directory (`/admin/brands`)
- 360° brand view with expandable cards
- Manager assignment (dropdown of team members)
- Medical status indicator
- Deal value badges
- Meeting countdown timers
- Creative history navigation
- Call Prep Export
- Search with "My Brands Only" filter

### 5.4 Public Brand Directory (`/`)
- Search brands by name
- Medical grade badges (A-F)
- Review status indicators
- Partner Login / Admin Login buttons
- SEO metadata via react-helmet-async

### 5.5 Partner Dashboard (`/partner`)
- Performance snapshot (clicks, conversions, revenue — coming soon)
- Asset status progress bar
- Active deals list with contract status
- Resource center (downloads — coming soon)
- New Submission wizard
- Role switching for dual-role users

### 5.6 Admin Settings (`/admin/settings`)
- System-wide configuration management
- Grouped categories: Sales & CRM, Operations, Content, Medical
- CRUD on dropdown options
- Drag-to-reorder
- CSV import/export

### 5.7 External Gateways (`/admin/gateways`)
- Public Directory CMS controls (maintenance mode toggle)
- Partner Access management (invite partner, access log, revoke access)
- API Integrations placeholder

### 5.8 User Management (`/admin/users`)
- User list with search
- Role management dialog (toggle admin/partner roles)
- Stats: total users, admins, partners

### 5.9 Admin Command Center (`/admin`)
- 6 pillar cards linking to major sections
- Portal Map menu (full navigation overlay)
- Command Palette (⌘K search)
- Breadcrumb navigation
- Session Monitor
- Quick Actions FAB
- Smart Selector (role + workspace navigation)

### 5.10 Content Inventory System
- 4-level content hierarchy (verticals → sub-verticals → categories → K1 clusters)
- Article management with pageview tracking
- Ad unit booking (available/pitched/booked)
- Placement calendar and table views

### 5.11 Operations Suite
- Insertion Orders management
- Inventory tracking (physical goods)
- Purchase Orders with line items
- Supplier management
- Performance feed

### 5.12 Financials / Billables
- Monthly billables reconciliation
- Network-level payout tracking
- Dispute management
- Master brand mapping across networks
- Network API status monitoring

### 5.13 Sales Pipeline
- Prospect/lead management (Kanban board)
- Pipeline stages: prospecting → initial_pitch → negotiation → contract_sent → closed_won/lost
- Lead capture dialog

---

## 6. Design System — "Pulse & Precision"

### Core Principles
- **"Doctor-White"** background: `#F9FAFB` (bg-background)
- **"Medical Teal"** primary accent: `#1ABC9C` (used on CTAs, active states, badges)
- **"Hard Corners"**: `0px border-radius` on all buttons, cards, inputs, badges
- **Typography**: Inter body font, Montserrat display, Cormorant Garamond serif, IBM Plex Mono monospace
- **Letter-spacing**: Increased for "Scientific Report" feel
- **Status Colors**: Urgent Red for critical, Healing Green for success, Amber for warnings

### CSS Custom Properties (index.css)
```css
:root {
  --background: 240 4% 95%;
  --foreground: 240 5% 10%;
  --primary: 258 89% 66%;
  --healthcare-blue: 185 65% 42%;
  --healthcare-teal: 175 60% 40%;
  --success: 155 70% 38%;
  --warning: 38 92% 50%;
  --medical-slate: 210 29% 24%;
  --pulse-blue: 204 70% 53%;
}
```

### Component Patterns
- Cards: `rounded-none border-border bg-card`
- Buttons: `rounded-none bg-[#1ABC9C] hover:bg-[#16A085] text-white`
- Inputs: `rounded-none` class on all Input/Select components
- Badges: `rounded-none` with status-specific color schemes
- Active navigation: `bg-[#1ABC9C]/10 text-[#1ABC9C] border-b-2 border-[#1ABC9C]`

### Tailwind Config Extensions
- `healthcare-teal`, `healthcare-blue`, `pulse-blue` custom colors
- Custom shadow utilities: `shadow-glow`, `shadow-sm`, `shadow-md`, `shadow-lg`
- Animation utilities: `animate-fade-in`, `animate-slide-up`, `animate-scale-in`

---

## 7. Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Routing | React Router v6 (nested routes) |
| State | TanStack React Query (server state), React Context (auth) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| Charts | Recharts |
| Animation | Framer Motion |
| Forms | React Hook Form + Zod |
| SEO | react-helmet-async |
| Date | date-fns |

---

## 8. Edge Functions

| Function | Purpose |
|----------|---------|
| `invite-partner` | Creates partner user account and assigns partner role |
| `send-partner-invite` | Sends invitation email to partner |

---

## 9. Error Handling Architecture

- **Global Error Boundary** (`GlobalErrorBoundary`): Wraps entire app in `main.tsx`, catches unhandled crashes, shows "Something went wrong" + "Reload Page" UI
- **Section Error Boundaries** (`ErrorBoundary`): Wraps Partner Dashboard and Admin Layout individually, so a crash in one zone doesn't affect others
- **ResizeObserver Crash Prevention**: Custom class override in `main.tsx` wraps callbacks in `requestAnimationFrame` to prevent Recharts/Radix layout thrashing crashes

---

## 10. Key Enums

```typescript
app_role: "admin" | "partner"
contract_status: "draft" | "signed" | "expired"
funnel_stage: "prospecting" | "qualification" | "proposal" | "negotiation" | "closed_won" | "closed_lost"
inventory_availability: "available" | "pitched" | "booked"
medical_review_status: "pending_bd_approval" | "in_medical_review" | "approved" | "rejected" | "requires_revision"
pipeline_stage: "prospecting" | "initial_pitch" | "negotiation" | "contract_sent" | "closed_won" | "closed_lost"
placement_status: "available" | "pitched" | "booked" | "upcoming"
po_status: "draft" | "submitted" | "approved" | "ordered" | "partially_received" | "received" | "cancelled"
review_status: "pending" | "approved" | "revision_requested"
```
