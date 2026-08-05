/**
 * Beacon API - receives telemetry payloads from the viewer.
 * Mocked for the POC; swap with a real endpoint later.
 */

import { mockApi } from "./mockData";
import type { BeaconPayload } from "../types";

/**
 * Send a beacon payload. In production this would POST to a
 * telemetry endpoint. For the POC we store it in the mock store.
 */
export async function sendBeacon(payload: BeaconPayload): Promise<void> {
  // Simulate a fire-and-forget network call.
  mockApi.addBeacon(payload);
  // In a real implementation:
  // await fetch("/api/beacon", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(payload),
  //   keepalive: true,
  // });
}