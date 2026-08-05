/**
 * Zustand store for the viewer session.
 * Holds the granted session state (document title, page count, scoped token).
 */

import { create } from "zustand";
import type { ViewerSession } from "../../types";

interface ViewerSessionState {
  /** The granted session, or null if access has not been granted. */
  session: ViewerSession | null;
  /** Set the granted session. */
  setSession: (session: ViewerSession) => void;
  /** Clear the session (e.g. on viewer unmount). */
  clearSession: () => void;
}

export const useViewerSessionStore = create<ViewerSessionState>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
  clearSession: () => set({ session: null }),
}));