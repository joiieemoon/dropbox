/**
 * documents.js - document listing and registration endpoints.
 */
const express = require("express");
const router = express.Router();
const { readData, writeData, makeId } = require("../store");

/**
 * GET /api/documents
 * Return all uploaded documents.
 */
router.get("/", (req, res) => {
    const data = readData();
    res.json(data.documents);
});

/**
 * POST /api/documents
 * Register a newly uploaded PDF document.
 * Body: { name, url, pageCount, sizeBytes, dataUrl?, uploadedBy?, sharedWith? }
 */
router.post("/", (req, res) => {
    const { name, url, pageCount, sizeBytes, dataUrl, uploadedBy, sharedWith } = req.body || {};

    if (!name || !url) {
        return res.status(400).json({ error: "name and url are required" });
    }

    const data = readData();
    const doc = {
        id: makeId("doc"),
        name,
        url,
        pageCount: pageCount || 1,
        sizeBytes: sizeBytes || 0,
        dataUrl: dataUrl || null,
        uploadedAt: new Date().toISOString(),
        sharedWith: Array.isArray(sharedWith) ? sharedWith : [],
        uploadedBy: uploadedBy || null,
    };

    data.documents.unshift(doc);
    // Ensure the uploader is in the recipients list so analytics can resolve them.
    if (doc.uploadedBy && !data.recipients.some((r) => r.id === doc.uploadedBy)) {
        data.recipients.push({
            id: doc.uploadedBy,
            email: `${doc.uploadedBy}@example.com`,
            name: "Uploader",
            username: doc.uploadedBy,
        });
    }
    writeData(data);

    res.status(201).json(doc);
});

module.exports = router;
