/**
 * Beacon API - receives telemetry payloads from the viewer.
 * Posts to the real Express backend at http://localhost:4000.
 */

import { backendClient } from "./backendClient";
import { mockApi } from "./mockData";
import type { BeaconPayload } from "../types";

/**
 * Send a beacon payload. POSTs to the backend telemetry endpoint.
 * Falls back to the mock store if the backend is unreachable.
 */
export async function sendBeacon(payload: BeaconPayload): Promise<void> {
  try {
    await backendClient.post("/api/views/beacon", payload);
  } catch {
    // Backend unreachable — store locally for the POC.
    mockApi.addBeacon(payload);
  }
}
