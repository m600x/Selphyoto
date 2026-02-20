import { defineConfig } from 'vite';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

let commitHash = process.env.COMMIT_HASH || 'dev';
if (commitHash === 'dev') {
  try {
    commitHash = execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    // not a git repo or .git not available (e.g. Docker build)
  }
}
if (commitHash.length > 7) {
  commitHash = commitHash.slice(0, 7);
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __COMMIT_HASH__: JSON.stringify(commitHash),
  },
});
