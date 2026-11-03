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

describe('Bank Soal UI & Editor Pages', () => {
  it('confirms Bank Soal list page exists and has required elements', () => {
    const listPage = path.join(APPS_ROOT, 'app', '(main)', 'bank-soal', 'page.tsx');
    assert.ok(fs.existsSync(listPage), 'bank-soal/page.tsx must exist');
    const content = fs.readFileSync(listPage, 'utf8');

    assert.ok(content.includes('Bank Soal & Materi Ujian'));
    assert.ok(content.includes('Buat Paket Bank Soal'));
    assert.ok(content.includes('api.bank.public.queries.listQuestionBanks'));
    assert.ok(content.includes('api.bank.public.mutations.createQuestionBank'));

    // Check zero technical leakage
    const matches = Array.from(content.matchAll(TECHNICAL_LEAK_REGEX)).map((m) => m[0]);
    assert.deepStrictEqual(matches, [], 'Must have zero technical specification code leaks');
  });

  it('confirms Bank Soal editor page exists and has multiple choice & essay inputs', () => {
    const editorPage = path.join(APPS_ROOT, 'app', '(main)', 'bank-soal', '[id]', 'page.tsx');
    assert.ok(fs.existsSync(editorPage), 'bank-soal/[id]/page.tsx must exist');
    const content = fs.readFileSync(editorPage, 'utf8');

    assert.ok(content.includes('Tambah Butir Soal Baru'));
    assert.ok(content.includes('Pilihan Ganda'));
    assert.ok(content.includes('Essay'));
    assert.ok(content.includes('api.bank.public.queries.getQuestionBank'));
    assert.ok(content.includes('api.bank.public.mutations.createQuestion'));

    // Check zero technical leakage
    const matches = Array.from(content.matchAll(TECHNICAL_LEAK_REGEX)).map((m) => m[0]);
    assert.deepStrictEqual(matches, [], 'Must have zero technical specification code leaks');
  });

  it('confirms app sidebar links to /bank-soal', () => {
    const sidebarPath = path.join(APPS_ROOT, 'components', 'app-sidebar.tsx');
    assert.ok(fs.existsSync(sidebarPath), 'components/app-sidebar.tsx must exist');
    const content = fs.readFileSync(sidebarPath, 'utf8');

    assert.ok(content.includes('url: "/bank-soal"'));
    assert.ok(content.includes('title: "Bank Soal"'));
  });
});
