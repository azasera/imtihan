import { internalMutation } from "../../_generated/server"
import { executeSeedOfficialSubjects } from "../public/mutations"
import { cleanStudentName } from "../../../lib/rapor-utils"

export const seedOfficialSubjects = internalMutation({
  args: {},
  handler: async (ctx) => {
    return await executeSeedOfficialSubjects(ctx)
  },
})

export const cleanAllStudentNames = internalMutation({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db.query("students").collect()
    let count = 0
    for (const st of students) {
      const cleaned = cleanStudentName(st.nama)
      if (cleaned !== st.nama) {
        await ctx.db.patch(st._id, { nama: cleaned })
        count++
      }
    }
    return { success: true, count }
  },
})
