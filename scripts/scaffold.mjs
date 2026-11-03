import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const templateDir = path.join(root, '.agents', 'skills', 'planora-product-kit', 'assets', 'templates');
const target = path.join(root, '.planora');
const productName = "E-Imtihan At-Tauhid";
const locale = "id-ID";
const slug = "e-imtihan-at-tauhid";

function readTemplate(name) {
  const locName = name.replace('.md.tmpl', `.${locale}.md.tmpl`);
  const locPath = path.join(templateDir, locName);
  if (fs.existsSync(locPath)) {
    return fs.readFileSync(locPath, 'utf8');
  }
  return fs.readFileSync(path.join(templateDir, name), 'utf8');
}

function render(template, values) {
  let res = template;
  for (const [k, v] of Object.entries(values)) {
    res = res.replaceAll(`{{${k}}}`, v);
  }
  return res;
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content.trimEnd() + '\n', 'utf8');
}

function document(relative, title) {
  const tmplName = relative === 'UI/content-guidelines.md' ? 'content-guidelines.md.tmpl' : 'document.md.tmpl';
  const tmpl = readTemplate(tmplName);
  const content = render(tmpl, { TITLE: title, PROJECT_NAME: productName });
  write(path.join(target, relative), content);
}

// Ensure target exists
fs.mkdirSync(target, { recursive: true });

// 1. Root README
const experienceLinks = `- [UI panduan pengalaman](UI/README.md)`;
const rootReadme = render(readTemplate('root-readme.md.tmpl'), {
  PROJECT_NAME: productName,
  EXPERIENCE_LINKS: experienceLinks,
});
write(path.join(target, 'README.md'), rootReadme);

// 2. PRD Documents
const prdDocs = {
  "PRD/README.md": `Kebutuhan produk ${productName}`,
  "PRD/PRD.md": `Product Requirements Document — ${productName}`,
  "PRD/asumsi-dan-pertanyaan.md": "Asumsi, keputusan, dan pertanyaan terbuka",
  "PRD/metrik-keberhasilan.md": "Metrik keberhasilan",
  "PRD/model-data.md": "Model data konseptual",
  "PRD/non-functional-requirements.md": "Non-functional requirements",
  "PRD/roadmap.md": "Roadmap produk",
};
for (const [rel, title] of Object.entries(prdDocs)) {
  document(rel, title);
}
fs.mkdirSync(path.join(target, 'PRD', 'fitur'), { recursive: true });

// 3. UI Documents
const uiDocs = {
  "UI/README.md": `UI Design Guide ${productName}`,
  "UI/design-direction.md": "Arah desain",
  "UI/accessibility.md": "Aksesibilitas",
  "UI/content-guidelines.md": "Panduan konten",
  "UI/foundations/README.md": "Fondasi desain",
  "UI/components/README.md": "Standar komponen",
  "UI/patterns/README.md": "Pola interaksi",
  "UI/screens/screen-inventory.md": "Inventaris screen",
};
for (const [rel, title] of Object.entries(uiDocs)) {
  document(rel, title);
}

// 4. Execution Documents
const execDocs = {
  "EXECUTION/README.md": `Paket eksekusi ${productName}`,
  "EXECUTION/feature-order.md": "Urutan fitur",
  "EXECUTION/release-readiness.md": "Kesiapan rilis",
};
for (const [rel, title] of Object.entries(execDocs)) {
  document(rel, title);
}
const todo = render(readTemplate('todo.md.tmpl'), { PROJECT_NAME: productName });
write(path.join(target, 'EXECUTION', 'TODO.md'), todo);

const phase = render(readTemplate('phase.md.tmpl'), { TITLE: "Fase 00 — Keputusan produk" });
write(path.join(target, 'EXECUTION', 'phases', 'phase-00-decisions.md'), phase);

// 5. Manifest
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

const files = ['manifest.json'].concat(getAllFiles(target, target)).sort();
const manifest = {
  formatVersion: "1.0",
  packageDirectory: ".planora",
  project: { id: slug, name: productName, locale: locale },
  generatedDate: new Date().toISOString().split('T')[0],
  guideType: "ui",
  status: "draft",
  sourceVersions: {
    prd: "0.1",
    uiGuide: "0.1",
    executionPlan: "0.1",
  },
  artifacts: {
    prd: { directory: "PRD", entry: "PRD/PRD.md", sourceVersion: "0.1", status: "draft" },
    uiGuide: { directory: "UI", entry: "UI/README.md", sourceVersion: "0.1", status: "draft" },
    executionPlan: { directory: "EXECUTION", entry: "EXECUTION/README.md", sourceVersion: "0.1", status: "draft" },
  },
  files: Array.from(new Set(files)).sort(),
  openBlockers: ["__PLANORA_REQUIRED__"],
};

write(path.join(target, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log('Successfully scaffolded .planora at', target);
