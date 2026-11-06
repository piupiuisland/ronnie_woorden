import { Flag, RotateCcw } from 'lucide-react'
import fireworks from '@/assets/fireworks_celebration.png'
import { Button } from './ui/Button'

interface CelebrationProps {
  count: number
  onRestart: () => void
  onClose?: () => void
  /** Words marked wrong in this run; shows a "Review mistakes" button when > 0. */
  mistakes?: number
  onReviewMistakes?: () => void
}

/** Shown after the last card: fireworks and a well-done message. */
export function Celebration({ count, onRestart, onClose, mistakes = 0, onReviewMistakes }: CelebrationProps) {
  return (
    <div className="flex flex-col items-center text-center" role="status" data-testid="celebration">
      <img
        src={fireworks}
        alt="Fireworks"
        draggable={false}
        className="animate-celebrate h-44 w-44 object-contain sm:h-96 sm:w-96"
      />
      <p className="font-display mt-2 text-4xl font-bold text-ink sm:text-5xl">Goed gedaan!</p>
      <p className="mt-2 text-lg text-muted">
        You went through all {count} {count === 1 ? 'word' : 'words'} · 太棒了!
      </p>
      <div className="mt-6 flex w-full max-w-sm flex-col gap-2">
        <Button size="lg" onClick={onRestart}>
          <RotateCcw className="h-5 w-5" aria-hidden />
          Start again
        </Button>
        {mistakes > 0 && onReviewMistakes && (
          <Button size="lg" variant="secondary" onClick={onReviewMistakes}>
            <Flag className="h-5 w-5" aria-hidden />
            Review mistakes ({mistakes})
          </Button>
        )}
        {onClose && (
          <Button size="lg" variant="secondary" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
      <p className="font-display animate-celebrate mt-6 text-3xl font-bold text-sage-600 sm:text-4xl">
        Gefeliciteerd!
      </p>
    </div>
  )
}
