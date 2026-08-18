# 📄 Document Management Feature

## Overview

The **Document Management** feature is a complete document sharing and tracking solution — similar to tools like DocSend or Dropbox. It lets users **upload**, **share**, **securely view**, **collaborate**, and **track** documents (PDF and Word files) right from the browser, with detailed engagement analytics.

---

## Feature List

### 1️⃣ Document Upload

| Feature | Description |
|---------|-------------|
| **PDF Upload** | Drag-and-drop or click-to-select to upload PDF files (max 2 MB). |
| **Word (.DOCX) Upload** | Dedicated upload flow for Word documents (max 1 MB). |
| **File Validation** | Automatically rejects wrong file types or oversized files with clear error messages. |
| **Auto Page Detection** | Automatically detects and displays the number of pages in the uploaded document. |
| **Upload Status** | Visual feedback during upload (loading, success, error states). |

---

### 2️⃣ Document Dashboard

| Feature | Description |
|---------|-------------|
| **Document List** | Table view of all documents uploaded by the current user with name, page count, file size, and shared-with details. |
| **Search & Filter** | View only documents you own, or filter by document type. |
| **Quick Actions** | One-click buttons to **View**, **Edit** (Word only), **View Analytics**, and **Delete** each document. |
| **Empty State** | Friendly "No documents uploaded" message with guidance when the list is empty. |
| **User Info Card** | Displays the logged-in user's profile picture, username, and email in the dashboard header. |

---

### 3️⃣ Document Sharing

| Feature | Description |
|---------|-------------|
| **Share with Users** | Share any document with other registered users by selecting them from a dropdown. |
| **Share Roles** | Choose how the recipient can interact: **Viewer** (read-only) or **Editor** (can edit Word docs). |
| **Add More Users** | Share an existing document with additional users at any time. |
| **Revoke Access** | Remove a user's access to a document at any time with a confirmation prompt. |
| **Shared With Me** | Dedicated page showing all documents other users have shared with you. |
| **Access Management** | Owners can see and manage (enable/disable) editor access for each shared collaborator. |

---

### 4️⃣ Tracking Links

| Feature | Description |
|---------|-------------|
| **Unique Tracking Links** | Each share generates a unique, recipient-specific link that can be copied and sent to the recipient. |
| **Link Display** | The dashboard shows a "Copy Link" button for each document that has a generated share link. |
| **Clipboard Copy** | Copy the tracking link to the clipboard with one click (with fallback for unsupported browsers). |

---

### 5️⃣ Secure Document Viewer

| Feature | Description |
|---------|-------------|
| **Access Verification** | Before viewing, the system verifies the recipient's identity and permissions through a secure gate. |
| **Token-Based Access** | Public, unauthenticated users can access a document only via a secure tracking-link token. |
| **Login Required** | If not signed in, the viewer is prompted to log in before access is granted. |
| **Email Verification (OTP)** | First-time recipients verify their email with a one-time password (OTP). |
| **Direct Access** | Logged-in users who are shared on a document can access it directly by clicking "View". |
| **Access Denied** | Users without permission see a clear "access denied" message. |
| **Strict Page Navigation** | One page is shown at a time with **Previous / Next** navigation — keeps tracking accurate. |
| **PDF Viewer** | Renders PDF documents page-by-page directly in the browser. |
| **Word Viewer** | Read-only in-browser viewer for Word (.docx) documents with Word-style layout. |
| **Document Close** | Users can navigate back easily when done viewing. |

---

### 6️⃣ Word Document Editor ✏️

| Feature | Description |
|---------|-------------|
| **Full Word Editor** | Complete in-browser editing of Word documents with a full ribbon toolbar. |
| **Formatting Tools** | Rich text formatting — fonts, styles, paragraphs, tables, images, and more. |
| **Track Changes** | Record every change made with author name, timestamp, and change type (insertion, deletion, move). |
| **Review Changes** | Accept or reject tracked changes with one click. |
| **Change History Panel** | View a history of all tracked changes with author, type, date, and status. |
| **Spell Check** | Built-in spell checking while typing. |
| **Comments & Collaboration** | Supports comments for collaborative review. |
| **Versioning** | Save new versions of the document — every save creates a versioned snapshot. |
| **Export** | Save the document back as a `.docx` file or export to PDF. |
| **Permission Control** | Only the owner and users granted **editor** access can edit — viewers are blocked. |
| **Desktop Only** | Edit mode is supported only on desktop browsers (not mobile) to ensure a full editing experience. |

---

### 7️⃣ Viewing Analytics 📊

