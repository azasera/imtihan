import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import test, { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APPS_ROOT = path.resolve(__dirname, '..');

// Regex to detect technical specification codes in user-facing UI
const TECHNICAL_LEAK_REGEX = /\b(SCR-[A-Z0-9\-]+|[A-Z]{2,10}-(FR|AC|NFR)-\d+|TASK-\d+|Fase\s+\d+)\b/g;

describe('CBT Bank Soal Enhancements (TASK-011)', () => {
  it('confirms questions table schema supports stimulus and modern question types', () => {
    const schemaFile = path.join(APPS_ROOT, 'convex', 'schema.ts');
    assert.ok(fs.existsSync(schemaFile), 'convex/schema.ts must exist');
    const content = fs.readFileSync(schemaFile, 'utf8');

    assert.ok(content.includes('v.literal("multiple_choice")'));
    assert.ok(content.includes('v.literal("pg_kompleks")'));
    assert.ok(content.includes('v.literal("true_false")'));
    assert.ok(content.includes('v.literal("essay")'));
    assert.ok(content.includes('stimulusText: v.optional(v.string())'));
    assert.ok(content.includes('stimulusMediaUrl: v.optional(v.string())'));
  });

  it('confirms createQuestion mutation enforces validation rules for each question type', () => {
    const mutationFile = path.join(APPS_ROOT, 'convex', 'bank', 'public', 'mutations.ts');
    assert.ok(fs.existsSync(mutationFile), 'mutations.ts must exist');
    const content = fs.readFileSync(mutationFile, 'utf8');

    // Validation checks
    assert.ok(content.includes('args.type === "multiple_choice"'));
    assert.ok(content.includes('args.type === "pg_kompleks"'));
    assert.ok(content.includes('args.type === "true_false"'));
    assert.ok(content.includes('Soal pilihan ganda harus memiliki tepat satu kunci jawaban yang benar'));
    assert.ok(content.includes('Soal pilihan ganda kompleks harus memiliki minimal 2 kunci jawaban yang benar'));
    assert.ok(content.includes('Soal benar/salah harus memiliki tepat satu status jawaban yang benar'));
  });

  it('confirms Bank Soal editor page supports all 4 question types and Live Preview', () => {
    const editorPage = path.join(APPS_ROOT, 'app', '(main)', 'bank-soal', '[id]', 'page.tsx');
    assert.ok(fs.existsSync(editorPage), 'bank-soal/[id]/page.tsx must exist');
    const content = fs.readFileSync(editorPage, 'utf8');

    // Type options
    assert.ok(content.includes('Pilihan Ganda'));
    assert.ok(content.includes('PG Kompleks'));
    assert.ok(content.includes('Benar / Salah'));
    assert.ok(content.includes('Essay'));

    // Stimulus controls
    assert.ok(content.includes('Konten Wacana / Stimulus Soal'));
    assert.ok(content.includes('stimulusText'));
    assert.ok(content.includes('stimulusMediaUrl'));

    // Live preview
    assert.ok(content.includes('Live Preview'));
    assert.ok(content.includes('Pratinjau Siswa'));

    // Check zero technical leakage
    const matches = Array.from(content.matchAll(TECHNICAL_LEAK_REGEX)).map((m) => m[0]);
    assert.deepStrictEqual(matches, [], 'Must have zero technical specification code leaks');
  });
});
