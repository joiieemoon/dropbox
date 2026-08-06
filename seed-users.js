/**
 * Seed script - creates users in Firebase Auth and Firestore.
 *
 * Prerequisites:
 * 1. npm install firebase-admin
 * 2. Download your Firebase service account key
 * 3. Save it as: serviceAccountKey.json
 *
 * Run:
 * node seed-users.js
 */

// import admin from "firebase-admin";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import serviceAccount from "./serviceAccountKey.json" with { type: "json" };

// Support __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

// Check if service account exists
if (!fs.existsSync(serviceAccountPath)) {
    console.error("❌ serviceAccountKey.json not found!");
    console.log("Download it from:");
    console.log("Firebase Console → Project Settings → Service Accounts → Generate New Private Key");
    process.exit(1);
}

// Initialize Firebase Admin
// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
// });

// const auth = admin.auth();
// const db = admin.firestore();
initializeApp({
    credential: cert(serviceAccount),
});

const auth = getAuth();
const db = getFirestore();
// Users
const users = [
    { name: "Aman", email: "aman@yopmail.com", password: "Abc@123", username: "aman", displayName: "Aman", role: "admin" },
    { name: "Raj", email: "raj@yopmail.com", password: "Abc@123", username: "raj", displayName: "Raj", role: "user" },
    { name: "Ravi", email: "ravi@yopmail.com", password: "Abc@123", username: "ravi", displayName: "Ravi", role: "user" },
    { name: "Kiran", email: "kiran@yopmail.com", password: "Abc@123", username: "kiran", displayName: "Kiran", role: "user" },
    { name: "Neha", email: "neha@yopmail.com", password: "Abc@123", username: "neha", displayName: "Neha", role: "user" },
    { name: "Pooja", email: "pooja@yopmail.com", password: "Abc@123", username: "pooja", displayName: "Pooja", role: "user" },
    { name: "Ankit", email: "ankit@yopmail.com", password: "Abc@123", username: "ankit", displayName: "Ankit", role: "user" },
    { name: "Riya", email: "riya@yopmail.com", password: "Abc@123", username: "riya", displayName: "Riya", role: "user" },
    { name: "Vikas", email: "vikas@yopmail.com", password: "Abc@123", username: "vikas", displayName: "Vikas", role: "user" },
    { name: "Sonal", email: "sonal@yopmail.com", password: "Abc@123", username: "sonal", displayName: "Sonal", role: "user" },
];

async function seedUsers() {
    console.log("🌱 Starting user seeding...\n");

    for (const user of users) {
        try {
            // Create Firebase Auth user
            const userRecord = await auth.createUser({
                email: user.email,
                password: user.password,
                displayName: user.displayName,
            });

            console.log(`✅ Auth user created: ${user.email}`);

            // Save user in Firestore
            await db.collection("users").doc(userRecord.uid).set({
                uid: userRecord.uid,
                name: user.name,
                username: user.username,
                email: user.email,
                displayName: user.displayName,
                role: user.role,
                createdAt: FieldValue.serverTimestamp(),
            });

            console.log(`✅ Firestore document created for ${user.email}\n`);

        } catch (error) {
            if (error.code === "auth/email-already-exists") {
                console.log(`⚠️ User already exists: ${user.email}`);
            } else {
                console.error(`❌ ${user.email}: ${error.message}`);
            }
        }
    }

    console.log("\n======================================");
    console.log("Users Created Successfully");
    console.log("======================================");

    users.forEach(user => {
        console.log(`${user.email}  |  ${user.password}`);
    });

    console.log("======================================");
}

seedUsers()
    .then(() => {
        console.log("\n🎉 Seeding completed!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ Error:", err);
        process.exit(1);
    });