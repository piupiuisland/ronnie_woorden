// Renders public/icons/favicon.svg into the PNG icons used by the manifest and iOS.
// Uses Playwright's Chromium (already a dev dependency): `npx playwright install chromium` once.
import { readFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const svg = await readFile(new URL('../public/icons/favicon.svg', import.meta.url), 'utf8')
const outDir = new URL('../public/icons/', import.meta.url)

// iOS and maskable icons must be full-bleed squares; the OS applies its own rounding.
const fullBleed = svg.replace('rx="112"', 'rx="0"')

const targets = [
  { file: 'icon-192.png', size: 192, source: svg, padding: 0 },
  { file: 'icon-512.png', size: 512, source: svg, padding: 0 },
  { file: 'apple-touch-icon.png', size: 180, source: fullBleed, padding: 0 },
  // Maskable: keep the artwork inside the 80% safe zone.
  { file: 'icon-maskable-512.png', size: 512, source: fullBleed, padding: 0.1 },
]

const browser = await chromium.launch()
const page = await browser.newPage()
for (const { file, size, source, padding } of targets) {
  await page.setViewportSize({ width: size, height: size })
  const inset = Math.round(size * padding)
  await page.setContent(
    `<html><body style="margin:0;background:${padding ? '#6f9468' : 'transparent'}">
       <div style="width:${size - inset * 2}px;height:${size - inset * 2}px;margin:${inset}px">
         ${source.replace('<svg ', '<svg width="100%" height="100%" ')}
       </div></body></html>`,
  )
  await page.screenshot({ path: new URL(file, outDir).pathname, omitBackground: !padding })
  console.log('wrote', file)
}
await browser.close()
