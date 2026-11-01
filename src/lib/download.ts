/**
 * Saves a text file. On touch devices that support sharing files (iOS/iPadOS Safari)
 * we open the share sheet, which offers "Save to Files", AirDrop, etc. Elsewhere we
 * trigger a regular download. Returns false if the user cancelled the share sheet.
 */
export async function saveTextFile(fileName: string, text: string, type = 'application/json'): Promise<boolean> {
  const file = new File([text], fileName, { type })
  const isTouch = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0
  if (isTouch && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: fileName })
      return true
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return false
      // Fall through to a regular download.
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return true
}
