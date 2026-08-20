# MoonDoc — Document Tracking & Analytics

> A secure document sharing, tracking, and analytics platform built with React 19, TypeScript, and Firebase.

<p align="center">
  <a href="#features">✨ Features</a> ·
  <a href="#getting-started">🚀 Getting Started</a> ·
  <a href="#architecture">🏗️ Architecture</a> ·
  <a href="#tech-stack">🛠️ Tech Stack</a> ·
  <a href="#project-structure">📁 Structure</a> ·
  <a href="#scripts">📜 Scripts</a>
</p>

---

## Badge Overview

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite" />
  <img alt="Firebase" src="https://img.shields.io/badge/Firebase-12-FFCA28?style=for-the-badge&logo=firebase" />
  <img alt="MUI" src="https://img.shields.io/badge/MUI-9-007FFF?style=for-the-badge&logo=mui" />
  <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-4-38BDF8?style=for-the-badge&logo=tailwindcss" />
</p>

---

## Project Information

- **Project Name:** MoonDoc
- **Description:** Secure document sharing, tracking, and analytics platform
- **Repository:** [github.com/joiieemoon/dropbox](https://github.com/joiieemoon/dropbox)
- **Developer:** @joiiie
- **Company:** Moon Technolabs

---

## Features

### 📤 Document Sender Dashboard
- Upload **PDF** and **DOCX** documents via drag-and-drop
- View document list with page count, size, and upload date
- Share documents with recipients via email
- Generate unique **tracking links** per recipient
- Revoke or delete shared documents
- Copy share links with one click

### ✍️ In-Browser DOCX Editor
- Create and edit Word documents directly in the browser (Syncfusion DocumentEditor)
- Track changes with **revision history** (insertions, deletions, moves)
- Accept or reject tracked changes
- Save **version snapshots** with change summaries
- Export to PDF and DOCX

### 🔒 Secure Viewer
- Public, token-based document viewing at `/v/:token`
- Access gate state machine: verify → login/email → OTP → granted/denied
- Email verification and OTP authentication for recipients
- Scoped session tokens for subsequent API calls

### 📊 Analytics Dashboard
- Per-document analytics: open rate, average duration, completion %
- Per-recipient engagement: first access, total duration, max page reached
- **Page dwell tracking** (seconds per page at ≥50% visibility)
- **Interaction events**: zoom, download, print, open
- **Beacon queue** for telemetry payloads flushed to the server

### 👥 Shared Documents
- View documents shared with the current user
- Role-based access (owner / editor / viewer)

### 🔐 Authentication
- Sign in / Sign up with Firebase Auth
- Protected routes for authenticated users
- Public routes for the secure viewer

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase project (for auth, Firestore, and Cloud Storage)

### Installation

```bash
# Clone the repository
git clone https://github.com/joiieemoon/dropbox.git
cd reactkit_moondoc

# Install dependencies
npm install
```

### Environment Setup

Create a `.env` file in the project root with your Firebase configuration:

```env
# Firebase config
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Run (Development)

```bash
npm run dev
```

### Build (Production)

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

---

## Tech Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Framework** | React 19 | UI library |
| **Language** | TypeScript 5.7 | Strict typing |
| **Build Tool** | Vite 6 | Dev server + production build |
| **UI Library** | MUI 9 | Material Design components |
| **Styling** | Tailwind CSS 4 | Utility-first styling |
| **Routing** | React Router 7 | Client-side routing |
| **State** | Redux Toolkit, Zustand, React Query | Global + server state |
| **Backend** | Firebase 12 (Auth, Firestore, Storage) | Auth, data, file storage |
| **Documents** | Syncfusion DocumentEditor | In-browser DOCX editing |
| **PDF** | PDF.js (pdfjs-dist) | PDF rendering |
| **Charts** | ApexCharts, Recharts | Analytics visualizations |
| **Forms** | Formik + Yup | Form handling + validation |
| **Toasts** | react-hot-toast | Notifications |
| **Drag & Drop** | react-dropzone, react-dnd | File uploads |
| **Testing** | Vitest, Playwright, Storybook | Unit, E2E, component testing |
| **Calendar** | FullCalendar | Calendar views |

---

## Architecture

### Feature-Based Architecture

The application uses **feature-based architecture** — each feature owns its UI, hooks, state, and API calls within a self-contained module.

```
src/
  features/
    auth/          # Sign in / Sign up
    documents/     # Document tracking & analytics (main feature)
      sender/      # Upload, share, edit, view documents
      viewer/      # Secure token-based viewer
      analytics/   # Analytics dashboard
      api/         # API clients (documents, recipients, analytics, beacon)
      utils/       # PDF utilities, user identity
    UserProfile/   # User profile pages
    OtherPage/     # 404 / fallback
```

### Document Flow

```
Sender Uploads
      │
      ▼
Document Stored (Firebase Storage + Firestore)
      │
      ▼
Share with Recipients ──► Generate Tracking Links (/v/:token)
      │                              │
      ▼                              ▼
Recipient Opens Link ──► Secure Viewer (email/OTP gate)
      │
      ▼
Beacon Telemetry (page dwell, interactions, completion)
      │
      ▼
Analytics Dashboard (open rate, duration, engagement)
```

### Secure Viewer Access Flow

```
/v/:token
    │
    ▼
Verify Token ──► Login Required? ──► Email Required? ──► OTP Required? ──► Granted
    │                    │                    │                  │
    ▼                    ▼                    ▼                  ▼
  Denied            Sign In / Sign Up     Enter Email        Verify OTP
```

---

## Project Structure

```
src/
  api/                    # Shared API clients
  components/
    common/               # Reusable primitives (routes, toast, etc.)
    layout/               # App shell (sidebar, header, layout)
  config/                 # App configuration
  context/                # React context providers
  features/
    auth/                 # Authentication feature
    documents/
      analytics/          # Analytics dashboard + components
      api/                # API layer (documents, recipients, beacon, viewer)
      sender/             # Sender dashboard, DOCX editor/viewer, shared docs
      utils/              # PDF utilities, user identity helpers
      viewer/             # Secure viewer + telemetry
      types.ts            # Shared domain types
    UserProfile/          # User profile feature
    OtherPage/            # 404 page
  hooks/                  # Reusable React hooks
  icons/                  # Icon components
  scripts/                # Build/utility scripts
  services/               # Service layer
  store/                  # Global state (Redux/Zustand)
  stories/                # Storybook stories
  types/                  # Shared TypeScript types
  utils/                  # Pure utility functions
  main.tsx                # App bootstrap
  route.tsx               # Route definitions
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

## Key Routes

| Route | Description | Auth |
|-------|-------------|------|
| `/signin` | Sign in page | Public |
| `/signup` | Sign up page | Public |
| `/documents` | Sender dashboard (upload/share/manage) | Protected |
| `/docx-viewer` | DOCX viewer list | Protected |
| `/docx-viewer/:id` | View a DOCX document | Protected |
| `/docx-editor/:id` | Edit a DOCX document | Protected |
| `/analytics` | Analytics dashboard | Protected |
| `/shared-with-me` | Documents shared with me | Protected |
| `/documents/:id` | Secure viewer (logged-in) | Protected |
| `/v/:token` | Public secure viewer | Public (token) |
| `/profile` | User profile | Protected |

---

## Development Workflow

This project uses the **AI-DLC (AI-Driven Development Life Cycle)** workflow for feature development:

1. **INCEPTION** — Workspace detection, requirements analysis, workflow planning
2. **CONSTRUCTION** — Code generation (per-unit), build and test
3. **OPERATIONS** — Deployment and monitoring (future)

Internal workflow rules live in `.clinerules/` and `.aidlc-rule-details/` (git-ignored, not pushed to the public repo).

---

## License

See [LICENSE.md](./LICENSE.md).

---

## Maintainers

- **Developer:** @joiiie
- **Company:** Moon Technolabs