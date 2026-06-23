/**
 * Toast notifications utility.
 * Wraps react-hot-toast for consistent usage across the app.
 */
import toast from "react-hot-toast";

interface ToastOptions {
  duration?: number;
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
}

/**
 * Show a success toast notification.
 */
export function showSuccess(message: string, options?: ToastOptions) {
  return toast.success(message, options);
}

/**
 * Show an error toast notification.
 */
export function showError(message: string, options?: ToastOptions) {
  return toast.error(message, options);
}

/**
 * Show a loading toast notification.
 */
export function showLoading(message: string, options?: ToastOptions) {
  return toast.loading(message, options);
}

/**
 * Dismiss a specific toast or all toasts.
 */
export function dismissToast(toastId?: string) {
  if (toastId) {
    toast.dismiss(toastId);
  } else {
    toast.dismiss();
  }
}

// Re-export the Toaster component for convenience
export { Toaster } from "react-hot-toast";

// Re-export the default toast for advanced usage
export default toast;
