/**
 * Authentication selectors.
 * Provides memoized selectors for auth state.
 */

import { createSelector } from "@reduxjs/toolkit";
// import { RootState } from "../index"
import { RootState } from "..";
/**
 * Select authentication state.
 */
export const selectAuthState = (state: RootState) => state.auth;

/**
 * Select current user.
 */
export const selectUser = createSelector(
  [selectAuthState],
  (auth) => auth.user,
);

/**
 * Select access token.
 */
export const selectAccessToken = createSelector(
  [selectAuthState],
  (auth) => auth.accessToken,
);

/**
 * Select refresh token.
 */
export const selectRefreshToken = createSelector(
  [selectAuthState],
  (auth) => auth.refreshToken,
);

/**
 * Select authentication status.
 */
export const selectIsAuthenticated = createSelector(
  [selectAuthState],
  (auth) => auth.isAuthenticated,
);

/**
 * Select loading state.
 */
export const selectAuthLoading = createSelector(
  [selectAuthState],
  (auth) => auth.isLoading,
);

/**
 * Select error state.
 */
export const selectAuthError = createSelector(
  [selectAuthState],
  (auth) => auth.error,
);

/**
 * Select user role.
 */
// export const selectUserRole = createSelector(
//   [selectUser],
//   (user) => user?.role,
// );