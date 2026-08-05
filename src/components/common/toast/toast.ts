import toast from "react-hot-toast";
import type { ToastOptions, DefaultToastOptions } from "react-hot-toast";

/**
 * Reusable toast wrapper methods.
 * All styling matches the TailAdmin design system.
 */

const defaultOptions: ToastOptions = {
    duration: 4000,
    position: "top-center",
};

/**
 * Show a success toast.
 */
export function toastSuccess(message: string, options?: ToastOptions): string {
    return toast.success(message, { ...defaultOptions, ...options });
}

/**
 * Show an error toast.
 */
export function toastError(message: string, options?: ToastOptions): string {
    return toast.error(message, { ...defaultOptions, ...options });
}

/**
 * Show a warning toast (uses custom render).
 */
export function toastWarning(message: string, options?: ToastOptions): string {
    return toast(message, {
        ...defaultOptions,
        icon: "⚠️",
        ...options,
    });
}
    
/**
 * Show an info toast (uses custom render).
 */
export function toastInfo(message: string, options?: ToastOptions): string {
    return toast(message, {
        ...defaultOptions,
        icon: "ℹ️",
        ...options,
    });
}

/**
 * Show a promise toast for async operations.
 */
export function toastPromise<T>(
    promise: Promise<T>,
    messages: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: unknown) => string);
    },
    options?: ToastOptions,
): Promise<T> {
    return toast.promise(promise, messages, { ...defaultOptions, ...options });
}

/**
 * Dismiss a specific toast by ID, or all toasts if no ID provided.
 */
export function dismissToast(toastId?: string): void {
    toast.dismiss(toastId);
}

/**
 * Remove a specific toast by ID.
 */
export function removeToast(toastId: string): void {
    toast.remove(toastId);
}

/**
 * Default toast options for the Toaster component.
 */
export const defaultToastOptions: DefaultToastOptions = {
    duration: 4000,
    position: "top-center",
    style: {
        borderRadius: "12px",
        background: "#fff",
        color: "#1D2939",
        fontSize: "14px",
        boxShadow:
            "0px 4px 6px -2px rgba(16, 24, 40, 0.05), 0px 12px 16px -4px rgba(16, 24, 40, 0.1)",
    },
    success: {
        iconTheme: {
            primary: "#039855",
            secondary: "#fff",
        },
    },
    error: {
        iconTheme: {
            primary: "#D92D20",
            secondary: "#fff",
        },
    },
};

export {
    toastSuccess as success,
    toastError as error,
    toastWarning as warning,
    toastInfo as info,
    toastPromise as promise,
    dismissToast as dismiss,
    removeToast as remove,
};