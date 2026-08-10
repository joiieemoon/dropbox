/**
 * Authentication service using Firebase.
 * Handles all authentication-related operations via Firebase Auth.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase";
import {
  LoginPayload,
  LoginResponse,
  SignupPayload,
  SignupResponse,
  UserProfile,
} from "../types";
import {
  setToken,
  setRefreshToken,
  removeToken,
  removeRefreshToken,
  clearAuth,
} from "../auth.storage";

/**
 * Convert a Firebase User to the app's UserProfile shape.
 */
function toUserProfile(user: User, extra?: Partial<UserProfile>): UserProfile {
  const nameParts = (user.displayName ?? "").split(" ");
  return {
    id: 0,
    email: user.email ?? "",
    firstName: nameParts[0] ?? "",
    lastName: nameParts.slice(1).join(" ") ?? "",
    username: user.displayName ?? user.email?.split("@")[0] ?? "",
    image: user.photoURL ?? "",
    creationAt: user.metadata.creationTime ?? "",
    firebaseUid: user.uid,
    ...extra,
  };
}

/**
 * Write the user document to Firestore (users/{uid}).
 * This is the secure identity record used by Firestore security rules.
 */
async function writeUserDoc(
  user: User,
  extra: { username?: string; displayName?: string } = {},
): Promise<void> {
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);
  if (!snapshot.exists()) {
    await setDoc(userRef, {
      email: user.email,
      username: extra.username ?? user.email?.split("@")[0] ?? "",
      displayName: extra.displayName ?? user.displayName ?? "",
      createdAt: serverTimestamp(),
    });
  }
}

/**
 * Login with email and password via Firebase Authentication.
 */
export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    payload.email,
    payload.password,
  );
  const user = userCredential.user;

  await writeUserDoc(user);

  return {
    id: 0,
    accessToken: await user.getIdToken(),
    refreshToken: user.refreshToken ?? undefined,
    email: user.email ?? payload.email,
    username: user.displayName ?? user.email?.split("@")[0] ?? "",
    firstName: user.displayName?.split(" ")[0] ?? "",
    lastName: user.displayName?.split(" ").slice(1).join(" ") ?? "",
    gender: "",
    image: user.photoURL ?? "",
    firebaseUid: user.uid,
  };
}

/**
 * Signup with user details via Firebase Authentication.
 */
export async function signup(payload: SignupPayload): Promise<SignupResponse> {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    payload.email,
    payload.password,
  );
  const user = userCredential.user;

  // Set display name from the signup name field.
  await updateProfile(user, { displayName: payload.name });

  // Write the Firestore user document.
  await writeUserDoc(user, {
    username: payload.email.split("@")[0],
    displayName: payload.name,
  });

  return {
    id: 0,
    email: payload.email,
    name: payload.name,
    role: payload.role ?? "customer",
    avatar: payload.avatar ?? "",
    creationAt: new Date().toISOString(),
    firebaseUid: user.uid,
  };
}

/**
 * Get current Firebase user profile (reads from Firestore users/{uid}).
 */
export async function getCurrentUser(): Promise<UserProfile> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No authenticated user");
  }
  // Try to read enriched profile from Firestore.
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);
  const data = snapshot.exists() ? snapshot.data() : {};
  return toUserProfile(user, {
    username: (data.username as string) ?? user.displayName ?? "",
    firebaseUid: user.uid,
  });
}

/**
 * Update user profile in Firebase Auth and Firestore (users/{uid}).
 */
export async function updateUserProfile(
  payload: Partial<UserProfile>,
  userId?: number,
): Promise<UserProfile> {
  void userId; // Firebase uses auth.currentUser.uid
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User ID is required to update profile");
  }

  if (payload.firstName || payload.lastName) {
    await updateProfile(user, {
      displayName: `${payload.firstName ?? ""} ${payload.lastName ?? ""}`.trim(),
    });
  }

  // Update the Firestore user document.
  const userRef = doc(db, "users", user.uid);
  await setDoc(
    userRef,
    {
      email: user.email,
      username: payload.username ?? user.email?.split("@")[0] ?? "",
      displayName: user.displayName ?? "",
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return toUserProfile(user, payload);
}

/**
 * Logout the current Firebase user.
 */
export async function logout(): Promise<void> {
  try {
    await signOut(auth);
  } catch {
    // Ignore logout errors - still clear local state
  } finally {
    clearAuth();
  }
}

/**
 * Store authentication tokens.
 */
export function storeToken(
  accessToken: string,
  refreshToken?: string,
): void {
  setToken(accessToken);
  if (refreshToken) {
    setRefreshToken(refreshToken);
  }
}

/**
 * Remove authentication tokens.
 */
export function removeTokens(): void {
  removeToken();
  removeRefreshToken();
}

/**
 * Refresh the Firebase ID token.
 */
export async function refreshToken(): Promise<LoginResponse | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return {
    id: 0,
    accessToken: await user.getIdToken(true),
    refreshToken: user.refreshToken ?? undefined,
    email: user.email ?? "",
    username: user.displayName ?? "",
    firstName: user.displayName?.split(" ")[0] ?? "",
    lastName: user.displayName?.split(" ").slice(1).join(" ") ?? "",
    gender: "",
    image: user.photoURL ?? "",
    firebaseUid: user.uid,
  };
}
