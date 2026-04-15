import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('web package includes required build dependency for next css pipeline', () => {
  const packageJsonPath = path.join(process.cwd(), 'apps/web/package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
    dependencies?: Record<string, string>;
  };

  assert.ok(
    packageJson.dependencies?.postcss,
    'apps/web/package.json must include postcss so next build can resolve css minifier pipeline',
  );
});
