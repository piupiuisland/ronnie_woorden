import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import App from '@/App'
import { db } from '@/db/database'

const words = ['een', 'twee', 'drie'].map((dutch, i) => ({
  id: `id-${i}`,
  date: `2026-10-2${i}`,
  dutch,
  chinese: '数字',
  exampleDutch: `Zin ${dutch}.`,
  exampleChinese: '',
  createdAt: `2026-10-2${i}T10:00:00.000Z`,
  updatedAt: `2026-10-2${i}T10:00:00.000Z`,
}))

beforeEach(async () => {
  await db.vocabulary.clear()
  await db.vocabulary.bulkAdd(words)
})

describe('ReviewPage', () => {
  it('steps through all words in order and resets the flip', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/review']}>
        <App />
      </MemoryRouter>,
    )
    expect(await screen.findByText('een')).toBeInTheDocument()
    expect(screen.getByTestId('review-progress')).toHaveTextContent('1 / 3')
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled()

    await user.click(screen.getByTestId('vocabulary-card'))
    expect(screen.getByTestId('vocabulary-card')).toHaveAttribute('data-flipped', 'true')

    await user.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByText('twee')).toBeInTheDocument()
    expect(screen.getByTestId('vocabulary-card')).toHaveAttribute('data-flipped', 'false')

    await user.keyboard('{ArrowRight}')
    expect(screen.getByText('drie')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })

  it('shuffles and can review a single day', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/review?date=2026-10-21']}>
        <App />
      </MemoryRouter>,
    )
    await screen.findByText('een')
    await user.click(screen.getByRole('button', { name: 'Shuffle' }))
    expect(screen.getByRole('button', { name: 'Reshuffle' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('review-progress')).toHaveTextContent('1 / 3')

    await user.click(screen.getByRole('radio', { name: 'One day' }))
    expect(await screen.findByText('twee')).toBeInTheDocument()
    expect(screen.getByTestId('review-progress')).toHaveTextContent('1 / 1')
  })
})
