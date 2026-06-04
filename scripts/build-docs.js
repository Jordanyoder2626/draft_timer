const { copyFileSync, existsSync } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');

const docsPath = join(process.cwd(), 'docs');

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['react-scripts', 'build'],
  {
    env: {
      ...process.env,
      BUILD_PATH: 'docs',
    },
    stdio: 'inherit',
  }
);

if (result.status !== 0) {
  process.exit(result.status || 1);
}

const indexPath = join(docsPath, 'index.html');
const notFoundPath = join(docsPath, '404.html');

if (existsSync(indexPath)) {
  copyFileSync(indexPath, notFoundPath);
}
