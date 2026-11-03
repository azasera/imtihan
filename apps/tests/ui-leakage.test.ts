import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import test, { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APPS_ROOT = path.resolve(__dirname, '..');

// Regex to detect technical specification codes in user-facing UI
export const TECHNICAL_LEAK_REGEX = /\b(SCR-[A-Z0-9\-]+|[A-Z]{2,10}-(FR|AC|NFR)-\d+|TASK-\d+|Fase\s+\d+)\b/g;

export interface LeakMatch {
  file: string;
  line: number;
  snippet: string;
  matched: string[];
}

/**
 * Checks whether a given line is an allowable technical code usage:
 * - Single-line comment (`// ...`)
 * - data-testid attribute assignment (`data-testid="..."`)
 */
export function isAllowedLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
    return true;
  }
  // If line contains data-testid and removing data-testid="..." leaves no technical code
  if (trimmed.includes('data-testid')) {
    const withoutTestId = trimmed.replace(/data-testid=["'][^"']*["']/g, '');
    if (!TECHNICAL_LEAK_REGEX.test(withoutTestId)) {
      TECHNICAL_LEAK_REGEX.lastIndex = 0;
      return true;
    }
    TECHNICAL_LEAK_REGEX.lastIndex = 0;
  }
  return false;
}

/**
 * Scans a file content for technical spec leakage.
 */
export function scanFileForLeaks(filePath: string, content: string): LeakMatch[] {
  const leaks: LeakMatch[] = [];
  const lines = content.split(/\r?\n/);
  let inMultiLineComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (inMultiLineComment) {
      if (trimmed.includes('*/')) {
        inMultiLineComment = false;
      }
      continue;
    }

    if (trimmed.startsWith('/*') && !trimmed.includes('*/')) {
      inMultiLineComment = true;
      continue;
    }

    if (isAllowedLine(line)) {
      continue;
    }

    TECHNICAL_LEAK_REGEX.lastIndex = 0;
    const matches = Array.from(line.matchAll(TECHNICAL_LEAK_REGEX)).map((m) => m[0]);
    if (matches.length > 0) {
      leaks.push({
        file: filePath,
        line: i + 1,
        snippet: trimmed,
        matched: matches,
      });
    }
  }

  return leaks;
}

/**
 * Recursively retrieves all files matching specific extensions in directory.
 */
function getFilesRecursively(dir: string, extensions: string[]): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next') {
        results.push(...getFilesRecursively(fullPath, extensions));
      }
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('UI Technical Specification Leakage Prevention', () => {
  it('detects sample technical code leaks in UI copy while allowing data-testid and comments', () => {
    const leakingCode = `
      export function BadComponent() {
        return (
          <div>
            <span className="badge">SCR-POS-01</span>
            <h2>1. OMZET (CUST-FR-001)</h2>
            <p>Fase 02 task TASK-004</p>
          </div>
        );
      }
    `;

    const cleanCodeWithAllowedMetadata = `
      // Traceability: SCR-POS-01
      /* TASK-004 CUST-FR-001 */
      export function GoodComponent() {
        return (
          <div data-testid="SCR-POS-01">
            <span className="badge" data-testid="TASK-004">Kasir POS</span>
            <h2>Total Omzet</h2>
            <p>Input transaksi cepat tanpa me-reset form.</p>
          </div>
        );
      }
    `;

    const leaks = scanFileForLeaks('BadComponent.tsx', leakingCode);
    assert.strictEqual(leaks.length, 3, 'Should catch all 3 leaking lines in BadComponent');
    assert.ok(leaks[0].matched.includes('SCR-POS-01'));
    assert.ok(leaks[1].matched.includes('CUST-FR-001'));
    assert.ok(leaks[2].matched.includes('Fase 02'));
    assert.ok(leaks[2].matched.includes('TASK-004'));

    const cleanLeaks = scanFileForLeaks('GoodComponent.tsx', cleanCodeWithAllowedMetadata);
    assert.strictEqual(cleanLeaks.length, 0, 'Clean component with comments and data-testid should have 0 leaks');
  });

  it('scans all app and component files in the repository for technical spec leaks', () => {
    const targetDirs = [
      path.join(APPS_ROOT, 'app'),
      path.join(APPS_ROOT, 'components'),
    ];

    const uiFiles: string[] = [];
    for (const dir of targetDirs) {
      uiFiles.push(...getFilesRecursively(dir, ['.tsx', '.jsx']));
    }

    assert.ok(uiFiles.length > 0, 'Found UI files to scan in apps/app and apps/components');

    const allLeaks: LeakMatch[] = [];
    for (const file of uiFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const fileLeaks = scanFileForLeaks(path.relative(APPS_ROOT, file), content);
      allLeaks.push(...fileLeaks);
    }

    if (allLeaks.length > 0) {
      const leakSummary = allLeaks
        .map(
          (l) =>
            `  - ${l.file}:${l.line} [${l.matched.join(', ')}]\n    Snippet: ${l.snippet}`
        )
        .join('\n');
      assert.fail(
        `Technical specification code leakage detected in user-facing UI files!\n` +
          `Technical codes (SCR-*, *-FR-*, *-AC-*, TASK-*, Fase *) are strictly prohibited in UI text.\n` +
          `Found ${allLeaks.length} leak(s):\n${leakSummary}`
      );
    }
  });
});
