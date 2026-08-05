/**
 * store.js - simple JSON file storage for the PDF tracking POC.
 * Reads/writes the local data.json file on every mutation.
 */
const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "data.json");

/** Default seed data structure. */
function defaultData() {
    return {
        documents: [],
        recipients: [],
        links: [],
        views: [],
    };
}

/** Read the data file, returning default data if missing/invalid. */
function readData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, "utf8");
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === "object") {
                return {
                    documents: parsed.documents || [],
                    recipients: parsed.recipients || [],
                    links: parsed.links || [],
                    views: parsed.views || [],
                };
            }
        }
    } catch (err) {
        console.error("Failed to read data.json, using defaults:", err.message);
    }
    return defaultData();
}

/** Write the entire data object to disk. */
function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    } catch (err) {
        console.error("Failed to write data.json:", err.message);
    }
}

/** Generate a short unique id/token. */
function makeId(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now()
        .toString(36)
        .slice(-4)}`;
}

module.exports = {
    readData,
    writeData,
    makeId,
    DATA_FILE,
};
