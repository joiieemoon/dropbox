
# ReactKit

![ReactKit Logo](./docs/logo.png)

> **Logo note:** Place the official hero logo at `docs/logo.png` (PNG recommended).  
> This README assumes the logo file exists to render the hero section correctly.

<p align="center">
  <a href="#why-reactkit">✨ Why ReactKit</a> ·
  <a href="#getting-started">🚀 Getting Started</a> ·
  <a href="#architecture">🏗️ Architecture</a> ·
  <a href="#project-principles">✅ Principles</a> ·
  <a href="#roadmap">🗺️ Roadmap</a>
</p>

---

## Badge Overview

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind-3.x-38BDF8?style=for-the-badge&logo=tailwindcss" />
  <img alt="React Router" src="https://img.shields.io/badge/Router-Ready-CA4245?style=for-the-badge&logo=reactrouter" />
</p>

---

## Project Information

- **Project Name:** ReactKit  
- **Tagline:** A scalable, reusable React component and architecture starter kit for modern enterprise applications.  
- **Created By:** Jainil Kukrolia  
- **Developer:** @joiiie  
- **Company:** Moon Technolabs  

---

## Project Goal

ReactKit is a reusable **React project foundation** built for enterprise applications.

This repo is **NOT** meant to be a single application (no CRUD-focused or user-management-focused scope). Instead, it focuses on reusable **UI**, **utilities**, **hooks**, **architecture patterns**, and **coding standards** that can bootstrap and accelerate multiple projects.

### What ReactKit provides
- Production-ready UI building blocks
- Scalable architecture for growth
- Consistent folder structure and conventions
- Feature-isolated modules that won’t collapse under complexity
- Strict typing, accessibility-first components, and performance-conscious utilities

### What ReactKit avoids
- “Template-only” code that’s impossible to reuse
- Copy-pasted UI patterns with inconsistent APIs
- Tight coupling between screens, components, and data logic

---

## Tech Stack

| Category | Technology | Notes |
|---|---|---|
| Runtime | React 19 | Modern hooks + concurrent-friendly patterns |
| Language | TypeScript | Strict typing as a default, not an option |
| Build Tool | Vite | Fast dev server + production build pipeline |
| Styling | Tailwind CSS | Utility-first design system foundation |
| Routing | React Router | Feature-friendly routing approach |
| Forms | Formik + Yup | Practical form handling with validation |
| Data | React Query (Future) | Planned server-state layer |
| HTTP | Axios (Future) | Planned service/http abstraction |

---

## Why This Architecture?

### Feature-Based Architecture (Selected)

ReactKit uses **Feature-Based Architecture** because it scales better than “folder-by-type only” approaches (e.g., `/components`, `/utils`, `/services`) as applications grow.

With feature-based structure:
- A team can own a feature end-to-end (UI + hooks + validation + services)
- Reuse becomes intentional: shared UI lives in shared modules, not inside feature pages
- Refactors remain localized (changes don’t cascade across unrelated modules)
- Enterprise growth becomes manageable (more screens, more roles, more complexity)

---

## Core Separation (What lives where)

To keep the codebase maintainable and predictable, responsibilities are separated across:

### 1) Features
- Route-level and screen-level concerns
- Feature-specific components
- Feature-specific state, validation, and orchestration
- Example: Auth screens, Dashboard pages, Table flows

### 2) Shared Components
- Generic components used across multiple features
- “No feature logic”—only reusable UI & behavior primitives
- Example: `Alert`, `Spinner`, shared table primitives

### 3) UI Library
- Visual components that conform to the design system
- Common patterns like modal triggers, pagination UI, consistent form controls

### 4) Hooks
- Encapsulated client-side behavior
- Reusable logic with minimal assumptions (e.g., debounce, modal, pagination helpers)

### 5) Utilities
- Pure functions and non-React logic
- Sorting, searching, filtering, formatting, storage helpers

### 6) Services
- API communication and side effects
- Expected placement for future Axios integration and server requests

### 7) Constants
- Stable values: keys, configuration defaults, option lists, enum-like data

