import type { Vocabulary } from '@/types/vocabulary'
import { VocabularyCard } from './VocabularyCard'

interface VocabularyGridProps {
  items: Vocabulary[]
  onEdit: (item: Vocabulary) => void
  onDelete: (item: Vocabulary) => void
  onOpen: (item: Vocabulary) => void
}

export function VocabularyGrid({ items, onEdit, onDelete, onOpen }: VocabularyGridProps) {
  return (
    <ul className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.id}>
          <VocabularyCard item={item} onEdit={onEdit} onDelete={onDelete} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  )
}
