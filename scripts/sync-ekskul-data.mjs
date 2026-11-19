import { createRequire } from "module";
import fs from "fs";
const require = createRequire(import.meta.url);
const xlsx = require("../apps/node_modules/xlsx");

const filePath = "D:/DATA/PROJEK/IMTIHAN/rapor/ABSEN EKSKUL 2026-2027.xlsx";
const wb = xlsx.readFile(filePath);

const roster = [];

for (const sheetName of wb.SheetNames) {
  const ws = wb.Sheets[sheetName];
  const json = xlsx.utils.sheet_to_json(ws, { header: 1 });
  for (let i = 6; i < json.length; i++) {
    const row = json[i];
    if (!row || !row[1]) continue;
    const studentName = String(row[1]).trim();
    const className = row[2] ? String(row[2]).trim() : "";
    roster.push({
      studentName,
      className,
      rawEkskul: sheetName,
    });
  }
}

console.log("Total roster entries:", roster.length);

const fileContent = `// Berkas data roster ekstrakurikuler yang di-generate otomatis dari ABSEN EKSKUL 2026-2027.xlsx
export interface EkskulRosterEntry {
  studentName: string
  className: string
  ekskul: string
}

export const EKSKUL_ROSTER_DATA: EkskulRosterEntry[] = ${JSON.stringify(
  roster.map(r => ({
    studentName: r.studentName,
    className: r.className,
    ekskul: r.rawEkskul
  })),
  null,
  2
)};
`;

fs.writeFileSync("apps/lib/extracurricular-roster.ts", fileContent, "utf-8");
console.log("Successfully wrote apps/lib/extracurricular-roster.ts");
