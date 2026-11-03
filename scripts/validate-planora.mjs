import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const planoraDir = path.join(root, '.planora');

const errors = [];

if (!fs.existsSync(planoraDir) || !fs.statSync(planoraDir).isDirectory()) {
  errors.push(".planora directory not found");
}

const manifestPath = path.join(planoraDir, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  errors.push("manifest.json not found");
}

let manifest = {};
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
} catch (e) {
  errors.push(`Invalid manifest.json: ${e.message}`);
}

if (manifest.packageDirectory !== '.planora') {
  errors.push("packageDirectory must be .planora");
}

function getAllFiles(dir, baseDir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of list) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, baseDir));
    } else {
      results.push(path.relative(baseDir, fullPath).replaceAll('\\', '/'));
    }
  }
  return results;
}

const diskFiles = getAllFiles(planoraDir, planoraDir).sort();
const manifestFiles = (manifest.files || []).slice().sort();

for (const f of diskFiles) {
  if (!manifestFiles.includes(f)) {
    errors.push(`File on disk missing from manifest: ${f}`);
  }
}
for (const f of manifestFiles) {
  if (!diskFiles.includes(f)) {
    errors.push(`File in manifest missing from disk: ${f}`);
  }
}

// Validate each markdown file
const LINK_RE = /\[[^\]]+\]\(([^)]+)\)/g;
const TEMPLATE_MARKERS = ["__PLANORA_REQUIRED__", "{{"];

for (const rel of diskFiles) {
  if (!rel.endsWith('.md')) continue;
  const full = path.join(planoraDir, rel);
  const content = fs.readFileSync(full, 'utf8');
  const lines = content.split(/\r?\n/);

  if (!lines.length || !lines[0].startsWith('# ')) {
    errors.push(`Markdown file must start with one H1: ${rel}`);
  }

  const fences = lines.filter(l => l.trim().startsWith('```')).length;
  if (fences % 2 !== 0) {
    errors.push(`Unbalanced fenced code blocks: ${rel}`);
  }

  for (const marker of TEMPLATE_MARKERS) {
    if (content.includes(marker)) {
      errors.push(`Unresolved template marker ${marker}: ${rel}`);
    }
  }

  let match;
  LINK_RE.lastIndex = 0;
  while ((match = LINK_RE.exec(content)) !== null) {
    const rawTarget = match[1].trim();
    if (rawTarget.startsWith('http://') || rawTarget.startsWith('https://') || rawTarget.startsWith('#') || rawTarget.startsWith('mailto:')) {
      continue;
    }
    const cleanTarget = rawTarget.split('#')[0].replace(/[<>]/g, '').trim();
    if (!cleanTarget) continue;
    const resolved = path.resolve(path.dirname(full), decodeURIComponent(cleanTarget));
    if (!fs.existsSync(resolved)) {
      errors.push(`Broken relative link in ${rel}: ${rawTarget}`);
    }
  }
}

// Validate features
const featureDir = path.join(planoraDir, 'PRD', 'fitur');
if (fs.existsSync(featureDir)) {
  const featFiles = fs.readdirSync(featureDir).filter(f => f.endsWith('.md'));
  if (featFiles.length === 0) {
    errors.push("No feature files in PRD/fitur/");
  }
  for (const f of featFiles) {
    const text = fs.readFileSync(path.join(featureDir, f), 'utf8');
    if (!/## (?:Functional requirements|Kebutuhan fungsional)/i.test(text)) {
      errors.push(`Feature lacks Kebutuhan fungsional: PRD/fitur/${f}`);
    }
    if (!/## (?:Acceptance criteria|Kriteria penerimaan)/i.test(text)) {
      errors.push(`Feature lacks Kriteria penerimaan: PRD/fitur/${f}`);
    }
    if (!/\b[A-Z][A-Z0-9]{1,11}-FR-\d{3}\b/.test(text)) {
      errors.push(`Feature lacks FR ID: PRD/fitur/${f}`);
    }
    if (!/\b[A-Z][A-Z0-9]{1,11}-AC-\d{3}\b/.test(text)) {
      errors.push(`Feature lacks AC ID: PRD/fitur/${f}`);
    }
  }
}

// Validate phases
const phasesDir = path.join(planoraDir, 'EXECUTION', 'phases');
if (fs.existsSync(phasesDir)) {
  const phaseFiles = fs.readdirSync(phasesDir).filter(f => f.endsWith('.md'));
  for (const f of phaseFiles) {
    const text = fs.readFileSync(path.join(phasesDir, f), 'utf8');
    if (!/## (?:Dependencies|Dependensi)/i.test(text)) {
      errors.push(`Phase lacks Dependensi: EXECUTION/phases/${f}`);
    }
    if (!/## (?:Execution workflows|Workflow eksekusi)/i.test(text)) {
      errors.push(`Phase lacks Workflow eksekusi: EXECUTION/phases/${f}`);
    }
    if (!/## (?:Exit criteria|Kriteria keluar)/i.test(text)) {
      errors.push(`Phase lacks Kriteria keluar: EXECUTION/phases/${f}`);
    }
  }
}

// Validate TODO.md
const todoPath = path.join(planoraDir, 'EXECUTION', 'TODO.md');
if (fs.existsSync(todoPath)) {
  const text = fs.readFileSync(todoPath, 'utf8');
  if (!/## (?:Execution checklist|Checklist eksekusi)/i.test(text)) {
    errors.push("EXECUTION/TODO.md lacks Checklist eksekusi heading");
  }
  const taskHeaderRe = /^- \[(?<checked>[ xX])\]\s+`(?<id>(?:TASK|BUG|CHG)-\d{3})`\s+[—-]\s+.+$/gm;
  const tasks = Array.from(text.matchAll(taskHeaderRe));
  if (!tasks.length) {
    errors.push("EXECUTION/TODO.md contains no tasks");
  }
}

// Validate main PRD
const prdPath = path.join(planoraDir, 'PRD', 'PRD.md');
if (fs.existsSync(prdPath)) {
  const text = fs.readFileSync(prdPath, 'utf8');
  const required = [
    ["Ringkasan", /Ringkasan|Summary/i],
    ["Latar belakang/Masalah", /Latar belakang(?: dan masalah)?|Masalah|Problem/i],
    ["Tujuan", /Tujuan|Goals?/i],
    ["Non-goals", /Non-goals?|Bukan tujuan/i],
    ["Target pengguna", /Target pengguna|Pengguna|Users?/i],
    ["Scope", /Scope|Ruang lingkup/i],
    ["Risiko", /Risiko|Risks?/i],
    ["Definition of done", /Definition of done|Definisi selesai/i],
  ];
  for (const [label, re] of required) {
    const sectionRe = new RegExp(`^##\\s+(?:\\d+\\.\\s*)?(?:${re.source})\\s*$`, 'm');
    if (!sectionRe.test(text)) {
      errors.push(`PRD/PRD.md lacks required section: ${label}`);
    }
  }
}

if (errors.length > 0) {
  console.error("Validation failed with", errors.length, "errors:\n" + errors.map(e => `  - ${e}`).join('\n'));
  process.exit(1);
} else {
  console.log("Validation PASSED! 0 errors found. .planora package is completely valid and complete.");
}
