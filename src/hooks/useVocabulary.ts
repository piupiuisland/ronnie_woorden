import { useLiveQuery } from 'dexie-react-hooks'
import { db, getAllVocabulary, getDatesWithWords, getWordsForDate } from '@/db/database'
import type { Vocabulary } from '@/types/vocabulary'

/** `undefined` while loading. */
export function useWordsForDate(date: string): Vocabulary[] | undefined {
  return useLiveQuery(() => getWordsForDate(date), [date])
}

export function useAllVocabulary(): Vocabulary[] | undefined {
  return useLiveQuery(() => getAllVocabulary(), [])
}

export function useDatesWithWords(): Set<string> {
  const dates = useLiveQuery(() => getDatesWithWords(), [])
  return new Set(dates ?? [])
}

export function useVocabularyStats(): { total: number; days: number } | undefined {
  return useLiveQuery(async () => {
    const [total, dates] = await Promise.all([db.vocabulary.count(), getDatesWithWords()])
    return { total, days: dates.length }
  }, [])
}
