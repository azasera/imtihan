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

describe('CBT Exam 3-Panel & Integrity Features (TASK-012)', () => {
  it('confirms schema defines tabViolations on examParticipants and selectedOptionIds on studentAnswers', () => {
    const schemaFile = path.join(APPS_ROOT, 'convex', 'schema.ts');
    assert.ok(fs.existsSync(schemaFile), 'convex/schema.ts must exist');
    const content = fs.readFileSync(schemaFile, 'utf8');

    assert.ok(content.includes('tabViolations: v.optional(v.number())'));
    assert.ok(content.includes('selectedOptionIds: v.optional(v.array(v.string()))'));
  });

  it('confirms backend mutations support recordTabViolation and auto-scoring for PG Kompleks and Benar/Salah', () => {
    const mutationFile = path.join(APPS_ROOT, 'convex', 'examSession', 'public', 'mutations.ts');
    assert.ok(fs.existsSync(mutationFile), 'mutations.ts must exist');
    const content = fs.readFileSync(mutationFile, 'utf8');

    // recordTabViolation
    assert.ok(content.includes('export const recordTabViolation = mutation'));
    assert.ok(content.includes('tabViolations: newCount'));

    // saveStudentAnswer selectedOptionIds
    assert.ok(content.includes('selectedOptionIds: v.optional(v.array(v.string()))'));

    // submitStudentExam auto-scoring
    assert.ok(content.includes('q.type === "true_false"'));
    assert.ok(content.includes('q.type === "pg_kompleks"'));
  });

  it('confirms ExamWorksheet UI has 3-panel layout, anti-cheat listeners, and zero technical leaks', () => {
    const worksheetFile = path.join(APPS_ROOT, 'app', 'ujian', 'ExamWorksheet.tsx');
    assert.ok(fs.existsSync(worksheetFile), 'ExamWorksheet.tsx must exist');
    const content = fs.readFileSync(worksheetFile, 'utf8');

    // 3-Panel elements
    assert.ok(content.includes('Wacana / Stimulus'));
    assert.ok(content.includes('Peta Nomor Soal'));
    assert.ok(content.includes('pg_kompleks'));
    assert.ok(content.includes('true_false'));

    // Anti-cheat elements
    assert.ok(content.includes('visibilitychange'));
    assert.ok(content.includes('Peringatan Integritas Ujian'));
    assert.ok(content.includes('recordTabViolation'));

    // Check zero technical leakage
    const matches = Array.from(content.matchAll(TECHNICAL_LEAK_REGEX)).map((m) => m[0]);
    assert.deepStrictEqual(matches, [], 'Must have zero technical specification code leaks');
  });

  it('confirms rekap-nilai page displays Pelanggaran Tab and includes it in CSV export', () => {
    const rekapFile = path.join(APPS_ROOT, 'app', '(main)', 'rekap-nilai', 'page.tsx');
    assert.ok(fs.existsSync(rekapFile), 'rekap-nilai/page.tsx must exist');
    const content = fs.readFileSync(rekapFile, 'utf8');

    assert.ok(content.includes('Pelanggaran Tab'));
    assert.ok(content.includes('tabViolations'));

    // Check zero technical leakage
    const matches = Array.from(content.matchAll(TECHNICAL_LEAK_REGEX)).map((m) => m[0]);
    assert.deepStrictEqual(matches, [], 'Must have zero technical specification code leaks');
  });
});
