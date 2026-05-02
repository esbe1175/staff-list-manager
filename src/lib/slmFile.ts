import JSZip from 'jszip'
import type { SlmArchive, StaffDocument } from '../types/document'

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
