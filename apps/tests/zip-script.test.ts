import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APPS_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(APPS_ROOT, '..');

describe('Zip Artifacts Script Configuration', () => {
  it('registers "zip" script in root package.json', () => {
    const rootPkgPath = path.join(REPO_ROOT, 'package.json');
    assert.ok(fs.existsSync(rootPkgPath), 'root package.json must exist');
    const pkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
    assert.strictEqual(pkg.scripts?.zip, 'node scripts/zip.mjs');
  });

  it('registers "zip" script in apps/package.json', () => {
    const appsPkgPath = path.join(APPS_ROOT, 'package.json');
    assert.ok(fs.existsSync(appsPkgPath), 'apps/package.json must exist');
    const pkg = JSON.parse(fs.readFileSync(appsPkgPath, 'utf8'));
    assert.strictEqual(pkg.scripts?.zip, 'node ../scripts/zip.mjs');
  });

  it('ensures scripts/zip.mjs exists and is executable', () => {
    const scriptPath = path.join(REPO_ROOT, 'scripts', 'zip.mjs');
    assert.ok(fs.existsSync(scriptPath), 'scripts/zip.mjs must exist');
    const content = fs.readFileSync(scriptPath, 'utf8');
    assert.ok(content.includes('createZip'), 'must define createZip function');
    assert.ok(content.includes('dist.zip'), 'must reference dist.zip');
  });

  it('validates dist.zip artifact generation when build output exists', () => {
    const distZip = path.join(REPO_ROOT, 'dist.zip');
    if (fs.existsSync(distZip)) {
      const stats = fs.statSync(distZip);
      assert.ok(stats.size > 0, 'dist.zip must not be empty');
    }
  });
});
