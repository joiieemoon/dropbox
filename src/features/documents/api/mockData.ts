/**
 * In-memory mock data store for the POC.
 * Simulates a backend database. Swap with real API calls later.
 */

import type {
  Document,
  Recipient,
  TrackingLink,
  DocumentAnalytics,
  RecipientAnalytics,
  EngagementEvent,
} from "../types";

/** Generate a short unique token. */
function makeToken(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now()
    .toString(36)
    .slice(-4)}`;
}

/** Seed documents. */
const seedDocuments: Document[] = [
  {
    id: "doc_1",
    name: "Q3 Investor Deck.pdf",
    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    pageCount: 8,
    uploadedAt: "2026-07-28T09:12:00.000Z",
    sizeBytes: 2_400_000,
    sharedWith: ["rec_1", "rec_2"],
  },
  {
    id: "doc_2",
    name: "Product Roadmap 2026.pdf",
    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    pageCount: 12,
    uploadedAt: "2026-07-30T14:05:00.000Z",
    sizeBytes: 3_100_000,
    sharedWith: ["rec_3"],
  },
  {
    id: "doc_3",
    name: "Security Whitepaper.pdf",
    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    pageCount: 6,
    uploadedAt: "2026-08-01T11:30:00.000Z",
    sizeBytes: 1_800_000,
    sharedWith: [],
  },
];

/** Seed recipients. */
const seedRecipients: Recipient[] = [
  { id: "rec_1", email: "alice@acme.com", name: "Alice Johnson", username: "alice" },
  { id: "rec_2", email: "bob@globex.com", name: "Bob Smith", username: "bob" },
  { id: "rec_3", email: "carol@initech.com", name: "Carol White", username: "carol" },
  { id: "rec_4", email: "dave@umbrella.com", name: "Dave Brown", username: "dave" },
  { id: "rec_5", email: "erin@stark.com", name: "Erin Davis", username: "erin" },
];

/** Seed tracking links. */
const seedLinks: TrackingLink[] = [
  {
    id: "link_1",
    documentId: "doc_1",
    recipientId: "rec_1",
    token: "tok_alice_doc1",
    url: `${window.location.origin}/v/tok_alice_doc1`,
    createdAt: "2026-07-28T10:00:00.000Z",
  },
  {
    id: "link_2",
    documentId: "doc_1",
    recipientId: "rec_2",
    token: "tok_bob_doc1",
    url: `${window.location.origin}/v/tok_bob_doc1`,
    createdAt: "2026-07-28T10:05:00.000Z",
  },
  {
    id: "link_3",
    documentId: "doc_2",
    recipientId: "rec_3",
    token: "tok_carol_doc2",
    url: `${window.location.origin}/v/tok_carol_doc2`,
    createdAt: "2026-07-30T15:00:00.000Z",
  },
];

/** Seed engagement events for analytics. */
function seedEvents(): EngagementEvent[] {
  const now = Date.now();
  const min = 60_000;
  const events: EngagementEvent[] = [
    {
      id: "evt_1",
      type: "email_open",
      timestamp: new Date(now - 3 * min).toISOString(),
      detail: "Email opened",
    },
    {
      id: "evt_2",
      type: "access",
      timestamp: new Date(now - 2 * min).toISOString(),
      detail: "First document access",
    },
    {
      id: "evt_3",
      type: "zoom",
      page: 2,
      timestamp: new Date(now - 1 * min).toISOString(),
      detail: "Zoomed to 150%",
    },
    {
      id: "evt_4",
      type: "download",
      page: 5,
      timestamp: new Date(now - 30_000).toISOString(),
      detail: "Downloaded PDF",
    },
  ];
  return events;
}

/** Seed recipient analytics. */
function seedRecipientAnalytics(): RecipientAnalytics[] {
  return [
    {
      recipientId: "rec_1",
      email: "alice@acme.com",
      name: "Alice Johnson",
      username: "alice",
      emailOpened: true,
      firstAccessAt: new Date(Date.now() - 2 * 60_000).toISOString(),
      totalDurationSec: 184,
      completionPercent: 100,
      maxPageReached: 8,
      events: seedEvents(),
    },
    {
      recipientId: "rec_2",
      email: "bob@globex.com",
      name: "Bob Smith",
      username: "bob",
      emailOpened: true,
      firstAccessAt: new Date(Date.now() - 5 * 60_000).toISOString(),
      totalDurationSec: 96,
      completionPercent: 62,
      maxPageReached: 5,
      events: [
        {
          id: "evt_5",
          type: "email_open",
          timestamp: new Date(Date.now() - 6 * 60_000).toISOString(),
          detail: "Email opened",
        },
        {
          id: "evt_6",
          type: "access",
          timestamp: new Date(Date.now() - 5 * 60_000).toISOString(),
          detail: "First document access",
        },
      ],
    },
    {
      recipientId: "rec_3",
      email: "carol@initech.com",
      name: "Carol White",
      username: "carol",
      emailOpened: false,
      firstAccessAt: null,
      totalDurationSec: 0,
      completionPercent: 0,
      maxPageReached: 0,
      events: [],
    },
  ];
}

/** Seed document analytics. */
function seedDocumentAnalytics(): DocumentAnalytics[] {
  const recipients = seedRecipientAnalytics();
  const opened = recipients.filter((r) => r.emailOpened).length;
  const viewed = recipients.filter((r) => r.firstAccessAt !== null);
  const avgDuration =
    viewed.length > 0
      ? Math.round(
          viewed.reduce((sum, r) => sum + r.totalDurationSec, 0) /
            viewed.length,
        )
      : 0;
  const avgCompletion =
    viewed.length > 0
      ? Math.round(
          viewed.reduce((sum, r) => sum + r.completionPercent, 0) /
            viewed.length,
        )
      : 0;

  return [
    {
      documentId: "doc_1",
      documentTitle: "Q3 Investor Deck.pdf",
      pageCount: 8,
      totalRecipients: recipients.length,
      openedCount: opened,
      openRate: Math.round((opened / recipients.length) * 100),
      avgDurationSec: avgDuration,
      avgCompletionPercent: avgCompletion,
      avgPageDwell: [12, 18, 9, 22, 15, 8, 5, 3],
      recipients,
    },
    {
      documentId: "doc_2",
      documentTitle: "Product Roadmap 2026.pdf",
      pageCount: 12,
      totalRecipients: 2,
      openedCount: 1,
      openRate: 50,
      avgDurationSec: 74,
      avgCompletionPercent: 45,
      avgPageDwell: [8, 14, 20, 11, 6, 4, 3, 2, 2, 1, 1, 1],
      recipients: [
        {
          recipientId: "rec_3",
          email: "carol@initech.com",
          name: "Carol White",
          username: "carol",
          emailOpened: true,
          firstAccessAt: new Date(Date.now() - 4 * 60_000).toISOString(),
          totalDurationSec: 74,
          completionPercent: 45,
          maxPageReached: 6,
          events: [
            {
              id: "evt_7",
              type: "email_open",
              timestamp: new Date(Date.now() - 5 * 60_000).toISOString(),
              detail: "Email opened",
            },
            {
              id: "evt_8",
              type: "access",
              timestamp: new Date(Date.now() - 4 * 60_000).toISOString(),
              detail: "First document access",
            },
          ],
        },
        {
          recipientId: "rec_4",
          email: "dave@umbrella.com",
          name: "Dave Brown",
          username: "dave",
          emailOpened: false,
          firstAccessAt: null,
          totalDurationSec: 0,
          completionPercent: 0,
          maxPageReached: 0,
          events: [],
        },
      ],
    },
    {
      documentId: "doc_3",
      documentTitle: "Security Whitepaper.pdf",
      pageCount: 6,
      totalRecipients: 1,
      openedCount: 0,
      openRate: 0,
      avgDurationSec: 0,
      avgCompletionPercent: 0,
      avgPageDwell: [0, 0, 0, 0, 0, 0],
      recipients: [
        {
          recipientId: "rec_5",
          email: "erin@stark.com",
          name: "Erin Davis",
          username: "erin",
          emailOpened: false,
          firstAccessAt: null,
          totalDurationSec: 0,
          completionPercent: 0,
          maxPageReached: 0,
          events: [],
        },
      ],
    },
  ];
}

/** localStorage keys. */
const DOCUMENTS_KEY = "doc_tracking_documents";
const LINKS_KEY = "doc_tracking_links";
const BEACONS_KEY = "doc_tracking_beacons";

/** Load persisted documents from localStorage, falling back to seeds. */
function loadDocuments(): Document[] {
  try {
    const raw = localStorage.getItem(DOCUMENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Document[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Ignore parse errors and fall back to seeds.
  }
  return [...seedDocuments];
}

/** Load persisted links from localStorage, falling back to seeds. */
function loadLinks(): TrackingLink[] {
  try {
    const raw = localStorage.getItem(LINKS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TrackingLink[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Ignore parse errors and fall back to seeds.
  }
  return [...seedLinks];
}

/** Load persisted beacons from localStorage. */
function loadBeacons(): unknown[] {
  try {
    const raw = localStorage.getItem(BEACONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore parse errors.
  }
  return [];
}

/** In-memory store, hydrated from localStorage. */
export const mockStore = {
  documents: loadDocuments(),
  recipients: [...seedRecipients],
  links: loadLinks(),
  analytics: seedDocumentAnalytics(),
  /** Beacon payloads received (for demo inspection). */
  beacons: loadBeacons(),
};

/** Persist the current documents to localStorage as JSON. */
function persistDocuments(): void {
  try {
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(mockStore.documents));
  } catch {
    // localStorage may be full (large PDFs); ignore for the POC.
  }
}

/** Persist the current links to localStorage as JSON. */
function persistLinks(): void {
  try {
    localStorage.setItem(LINKS_KEY, JSON.stringify(mockStore.links));
  } catch {
    // Ignore.
  }
}

/** Persist the current beacons to localStorage as JSON. */
function persistBeacons(): void {
  try {
    localStorage.setItem(BEACONS_KEY, JSON.stringify(mockStore.beacons));
  } catch {
    // Ignore.
  }
}

/** Helpers to mutate the store. */
export const mockApi = {
  addDocument(doc: Document) {
    mockStore.documents.unshift(doc);
    persistDocuments();
  },
  addLink(link: TrackingLink) {
    mockStore.links.unshift(link);
    persistLinks();
  },
  addBeacon(payload: unknown) {
    mockStore.beacons.push(payload);
    persistBeacons();
  },
  makeToken,
};
