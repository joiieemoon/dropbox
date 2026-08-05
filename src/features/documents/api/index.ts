/**
 * API barrel for the Document Tracking & Analytics POC.
 * All mock APIs are exported here so real endpoints can be swapped in later.
 */

export * from "./viewerApi";
export * from "./analyticsApi";
export * from "./beaconApi";
export * from "./documentsApi";
export { mockStore } from "./mockData";