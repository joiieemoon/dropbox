/**
 * Application Redux slice.
 * Manages global application state.
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/**
 * Application state interface.
 */
interface AppState {
  theme: "light" | "dark";
  sidebarOpen: boolean;
  isLoading: boolean;
}

/**
 * Initial application state.
 */
const initialState: AppState = {
  theme: "light",
  sidebarOpen: true,
  isLoading: false,
};

/**
 * Application slice.
 */
export const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    /**
     * Toggle theme.
     */
    toggleTheme: (state) => {
      state.theme = state.theme === "light" ? "dark" : "light";
    },

    /**
     * Set theme.
     */
    setTheme: (
      state,
      action: PayloadAction<"light" | "dark">,
    ) => {
      state.theme = action.payload;
    },

    /**
     * Toggle sidebar.
     */
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },

    /**
     * Set sidebar state.
     */
    setSidebarOpen: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.sidebarOpen = action.payload;
    },

    /**
     * Set global loading state.
     */
    setGlobalLoading: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  setGlobalLoading,
} = appSlice.actions;

export default appSlice.reducer;