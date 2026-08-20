import type { FC, ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { defaultToastOptions } from "./toast";

export interface ToastProviderProps {
  /** Child components */
  children: ReactNode;
}

/**
 * ToastProvider — wraps the application with react-hot-toast's Toaster.
 * Place once at the root of the app to enable toast notifications globally.
 */
export const ToastProvider: FC<ToastProviderProps> = ({ children }) => {
  return (
    <>
      {children}
      <Toaster
        toastOptions={defaultToastOptions}
        containerStyle={{ zIndex: 999999 }}
      />
    </>
  );
};

export default ToastProvider;
    