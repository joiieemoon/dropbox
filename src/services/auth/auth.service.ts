/**
 * Auth service for handling authentication logic.
 * All localStorage operations are encapsulated within this service.
 */

export const AUTH_STORAGE_KEY = "auth_user";
export const REGISTERED_USERS_KEY = "registered_users";

export interface AuthUser {
  email: string;
  isLoggedIn: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
}

export interface SignupResponse {
  success: boolean;
  message: string;
}

export interface RegisteredUser {
  email: string;
  firstName: string;
  lastName: string;
}

function getStoredAuth(): AuthUser | null {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as AuthUser;
  } catch {
    return null;
  }
}

function setStoredAuth(user: AuthUser): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

function clearStoredAuth(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function getRegisteredUsers(): RegisteredUser[] {
  try {
    const stored = localStorage.getItem(REGISTERED_USERS_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as RegisteredUser[];
  } catch {
    return [];
  }
}

function setRegisteredUsers(users: RegisteredUser[]): void {
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
}

/**
 * Login the user with email and password.
 * Stores auth info in localStorage after successful login.
 */
export async function login(
  email: string,
  _password: string,
): Promise<LoginResponse> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const user: AuthUser = {
    email,
    isLoggedIn: true,
  };

  setStoredAuth(user);
  
  return {

    success: true,
    message: "Login successful",
  };
}

/**
 * Register a new user. Prevents duplicate email registrations.
 */
export async function signup(
  data: Record<string, string>,
): Promise<SignupResponse> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const email = data.email;
  if (!email) {
    return { success: false, message: "Email is required" };
  }

  const existingUsers = getRegisteredUsers();
  const duplicate = existingUsers.find(
    (u) => u.email.toLowerCase() === email.toLowerCase(),
  );

  if (duplicate) {
    return {
      success: false,
      message: "An account with this email already exists",
    };
  }

  const newUser: RegisteredUser = {
    email,
    firstName: data.firstName ?? "",
    lastName: data.lastName ?? "",
  };

  existingUsers.push(newUser);
  setRegisteredUsers(existingUsers);

  // Auto-login after signup
  setStoredAuth({ email, isLoggedIn: true });

  return {
    success: true,
    message: "Account created successfully",
  };
}

/**
 * Logout the current user.
 */
export function logout(): void {
  clearStoredAuth();
}

/**
 * Get the currently logged-in user from storage.
 */
export function getCurrentUser(): AuthUser | null {
  return getStoredAuth();
}

/**
 * Check if a user is currently logged in.
 */
export function isAuthenticated(): boolean {
  const user = getStoredAuth();
  return user !== null && user.isLoggedIn === true;
}