import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VocabularyCard } from '@/components/VocabularyCard'
import type { Vocabulary } from '@/types/vocabulary'

const item: Vocabulary = {
  id: '1',
  date: '2026-10-30',
  dutch: 'gezellig',
  chinese: '温馨的、愉快的',
  exampleDutch: 'Het is gezellig bij ons thuis.',
  exampleChinese: '我们家里很温馨。',
  createdAt: '2026-10-30T18:00:00.000Z',
  updatedAt: '2026-10-30T18:00:00.000Z',
}

describe('VocabularyCard', () => {
  it('shows the word on the front and flips on click', async () => {
    render(<VocabularyCard item={item} />)
    const card = screen.getByTestId('vocabulary-card')
    expect(screen.getByText('gezellig')).toBeVisible()
    expect(screen.getByText('温馨的、愉快的')).toBeInTheDocument()
    expect(card).toHaveAttribute('data-flipped', 'false')
    expect(screen.getByText('Het is gezellig bij ons thuis.').parentElement).toHaveAttribute('aria-hidden', 'true')

    await userEvent.click(card)
    expect(card).toHaveAttribute('data-flipped', 'true')
    expect(card).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Het is gezellig bij ons thuis.').parentElement).toHaveAttribute('aria-hidden', 'false')
    expect(screen.getByText('我们家里很温馨。')).toBeInTheDocument()

    await userEvent.click(card)
    expect(card).toHaveAttribute('data-flipped', 'false')
  })

  it('flips with Enter and Space', async () => {
    render(<VocabularyCard item={item} />)
    const card = screen.getByTestId('vocabulary-card')
    card.focus()
    await userEvent.keyboard('{Enter}')
    expect(card).toHaveAttribute('data-flipped', 'true')
    await userEvent.keyboard(' ')
    expect(card).toHaveAttribute('data-flipped', 'false')
  })

  it('flips cards independently', async () => {
    render(
      <>
        <VocabularyCard item={item} />
        <VocabularyCard item={{ ...item, id: '2', dutch: 'fiets' }} />
      </>,
    )
    const [first, second] = screen.getAllByTestId('vocabulary-card')
    await userEvent.click(first)
    expect(first).toHaveAttribute('data-flipped', 'true')
    expect(second).toHaveAttribute('data-flipped', 'false')
  })

  it('edit and delete buttons do not flip the card', async () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    render(<VocabularyCard item={item} onEdit={onEdit} onDelete={onDelete} />)
    await userEvent.click(screen.getByRole('button', { name: 'Edit gezellig' }))
    await userEvent.click(screen.getByRole('button', { name: 'Delete gezellig' }))
    expect(onEdit).toHaveBeenCalledWith(item)
    expect(onDelete).toHaveBeenCalledWith(item)
    expect(screen.getByTestId('vocabulary-card')).toHaveAttribute('data-flipped', 'false')
  })

  it('opens instead of flipping when onOpen is given', async () => {
    const onOpen = vi.fn()
    render(<VocabularyCard item={item} onOpen={onOpen} />)
    const card = screen.getByTestId('vocabulary-card')
    await userEvent.click(card)
    card.focus()
    await userEvent.keyboard('{Enter}')
    expect(onOpen).toHaveBeenCalledTimes(2)
    expect(card).toHaveAttribute('data-flipped', 'false')
  })

  it('shows only the picture on the back when there is no example', async () => {
    render(<VocabularyCard item={{ ...item, exampleDutch: '', exampleChinese: '', image: 'missing.svg' }} />)
    await userEvent.click(screen.getByTestId('vocabulary-card'))
    expect(screen.queryByText('Het is gezellig bij ons thuis.')).not.toBeInTheDocument()
  })
})
