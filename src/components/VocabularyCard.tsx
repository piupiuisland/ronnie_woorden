import { useState, type KeyboardEvent } from 'react'
import { Maximize2, Pencil, RotateCw, Trash2 } from 'lucide-react'
import type { Vocabulary } from '@/types/vocabulary'
import { cn } from '@/lib/cn'
import { pictureUrl } from '@/lib/pictures'

interface VocabularyCardProps {
  item: Vocabulary
  onEdit?: (item: Vocabulary) => void
  onDelete?: (item: Vocabulary) => void
  /** When set, tapping opens the card (full screen) instead of flipping it. */
  onOpen?: (item: Vocabulary) => void
  /** "large" is used in review mode, "full" in the full-screen viewer. */
  size?: 'default' | 'large' | 'full'
}

const sizes = {
  default: {
    face: 'min-h-40 py-8',
    word: 'text-[28px] leading-tight',
    translation: 'mt-2 text-[17px]',
    example: 'text-lg',
    exampleTranslation: 'mt-3 text-[15px]',
    picture: 'h-24 w-24',
  },
  large: {
    face: 'min-h-72 py-12 sm:min-h-80',
    word: 'text-4xl sm:text-5xl',
    translation: 'mt-2 text-xl',
    example: 'text-2xl sm:text-3xl',
    exampleTranslation: 'mt-3 text-lg',
    picture: 'h-40 w-40 sm:h-48 sm:w-48',
  },
  full: {
    face: 'min-h-[min(60dvh,36rem)] py-14 px-8',
    word: 'text-5xl leading-tight sm:text-7xl',
    translation: 'mt-4 text-2xl sm:text-3xl',
    example: 'text-3xl leading-snug sm:text-5xl',
    exampleTranslation: 'mt-5 text-xl sm:text-2xl',
    picture: 'h-56 w-56 sm:h-80 sm:w-80',
  },
}

const faceBase =
  'flip-face flex flex-col justify-center rounded-3xl border border-line bg-paper shadow-card px-6 text-center'

export function VocabularyCard({ item, onEdit, onDelete, onOpen, size = 'default' }: VocabularyCardProps) {
  const [flipped, setFlipped] = useState(false)
  const s = sizes[size]
  const picture = pictureUrl(item.image)
  const toggle = () => (onOpen ? onOpen(item) : setFlipped((f) => !f))

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
          aria-pressed={onOpen ? undefined : flipped}
          aria-label={
            onOpen
              ? `${item.dutch}, ${item.chinese}. Open full screen`
              : flipped
                ? `${item.dutch}: example sentence. Activate to show the word.`
                : undefined
          }
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
            className={cn(faceBase, 'flip-front', s.face)}
            aria-hidden={flipped}
          >
            <p
              lang="nl"
              className={cn('font-display font-bold tracking-tight break-words text-ink', s.word)}
            >
              {item.dutch}
            </p>
            <p lang="zh" className={cn('text-muted', s.translation)}>
              {item.chinese}
            </p>
          </div>

          <div
            className={cn(faceBase, 'flip-back bg-sage-50', s.face)}
            aria-hidden={!flipped}
          >
            {picture && (
              <img
                src={picture}
                alt={item.dutch}
                draggable={false}
                className={cn('mx-auto object-contain', s.picture, item.exampleDutch && 'mb-4')}
              />
            )}
            {item.exampleDutch && (
              <p lang="nl" className={cn('font-semibold leading-snug text-ink', s.example)}>
                {item.exampleDutch}
              </p>
            )}
            {item.exampleChinese && (
              <p lang="zh" className={cn('leading-relaxed text-muted', s.exampleTranslation)}>
                {item.exampleChinese}
              </p>
            )}
          </div>
        </div>
      </div>

      {onOpen ? (
        <Maximize2 aria-hidden className="pointer-events-none absolute bottom-3 left-4 h-3.5 w-3.5 text-sage-300" />
      ) : (
        <RotateCw aria-hidden className="pointer-events-none absolute bottom-3 left-4 h-3.5 w-3.5 text-sage-300" />
      )}

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
