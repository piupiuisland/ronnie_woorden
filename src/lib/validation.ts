import type { VocabularyInput } from '@/types/vocabulary'
import { isValidDateKey } from './dates'

export type VocabularyErrors = Partial<Record<keyof VocabularyInput, string>>

export type ValidationResult =
  | { ok: true; value: VocabularyInput }
  | { ok: false; errors: VocabularyErrors }

/** Collapses internal runs of whitespace and trims the ends. */
export function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
}

export function validateVocabularyInput(
  raw: Partial<Record<keyof VocabularyInput, unknown>>,
  { exampleRequired = true }: { exampleRequired?: boolean } = {},
): ValidationResult {
  const value: VocabularyInput = {
    dutch: cleanText(raw.dutch),
    chinese: cleanText(raw.chinese),
    exampleDutch: cleanText(raw.exampleDutch),
    exampleChinese: cleanText(raw.exampleChinese),
    date: typeof raw.date === 'string' ? raw.date.trim() : '',
  }

  const errors: VocabularyErrors = {}
  if (!value.dutch) errors.dutch = 'Please enter the Dutch word.'
  if (!value.chinese) errors.chinese = 'Please enter the Chinese translation.'
  if (exampleRequired && !value.exampleDutch) errors.exampleDutch = 'Please enter a Dutch example sentence.'
  if (!isValidDateKey(value.date)) errors.date = 'Please choose a valid date.'

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, value }
}