### 8) Types
- Shared TypeScript types for consistent contracts
- Table types, shared DTO-like shapes, UI state models

### 9) Validation
- Yup validation schemas
- Validation should be co-located with the feature and/or reused through shared schema utilities

### 10) Layouts
- App shell components: sidebar, top bars, page layout wrappers
- Cross-page UX consistency

---

## How It Scales in Larger Projects

As a project grows:
1. **New screens** are implemented inside their feature boundaries
2. **Shared components** accumulate as reusable primitives (not bespoke one-offs)
3. **Utilities & types** remain stable and become the “contract layer”
4. **Service layer** can be added without rewriting UI logic
5. Teams can parallelize development by owning different features without merge chaos

This prevents the common enterprise failure mode:
> “Everything becomes a shared component eventually, but without ownership or boundaries.”

---

## Project Folder Structure

Below is the intended folder layout for ReactKit enterprise-scale usage.  
(Your implementation may evolve, but the conceptual responsibilities should remain consistent.)

```txt
src/
  components/
    common/              # Small reusable primitives (Alert, Spinner, etc.)
    ui/                  # Design-system UI components (controls, cards, modals)
    layout/              # Layout primitives and shell components
    tables/              # Table UI primitives and reusable table components
    form/                # Form controls (checkbox/radio/select wrappers etc.)
    header/              # Header components (if app shell uses them)
  features/
    auth/                # Auth screens (login/signup/forgot/reset)
    Dashboard/          # Dashboard feature pages/widgets
    Forms/              # Example forms feature scope
    Tables/             # Table feature scope
    UserProfile/        # User profile pages
  hooks/
    useDebounce.ts
    usePagination.ts
    useModal.ts
    useSearch.ts
    ...etc
  context/
    ThemeContext.tsx
    SidebarContext.tsx
  utils/
    sortData.ts
    searchData.ts
    filterData.ts
    paginateData.ts
    storage.ts
    ...etc
  services/
    auth/                # Feature service layer (future: Axios + endpoints)
  constants/
    ...                # stable option sets, keys, UI configs
  types/
    ...                # shared domain/UI types
  route.tsx             # route definitions / router wiring
  main.tsx              # app bootstrap
  vite-env.d.ts

Major folders (what they’re for)
Folder
Purpose
components
Reusable view/UI primitives and composition building blocks
components/common
Lightweight shared UI primitives (alerts, loaders, scroll-to-top)
components/ui
Design-system controls that standardize UI patterns
components/form
Form-related UI components (toggles, fields, input wrappers)
components/layout
Layout wrappers and application shell (sidebar, header, page layout)
components/tables
Reusable table system components
hooks
Reusable React hooks (stateful logic and behavior patterns)
utils
Pure helper functions (search/filter/sort/paginate/etc.)
services
Side effects + API communication (future Axios/React Query integration)
constants
Centralized constant values
types
Shared TypeScript types to avoid “shape drift”
features
Feature boundaries: UI + behavior + validation + services integration
config (planned)
App config: environment variables, endpoints, feature flags
providers (planned)
Context providers wiring (theme, auth, feature flags)
api (planned)
API client abstraction (base URL, request/response transforms)


Development Roadmap
This roadmap is optimized for building a reusable starter kit that gets more capable without losing cleanliness.
Phase 1 — Project Foundation
Purpose: Establish the baseline architecture, dev tooling, TypeScript conventions, routing wiring, and initial reusable components.
Phase 2 — Core UI Components
Purpose: Build a consistent set of foundational UI controls (buttons, inputs, layout primitives, typography patterns).
Phase 3 — Common Dialog System
Purpose: Centralize modal/dialog behavior for consistent UX (accessibility, focus management, escape handling).
Phase 4 — Reusable Table System
Purpose: Implement a scalable table architecture (sorting, pagination, filtering, row rendering patterns).
Phase 5 — Layout Components
Purpose: Standardize app shell components and page layouts (sidebar behavior, header placement, content wrappers).
Phase 6 — Feedback Components
Purpose: Improve feedback UX (alerts, spinners, notifications, empty-state patterns).
Phase 7 — Navigation Components
Purpose: Create enterprise-grade navigation UI patterns (sidebar navigation, breadcrumbs, active states).
Phase 8 — Common Hooks
Purpose: Collect reusable hooks for enterprise flows (debounce, search, modal orchestration, pagination).
Phase 9 — Utilities
Purpose: Create robust pure utilities (data transforms, formatting, storage, caching primitives).
Phase 10 — Constants
Purpose: Stabilize reusable constants and UI options to reduce magic values across the app.
Phase 11 — Validation
Purpose: Build a validation library using Yup schemas (reusable and feature-cohesive).
Phase 12 — API Foundation
Purpose: Add a formal service layer and API clients (Axios + request/response adapters).
Phase 13 — Theme & Design System
Purpose: Move from styling consistency to a real design system: tokens, themes, and controlled component variants.
Phase 14 — Documentation
Purpose: Improve onboarding: architecture docs, examples, and “how to extend ReactKit” guides.
Phase 15 — Code Quality
Purpose: Lock in quality with linting, type checks, component standards, and developer workflow improvements.

Implemented Components
The following table reflects the component system direction. Status is intentionally forward-looking to guide future work.
Core UI & System Components
Component
Purpose
Status
Future Improvements
Buttons (core)
Standardized button behavior and styling
Planned/Partial
Variants registry, loading states, icon-button patterns
Input Components
Consistent input patterns for forms
Planned/Partial
Form integration, accessibility audit, masked inputs
Modal System
Dialog primitives and triggers
Planned
Focus trap, portal strategy, standardized animation
Table Components
Sorting/pagination/filter UI foundation
Implementing
Virtualization, column presets, column-level actions
Feedback Components
Alerts, spinners, empty/loading states
Implementing
Toast notifications, retry UX patterns

Hooks & Behavior
Component
Purpose
Status
Future Improvements
useSearch
Shared search behavior
Implementing
Support advanced queries + URL sync
usePagination
Pagination state and helpers
Planned/Partial
Server-state alignment for React Query
useModal
Modal open/close orchestration
Implementing
Queue multiple dialogs, typed modal registry
useDebounce
Reduce recomputation on user input
Implementing
Configurable leading/trailing behavior

Utilities & Logic
Component
Purpose
Status
Future Improvements
sortData
Sorting utilities for tables
Implementing
Custom comparators, stable sorting options
filterData
Filtering utilities
Implementing
Filter presets for common domains
paginateData
Pagination helper
Implementing
Cursor-based pagination support
searchData
Search matching logic
Implementing
Tokenization + fuzzy search option

Validation
Component
Purpose
Status
Future Improvements
Yup schemas
Form validation contracts
Planned
Shared schema composition patterns


Project Principles
ReactKit is built on a set of non-negotiable engineering principles.
1) Reusable over duplicated
Every new UI or logic pattern should be evaluated for reuse potential. Avoid “one-off” components that only exist for a single screen.
2) Composition over inheritance
Prefer composing smaller components (and hooks) rather than relying on class inheritance patterns.
3) Scalable architecture
Folder and responsibility boundaries exist to survive growth, not just to look tidy.
4) Feature isolation
Each feature should be understandable and maintainable without reading the entire repository.
5) Clean folder structure
Clear boundaries reduce cognitive load and improve onboarding.
6) Strict typing
TypeScript is used to:
prevent runtime shape bugs
improve refactor safety
improve developer experience with IDE hints
7) Accessibility first
Keyboard navigation, focus behavior, and semantic structure are considered during component design—not after.
8) Performance first
Avoid unnecessary rerenders and expensive computations; use memoization when appropriate and keep utilities pure.
9) Maintainability
Readable code wins. Patterns are documented and predictable.
10) Developer Experience
Good DX means:
consistent APIs
predictable folder conventions
reduced integration friction

Future Scope
A reusable starter kit should evolve with enterprise needs. These are planned enhancements:
Future Addition
Why It Matters
React Query
Standardize server-state management and caching
Dark Theme
Improve enterprise UI customization and theming
API Layer
Centralize HTTP behavior and request/response handling
Authentication
Secure app foundation and token lifecycle
Permission System
Role/permission-based UI gating and route protection
Charts
Visual analytics primitives (dashboard enablement)
Internationalization
Multi-language support (i18n) and locale management
Testing
Unit + integration testing conventions
Storybook
Visual component development and review
CI/CD
Automated builds, linting gates, and release pipelines
Docker
Consistent environments for dev and CI


Coding Standards
Consistency is a productivity multiplier. ReactKit follows clear naming and exporting conventions.
File naming convention
Use kebab-case for file names: toggle-switch.tsx
Use .tsx for React components, .ts for utilities/types/hooks
Use explicit names for intention: useSearch.ts, sortData.ts
Folder naming convention
Use kebab-case for folders under components/features when applicable
Use plural naming only when it represents a collection (e.g., tables/)
Keep folder responsibilities narrow and well-defined
Component naming
Use PascalCase for React components: ToggleSwitch, ScrollToTop
Prefix shared UI primitives with descriptive nouns: Alert, Spinner
Hook naming
Hooks start with use: useDebounce, usePagination, useModal
Avoid hooks that are not reusable: if not reusable, keep it as local logic
Utility naming
Use verb/noun intention: sortData, filterData, searchData
Utilities should be pure unless explicitly documented otherwise
Type naming
Use clear domain/UI intention: TableColumn, SortState, PaginationModel
Export types and avoid runtime dependencies
Export strategy (barrel exports)
Prefer barrel exports when it improves discovery and reduces import churn
Avoid ambiguous barrels—export only stable public surfaces
Keep default exports minimal (prefer named exports for clarity)
Absolute imports
Use absolute imports for cleaner code organization
Example intention:
import { Alert } from "@/components/common/alert/Alert"

Getting Started
ReactKit is designed to be cloned and extended.
Installation
npm install

Clone
git clone <your-repo-url>
cd ReactKit

Run (Development)
npm run dev

Build (Production)
npm run build

Folder Explanation (Quick Navigation)
src/features/ → page-level feature modules
src/components/ → shared UI primitives and system components
src/hooks/ → reusable hook library
src/utils/ → pure functions and data transforms
src/services/ → future server/API layer
src/types/ → shared TypeScript models and contracts

Screenshots
Place real screenshots here as the project evolves.
Authentication
Dashboard
Tables
Forms
Modals
Components

About ReactKit
Why ReactKit exists
Most starter templates provide UI quickly, but they fail when you need:
consistent component contracts
scaling-friendly architecture
reusable UI primitives across multiple apps
predictable folder boundaries for large teams
ReactKit exists to solve those problems by building a reusable foundation from day one.
What problems it solves
Reduced time to scaffold enterprise UI
Reduced tech debt from one-off components
Better maintainability through strict separation of concerns
Improved developer experience through consistent conventions
Who it is for
ReactKit is for:
front-end engineers in enterprise environments
teams that build multiple internal apps
organizations that need consistent UX and maintainable UI foundations
senior developers who want a real architecture starting point (not a demo repo)
How it differs from cloning an admin template
Admin templates often include:
tightly coupled pages
UI that’s hard to reuse without rewriting
inconsistent patterns and inconsistent data flow
ReactKit is different because it:
is built around reusable primitives + predictable boundaries
supports feature isolation
emphasizes scalable architecture over short-term visuals

License
See LICENSE.md.

Contributing
ReactKit is intended to be extended. When adding new components or features:
keep features isolated inside src/features/
add reusable primitives to src/components/
add pure logic into src/utils/
ensure naming conventions stay consistent
prioritize accessibility and predictable behavior

Maintainers
Jainil Kukrolia (Created By)
@joiiie (Developer)

Quick References
Architecture: Feature-Based Separation
Shared UI: src/components/
Feature modules: src/features/
Reusable logic: src/hooks/, src/utils/
Future: src/services/, React Query, Axios, design system tokens

#   d r o p b o x  
 