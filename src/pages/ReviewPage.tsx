import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Layers, Shuffle } from 'lucide-react'
import { useAllVocabulary, useWordsForDate } from '@/hooks/useVocabulary'
import { useSwipe } from '@/hooks/useSwipe'
import { useSelectedDate } from '@/hooks/useSelectedDate'
import { useMistakes } from '@/hooks/useMistakes'
import { seededShuffle } from '@/lib/shuffle'
import { formatShortDate } from '@/lib/dates'
import { DateNavigator } from '@/components/DateNavigator'
import { VocabularyCard } from '@/components/VocabularyCard'
import { Celebration } from '@/components/Celebration'
import { MarkWrongButton } from '@/components/MarkWrongButton'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

type Scope = 'all' | 'day'

export function ReviewPage() {
  const [scope, setScope] = useState<Scope>('all')
  const [date, setDate] = useSelectedDate()
  const [shuffleSeed, setShuffleSeed] = useState<number | null>(null)
  const [index, setIndex] = useState(0)

  const all = useAllVocabulary()
  const day = useWordsForDate(date)
  const source = scope === 'all' ? all : day

  const ordered = useMemo(() => {
    if (!source) return undefined
    return shuffleSeed === null ? source : seededShuffle(source, shuffleSeed)
  }, [source, shuffleSeed])
  const mistakes = useMistakes(ordered)
  const deck = mistakes.deck

  const total = deck?.length ?? 0
  // index === total means "finished": the celebration is shown.
  const current = Math.min(index, total)
  const done = total > 0 && current === total
  const item = deck?.[current]

  const go = (delta: number) => setIndex((i) => Math.min(Math.max(Math.min(i, total) + delta, 0), total))
  const goRef = useRef(go)
  useEffect(() => {
    goRef.current = go
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, [role="dialog"]')) return
      if (e.key === 'ArrowRight') goRef.current(1)
      if (e.key === 'ArrowLeft') goRef.current(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const swipe = useSwipe(go)

  const restart = () => {
    mistakes.reset()
    setIndex(0)
  }

  const changeScope = (next: Scope) => {
    setScope(next)
    restart()
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div role="radiogroup" aria-label="Words to review" className="flex rounded-xl bg-sage-100 p-1">
          {(
            [
              ['all', 'All words'],
              ['day', 'One day'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={scope === value}
              onClick={() => changeScope(value)}
              className={cn(
                'h-9 rounded-lg px-4 text-sm font-medium transition-colors',
                scope === value ? 'bg-paper text-ink shadow-sm' : 'text-sage-700',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <Button
          variant={shuffleSeed === null ? 'secondary' : 'primary'}
          aria-pressed={shuffleSeed !== null}
          onClick={() => {
            setShuffleSeed(Date.now())
            restart()
          }}
          className="ml-auto h-11"
        >
          <Shuffle className="h-4 w-4" aria-hidden />
          {shuffleSeed === null ? 'Shuffle' : 'Reshuffle'}
        </Button>
        {shuffleSeed !== null && (
          <Button
            variant="ghost"
            onClick={() => {
              setShuffleSeed(null)
              restart()
            }}
          >
            In order
          </Button>
        )}
      </div>

      {scope === 'day' && (
        <div className="mt-4">
          <DateNavigator
            date={date}
            onChange={(d) => {
              setDate(d)
              restart()
            }}
          />
        </div>
      )}

      <section aria-label="Review card" className="mt-6">
        {deck && total === 0 && (
          <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-line px-6 py-14 text-center">
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-sage-100 text-sage-600">
              <Layers className="h-6 w-6" aria-hidden />
            </div>
            <p className="font-semibold">Nothing to review yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted">
              {scope === 'all' ? 'Add some words first, then come back here.' : 'There are no words saved for this day.'}
            </p>
          </div>
        )}

        {done && (
          <Celebration
            count={total}
            onRestart={restart}
            mistakes={mistakes.mistakeCount}
            onReviewMistakes={() => {
              mistakes.reviewMistakes()
              setIndex(0)
            }}
          />
        )}

        {item && (
          <>
            <div className="mb-3 flex items-center justify-between px-1 text-sm text-muted">
              <span data-testid="review-progress">
                {mistakes.reviewingMistakes && 'Mistakes · '}
                {current + 1} / {total}
              </span>
              <span>{formatShortDate(item.date)}</span>
            </div>
            <div className="mb-4 h-1 overflow-hidden rounded-full bg-sage-100" aria-hidden>
              <div
                className="h-full rounded-full bg-sage-400 transition-[width] duration-300"
                style={{ width: `${((current + 1) / total) * 100}%` }}
              />
            </div>

            <div {...swipe}>
              {/* key resets the flip state when moving to another card */}
              <VocabularyCard key={item.id} item={item} size="large" />
            </div>

            <p className="mt-3 text-center text-xs text-muted">Tap the card to flip · swipe or use the buttons to move</p>

            <MarkWrongButton
              marked={mistakes.isMarked(item.id)}
              onToggle={() => mistakes.toggle(item.id)}
              className="mx-auto mt-4 w-[calc(50%-0.375rem)]"
            />

            <div className="mt-5 flex gap-3">
              <Button variant="secondary" size="lg" className="flex-1" onClick={() => go(-1)} disabled={current === 0}>
                <ChevronLeft className="h-5 w-5" aria-hidden />
                Previous
              </Button>
              <Button size="lg" className="flex-1" onClick={() => go(1)} disabled={done}>
                Next
                <ChevronRight className="h-5 w-5" aria-hidden />
              </Button>
            </div>
          </>
        )}
      </section>
    </>
  )
}
