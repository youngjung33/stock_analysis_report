let unauthorizedCallback: (() => void) | null = null;

export const tokenStorage = {
  onUnauthorized(callback: () => void): void {
    unauthorizedCallback = callback;
  },

  triggerUnauthorized(): void {
    unauthorizedCallback?.();
  },
};
