import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APPS_ROOT = path.resolve(__dirname, '..');

const read = (...parts: string[]) =>
  fs.readFileSync(path.join(APPS_ROOT, ...parts), 'utf8');

const PREVIEW_START = 'VIEW 1: LIVE PREVIEW SISWA';
const PREVIEW_END = 'VIEW 2: DAFTAR SOAL TERSIMPAN';

function previewRegion(source: string): string {
  const start = source.indexOf(PREVIEW_START);
  const end = source.indexOf(PREVIEW_END);
  assert.ok(start >= 0 && end > start, 'penanda wilayah pratinjau siswa harus ada');
  return source.slice(start, end);
}

describe('Pratinjau simulasi santri tidak membocorkan kunci jawaban', () => {
  const editor = read('app', '(main)', 'bank-soal', '[id]', 'page.tsx');
  const preview = previewRegion(editor);

  it('panel pratinjau tidak merender penanda kunci maupun rubrik penguji', () => {
    assert.ok(!preview.includes('Kunci'), 'label "Kunci" tidak boleh ada di pratinjau siswa');
    assert.ok(!preview.includes('(Kunci)'), 'penanda "(Kunci)" benar/salah tidak boleh ada');
    assert.ok(!preview.includes('Rubrik'), 'rubrik penguji tidak boleh ada di pratinjau siswa');
    assert.ok(!preview.includes('isCorrect'), 'pratinjau siswa tidak boleh membaca isCorrect');
  });

  it('pratinjau tetap menampilkan opsi netral untuk tiap tipe soal', () => {
    assert.ok(preview.includes('questionType === "multiple_choice"'));
    assert.ok(preview.includes('questionType === "pg_kompleks"'));
    assert.ok(preview.includes('questionType === "true_false"'));
    assert.ok(preview.includes('questionType === "essay"'));
    assert.ok(preview.includes('Wacana / Stimulus Soal'), 'stimulus tetap dipratinjau');
    assert.ok(preview.includes('(Opsi kosong)'), 'penanda opsi kosong tetap ada');
  });

  it('pengajar tetap bisa menetapkan kunci dan rubrik di formular editor', () => {
    const before = editor.slice(0, editor.indexOf(PREVIEW_START));
    assert.ok(before.includes('Tentukan Kunci Status Pernyataan'));
    assert.ok(before.includes('id="q-rubric"'), 'kolom rubrik penguji harus tetap ada');
    assert.ok(before.includes('isCorrect'), 'logika kunci di editor harus tetap ada');
  });

  it('lembar pengerjaan santri tidak memuat teks kunci atau rubrik', () => {
    const worksheet = read('app', 'ujian', 'ExamWorksheet.tsx');
    assert.ok(!worksheet.includes('Kunci'));
    assert.ok(!worksheet.includes('rubric'));
    assert.ok(!worksheet.includes('explanation'));
  });

  it('proyeksi server untuk santri menghapus isCorrect dan rubric', () => {
    const queries = read('convex', 'examSession', 'public', 'queries.ts');
    const start = queries.indexOf('sanitizedQuestions');
    const end = queries.indexOf('existingAnswers');
    assert.ok(start >= 0 && end > start, 'blok sanitasi payload santri harus ada');
    const block = queries.slice(start, end);
    assert.ok(!block.includes('isCorrect'), 'payload santri tidak boleh memuat isCorrect');
    assert.ok(!block.includes('rubric:'), 'payload santri tidak boleh memuat rubric');
  });
});
