# MoonDoc — Document Tracking & Analytics

A secure document sharing, tracking, and analytics platform built with **React 19**, **TypeScript**, **Vite**, and **Firebase**.

> Developer: @joiiie · Company: Moon Technolabs
> Repository: [github.com/joiieemoon/dropbox](https://github.com/joiieemoon/dropbox)

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 19 |
| Language | TypeScript 5.7 |
| Build | Vite 6 |
| Backend / Auth | Firebase 12 (Auth, Firestore, Cloud Storage) |
| UI | MUI 9, Tailwind CSS 4 |
| Tables / Charts | MUI X Data Grid, ApexCharts, Recharts |
| DOCX Editing | Syncfusion DocumentEditor |
| State | Redux Toolkit, Zustand |
| Data Fetching | TanStack React Query, Axios |
| Forms | Formik, Yup |
| Calendars | FullCalendar |
| Docs / Testing | Storybook 10, Vitest, Playwright |

---

## Features

- **Document Sender Dashboard** — upload PDF/DOCX via drag-and-drop, manage documents, share with recipients via email, generate unique per-recipient tracking links, revoke/delete shares, copy links.
- **In-Browser DOCX Editor** — create and edit Word documents (Syncfusion), track changes with revision history (accept/reject), save version snapshots, export to PDF/DOCX.
- **Secure Viewer** — public token-based viewing at `/v/:token` with an access gate (verify → login/email → OTP → granted/denied), email verification, and scoped session tokens.
- **Analytics Dashboard** — per-document open rate, duration, and completion %; per-recipient engagement; page dwell tracking; interaction events (zoom, download, print, open); beacon telemetry queue.
- **Shared Documents** — view documents shared with you, with role-based access (owner / editor / viewer).
- **Authentication** — Firebase Auth sign in/sign up with protected and public routes.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Firebase project (Auth, Firestore, Cloud Storage)

### Installation

```bash
git clone https://github.com/joiieemoon/dropbox.git
cd reactkit_moondoc
npm install
```

### Environment Setup

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Run

```bash
npm run dev        # Start Vite dev server
npm run build      # Type-check + build for production
npm run preview    # Preview the production build
npm run lint       # Run ESLint
```

---

## Key Routes

| Route | Description | Auth |
|-------|-------------|------|
| `/signin`, `/signup` | Sign in / sign up | Public |
| `/documents` | Sender dashboard (upload / share / manage) | Protected |
| `/docx-viewer` | DOCX viewer list | Protected |
| `/docx-viewer/:id` | View a DOCX document | Protected |
| `/docx-editor/:id` | Edit a DOCX document | Protected |
| `/analytics` | Analytics dashboard | Protected |
| `/shared-with-me` | Documents shared with me | Protected |
| `/documents/:id` | Secure viewer (logged-in) | Protected |
| `/v/:token` | Public secure viewer | Public (token) |
| `/profile` | User profile | Protected |

---

## Project Structure

```
src/
  api/          # Shared API clients
  components/   # common/, layout/ (app shell)
  config/       # App configuration
  context/      # React context providers
  features/
    auth/                 # Sign in / sign up
    documents/
      analytics/          # Analytics dashboard + charts
      api/                # Documents, recipients, beacon, viewer API
      sender/             # Sender dashboard, DOCX editor/viewer, shared docs
      utils/              # PDF utilities, identity helpers
      viewer/             # Secure viewer + telemetry
      types.ts            # Shared domain types
    UserProfile/          # User profile
    OtherPage/            # 404 page
  hooks/        # Reusable hooks
  store/        # Global state
  stories/      # Storybook stories
  utils/        # Pure utilities
  main.tsx      # App bootstrap
  route.tsx     # Route definitions
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |
| `npm run storybook` | Start Storybook (port 6006) |
| `npm run build-storybook` | Build Storybook |
| `npm run chromatic` | Publish Storybook to Chromatic |

---

## License

See [LICENSE.md](./LICENSE.md).
