import { useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { addDays, formatLongDate, relativeDayLabel, todayKey } from '@/lib/dates'
import { useDatesWithWords } from '@/hooks/useVocabulary'
import { CalendarPicker } from './CalendarPicker'
import { Modal } from './ui/Modal'
import { cn } from '@/lib/cn'

interface DateNavigatorProps {
  date: string
  onChange: (date: string) => void
}

export function DateNavigator({ date, onChange }: DateNavigatorProps) {
  const [calendarOpen, setCalendarOpen] = useState(false)
  const datesWithWords = useDatesWithWords()
  const relative = relativeDayLabel(date)
  const isToday = date === todayKey()

  return (
    <nav aria-label="Date navigation" className="flex items-center gap-1 rounded-2xl border border-line bg-paper p-1.5 shadow-card">
      <button
        type="button"
        onClick={() => onChange(addDays(date, -1))}
        aria-label="Previous day"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-ink hover:bg-sage-100 active:bg-sage-200"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={() => setCalendarOpen(true)}
        aria-label={`Selected date ${formatLongDate(date)}. Open calendar`}
        className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-2 py-1.5 hover:bg-sage-50"
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-sage-600" aria-hidden />
        <span className="min-w-0 text-center leading-tight">
          <span className="block truncate text-[15px] font-semibold" data-testid="selected-date">
            {formatLongDate(date)}
          </span>
          {relative && <span className="block text-xs text-sage-600">{relative}</span>}
        </span>
      </button>

      {!isToday && (
        <button
          type="button"
          onClick={() => onChange(todayKey())}
          className={cn('h-9 shrink-0 rounded-lg bg-sage-100 px-2.5 text-xs font-semibold text-sage-700 hover:bg-sage-200')}
        >
          Today
        </button>
      )}

      <button
        type="button"
        onClick={() => onChange(addDays(date, 1))}
        aria-label="Next day"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-ink hover:bg-sage-100 active:bg-sage-200"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <Modal open={calendarOpen} title="Choose a date" onClose={() => setCalendarOpen(false)}>
        <CalendarPicker
          selected={date}
          highlighted={datesWithWords}
          onSelect={(d) => {
            onChange(d)
            setCalendarOpen(false)
          }}
        />
      </Modal>
    </nav>
  )
}
