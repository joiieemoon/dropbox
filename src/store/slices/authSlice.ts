/**
 * Authentication Redux slice.
 * Manages authentication state with Redux Toolkit.
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthState, UserProfile, TokenPair } from "../../api/types";

/**
 * Initial authentication state.
 */
const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

/**
 * Authentication slice.
 */
export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /**
     * Set user and tokens after successful login/signup.
     */
      setCredentials: (
       state,
       action: PayloadAction<{
         user: UserProfile | null;
         tokens: TokenPair;
       }>,
     ) => {
       state.user = action.payload.user;
       state.accessToken = action.payload.tokens.accessToken;
       state.refreshToken = action.payload.tokens.refreshToken ?? null;
       state.isAuthenticated = !!action.payload.user;
       state.error = null;
     },

    /**
     * Set user profile.
     */
    setUserProfile: (
      state,
      action: PayloadAction<UserProfile>,
    ) => {
      state.user = action.payload;
    },

    /**
     * Set loading state.
     */
    setLoading: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.isLoading = action.payload;
    },

    /**
     * Set error state.
     */
    setError: (
      state,
      action: PayloadAction<string | null>,
    ) => {
      state.error = action.payload;
    },

    /**
     * Clear authentication state on logout.
     */
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
    },

    /**
     * Update access token (for refresh).
     */
    updateAccessToken: (
      state,
      action: PayloadAction<string>,
    ) => {
      state.accessToken = action.payload;
    },
  },
});

export const {
  setCredentials,
  setUserProfile,
  setLoading,
  setError,
  logout,
  updateAccessToken,
} = authSlice.actions;

export default authSlice.reducer;