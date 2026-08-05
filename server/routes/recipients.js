/**
 * recipients.js - list available recipients.
 */
const express = require("express");
const router = express.Router();
const { readData } = require("../store");

/**
 * GET /api/recipients
 * Return all recipients.
 */
router.get("/", (req, res) => {
    const data = readData();
    res.json(data.recipients);
});

module.exports = router;
