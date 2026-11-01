import { useState } from 'react'
import { BookOpen, Plus } from 'lucide-react'
import type { Vocabulary, VocabularyInput } from '@/types/vocabulary'
import { addVocabulary, deleteVocabulary, updateVocabulary } from '@/db/database'
import { useWordsForDate } from '@/hooks/useVocabulary'
import { useSelectedDate } from '@/hooks/useSelectedDate'
import { DateNavigator } from '@/components/DateNavigator'
import { VocabularyGrid } from '@/components/VocabularyGrid'
import { VocabularyForm } from '@/components/VocabularyForm'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/Button'

type EditorState = { mode: 'add' } | { mode: 'edit'; item: Vocabulary } | null

const emptyInput = (date: string): VocabularyInput => ({
  date,
  dutch: '',
  chinese: '',
  exampleDutch: '',
  exampleChinese: '',
})

export function HomePage() {
  const [date, setDate] = useSelectedDate()
  const words = useWordsForDate(date)
  const [editor, setEditor] = useState<EditorState>(null)
  const [toDelete, setToDelete] = useState<Vocabulary | null>(null)

  const closeEditor = () => setEditor(null)

  const handleSave = async (value: VocabularyInput) => {
    if (editor?.mode === 'edit') await updateVocabulary(editor.item.id, value)
    else await addVocabulary(value)
    setEditor(null)
    // Follow the word if it was saved to another day.
    if (value.date !== date) setDate(value.date)
  }

  const count = words?.length ?? 0

  return (
    <>
      <DateNavigator date={date} onChange={setDate} />

      <section aria-labelledby="words-heading" className="mt-6">
        <div className="mb-3 flex items-baseline justify-between px-1">
          <h2 id="words-heading" className="text-sm font-semibold tracking-wide text-muted uppercase">
            Words
          </h2>
          {words && (
            <span className="text-sm text-muted" data-testid="word-count" aria-live="polite">
              {count === 1 ? '1 word' : `${count} words`}
            </span>
          )}
        </div>

        {words && count === 0 && (
          <div className="animate-fade-in flex flex-col items-center rounded-3xl border-2 border-dashed border-line px-6 py-12 text-center">
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-sage-100 text-sage-600">
              <BookOpen className="h-6 w-6" aria-hidden />
            </div>
            <p className="font-semibold">No words for this day yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted">
              Add the Dutch words you learned. Tap a card to see its example sentence.
            </p>
          </div>
        )}

        {words && count > 0 && <VocabularyGrid items={words} onEdit={(item) => setEditor({ mode: 'edit', item })} onDelete={setToDelete} />}
      </section>

      {/* Floating add button, sits above the tab bar. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 flex justify-center px-4">
        <Button
          size="lg"
          onClick={() => setEditor({ mode: 'add' })}
          className="pointer-events-auto w-full max-w-sm shadow-lg shadow-sage-800/20"
        >
          <Plus className="h-5 w-5" aria-hidden />
          Add Word
        </Button>
      </div>

      <Modal open={editor !== null} title={editor?.mode === 'edit' ? 'Edit word' : 'Add word'} onClose={closeEditor}>
        {editor && (
          <VocabularyForm
            key={editor.mode === 'edit' ? editor.item.id : 'new'}
            initial={editor.mode === 'edit' ? editor.item : emptyInput(date)}
            submitLabel={editor.mode === 'edit' ? 'Save changes' : 'Save word'}
            onSubmit={handleSave}
            onCancel={closeEditor}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete word?"
        message={toDelete ? `“${toDelete.dutch}” will be removed permanently.` : ''}
        confirmLabel="Delete"
        danger
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) await deleteVocabulary(toDelete.id)
          setToDelete(null)
        }}
      />
    </>
  )
}
