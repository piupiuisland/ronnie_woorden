import { useMemo, useState } from 'react'
import type { Vocabulary } from '@/types/vocabulary'

const NONE: ReadonlySet<string> = new Set()

/**
 * Words marked as wrong during one run through a deck. `reviewMistakes()` narrows the deck to
 * the marked words (and clears the marks, so they can be marked again); `reset()` goes back to
 * the full deck. Marks only live in memory, for the current session.
 */
export function useMistakes(items: Vocabulary[] | undefined) {
  const [marked, setMarked] = useState<ReadonlySet<string>>(NONE)
  const [onlyIds, setOnlyIds] = useState<ReadonlySet<string> | null>(null)

  const deck = useMemo(
    () => (items && onlyIds ? items.filter((item) => onlyIds.has(item.id)) : items),
    [items, onlyIds],
  )
  const mistakeCount = deck?.filter((item) => marked.has(item.id)).length ?? 0

  const toggle = (id: string) =>
    setMarked((prev) => {
      const next = new Set(prev)
      if (!next.delete(id)) next.add(id)
      return next
    })

  const reviewMistakes = () => {
    setOnlyIds(marked)
    setMarked(NONE)
  }

  const reset = () => {
    setOnlyIds(null)
    setMarked(NONE)
  }

  return {
    deck,
    isMarked: (id: string) => marked.has(id),
    toggle,
    mistakeCount,
    reviewingMistakes: onlyIds !== null,
    reviewMistakes,
    reset,
  }
}
