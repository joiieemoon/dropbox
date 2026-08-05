/**
 * index.js - main Express server for the PDF tracking POC.
 * Provides endpoints for shared links, access verification,
 * page-view tracking, and analytics, backed by data.json.
 */
const express = require("express");
const cors = require("cors");
const path = require("path");
const { readData, writeData } = require("./store");

const documentsRouter = require("./routes/documents");
const linksRouter = require("./routes/links");
const viewsRouter = require("./routes/views");
const analyticsRouter = require("./routes/analytics");
const recipientsRouter = require("./routes/recipients");

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Seed some demo data on first run so the POC works out of the box.
function seedIfEmpty() {
    const data = readData();
    if (data.documents.length > 0 && data.recipients.length > 0) return;

    const demoDocs = [
        {
            id: "doc_1",
            name: "Q3 Investor Deck.pdf",
            url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            pageCount: 8,
            uploadedAt: new Date().toISOString(),
            sizeBytes: 2400000,
            sharedWith: ["rec_1", "rec_2"],
            uploadedBy: "rec_9",
        },
        {
            id: "doc_2",
            name: "Product Roadmap 2026.pdf",
            url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            pageCount: 12,
            uploadedAt: new Date().toISOString(),
            sizeBytes: 3100000,
            sharedWith: ["rec_3"],
            uploadedBy: "rec_9",
        },
    ];

    const demoRecipients = [
        { id: "rec_1", email: "alice@acme.com", name: "Alice Johnson", username: "alice" },
        { id: "rec_2", email: "bob@globex.com", name: "Bob Smith", username: "bob" },
        { id: "rec_3", email: "carol@initech.com", name: "Carol White", username: "carol" },
        { id: "rec_4", email: "dave@umbrella.com", name: "Dave Brown", username: "dave" },
        { id: "rec_5", email: "erin@stark.com", name: "Erin Davis", username: "erin" },
        { id: "rec_9", email: "uploader@acme.com", name: "Uploader User", username: "uploader" },
    ];

    const demoLinks = [
        {
            id: "link_1",
            documentId: "doc_1",
            recipientId: "rec_1",
            token: "tok_alice_doc1",
            url: `${process.env.PUBLIC_URL || "http://localhost:5173"}/v/tok_alice_doc1`,
            createdAt: new Date().toISOString(),
        },
        {
            id: "link_2",
            documentId: "doc_1",
            recipientId: "rec_2",
            token: "tok_bob_doc1",
            url: `${process.env.PUBLIC_URL || "http://localhost:5173"}/v/tok_bob_doc1`,
            createdAt: new Date().toISOString(),
        },
    ];

    data.documents = demoDocs;
    data.recipients = demoRecipients;
    data.links = demoLinks;
    data.views = data.views || [];
    data.beacons = data.beacons || [];
    writeData(data);
}
seedIfEmpty();

// Health check
app.get("/api/health", (req, res) => {
    res.json({ ok: true, ts: new Date().toISOString() });
});

// Routes
app.use("/api/documents", documentsRouter);
app.use("/api/links", linksRouter);
app.use("/api/views", viewsRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/recipients", recipientsRouter);

// Serve the frontend viewer route at /v/:token (SPA fallback).
// In production the Vite build would be served here; for the POC
// we just return a JSON hint so the API is self-describing.
app.get("/v/:token", (req, res) => {
    res.json({
        message: "Viewer app should be served by the frontend. Use the API at /api/links/:token to verify access.",
        token: req.params.token,
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
    console.log(`PDF tracking server running on http://localhost:${PORT}`);
});
