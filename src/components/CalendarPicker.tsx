import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addMonths, formatLongDate, formatMonthYear, monthGrid, parseDateKey, todayKey } from '@/lib/dates'
import { cn } from '@/lib/cn'

interface CalendarPickerProps {
  selected: string
  /** Dates that contain vocabulary. */
  highlighted: Set<string>
  onSelect: (date: string) => void
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

export function CalendarPicker({ selected, highlighted, onSelect }: CalendarPickerProps) {
  const initial = parseDateKey(selected)
  const [view, setView] = useState({ year: initial.getFullYear(), month: initial.getMonth() })
  const today = todayKey()
  const days = monthGrid(view.year, view.month)
  const monthPrefix = `${view.year}-${String(view.month + 1).padStart(2, '0')}`

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setView((v) => addMonths(v.year, v.month, -1))}
          aria-label="Previous month"
          className="grid h-10 w-10 place-items-center rounded-full hover:bg-sage-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="font-semibold" aria-live="polite">
          {formatMonthYear(view.year, view.month)}
        </p>
        <button
          type="button"
          onClick={() => setView((v) => addMonths(v.year, v.month, 1))}
          aria-label="Next month"
          className="grid h-10 w-10 place-items-center rounded-full hover:bg-sage-100"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-medium text-muted" aria-hidden>
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1" role="grid">
        {days.map((day) => {
          const inMonth = day.startsWith(monthPrefix)
          const isSelected = day === selected
          const hasWords = highlighted.has(day)
          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelect(day)}
              aria-label={`${formatLongDate(day)}${hasWords ? ', has words' : ''}`}
              aria-pressed={isSelected}
              data-has-words={hasWords || undefined}
              className={cn(
                'relative mx-auto grid h-11 w-11 place-items-center rounded-full text-[15px] transition-colors',
                !inMonth && 'text-muted/40',
                inMonth && !isSelected && 'hover:bg-sage-100',
                hasWords && !isSelected && 'bg-sage-100 font-semibold text-sage-800',
                day === today && !isSelected && 'ring-1 ring-sage-400',
                isSelected && 'bg-sage-600 font-semibold text-white',
              )}
            >
              {Number(day.slice(8))}
              {hasWords && (
                <span
                  aria-hidden
                  className={cn(
                    'absolute bottom-1.5 h-1 w-1 rounded-full',
                    isSelected ? 'bg-white' : 'bg-sage-600',
                  )}
                />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-muted">
        <span className="h-2.5 w-2.5 rounded-full bg-sage-200" aria-hidden />
        Days with saved words
      </div>
    </div>
  )
}
