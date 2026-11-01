// Creates src/words/<year>/<month>/<date>.json for today (or the date given: npm run new-day -- 2026-11-02).
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'

const pad = (n) => String(n).padStart(2, '0')
const now = new Date()
const date = process.argv[2] ?? `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error('Date must look like 2026-10-30')
  process.exit(1)
}

const folder = `${date.slice(0, 4)}/${date.slice(5, 7)}`
const dir = new URL(`../src/words/${folder}/`, import.meta.url)
const file = new URL(`${date}.json`, dir)
if (existsSync(file)) {
  console.log(`Already exists: src/words/${folder}/${date}.json`)
  process.exit(0)
}
mkdirSync(dir, { recursive: true })
const template = [{ dutch: '', chinese: '', exampleDutch: '', exampleChinese: '' }]
writeFileSync(file, JSON.stringify(template, null, 2) + '\n')
console.log(`Created src/words/${folder}/${date}.json`)
