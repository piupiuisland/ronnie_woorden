import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { Vocabulary } from '@/types/vocabulary'
import { useSwipe } from '@/hooks/useSwipe'
import { VocabularyCard } from './VocabularyCard'
import { Celebration } from './Celebration'

interface CardViewerProps {
  items: Vocabulary[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
}

/**
 * Shows one card full screen. Tap to flip, swipe / arrows to move, Escape or ✕ to close.
 * Moving past the last card shows a celebration (index === items.length).
 */
export function CardViewer({ items, index, onIndexChange, onClose }: CardViewerProps) {
  const total = items.length
  const current = Math.min(index, total)
  const done = current === total
  const item = items[current]
  const closeRef = useRef<HTMLButtonElement>(null)

  const go = (delta: number) => {
    const next = current + delta
    if (next >= 0 && next <= total) onIndexChange(next)
  }
  const swipe = useSwipe(go)

  const handlers = useRef({ go, onClose })
  useEffect(() => {
    handlers.current = { go, onClose }
  })

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus({ preventScroll: true })

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handlers.current.onClose()
      if (e.key === 'ArrowRight') handlers.current.go(1)
      if (e.key === 'ArrowLeft') handlers.current.go(-1)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previouslyFocused?.focus?.({ preventScroll: true })
    }
  }, [])

  // The word was deleted elsewhere (e.g. synced away) — nothing left to show.
  useEffect(() => {
    if (total === 0) onClose()
  }, [total, onClose])

  if (total === 0) return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={done ? 'Well done' : item.dutch}
      className="animate-fade-in fixed inset-0 z-50 flex flex-col bg-cream px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8"
    >
      <div className="flex items-center justify-between">
        <span className="pl-2 text-sm text-muted" data-testid="viewer-progress">
          {done ? `${total} / ${total}` : `${current + 1} / ${total}`}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid h-11 w-11 place-items-center rounded-full text-ink hover:bg-sage-100"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-4" {...swipe}>
        {done ? (
          <Celebration count={total} onRestart={() => onIndexChange(0)} onClose={onClose} />
        ) : (
          <>
            {/* key resets the flip state when moving to another card */}
            <VocabularyCard key={item.id} item={item} size="full" />
            <p className="mt-4 text-center text-xs text-muted">Tap the card to flip · swipe to move</p>
          </>
        )}
      </div>

      {/* The celebration has its own buttons; swipe / ← still go back to the last word. */}
      <div className={done ? 'hidden' : 'mx-auto flex w-full max-w-3xl gap-3'}>
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={current === 0}
          aria-label="Previous word"
          className="flex h-14 flex-1 items-center justify-center rounded-2xl border border-line bg-paper text-ink disabled:opacity-40"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={done}
          aria-label="Next word"
          className="flex h-14 flex-1 items-center justify-center rounded-2xl bg-sage-600 text-white disabled:opacity-40"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </div>,
    document.body,
  )
}
