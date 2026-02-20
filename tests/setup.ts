import { mock } from 'bun:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

GlobalRegistrator.register();

(globalThis as Record<string, unknown>).__APP_VERSION__ = '0.1.0';
(globalThis as Record<string, unknown>).__COMMIT_HASH__ = 'test';

if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = mock(() => 'blob:test');
}
if (typeof URL.revokeObjectURL !== 'function') {
  URL.revokeObjectURL = mock(() => {});
}
