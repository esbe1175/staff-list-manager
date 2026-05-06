import JSZip from 'jszip'
import type { SlmArchive, StaffDocument } from '../types/document'

type SaveFilePickerOptions = {
  suggestedName: string
  types: Array<{
    description: string
    accept: Record<string, string[]>
  }>
}

type WritableFile = {
  close: () => Promise<void>
  write: (blob: Blob) => Promise<void>
}

type SaveFileHandle = {
  createWritable: () => Promise<WritableFile>
}

declare global {
  interface Window {
    showSaveFilePicker?: (options: SaveFilePickerOptions) => Promise<SaveFileHandle>
  }
}

export async function createSlmBlob(document: StaffDocument): Promise<Blob> {
  const zip = new JSZip()
  const archive: SlmArchive = {
    app: 'staff-list-manager',
    schemaVersion: 1,
    savedAt: new Date().toISOString(),
    document,
  }

  zip.file('document.json', JSON.stringify(archive, null, 2))

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
}

export function createSlmFilename(document: StaffDocument, date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const invalidFilenameCharacters = new Set(['<', '>', ':', '"', '/', '\\', '|', '?', '*'])
  const title = (document.title.trim() || 'staff-list')
    .split('')
    .filter((character) => character.charCodeAt(0) >= 32 && !invalidFilenameCharacters.has(character))
    .join('')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')

  return `${year}-${month}_${title || 'staff-list'}.slm`
}

export async function readSlmFile(file: File): Promise<StaffDocument> {
  const zip = await JSZip.loadAsync(file)
  const documentFile = zip.file('document.json')

  if (!documentFile) {
    throw new Error('Filen mangler document.json')
  }

  const archive = JSON.parse(await documentFile.async('string')) as SlmArchive

  if (archive.app !== 'staff-list-manager' || archive.schemaVersion !== 1) {
    throw new Error('Filen er ikke en understøttet .slm-fil')
  }

  return archive.document
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export async function saveBlob(blob: Blob, filename: string): Promise<void> {
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: 'Staff List Manager file',
            accept: {
              'application/octet-stream': ['.slm'],
            },
          },
        ],
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }

      throw error
    }
  }

  downloadBlob(blob, filename)
}
