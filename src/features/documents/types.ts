/**
 * Shared domain types for the Document Tracking & Analytics POC.
 */

/** A PDF document uploaded by the sender. */
export interface Document {
  id: string;
  name: string;
  /** Mock URL to the PDF file (client-side only for the POC). */
  url: string;
  /** Base64 data URL of the PDF content (stored in localStorage as JSON). */
  dataUrl?: string;
  /** Cloud Storage path to the PDF file (e.g. documents/{ownerUid}/{docId}/{filename}). */
  storagePath?: string;
  pageCount: number;
  uploadedAt: string;
  sizeBytes: number;
  /** Recipients this document has been shared with. */
  sharedWith: string[];
  /** The username of the user who uploaded this document (legacy rec_X also supported). */
  uploadedBy?: string;
  /** Firebase UID of the document owner. */
  ownerId?: string;
}

/** A recipient who can be granted access to a document. */
export interface Recipient {
  id: string;
  email: string;
  name: string;
  /** Username used for login (shown instead of first/last name). */
  username: string;
}

/** A unique tracking link generated for a specific recipient + document. */
export interface TrackingLink {
  id: string;
  documentId: string;
  recipientId: string;
  token: string;
  /** Full public URL, e.g. `${origin}/v/${token}`. */
  url: string;
  createdAt: string;
}

/** Viewer access state machine states. */
export type ViewerGateState =
  | "verifying"
  | "login_required"
  | "email_required"
  | "otp_required"
  | "granted"
  | "denied";

/** Session state stored in Zustand once access is granted. */
export interface ViewerSession {
  documentId: string;
  documentTitle: string;
  pageCount: number;
  /** Scoped token used for subsequent beacon/telemetry calls. */
  scopedToken: string;
  recipientId: string;
  grantedAt: string;
}

/** A single page dwell measurement. */
export interface PageDwell {
  page: number;
  /** Seconds the page was at least 50% visible. */
  seconds: number;
}

/** Interaction events tracked by the beacon queue. */
export type InteractionType = "zoom" | "download" | "print" | "open";

export interface InteractionEvent {
  type: InteractionType;
  page?: number;
  timestamp: string;
}

/** A single beacon payload flushed to the server. */
export interface BeaconPayload {
  sessionId: string;
  scopedToken: string;
  documentId: string;
  recipientId: string;
  pageDwells: PageDwell[];
  maxPageReached: number;
  completionPercent: number;
  interactions: InteractionEvent[];
  /** Total viewing duration in seconds. */
  totalDurationSec: number;
  sentAt: string;
}

/** Document-level analytics (all recipients). */
export interface DocumentAnalytics {
  documentId: string;
  documentTitle: string;
  pageCount: number;
  totalRecipients: number;
  openedCount: number;
  /** Email open rate 0-100. */
  openRate: number;
  /** Average viewing duration in seconds across recipients. */
  avgDurationSec: number;
  /** Average completion percentage 0-100. */
  avgCompletionPercent: number;
  /** Average seconds spent per page (index 0 = page 1). */
  avgPageDwell: number[];
  recipients: RecipientAnalytics[];
}

/** Recipient-level analytics. */
export interface RecipientAnalytics {
  recipientId: string;
  email: string;
  name: string;
  /** Username used for login (shown instead of first/last name). */
  username: string;
  /** Whether the recipient's email was opened (email open tracking). */
  emailOpened: boolean;
  /** Timestamp of first document access, if any. */
  firstAccessAt: string | null;
  /** Total viewing duration in seconds. */
  totalDurationSec: number;
  /** Percentage of the document viewed 0-100. */
  completionPercent: number;
  maxPageReached: number;
  /** Discrete engagement events. */
  events: EngagementEvent[];
}

/** A discrete engagement event for the recipient table. */
export interface EngagementEvent {
  id: string;
  type: InteractionType | "access" | "email_open";
  page?: number;
  timestamp: string;
  detail?: string;
}