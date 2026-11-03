import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseWordFiles } from '@/lib/bundledWords'

// Checks every file in src/words — run `npm run check-words` after editing them.
// Reads the folder from disk (not import.meta.glob) so newly added files are never missed by a cache.
const root = join(__dirname, '../../src/words')

function readWordFiles(): Record<string, unknown> {
  const files: Record<string, unknown> = {}
  for (const entry of readdirSync(root, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue
    const full = join(entry.parentPath, entry.name)
    const path = relative(root, full).split('\\').join('/')
    try {
      files[path] = JSON.parse(readFileSync(full, 'utf8'))
    } catch (err) {
      files[path] = `invalid JSON: ${(err as Error).message}`
    }
  }
  return files
}

describe('word files in src/words', () => {
  it('are all valid', () => {
    const files = readWordFiles()
    const brokenJson = Object.entries(files)
      .filter(([, content]) => typeof content === 'string')
      .map(([path, content]) => `${path}: ${content}`)
    const pictures = new Set(readdirSync(join(root, 'pictures')))
    expect([...brokenJson, ...parseWordFiles(files, pictures).errors]).toEqual([])
  })
})
