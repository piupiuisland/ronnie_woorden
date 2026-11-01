/**
 * Date helpers that work exclusively with local calendar dates.
 *
 * A "date key" is a `YYYY-MM-DD` string in the user's local calendar. We never
 * round-trip through `toISOString()` or `new Date('YYYY-MM-DD')`, both of which
 * use UTC and can shift a word to the previous or following day.
 */

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

const pad = (n: number) => String(n).padStart(2, '0')

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayKey(now: Date = new Date()): string {
  return toDateKey(now)
}

export function isValidDateKey(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match = DATE_KEY_PATTERN.exec(value)
  if (!match) return false
  const [, y, m, d] = match.map(Number)
  const date = new Date(y, m - 1, d, 12)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

/** Parses a date key into a local Date at noon (noon avoids DST edge cases). */
export function parseDateKey(key: string): Date {
  if (!isValidDateKey(key)) throw new Error(`Invalid date key: ${key}`)
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

export function addDays(key: string, days: number): string {
  const date = parseDateKey(key)
  date.setDate(date.getDate() + days)
  return toDateKey(date)
}

export function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(year, month + delta, 1, 12)
  return { year: date.getFullYear(), month: date.getMonth() }
}

/** e.g. "Thursday, 30 October 2026" */
export function formatLongDate(key: string): string {
  return parseDateKey(key).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** e.g. "Thu 30 Oct" */
export function formatShortDate(key: string): string {
  return parseDateKey(key).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function formatMonthYear(year: number, month: number): string {
  return new Date(year, month, 1, 12).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

/** Relative label for nearby days, otherwise null. */
export function relativeDayLabel(key: string, today: string = todayKey()): string | null {
  if (key === today) return 'Today'
  if (key === addDays(today, -1)) return 'Yesterday'
  if (key === addDays(today, 1)) return 'Tomorrow'
  return null
}

/**
 * Returns the date keys for a Monday-first month grid (always 6 weeks = 42 days),
 * including leading and trailing days from adjacent months.
 */
export function monthGrid(year: number, month: number): string[] {
  const first = new Date(year, month, 1, 12)
  const offset = (first.getDay() + 6) % 7 // Monday = 0
  const start = new Date(year, month, 1 - offset, 12)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return toDateKey(d)
  })
}
