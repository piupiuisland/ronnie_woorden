import { afterEach, describe, expect, it } from 'vitest'
import {
  addDays,
  addMonths,
  isValidDateKey,
  monthGrid,
  parseDateKey,
  relativeDayLabel,
  toDateKey,
  todayKey,
} from '@/lib/dates'

const originalTz = process.env.TZ

afterEach(() => {
  process.env.TZ = originalTz
})

describe('dates', () => {
  it('formats local dates as YYYY-MM-DD', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it.each(['Pacific/Auckland', 'America/Los_Angeles', 'Europe/Amsterdam', 'Asia/Shanghai'])(
    'uses the local calendar day late at night and early in the morning (%s)',
    (tz) => {
      process.env.TZ = tz
      expect(todayKey(new Date(2026, 9, 30, 23, 59))).toBe('2026-10-30')
      expect(todayKey(new Date(2026, 9, 30, 0, 1))).toBe('2026-10-30')
      expect(toDateKey(parseDateKey('2026-10-30'))).toBe('2026-10-30')
    },
  )

  it('validates date keys', () => {
    expect(isValidDateKey('2026-10-30')).toBe(true)
    expect(isValidDateKey('2028-02-29')).toBe(true)
    expect(isValidDateKey('2026-02-29')).toBe(false)
    expect(isValidDateKey('2026-13-01')).toBe(false)
    expect(isValidDateKey('2026-1-1')).toBe(false)
    expect(isValidDateKey('')).toBe(false)
    expect(isValidDateKey(null)).toBe(false)
  })

  it('adds days across month, year and DST boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
    process.env.TZ = 'Europe/Amsterdam'
    // Clocks go back on 25 Oct 2026 and forward on 29 Mar 2026 in the Netherlands.
    expect(addDays('2026-10-24', 1)).toBe('2026-10-25')
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26')
    expect(addDays('2026-03-29', -1)).toBe('2026-03-28')
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30')
  })

  it('adds months', () => {
    expect(addMonths(2026, 11, 1)).toEqual({ year: 2027, month: 0 })
    expect(addMonths(2026, 0, -1)).toEqual({ year: 2025, month: 11 })
  })

  it('builds a Monday-first 6-week month grid', () => {
    const grid = monthGrid(2026, 9) // October 2026 starts on a Thursday
    expect(grid).toHaveLength(42)
    expect(grid[0]).toBe('2026-09-28')
    expect(grid[3]).toBe('2026-10-01')
    expect(grid[41]).toBe('2026-11-08')
  })

  it('labels nearby days', () => {
    expect(relativeDayLabel('2026-10-30', '2026-10-30')).toBe('Today')
    expect(relativeDayLabel('2026-10-29', '2026-10-30')).toBe('Yesterday')
    expect(relativeDayLabel('2026-10-31', '2026-10-30')).toBe('Tomorrow')
    expect(relativeDayLabel('2026-10-01', '2026-10-30')).toBeNull()
  })
})
