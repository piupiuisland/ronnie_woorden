import { expect, test, type Page } from '@playwright/test'

async function addWord(page: Page, dutch: string, chinese: string, example: string) {
  await page.getByRole('button', { name: 'Add Word' }).click()
  const dialog = page.getByRole('dialog', { name: 'Add word' })
  await dialog.getByLabel('Dutch word').fill(dutch)
  await dialog.getByLabel('Chinese translation').fill(chinese)
  await dialog.getByLabel('Dutch example sentence').fill(example)
  await dialog.getByRole('button', { name: 'Save word' }).click()
  await expect(dialog).toBeHidden()
}

test('add a word, flip it, and keep it after a reload', async ({ page }) => {
  await page.goto('./#/?date=2030-01-15')
  await expect(page.getByRole('heading', { name: 'Mijn Woordenboek' })).toBeVisible()
  await expect(page.getByText('No words for this day yet')).toBeVisible()

  await addWord(page, 'gezellig', '温馨的、愉快的', 'Het is gezellig bij ons thuis.')
  await expect(page.getByTestId('vocabulary-card')).toContainText('gezellig')

  // Tapping a word opens it full screen; tapping there flips it.
  await page.getByTestId('vocabulary-card').click()
  const viewer = page.getByRole('dialog', { name: 'gezellig' })
  const card = viewer.getByTestId('vocabulary-card')
  // Only the face pointing at the user is visible (regression: WebKit showed the mirrored back).
  await expect(viewer.getByText('Het is gezellig bij ons thuis.')).toBeHidden()
  await card.click()
  await expect(card).toHaveAttribute('data-flipped', 'true')
  await expect(viewer.getByText('Het is gezellig bij ons thuis.')).toBeVisible()
  await expect(viewer.getByText('gezellig', { exact: true })).toBeHidden()
  await viewer.getByRole('button', { name: 'Close' }).click()
  await expect(viewer).toBeHidden()

  await page.reload()
  await expect(page.getByTestId('vocabulary-card')).toContainText('gezellig')
  await expect(page.getByTestId('word-count')).toHaveText('1 word')
})

test('works offline after the first visit', async ({ page, context, browserName }) => {
  test.skip(browserName === 'webkit', 'Playwright WebKit does not support service workers + offline emulation reliably')
  await page.goto('./#/?date=2030-01-15')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  // Reload once so the page is controlled by the service worker.
  await page.reload()
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)
  await addWord(page, 'fiets', '自行车', 'Ik ga op de fiets.')

  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Mijn Woordenboek' })).toBeVisible()
  await expect(page.getByTestId('vocabulary-card')).toContainText('fiets')
  await context.setOffline(false)
})

test('export and import a backup', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'Mobile WebKit opens the share sheet instead of downloading')
  await page.goto('./#/?date=2030-01-15')
  await addWord(page, 'boek', '书', 'Ik lees een boek.')

  await page.getByRole('link', { name: 'Settings' }).click()
  // Totals include the words from src/words, so compare against the count after adding.
  await expect(page.getByTestId('stat-total')).not.toHaveText('–')
  const total = (await page.getByTestId('stat-total').textContent()) ?? ''

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /export backup/i }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^mijn-woordenboek-backup-\d{4}-\d{2}-\d{2}\.json$/)
  const path = await download.path()

  // Importing the same file again must not create duplicates.
  await page.getByTestId('import-input').setInputFiles(path)
  await page.getByRole('button', { name: 'Add to my words' }).click()
  await expect(page.getByRole('status')).toContainText('Imported 0 words, skipped')
  await expect(page.getByTestId('stat-total')).toHaveText(total)

  // Replace restores the backup after the word was deleted.
  await page.getByRole('link', { name: 'Words' }).click()
  await page.getByRole('button', { name: 'Delete boek' }).click()
  await page.getByRole('dialog', { name: 'Delete word?' }).getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText('No words for this day yet')).toBeVisible()

  await page.getByRole('link', { name: 'Settings' }).click()
  await page.getByTestId('import-input').setInputFiles(path)
  await page.getByRole('button', { name: 'Replace all my words' }).click()
  await page.getByRole('button', { name: 'Replace everything' }).click()
  await expect(page.getByRole('status')).toContainText('Imported')
  await expect(page.getByTestId('stat-total')).toHaveText(total)
})

test('review mode', async ({ page }) => {
  await page.goto('./#/?date=2030-01-15')
  await addWord(page, 'een', '一', 'Een appel.')
  await addWord(page, 'twee', '二', 'Twee appels.')
  await page.getByRole('link', { name: 'Review' }).click()
  await page.getByRole('radio', { name: 'One day' }).click()
  await expect(page.getByTestId('review-progress')).toHaveText('1 / 2')
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.getByTestId('review-progress')).toHaveText('2 / 2')
  await page.getByRole('button', { name: 'Shuffle' }).click()
  await expect(page.getByTestId('review-progress')).toHaveText('1 / 2')
})
