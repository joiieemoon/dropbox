/**
 * views.js - page view / telemetry tracking endpoints.
 */
const express = require("express");
const router = express.Router();
const { readData, writeData, makeId } = require("../store");

/**
 * POST /api/views
 * Record a page view / beacon payload.
 * Body: { documentId, recipientId, page, seconds, scopedToken }
 */
router.post("/", (req, res) => {
    const { documentId, recipientId, page, seconds, scopedToken } = req.body || {};

    if (!documentId || !recipientId) {
        return res.status(400).json({ error: "documentId and recipientId are required" });
    }

    const data = readData();
    const view = {
        id: makeId("view"),
        documentId,
        recipientId,
        page: page || 1,
        seconds: seconds || 0,
        scopedToken: scopedToken || null,
        viewedAt: new Date().toISOString(),
    };

    data.views.push(view);
    writeData(data);

    res.status(201).json({ ok: true, view });
});

/**
 * POST /api/views/beacon
 * Accept a full beacon payload (matches frontend BeaconPayload shape).
 * Body: BeaconPayload
 */
router.post("/beacon", (req, res) => {
    const payload = req.body || {};
    const { documentId, recipientId, pageDwells, totalDurationSec, interactions } = payload;

    if (!documentId || !recipientId) {
        return res.status(400).json({ error: "documentId and recipientId are required" });
    }

    const data = readData();
    const beacon = {
        id: makeId("beacon"),
        ...payload,
        receivedAt: new Date().toISOString(),
    };

    // Store page dwells as individual view records.
    const dwells = Array.isArray(pageDwells) ? pageDwells : [];
    dwells.forEach((d) => {
        data.views.push({
            id: makeId("view"),
            documentId,
            recipientId,
            page: d.page,
            seconds: d.seconds,
            scopedToken: payload.scopedToken || null,
            viewedAt: new Date().toISOString(),
        });
    });

    // Also store the aggregate beacon.
    data.beacons = data.beacons || [];
    data.beacons.push(beacon);
    writeData(data);

    res.status(201).json({ ok: true, totalDwells: dwells.length, totalDurationSec: totalDurationSec || 0 });
});

module.exports = router;
