import { writable } from "svelte/store";

export type ToastType = "success" | "error";

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

let nextId = 0;

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);

  return {
    subscribe,
    add(message: string, type: ToastType) {
      const id = nextId++;
      update((toasts) => [...toasts, { id, message, type }]);
      return id;
    },
    remove(id: number) {
      update((toasts) => toasts.filter((t) => t.id !== id));
    },
  };
}

export const toasts = createToastStore();

export function toast(message: string, type: ToastType) {
  return toasts.add(message, type);
}
