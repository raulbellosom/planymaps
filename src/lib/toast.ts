/**
 * Toast utility functions
 * Easy access to toast notifications throughout the app
 */

import { toast } from "sonner";

// Success toast
export function showSuccess(message: string, description?: string) {
  toast.success(message, { description });
}

// Error toast
export function showError(message: string, description?: string) {
  toast.error(message, { description });
}

// Warning toast
export function showWarning(message: string, description?: string) {
  toast.warning(message, { description });
}

// Info toast
export function showInfo(message: string, description?: string) {
  toast.info(message, { description });
}

// Loading toast (promise)
export function showLoading(
  promise: Promise<unknown>,
  messages: {
    loading?: string;
    success?: string;
    error?: string;
  },
) {
  return toast.promise(promise, messages);
}
