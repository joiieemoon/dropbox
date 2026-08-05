/**
 * Root reducer.
 * Combines all slice reducers.
 */

import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import appReducer from "./slices/appSlice";

/**
 * Root reducer combining all slices.
 */
export const rootReducer = combineReducers({
  auth: authReducer,
  app: appReducer,
});

export default rootReducer;