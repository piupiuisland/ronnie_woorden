import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import App from '@/App'
import { db, getAllVocabulary } from '@/db/database'
import { todayKey } from '@/lib/dates'

function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

beforeEach(async () => {
  await db.vocabulary.clear()
})

describe('HomePage', () => {
  it('shows an empty state for a day without words', async () => {
    renderApp()
    expect(await screen.findByText('No words for this day yet')).toBeInTheDocument()
    expect(screen.getByTestId('word-count')).toHaveTextContent('0 words')
  })

  it('adds, edits and deletes a word', async () => {
    const user = userEvent.setup()
    renderApp()
    await screen.findByText('No words for this day yet')

    // Add — first try saving an empty form.
    await user.click(screen.getByRole('button', { name: /add word/i }))
    const dialog = screen.getByRole('dialog', { name: 'Add word' })
    expect(within(dialog).getByLabelText('Date')).toHaveValue(todayKey())
    await user.click(within(dialog).getByRole('button', { name: 'Save word' }))
    expect(within(dialog).getByText('Please enter the Dutch word.')).toBeInTheDocument()

    await user.type(within(dialog).getByLabelText('Dutch word'), '  gezellig ')
    await user.type(within(dialog).getByLabelText('Chinese translation'), '温馨的')
    await user.type(within(dialog).getByLabelText('Dutch example sentence'), 'Het is gezellig.')
    await user.click(within(dialog).getByRole('button', { name: 'Save word' }))

    expect(await screen.findByText('gezellig')).toBeInTheDocument()
    expect(screen.getByTestId('word-count')).toHaveTextContent('1 word')
    expect((await getAllVocabulary())[0]).toMatchObject({ dutch: 'gezellig', date: todayKey(), exampleChinese: '' })

    // Edit
    await user.click(screen.getByRole('button', { name: 'Edit gezellig' }))
    const editDialog = screen.getByRole('dialog', { name: 'Edit word' })
    const dutch = within(editDialog).getByLabelText('Dutch word')
    await user.clear(dutch)
    await user.type(dutch, 'knus')
    await user.click(within(editDialog).getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByText('knus')).toBeInTheDocument()

    // Delete — cancel first, then confirm.
    await user.click(screen.getByRole('button', { name: 'Delete knus' }))
    await user.click(within(screen.getByRole('dialog', { name: 'Delete word?' })).getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText('knus')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete knus' }))
    await user.click(within(screen.getByRole('dialog', { name: 'Delete word?' })).getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(screen.queryByText('knus')).not.toBeInTheDocument())
    expect(await db.vocabulary.count()).toBe(0)
  })

  it('navigates between days and only shows words for the selected day', async () => {
    const user = userEvent.setup()
    await db.vocabulary.add({
      id: 'x',
      date: '2026-01-14',
      dutch: 'gisteren',
      chinese: '昨天',
      exampleDutch: 'Gisteren was het koud.',
      exampleChinese: '',
      createdAt: '2026-01-14T10:00:00.000Z',
      updatedAt: '2026-01-14T10:00:00.000Z',
    })
    renderApp('/?date=2026-01-15')
    expect(screen.getByTestId('selected-date')).toHaveTextContent('Thursday, 15 January 2026')
    expect(await screen.findByText('No words for this day yet')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Previous day' }))
    expect(screen.getByTestId('selected-date')).toHaveTextContent('Wednesday, 14 January 2026')
    expect(await screen.findByText('gisteren')).toBeInTheDocument()

    // Calendar highlights the day that has words.
    await user.click(screen.getByRole('button', { name: /open calendar/i }))
    const calendar = screen.getByRole('dialog', { name: 'Choose a date' })
    expect(within(calendar).getByRole('button', { name: /14 January 2026, has words/ })).toBeInTheDocument()
    await user.click(within(calendar).getByRole('button', { name: 'Friday, 16 January 2026' }))
    expect(screen.getByTestId('selected-date')).toHaveTextContent('Friday, 16 January 2026')
  })
})
