import { vi } from 'vitest';

// Provide global stubs for build-time constants injected by Vite
(globalThis as Record<string, unknown>).__APP_VERSION__ = '0.1.0';
(globalThis as Record<string, unknown>).__COMMIT_HASH__ = 'test';

// Stub URL.createObjectURL / revokeObjectURL for jsdom
if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = vi.fn(() => 'blob:test');
}
if (typeof URL.revokeObjectURL !== 'function') {
  URL.revokeObjectURL = vi.fn();
}
