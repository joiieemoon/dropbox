/**
 * links.js - shared link creation and verification endpoints.
 */
const express = require("express");
const router = express.Router();
const { readData, writeData, makeId } = require("../store");

/**
 * GET /api/links
 * Return all generated tracking links.
 */
router.get("/", (req, res) => {
    const data = readData();
    res.json(data.links);
});

/**
 * POST /api/links
 * Create a new shared tracking link for a document + recipient.
 * Body: { documentId, recipientId }
 */
router.post("/", (req, res) => {
    const { documentId, recipientId } = req.body || {};
    if (!documentId || !recipientId) {
        return res.status(400).json({ error: "documentId and recipientId are required" });
    }

    const data = readData();
    const document = data.documents.find((d) => d.id === documentId);
    if (!document) {
        return res.status(404).json({ error: "Document not found" });
    }

    // Add recipient to the document's sharedWith list if not already present.
    if (!document.sharedWith.includes(recipientId)) {
        document.sharedWith.push(recipientId);
    }

    const token = makeId("v");
    const link = {
        id: makeId("link"),
        documentId,
        recipientId,
        token,
        url: `${req.protocol}://${req.get("host")}/v/${token}`,
        createdAt: new Date().toISOString(),
    };

    data.links.unshift(link);
    writeData(data);

    res.status(201).json(link);
});

/**
 * GET /api/links/:token
 * Verify a link and return whether the requesting viewer has access.
 * Query: ?viewerRecipientId=rec_X
 */
router.get("/:token", (req, res) => {
    const { token } = req.params;
    const viewerRecipientId = req.query.viewerRecipientId;

    const data = readData();
    const link = data.links.find((l) => l.token === token);
    if (!link) {
        return res.status(404).json({ valid: false, emailKnown: false });
    }

    const document = data.documents.find((d) => d.id === link.documentId);
    if (!document) {
        return res.status(404).json({ valid: false, emailKnown: false });
    }

    // A viewer is authorized if they are the link's intended recipient,
    // are in the document's explicit sharedWith list, or are the uploader.
    const isAuthorizedViewer =
        viewerRecipientId === link.recipientId ||
        (viewerRecipientId && document.sharedWith.includes(viewerRecipientId)) ||
        viewerRecipientId === document.uploadedBy;

    if (!viewerRecipientId || !isAuthorizedViewer) {
        return res.json({ valid: false, emailKnown: false });
    }

    res.json({
        valid: true,
        emailKnown: true,
        document: {
            id: document.id,
            name: document.name,
            pageCount: document.pageCount,
            url: document.url,
            dataUrl: document.dataUrl,
            sharedWith: document.sharedWith,
            uploadedBy: document.uploadedBy,
        },
    });
});

module.exports = router;
