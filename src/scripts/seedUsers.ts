// /**
//  * Seed script - creates 10 users in Firebase Auth and Firestore.
//  * Run with: npx tsx src/scripts/seedUsers.ts
//  */

// import { initializeApp, cert } from "firebase-admin/app";
// import { getAuth, createUserWithEmailAndPassword } from "firebase-admin/auth";
// import { getFirestore, doc, setDoc, serverTimestamp } from "firebase-admin/firestore";

// // Initialize Firebase Admin with service account key
// // You need to download your service account key from Firebase Console
// const serviceAccount = require("../../serviceAccountKey.json");

// const app = initializeApp({
//   credential: cert(serviceAccount),
// });

// const auth = getAuth(app);
// const db = getFirestore(app);

// const users = [
//   { email: "admin@yopmail.com", password: "Admin@123", username: "admin", displayName: "Admin User", role: "admin" },
//   { email: "user1@yopmail.com", password: "User1@123", username: "user1", displayName: "User One", role: "user" },
//   { email: "user2@yopmail.com", password: "User2@123", username: "user2", displayName: "User Two", role: "user" },
//   { email: "user3@yopmail.com", password: "User3@123", username: "user3", displayName: "User Three", role: "user" },
//   { email: "user4@yopmail.com", password: "User4@123", username: "user4", displayName: "User Four", role: "user" },
//   { email: "user5@yopmail.com", password: "User5@123", username: "user5", displayName: "User Five", role: "user" },
//   { email: "user6@yopmail.com", password: "User6@123", username: "user6", displayName: "User Six", role: "user" },
//   { email: "user7@yopmail.com", password: "User7@123", username: "user7", displayName: "User Seven", role: "user" },
//   { email: "user8@yopmail.com", password: "User8@123", username: "user8", displayName: "User Eight", role: "user" },
//   { email: "user9@yopmail.com", password: "User9@123", username: "user9", displayName: "User Nine", role: "user" },
// ];

// async function seedUsers() {
//   console.log("Starting user seeding...\n");

//   for (const userData of users) {
//     try {
//       // Create user in Firebase Auth
//       const userRecord = await auth.createUser({
//         email: userData.email,
//         password: userData.password,
//         displayName: userData.displayName,
//       });

//       console.log(`✓ Created auth user: ${userData.email} (${userRecord.uid})`);

//       // Create user document in Firestore
//       await setDoc(doc(db, "users", userRecord.uid), {
//         email: userData.email,
//         username: userData.username,
//         displayName: userData.displayName,
//         role: userData.role,
//         createdAt: serverTimestamp(),
//       });

//       console.log(`✓ Created Firestore document: users/${userRecord.uid}`);
//     } catch (error: any) {
//       if (error.code === "auth/email-already-exists") {
//         console.log(`⚠ User already exists: ${userData.email}`);
//       } else {
//         console.error(`✗ Error creating user ${userData.email}:`, error.message);
//       }
//     }
//   }

//   console.log("\n✓ User seeding complete!");
//   console.log("\nLogin credentials:");
//   console.log("Admin: admin@yopmail.com / Admin@123");
//   console.log("Users: user1@yopmail.com through user9@yopmail.com / User1@123 through User9@123");
// }


