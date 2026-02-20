import { mock } from 'bun:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

GlobalRegistrator.register();

(globalThis as Record<string, unknown>).__APP_VERSION__ = '0.1.0';
(globalThis as Record<string, unknown>).__COMMIT_HASH__ = 'test';

URL.createObjectURL = mock(() => 'blob:test');
URL.revokeObjectURL = mock(() => {});
