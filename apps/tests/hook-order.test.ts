import test, { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APPS_ROOT = path.resolve(__dirname, "..")

const COMPONENT_RE = /^export default function ([A-Z]\w*)\s*\(/
const HOOK_RE =
  /(?:React\.)?(?:useState|useEffect|useMemo|useCallback|useRef|useMutation|useQuery|useTransition|useId|useContext|useSearchParams|usePathname|useAuth)\s*\(/
const CONTROL_OPENER_RE = /(?:if|for|while|switch|catch)\s*\(.*\)\s*\{\s*$/
const OWN_RETURN_RE = /^\s*return\b/

/** Strips string literals and line comments so brace counting ignores their contents. */
function codeOnly(line: string): string {
  return line.replace(/\/\/.*$/, "").replace(/(["'`])(?:(?!\1|\\).|\\.)*\1/g, '""')
}

/**
 * Reports top-level hook calls that sit after an early `return` in the component
 * body. React requires a stable hook count per render, so a hook behind a
 * conditional return throws "Rendered fewer hooks than expected" the moment that
 * branch turns on.
 *
 * Line-based: statements that open and close a block must do so on their own line,
 * which holds for this repository's formatted pages.
 */
function findHooksAfterEarlyReturn(source: string, componentName: string) {
  const lines = source.split("\n")
  const start = lines.findIndex((line) => COMPONENT_RE.test(line))
  if (start === -1) return []
  assert.equal(COMPONENT_RE.exec(lines[start])![1], componentName)

  const findings: { line: number; hook: string }[] = []
  const blockKinds: ("control" | "other")[] = []
  let depth = 0
  let earlyReturnAt: number | null = null
  let closed = false

  lines.forEach((raw, index) => {
    if (closed || index < start) return
    const code = codeOnly(raw)
    const depthBefore = depth
    for (const ch of code) {
      if (ch === "{") {
        blockKinds.push(CONTROL_OPENER_RE.test(code) ? "control" : "other")
        depth++
      } else if (ch === "}") {
        blockKinds.pop()
        depth--
        if (depth === 0) closed = true
      }
    }

    if (closed && depth === 0 && index > start) return

    // Depth 1 is the component body; depth 2 opened by `if` is a conditional return.
    const isEarlyReturn =
      OWN_RETURN_RE.test(raw) &&
      ((depthBefore === 1 && blockKinds.length === 1) ||
        (depthBefore === 2 && blockKinds[1] === "control"))
    if (isEarlyReturn && earlyReturnAt === null) earlyReturnAt = index + 1

    if (depthBefore === 1 && earlyReturnAt !== null && index + 1 > earlyReturnAt) {
      const hook = HOOK_RE.exec(code)?.[0]?.replace(/\($/, "").trim()
      if (hook) {
        findings.push({ line: index + 1, hook })
        earlyReturnAt = null
      }
    }
  })

  return findings
}

function listSourceFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return listSourceFiles(full)
    return /\.(tsx|ts)$/.test(entry.name) ? [full] : []
  })
}

describe("React hook order in client components", () => {
  it("flags a hook declared after a conditional early return", () => {
    const bad = [
      `export default function BadWidget() {`,
      `  const [flag, setFlag] = React.useState(false)`,
      `  if (flag) {`,
      `    return null`,
      `  }`,
      `  const value = React.useMemo(() => 1, [])`,
      `  return <p>{value}</p>`,
      `}`,
    ].join("\n")

    const findings = findHooksAfterEarlyReturn(bad, "BadWidget")
    assert.equal(findings.length, 1, "should detect the conditional useMemo")
    assert.match(findings[0].hook, /useMemo/)
  })

  it("ignores returns that belong to an event handler, not the component", () => {
    const good = [
      `export default function GoodWidget() {`,
      `  const [name, setName] = React.useState("")`,
      `  const handleSubmit = async () => {`,
      `    if (!name) {`,
      `      return`,
      `    }`,
      `    setName("")`,
      `  }`,
      `  const value = React.useMemo(() => 1, [])`,
      `  return <p onClick={handleSubmit}>{value}</p>`,
      `}`,
    ].join("\n")

    assert.deepEqual(findHooksAfterEarlyReturn(good, "GoodWidget"), [])
  })

  it("keeps every routed page free of conditional hook calls", () => {
    const offenders: string[] = []
    for (const file of listSourceFiles(path.join(APPS_ROOT, "app"))) {
      const source = fs.readFileSync(file, "utf-8")
      const componentName = COMPONENT_RE.exec(source)?.[1]
      if (!componentName) continue
      for (const finding of findHooksAfterEarlyReturn(source, componentName)) {
        offenders.push(
          `${path.relative(APPS_ROOT, file)}:${finding.line} ${finding.hook} after early return`
        )
      }
    }
    assert.deepEqual(offenders, [], `conditional hooks found:\n${offenders.join("\n")}`)
  })
})
