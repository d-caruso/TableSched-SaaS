// Lightweight imperative toast for SaaS-layer notifications.
// Decoupled from React context so it can be called from React Query callbacks.

export const TOAST_VARIANT = {
  INFO: 'info',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

export type ToastVariant = typeof TOAST_VARIANT[keyof typeof TOAST_VARIANT];

export type ToastEntry = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type Listener = (entries: ToastEntry[]) => void;

let entries: ToastEntry[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l([...entries]));
}

export function showToast(
  message: string,
  variant: ToastVariant = TOAST_VARIANT.INFO,
): void {
  const id = String(nextId++);
  entries = [...entries, { id, message, variant }];
  notify();
  setTimeout(() => {
    entries = entries.filter((e) => e.id !== id);
    notify();
  }, 4000);
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
