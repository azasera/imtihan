import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APPS_ROOT = path.resolve(__dirname, '..');

// Regex to detect technical specification codes in user-facing UI
const TECHNICAL_LEAK_REGEX = /\b(SCR-[A-Z0-9\-]+|[A-Z]{2,10}-(FR|AC|NFR)-\d+|TASK-\d+|Fase\s+\d+)\b/g;

describe('Bank Soal Stimulus Image Upload (IMG-AC)', () => {
  it('confirms questions table schema supports stimulusMediaStorageId', () => {
    const schemaFile = path.join(APPS_ROOT, 'convex', 'schema.ts');
    assert.ok(fs.existsSync(schemaFile), 'convex/schema.ts must exist');
    const content = fs.readFileSync(schemaFile, 'utf8');

    assert.ok(content.includes('stimulusMediaStorageId: v.optional(v.id("_storage"))'));
    assert.ok(content.includes('stimulusMediaUrl: v.optional(v.string())'));
    assert.ok(content.includes('stimulusText: v.optional(v.string())'));
  });

  it('confirms Convex bank mutations export generateUploadUrl and getStorageMediaUrl', () => {
    const mutationFile = path.join(APPS_ROOT, 'convex', 'bank', 'public', 'mutations.ts');
    assert.ok(fs.existsSync(mutationFile), 'mutations.ts must exist');
    const content = fs.readFileSync(mutationFile, 'utf8');

    assert.ok(content.includes('export const generateUploadUrl = mutation'));
    assert.ok(content.includes('export const getStorageMediaUrl = mutation'));
    assert.ok(content.includes('stimulusMediaStorageId: v.optional(v.id("_storage"))'));
    assert.ok(content.includes('ctx.storage.generateUploadUrl()'));
    assert.ok(content.includes('ctx.storage.getUrl(args.stimulusMediaStorageId)'));
  });

  it('confirms Bank Soal editor UI provides dual mode: Unggah Berkas and Tautan URL', () => {
    const editorPage = path.join(APPS_ROOT, 'app', '(main)', 'bank-soal', '[id]', 'page.tsx');
    assert.ok(fs.existsSync(editorPage), 'bank-soal/[id]/page.tsx must exist');
    const content = fs.readFileSync(editorPage, 'utf8');

    // Dual mode buttons
    assert.ok(content.includes('Unggah Berkas'));
    assert.ok(content.includes('Tautan URL'));

    // File input and validations
    assert.ok(content.includes('handleFileChange'));
    assert.ok(content.includes('generateUploadUrl'));
    assert.ok(content.includes('stimulusMediaStorageId'));
    assert.ok(content.includes('Pilih Berkas Gambar'));
    assert.ok(content.includes('Format PNG, JPG, WebP, atau SVG'));
    assert.ok(content.includes('5 MB'));

    // Replacement & removal buttons
    assert.ok(content.includes('Ganti'));
    assert.ok(content.includes('Hapus'));

    // Zero technical leak check
    const matches = Array.from(content.matchAll(TECHNICAL_LEAK_REGEX)).map((m) => m[0]);
    assert.deepStrictEqual(matches, [], 'Must have zero technical specification code leaks');
  });
});
