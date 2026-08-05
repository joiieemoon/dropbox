/**
 * Redux store configuration.
 * Creates the store with persistence and type definitions.
 */

import { configureStore } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import { rootReducer } from "./rootReducer";

/**
 * Create a noop storage for SSR compatibility.
 */
const createNoopStorage = () => ({
  getItem: () => Promise.resolve(null),
  setItem: () => Promise.resolve(),
  removeItem: () => Promise.resolve(),
});

/**
 * Web storage with SSR fallback.
 */
const webStorage =
  typeof window !== "undefined"
    ? {
        getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
        setItem: (key: string, value: string) =>
          Promise.resolve(localStorage.setItem(key, value)),
        removeItem: (key: string) =>
          Promise.resolve(localStorage.removeItem(key)),
      }
    : createNoopStorage();

/**
 * Persist configuration.
 */
const persistConfig = {
  key: "root",
  storage: webStorage,
  whitelist: ["auth"],
};

/**
 * Persisted reducer.
 */
const persistedReducer = persistReducer(persistConfig, rootReducer);

/**
 * Configure the Redux store.
 */
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: import.meta.env.VITE_NODE_ENV === "development",
});

/**
 * Create persistor.
 */
export const persistor = persistStore(store);

/**
 * Infer the `RootState` and `AppDispatch` types from the store.
 */
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;