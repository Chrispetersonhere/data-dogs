import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

test('web package includes required build dependency for next css pipeline', () => {
  const specDir = path.dirname(fileURLToPath(import.meta.url));
  const packageJsonPath = path.join(specDir, '../package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  assert.ok(
    packageJson.dependencies?.postcss,
    'apps/web/package.json must include postcss so next build can resolve css minifier pipeline',
  );

  assert.ok(
    packageJson.dependencies?.['styled-jsx'],
    'apps/web/package.json must include styled-jsx so next build can resolve Next require-hook dependencies',
  );

  assert.ok(
    packageJson.devDependencies?.esbuild,
    'apps/web/package.json must include esbuild so tsx test runner can resolve its transpiler dependency',
  );

  const npmrcPath = path.join(specDir, '../../.npmrc');
  const npmrc = readFileSync(npmrcPath, 'utf8');
  assert.match(
    npmrc,
    /onlyBuiltDependencies\[\]=esbuild/,
    'workspace .npmrc must explicitly allow esbuild build script for tsx runtime',
  );
});
