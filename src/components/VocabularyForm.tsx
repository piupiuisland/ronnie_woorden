import { useState, type FormEvent, type ReactNode } from 'react'
import type { VocabularyInput } from '@/types/vocabulary'
import { validateVocabularyInput, type VocabularyErrors } from '@/lib/validation'
import { Button } from './ui/Button'
import { cn } from '@/lib/cn'

interface VocabularyFormProps {
  initial: VocabularyInput
  submitLabel: string
  onSubmit: (value: VocabularyInput) => Promise<void>
  onCancel: () => void
}

export function VocabularyForm({ initial, submitLabel, onSubmit, onCancel }: VocabularyFormProps) {
  const [values, setValues] = useState<VocabularyInput>(initial)
  const [errors, setErrors] = useState<VocabularyErrors>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const set = (field: keyof VocabularyInput) => (value: string) => {
    setValues((v) => ({ ...v, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const result = validateVocabularyInput(values)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      await onSubmit(result.value)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save. Please try again.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field label="Dutch word" error={errors.dutch} required>
        {(props) => (
          <input
            {...props}
            lang="nl"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={values.dutch}
            onChange={(e) => set('dutch')(e.target.value)}
            placeholder="gezellig"
          />
        )}
      </Field>
      <Field label="Chinese translation" error={errors.chinese} required>
        {(props) => (
          <input
            {...props}
            lang="zh"
            value={values.chinese}
            onChange={(e) => set('chinese')(e.target.value)}
            placeholder="温馨的、愉快的"
          />
        )}
      </Field>
      <Field label="Dutch example sentence" error={errors.exampleDutch} required>
        {(props) => (
          <textarea
            {...props}
            lang="nl"
            rows={2}
            value={values.exampleDutch}
            onChange={(e) => set('exampleDutch')(e.target.value)}
            placeholder="Het is gezellig bij ons thuis."
          />
        )}
      </Field>
      <Field label="Chinese example translation" hint="optional" error={errors.exampleChinese}>
        {(props) => (
          <textarea
            {...props}
            lang="zh"
            rows={2}
            value={values.exampleChinese}
            onChange={(e) => set('exampleChinese')(e.target.value)}
            placeholder="我们家里很温馨。"
          />
        )}
      </Field>
      <Field label="Date" error={errors.date} required>
        {(props) => (
          <input {...props} type="date" value={values.date} onChange={(e) => set('date')(e.target.value)} />
        )}
      </Field>

      {saveError && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">
          {saveError}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}

interface FieldProps {
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: (props: {
    id: string
    className: string
    'aria-invalid': boolean
    'aria-describedby'?: string
    'aria-required'?: boolean
  }) => ReactNode
}

function Field({ label, hint, error, required, children }: FieldProps) {
  const id = `field-${label.toLowerCase().replace(/\s+/g, '-')}`
  const errorId = `${id}-error`
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {hint && <span className="ml-1 font-normal text-muted">({hint})</span>}
      </label>
      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': error ? errorId : undefined,
        'aria-required': required || undefined,
        className: cn(
          'block w-full resize-none rounded-xl border bg-white px-3.5 py-2.5 text-ink placeholder:text-muted/50',
          'outline-none transition-shadow focus:ring-2 focus:ring-sage-300',
          'appearance-none min-h-11',
          error ? 'border-danger' : 'border-line focus:border-sage-400',
        ),
      })}
      {error && (
        <p id={errorId} className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
