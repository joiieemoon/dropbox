export {
  login,
  signup,
  logout,
  getCurrentUser,
  isAuthenticated,
  AUTH_STORAGE_KEY,
  REGISTERED_USERS_KEY,
} from "./auth.service";

export type {
  AuthUser,
  LoginCredentials,
  LoginResponse,
  SignupResponse,
  RegisteredUser,
} from "./auth.service";