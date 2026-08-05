/**
 * Typed Redux hooks.
 * Provides type-safe hooks for Redux store.
 */

import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./index";

/**
 * Use typed dispatch.
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Use typed selector.
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;