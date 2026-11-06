import { Flag } from 'lucide-react'
import { cn } from '@/lib/cn'

interface MarkWrongButtonProps {
  marked: boolean
  onToggle: () => void
  className?: string
}

/** Flags the current card as a mistake, to review again at the end. */
export function MarkWrongButton({ marked, onToggle, className }: MarkWrongButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={marked}
      className={cn(
        'flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl border font-medium transition-colors',
        marked ? 'border-danger bg-danger text-white' : 'border-line bg-paper text-danger',
        className,
      )}
    >
      <Flag className="h-5 w-5" fill={marked ? 'currentColor' : 'none'} aria-hidden />
      {marked ? 'Marked wrong' : 'Mark wrong'}
    </button>
  )
}
