/**
 * analytics.js - document analytics endpoints.
 */
const express = require("express");
const router = express.Router();
const { readData } = require("../store");

/**
 * GET /api/analytics/:docId
 * Return document-level analytics: total views, unique recipients,
 * per-page dwell, and per-recipient breakdown.
 */
router.get("/:docId", (req, res) => {
    const { docId } = req.params;
    const data = readData();

    const document = data.documents.find((d) => d.id === docId);
    if (!document) {
        return res.status(404).json({ error: "Document not found" });
    }

    const views = data.views.filter((v) => v.documentId === docId);
    const recipients = data.recipients;

    // Per-recipient breakdown.
    const recipientMap = {};
    views.forEach((v) => {
        if (!recipientMap[v.recipientId]) {
            recipientMap[v.recipientId] = {
                recipientId: v.recipientId,
                email: "",
                name: "",
                username: "",
                emailOpened: false,
                firstAccessAt: null,
                totalDurationSec: 0,
                completionPercent: 0,
                maxPageReached: 0,
                events: [],
            };
        }
        const rec = recipientMap[v.recipientId];
        rec.totalDurationSec += v.seconds || 0;
        rec.maxPageReached = Math.max(rec.maxPageReached, v.page || 1);
        if (!rec.firstAccessAt) rec.firstAccessAt = v.viewedAt;
        if (v.page) rec.events.push({ type: "page_view", page: v.page, timestamp: v.viewedAt });
    });

    // Fill in recipient metadata.
    const recipientAnalytics = Object.values(recipientMap).map((rec) => {
        const meta = recipients.find((r) => r.id === rec.recipientId);
        if (meta) {
            rec.email = meta.email;
            rec.name = meta.name;
            rec.username = meta.username;
            rec.emailOpened = !!meta.emailOpened;
        }
        // Completion percent (max page / total pages).
        if (document.pageCount > 0) {
            rec.completionPercent = Math.round(
                Math.min(100, (rec.maxPageReached / document.pageCount) * 100),
            );
        }
        return rec;
    });

    // Aggregate stats.
    const totalViews = views.length;
    const uniqueRecipients = new Set(views.map((v) => v.recipientId)).size;
    const avgDuration =
        recipientAnalytics.length > 0
            ? Math.round(
                recipientAnalytics.reduce((s, r) => s + r.totalDurationSec, 0) /
                recipientAnalytics.length,
            )
            : 0;

    // Per-page dwell (average seconds per page).
    const pageCount = document.pageCount || 1;
    const avgPageDwell = Array.from({ length: pageCount }, (_, i) => {
        const pageViews = views.filter((v) => (v.page || 1) === i + 1);
        if (pageViews.length === 0) return 0;
        return Math.round(
            pageViews.reduce((s, v) => s + (v.seconds || 0), 0) / pageViews.length,
        );
    });

    res.json({
        documentId: docId,
        documentTitle: document.name,
        pageCount,
        totalRecipients: document.sharedWith.length,
        openedCount: recipientAnalytics.filter((r) => r.emailOpened).length,
        openRate: document.sharedWith.length
            ? Math.round(
                (recipientAnalytics.filter((r) => r.emailOpened).length /
                    document.sharedWith.length) *
                100,
            )
            : 0,
        avgDurationSec: avgDuration,
        avgCompletionPercent: recipientAnalytics.length
            ? Math.round(
                recipientAnalytics.reduce((s, r) => s + r.completionPercent, 0) /
                recipientAnalytics.length,
            )
            : 0,
        avgPageDwell,
        recipients: recipientAnalytics,
        totalViews,
        uniqueRecipients,
    });
});

module.exports = router;
