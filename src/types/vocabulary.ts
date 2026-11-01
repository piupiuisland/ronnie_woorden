export interface Vocabulary {
  id: string
  /** YYYY-MM-DD, local calendar date */
  date: string
  dutch: string
  chinese: string
  exampleDutch: string
  exampleChinese: string
  /** ISO timestamp */
  createdAt: string
  /** ISO timestamp */
  updatedAt: string
}

/** The user-editable fields of a vocabulary item. */
export type VocabularyInput = Pick<
  Vocabulary,
  'date' | 'dutch' | 'chinese' | 'exampleDutch' | 'exampleChinese'
>