| Feature | Description |
|---------|-------------|
| **Engagement Tracking** | Automatically tracks when a recipient opens a document, how long they view it, and which pages they spend time on. |
| **Page Dwell Time** | Measures how many seconds a recipient spends on each page. |
| **Completion Percentage** | Shows how much of the document each recipient actually viewed. |
| **Max Page Reached** | Tracks the furthest page each recipient scrolled to. |
| **Interaction Events** | Captures actions like **zoom**, **print**, **download**, and **open**. |
| **Smart Tracking** | Time is only counted while the document tab is visible and active — hidden tabs don't inflate metrics. |

---

### 8️⃣ Analytics Dashboard 📈

| Feature | Description |
|---------|-------------|
| **Document Selector** | Dropdown to switch between documents and see each one's analytics. |
| **Open Rate** | Percentage of recipients who opened the document. |
| **Average Duration** | Average viewing time across all recipients. |
| **Average Completion** | Average percentage of the document viewed by recipients. |
| **Page Dwell Chart** | Visual bar chart showing average time spent on each page of the document. |
| **Recipient Table** | Per-recipient breakdown showing first access time, total duration, pages viewed, and completion. |
| **Expandable Details** | Click any recipient row to see their page-by-page viewing time in a mini chart. |
| **Access Status** | See and manage which recipients currently have access — disable access directly from the analytics table. |

---

### 9️⃣ Security & Permissions

| Feature | Description |
|---------|-------------|
| **Role-Based Access** | Each user has a role per document: **Owner**, **Editor**, or **Viewer**. |
| **Firebase Authentication** | All access is tied to authenticated Firebase user accounts. |
| **Revoke Anytime** | Document owners can instantly revoke access for any recipient. |
| **Owner Excluded** | An owner's own document views are **not** counted in analytics — only real recipient activity is measured. |
| **Scoped Sessions** | Each viewing session uses a scoped token that ties telemetry back to the correct document and recipient. |

---

### 🔟 Real-Time Telemetry Pipeline

| Feature | Description |
|---------|-------------|
| **Beacon Queue** | Collects viewing events in a queue before sending them to the server. |
| **Auto-Flush** | Telemetry is sent to the server every **5 seconds** while viewing. |
| **Smart Dispatch** | Beacons are also flushed when the tab becomes hidden or the user leaves the page, so no data is lost. |
| **View Records** | Each viewing session creates view records in the database, per page and per interaction. |

---

## User Roles

| Role | Can Upload | Can View | Can Share | Can Edit (Word) | Can See Analytics | Can Delete |
|------|-----------|----------|-----------|-----------------|-------------------|------------|
| **Owner** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Editor** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Viewer** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Key User Journeys

1. **Upload & Share**
   - Upload a PDF or Word document → Share it with a colleague → Copy the tracking link → Send via email/chat.

2. **Secure View**
   - Recipient clicks the tracking link → Verifies identity (login/OTP) → Views the document page-by-page → Their activity is silently tracked.

3. **Track Engagement**
   - The owner opens the Analytics Dashboard → Sees open rate, time spent per page, completion percentage, and per-recipient behavior.

4. **Collaborate on Word Docs**
   - Owner shares a Word doc with editor access → Co-editor opens the editor → Makes changes with track changes → Owner reviews and accepts/rejects changes → New version is saved.

---

## Page & Route Summary

| Route | What it does |
|-------|-------------|
| `/documents` | Document dashboard — upload, manage, share PDF documents. |
| `/docx-viewer` | Word document library — upload and manage .docx files. |
| `/docx-viewer/:id` | Read-only Word document viewer. |
| `/docx-editor/:id` | Full Word document editor with track changes and versioning. |
| `/documents/:id` | Secure PDF viewer for logged-in users. |
| `/v/:token` | Public secure viewer accessed via a tracking link token. |
| `/analytics` | Analytics dashboard with document and recipient insights. |
| `/shared-with-me` | Documents shared with the current user by others. |

---

## Summary

The Document Management feature is a **complete document sharing, secure viewing, and analytics solution**:

- **Share** documents (PDF & Word) with role-based permissions.
- **Create unique tracking links** per recipient for secure access.
- **View & edit** documents fully in the browser.
- **Collaborate** with track changes, revisions, and versioning.
- **Track & measure** exactly how recipients engage with your documents through a rich analytics dashboard.

It's designed to replace traditional document-sending tools by giving senders full visibility into what happens after a document is sent — **who opened it, how long they spent, what they read, and whether they completed it**.