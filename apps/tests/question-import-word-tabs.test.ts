import assert from "node:assert/strict"
import { describe, it } from "node:test"

const {
  applyBulkKeyString,
  parseQuestionImport,
} = (await import(new URL("../lib/question-import.ts", import.meta.url).href)) as typeof import("../lib/question-import")

describe("Question Import - Word/Docs Auto-numbering and Tabs (20 Soal Jadi 20 Bukan 100)", () => {
  // 3-soal representasi kasus pengguna (soal 18, 19, 20 dari tangkapan layar dengan tab Word)
  const sampleWordText = `18.\tSebuah sepeda yang massanya 40 kg bergerak dengan kecepatan 10 m/s.
Tentukan besar energi kinetik sepeda tersebut!
a.\t1.0000 J
b.\t2.000 J
c.\t200 J
d.\t100 J

19.\tSebuah benda berada pada ketinggian 5 m dari atas tanah. Jika energi
potensial benda tersebut adalah 4900 joule dan percepatan gravitasi bumi adalah
10 m/s2, tentukan massa benda tersebut!
a.\t98 kg
b.\t980 kg
c.\t9,8 kg
d.\t988 kg

20.\tSebuah balok yang beratnya 150 N diletakkan di atas tanah. Jika luas
permukaan alas balok itu 5000 cm², maka tekanan yang diberikan balok tersebut
terhadap tanah adalah ....
a.\t300 N/m²
b.\t3000 N/m²
c.\t3 N/m²
d.\t0,3 N/m²`

  it("menafsirkan naskah salinan Word dengan tab auto-numbering sebagai 'numbered', bukan 'spreadsheet'", () => {
    const result = parseQuestionImport(sampleWordText, 5, "multiple_choice")

    assert.equal(result.format, "numbered", "Naskah bernomor dengan tab Word harus dibaca sebagai 'numbered'")
    assert.equal(result.items.length, 3, "3 butir soal harus menghasilkan tepat 3 butir, bukan 15 butir")

    // Periksa butir 1
    const [item1, item2, item3] = result.items
    assert.equal(item1.options.length, 4, "Butir 1 harus memiliki 4 opsi jawaban")
    assert.deepEqual(item1.options.map(o => o.label), ["A", "B", "C", "D"])
    assert.equal(item1.options[0].text, "1.0000 J")
    assert.equal(item1.options[3].text, "100 J")

    // Periksa butir 2
    assert.equal(item2.options.length, 4)
    assert.equal(item2.options[0].text, "98 kg")

    // Periksa butir 3
    assert.equal(item3.options.length, 4)
    assert.equal(item3.options[3].text, "0,3 N/m²")
  })

  it("20 soal pilihan ganda dari Word menghasilkan tepat 20 butir soal, bukan 100 butir", () => {
    // Bangkitkan 20 butir dengan format Word (setiap baris nomor & opsi memakai tab)
    const blocks: string[] = []
    for (let i = 1; i <= 20; i++) {
      blocks.push(
        `${i}.\tPertanyaan soal nomor ${i} tentang konsep fisika dan kimia.\na.\tPilihan jawaban A nomor ${i}\nb.\tPilihan jawaban B nomor ${i}\nc.\tPilihan jawaban C nomor ${i}\nd.\tPilihan jawaban D nomor ${i}`
      )
    }
    const twentyQuestionsText = blocks.join("\n\n")

    const result = parseQuestionImport(twentyQuestionsText, 5, "multiple_choice")
    assert.equal(result.format, "numbered")
    assert.equal(result.items.length, 20, "20 butir soal harus menghasilkan tepat 20 butir, bukan 100")

    for (const item of result.items) {
      assert.equal(item.options.length, 4, `Butir #${item.number} harus memiliki 4 opsi`)
      assert.equal(item.type, "multiple_choice")
    }

    // Terapkan kunci massal
    const keys = Array(20).fill("A").join(" ")
    const withKeys = applyBulkKeyString(result.items, keys)
    assert.equal(withKeys.items.filter(it => it.problems.length === 0).length, 20, "Seluruh 20 butir harus siap simpan")
  })

  it("mengenali nomor soal tanpa spasi seperti 1.Zat yang sering disalin dari dokumen", () => {
    const textNoSpace = `1.Zat yang terkandung dalam makanan berfungsi sebagai sumber energi utama adalah...
a. Karbohidrat *
b. Protein
c. Lemak
d. Mineral`

    const result = parseQuestionImport(textNoSpace, 5, "multiple_choice")
    assert.equal(result.format, "numbered")
    assert.equal(result.items.length, 1)
    assert.equal(result.items[0].questionText, "Zat yang terkandung dalam makanan berfungsi sebagai sumber energi utama adalah...")
    assert.equal(result.items[0].options.length, 4)
    assert.equal(result.items[0].options[0].isCorrect, true)
    assert.deepEqual(result.items[0].problems, [])
  })
})
