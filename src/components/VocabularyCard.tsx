import { useState, type KeyboardEvent } from 'react'
import { Pencil, RotateCw, Trash2 } from 'lucide-react'
import type { Vocabulary } from '@/types/vocabulary'
import { cn } from '@/lib/cn'

interface VocabularyCardProps {
  item: Vocabulary
  onEdit?: (item: Vocabulary) => void
  onDelete?: (item: Vocabulary) => void
  /** "large" is used in review mode. */
  size?: 'default' | 'large'
}

const faceBase =
  'flip-face flex flex-col justify-center rounded-3xl border border-line bg-paper shadow-card px-6 text-center'

export function VocabularyCard({ item, onEdit, onDelete, size = 'default' }: VocabularyCardProps) {
  const [flipped, setFlipped] = useState(false)
  const large = size === 'large'
  const toggle = () => setFlipped((f) => !f)

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle()
    }
  }

  return (
    <article className="group relative" aria-label={item.dutch}>
      <div className="flip-scene">
        <div
          role="button"
          tabIndex={0}
          aria-pressed={flipped}
          aria-label={flipped ? `${item.dutch}: example sentence. Activate to show the word.` : undefined}
          onClick={toggle}
          onKeyDown={onKeyDown}
          data-flipped={flipped}
          data-testid="vocabulary-card"
          className={cn(
            'flip-inner cursor-pointer rounded-3xl outline-none',
            'focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-4 focus-visible:ring-offset-cream',
          )}
        >
          <div
            className={cn(faceBase, 'flip-front', large ? 'min-h-72 py-12 sm:min-h-80' : 'min-h-40 py-8')}
            aria-hidden={flipped}
          >
            <p
              lang="nl"
              className={cn(
                'font-display font-bold tracking-tight break-words text-ink',
                large ? 'text-4xl sm:text-5xl' : 'text-[28px] leading-tight',
              )}
            >
              {item.dutch}
            </p>
            <p lang="zh" className={cn('mt-2 text-muted', large ? 'text-xl' : 'text-[17px]')}>
              {item.chinese}
            </p>
          </div>

          <div
            className={cn(
              faceBase,
              'flip-back bg-sage-50',
              large ? 'min-h-72 py-12 sm:min-h-80' : 'min-h-40 py-8',
            )}
            aria-hidden={!flipped}
          >
            <p
              lang="nl"
              className={cn('font-semibold leading-snug text-ink', large ? 'text-2xl sm:text-3xl' : 'text-lg')}
            >
              {item.exampleDutch}
            </p>
            {item.exampleChinese && (
              <p lang="zh" className={cn('mt-3 leading-relaxed text-muted', large ? 'text-lg' : 'text-[15px]')}>
                {item.exampleChinese}
              </p>
            )}
          </div>
        </div>
      </div>

      <RotateCw
        aria-hidden
        className="pointer-events-none absolute bottom-3 left-4 h-3.5 w-3.5 text-sage-300"
      />

      {(onEdit || onDelete) && (
        <div className="absolute top-1.5 right-1.5 flex">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(item)}
              aria-label={`Edit ${item.dutch}`}
              className="grid h-10 w-10 place-items-center rounded-full text-muted/70 transition-colors hover:bg-sage-100 hover:text-ink"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(item)}
              aria-label={`Delete ${item.dutch}`}
              className="grid h-10 w-10 place-items-center rounded-full text-muted/70 transition-colors hover:bg-red-50 hover:text-danger"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </article>
  )
}
