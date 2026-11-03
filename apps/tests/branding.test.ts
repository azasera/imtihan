import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import test, { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APPS_ROOT = path.resolve(__dirname, '..');

describe('Application Branding Configuration', () => {
  it('has brand name configured to E-Imtihan At-Tauhid', () => {
    const configPath = path.join(APPS_ROOT, 'lib', 'site-config.ts');
    assert.ok(fs.existsSync(configPath), 'lib/site-config.ts must exist');
    const content = fs.readFileSync(configPath, 'utf8');

    assert.ok(content.includes('name: "E-Imtihan At-Tauhid"'));
    assert.ok(content.includes('E-Imtihan At-Tauhid'));
  });

  it('ensures logo asset exists in public and app directories', () => {
    const publicLogo = path.join(APPS_ROOT, 'public', 'logo.png');
    const appIcon = path.join(APPS_ROOT, 'app', 'icon.png');

    assert.ok(fs.existsSync(publicLogo), 'public/logo.png must exist');
    assert.ok(fs.existsSync(appIcon), 'app/icon.png must exist');
    assert.ok(fs.statSync(publicLogo).size > 0, 'public/logo.png must not be empty');
    assert.ok(fs.statSync(appIcon).size > 0, 'app/icon.png must not be empty');
  });
});
