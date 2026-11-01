import { useRef, useState, type ChangeEvent } from 'react'
import { AlertTriangle, Download, Upload } from 'lucide-react'
import { useVocabularyStats } from '@/hooks/useVocabulary'
import {
  BackupError,
  backupFileName,
  exportBackupJson,
  importBackup,
  parseBackup,
  type ImportMode,
  type ImportResult,
  type ParsedBackup,
} from '@/lib/backup'
import { saveTextFile } from '@/lib/download'
import { formatLongDate, todayKey } from '@/lib/dates'
import { APP_VERSION } from '@/lib/version'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

const LAST_EXPORT_KEY = 'mijn-woordenboek:last-export'

function readLastExport(): string | null {
  try {
    return localStorage.getItem(LAST_EXPORT_KEY)
  } catch {
    return null
  }
}

type Status = { kind: 'success' | 'error'; message: string } | null

export function SettingsPage() {
  const stats = useVocabularyStats()
  const fileInput = useRef<HTMLInputElement>(null)
  const [lastExport, setLastExport] = useState(readLastExport)
  const [pending, setPending] = useState<{ parsed: ParsedBackup; fileName: string } | null>(null)
  const [confirmReplace, setConfirmReplace] = useState(false)
  const [status, setStatus] = useState<Status>(null)
  const [busy, setBusy] = useState(false)

  const handleExport = async () => {
    setStatus(null)
    try {
      const json = await exportBackupJson(APP_VERSION)
      const today = todayKey()
      if (await saveTextFile(backupFileName(today), json)) {
        try {
          localStorage.setItem(LAST_EXPORT_KEY, today)
        } catch {
          // ignore
        }
        setLastExport(today)
      }
    } catch {
      setStatus({ kind: 'error', message: 'Export failed. Please try again.' })
    }
  }

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow choosing the same file again
    if (!file) return
    setStatus(null)
    try {
      const parsed = parseBackup(await file.text())
      setPending({ parsed, fileName: file.name })
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof BackupError ? err.message : 'Could not read this file.',
      })
    }
  }

  const runImport = async (mode: ImportMode) => {
    if (!pending) return
    setBusy(true)
    try {
      const result = await importBackup(pending.parsed, mode)
      setStatus({ kind: 'success', message: describeResult(result, mode) })
    } catch {
      setStatus({ kind: 'error', message: 'Import failed. Your existing words were not changed.' })
    } finally {
      setBusy(false)
      setPending(null)
      setConfirmReplace(false)
    }
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="mb-3 px-1 text-sm font-semibold tracking-wide text-muted uppercase">
          Your progress
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Words" value={stats?.total} testId="stat-total" />
          <Stat label="Learning days" value={stats?.days} testId="stat-days" />
        </div>
      </section>

      <section aria-labelledby="backup-heading" className="rounded-3xl border border-line bg-paper p-5 shadow-card">
        <h2 id="backup-heading" className="font-semibold">
          Backup &amp; restore
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Your words are stored only on this device, in this browser. They do not sync between your iPhone, iPad and
          Mac. Export a backup regularly, and use it to move words to another device.
        </p>
        <p className="mt-2 text-sm text-muted">
          Last backup: <span className="font-medium text-ink">{lastExport ? formatLongDate(lastExport) : 'never'}</span>
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button onClick={handleExport} className="flex-1">
            <Download className="h-4 w-4" aria-hidden />
            Export backup (JSON)
          </Button>
          <Button variant="secondary" onClick={() => fileInput.current?.click()} className="flex-1">
            <Upload className="h-4 w-4" aria-hidden />
            Import backup
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            tabIndex={-1}
            aria-label="Backup file"
            data-testid="import-input"
            onChange={handleFile}
          />
        </div>

        {status && (
          <p
            role={status.kind === 'error' ? 'alert' : 'status'}
            className={
              status.kind === 'error'
                ? 'mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-danger'
                : 'mt-4 rounded-xl bg-sage-50 px-3 py-2 text-sm text-sage-800'
            }
          >
            {status.message}
          </p>
        )}
      </section>

      <section className="flex gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <p>
          Clearing Safari&apos;s website data, using Private Browsing, or removing the app from your Home Screen can
          delete your saved words. Keep a recent backup.
        </p>
      </section>

      <section className="px-1 text-sm text-muted">
        <p>
          Mijn Woordenboek · version <span data-testid="app-version">{APP_VERSION}</span>
        </p>
        <p className="mt-1">Works offline. No account, no tracking — everything stays on your device.</p>
      </section>

      <Modal open={pending !== null && !confirmReplace} title="Import backup" onClose={() => setPending(null)}>
        {pending && (
          <>
            <p className="text-[15px] leading-relaxed text-muted">
              <span className="font-medium text-ink">{pending.fileName}</span> contains{' '}
              {pending.parsed.records.length} word{pending.parsed.records.length === 1 ? '' : 's'}
              {pending.parsed.invalid > 0 && ` (${pending.parsed.invalid} invalid record${pending.parsed.invalid === 1 ? '' : 's'} will be skipped)`}
              . How would you like to import it?
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Button onClick={() => runImport('merge')} disabled={busy}>
                Add to my words
              </Button>
              <p className="-mt-1 mb-2 text-center text-xs text-muted">Words you already have are kept and not duplicated.</p>
              <Button variant="secondary" onClick={() => setConfirmReplace(true)} disabled={busy}>
                Replace all my words
              </Button>
              <Button variant="ghost" onClick={() => setPending(null)}>
                Cancel
              </Button>
            </div>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmReplace}
        title="Replace all words?"
        message={`This deletes all ${stats?.total ?? 0} words currently on this device and replaces them with the ${
          pending?.parsed.records.length ?? 0
        } words from the backup. This cannot be undone.`}
        confirmLabel="Replace everything"
        danger
        onCancel={() => setConfirmReplace(false)}
        onConfirm={() => runImport('replace')}
      />
    </div>
  )
}

function describeResult(result: ImportResult, mode: ImportMode): string {
  const parts = [`Imported ${result.imported} word${result.imported === 1 ? '' : 's'}`]
  if (result.skipped > 0) parts.push(`skipped ${result.skipped} already saved`)
  if (result.invalid > 0) parts.push(`skipped ${result.invalid} invalid`)
  return `${parts.join(', ')}.${mode === 'replace' ? ' Previous words were replaced.' : ''}`
}

function Stat({ label, value, testId }: { label: string; value: number | undefined; testId: string }) {
  return (
    <div className="rounded-3xl border border-line bg-paper p-5 shadow-card">
      <p className="font-display text-3xl font-bold text-sage-700" data-testid={testId}>
        {value ?? '–'}
      </p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  )
}
