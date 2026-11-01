import { useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { isValidDateKey, todayKey } from '@/lib/dates'

/** The selected date lives in the URL (?date=YYYY-MM-DD) so it survives tab switches and reloads. */
export function useSelectedDate(): [string, (date: string) => void] {
  const [params, setParams] = useSearchParams()
  const raw = params.get('date')
  const date = isValidDateKey(raw) ? raw : todayKey()

  const setDate = useCallback(
    (next: string) => {
      setParams(
        (prev) => {
          const updated = new URLSearchParams(prev)
          if (next === todayKey()) updated.delete('date')
          else updated.set('date', next)
          return updated
        },
        { replace: true },
      )
    },
    [setParams],
  )

  return [date, setDate]
}
