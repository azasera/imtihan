import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import test, { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APPS_ROOT = path.resolve(__dirname, '..');

/**
 * Validates options logic for multiple choice questions.
 */
function validateQuestionOptions(options?: Array<{ id: string; label: string; text: string; isCorrect: boolean }>) {
  if (!options || options.length < 2) {
    throw new Error('Soal pilihan ganda harus memiliki minimal 2 opsi jawaban.');
  }
  const correctCount = options.filter(o => o.isCorrect).length;
  if (correctCount !== 1) {
    throw new Error('Soal pilihan ganda harus memiliki tepat satu kunci jawaban yang benar.');
  }
  return true;
}

describe('Question Bank & Question Data Validation', () => {
  it('confirms schema.ts defines subjects, questionBanks, and questions tables', () => {
    const schemaPath = path.join(APPS_ROOT, 'convex', 'schema.ts');
    assert.ok(fs.existsSync(schemaPath), 'apps/convex/schema.ts must exist');
    const content = fs.readFileSync(schemaPath, 'utf8');

    assert.ok(content.includes('subjects: defineTable'));
    assert.ok(content.includes('questionBanks: defineTable'));
    assert.ok(content.includes('questions: defineTable'));
    assert.ok(content.includes('by_author'));
    assert.ok(content.includes('by_bank_and_order'));
  });

  it('validates multiple choice options correctly', () => {
    // Valid 4 options with exactly 1 correct
    assert.doesNotThrow(() => {
      validateQuestionOptions([
        { id: '1', label: 'A', text: 'Opsi A', isCorrect: false },
        { id: '2', label: 'B', text: 'Opsi B', isCorrect: true },
        { id: '3', label: 'C', text: 'Opsi C', isCorrect: false },
        { id: '4', label: 'D', text: 'Opsi D', isCorrect: false },
      ]);
    });

    // Invalid: less than 2 options
    assert.throws(
      () => validateQuestionOptions([{ id: '1', label: 'A', text: 'Opsi A', isCorrect: true }]),
      /minimal 2 opsi jawaban/
    );

    // Invalid: zero correct answer
    assert.throws(
      () =>
        validateQuestionOptions([
          { id: '1', label: 'A', text: 'Opsi A', isCorrect: false },
          { id: '2', label: 'B', text: 'Opsi B', isCorrect: false },
        ]),
      /tepat satu kunci jawaban/
    );

    // Invalid: multiple correct answers
    assert.throws(
      () =>
        validateQuestionOptions([
          { id: '1', label: 'A', text: 'Opsi A', isCorrect: true },
          { id: '2', label: 'B', text: 'Opsi B', isCorrect: true },
        ]),
      /tepat satu kunci jawaban/
    );
  });
});
