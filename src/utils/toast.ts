export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastPayload {
  id: string;
  variant: ToastVariant;
  title: string;
  message: string;
}

type ToastListener = (payload: ToastPayload) => void;

const listeners = new Set<ToastListener>();
let counter = 0;

function nextId(): string {
  counter += 1;
  return `toast-${Date.now()}-${counter}`;
}

function emit(variant: ToastVariant, title: string, message: string): string {
  const payload: ToastPayload = { id: nextId(), variant, title, message };
  for (const listener of listeners) {
    listener(payload);
  }
  return payload.id;
}

export function subscribeToToasts(listener: ToastListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function showSuccessToast(title: string, message: string): string {
  return emit('success', title, message);
}

export function showErrorToast(title: string, message: string): string {
  return emit('error', title, message);
}

export function showInfoToast(title: string, message: string): string {
  return emit('info', title, message);
}
