/**
 * BeaconQueue - in-memory queue that accumulates page dwell times and
 * interaction events without blocking the UI thread.
 *
 * The queue is flushed by the useBeaconDispatcher hook on an interval,
 * on visibility change, and on page unload.
 */

import type {
  BeaconPayload,
  InteractionEvent,
  PageDwell,
} from "../../types";

export class BeaconQueue {
  private pageDwells: Map<number, number> = new Map();
  private interactions: InteractionEvent[] = [];
  private maxPageReached = 0;
  private readonly sessionId: string;
  private readonly scopedToken: string;
  private readonly documentId: string;
  private readonly recipientId: string;
  private readonly pageCount: number;
  private readonly startedAt: number;

  constructor(input: {
    sessionId: string;
    scopedToken: string;
    documentId: string;
    recipientId: string;
    pageCount: number;
  }) {
    this.sessionId = input.sessionId;
    this.scopedToken = input.scopedToken;
    this.documentId = input.documentId;
    this.recipientId = input.recipientId;
    this.pageCount = input.pageCount;
    this.startedAt = Date.now();
  }

  /**
   * Record time spent on a page (seconds).
   * Accumulates into the existing value for that page.
   */
  recordPageDwell(page: number, seconds: number): void {
    if (page < 1 || seconds <= 0) return;
    const current = this.pageDwells.get(page) ?? 0;
    this.pageDwells.set(page, current + seconds);
    if (page > this.maxPageReached) {
      this.maxPageReached = page;
    }
  }

  /**
   * Record an interaction event (zoom, download, print, open).
   */
  recordInteraction(type: InteractionEvent["type"], page?: number): void {
    this.interactions.push({
      type,
      page,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Build the current payload and clear the queue.
   * Returns null if there is nothing to send.
   */
  flush(): BeaconPayload | null {
    if (this.pageDwells.size === 0 && this.interactions.length === 0) {
      return null;
    }

    const pageDwells: PageDwell[] = Array.from(this.pageDwells.entries())
      .map(([page, seconds]) => ({ page, seconds: Math.round(seconds) }))
      .sort((a, b) => a.page - b.page);

    const completionPercent = Math.min(
      100,
      Math.round((this.maxPageReached / this.pageCount) * 100),
    );

    // Calculate total duration as sum of all page dwell times (actual viewing time).
    const totalDurationSec = Math.round(
      pageDwells.reduce((sum, dwell) => sum + dwell.seconds, 0),
    );

    console.log(`[BeaconQueue] Flushing payload:`, {
      sessionId: this.sessionId,
      pageDwells,
      totalDurationSec,
      maxPageReached: this.maxPageReached,
      completionPercent,
    });

    const payload: BeaconPayload = {
      sessionId: this.sessionId,
      scopedToken: this.scopedToken,
      documentId: this.documentId,
      recipientId: this.recipientId,
      pageDwells,
      maxPageReached: this.maxPageReached,
      completionPercent,
      interactions: [...this.interactions],
      totalDurationSec,
      sentAt: new Date().toISOString(),
    };

    // Clear the queue.
    this.pageDwells.clear();
    this.interactions = [];

    return payload;
  }

  /**
   * Whether the queue currently has pending data.
   */
  get hasPendingData(): boolean {
    return this.pageDwells.size > 0 || this.interactions.length > 0;
  }
}