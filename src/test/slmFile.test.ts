import { describe, expect, it } from 'vitest'
import { createSlmBlob, createSlmFilename, readSlmFile } from '../lib/slmFile'
import type { StaffDocument } from '../types/document'

const document: StaffDocument = {
  schemaVersion: 1,
  id: 'doc-1',
  title: 'Børne- og Familieafdelingen',
  subtitle: 'Personaleoversigt – Maj 2026',
  useAutoDateSubtitle: false,
  compactLayout: false,
  primaryColor: '#0969da',
  locale: 'da',
  sections: [
    {
      id: 'section-1',
      name: 'Administrationen',
      staff: [
        {
          id: 'staff-1',
          name: 'Jens Jørgen-Henriksen',
          jobTitle: 'Souschef',
          email: 'jens@example.test',
          phone: '12 34 56 78',
          imageDataUrl: 'data:image/png;base64,abc',
          isPraktikant: true,
          sourceFilename: 'Jens Jørgen-Henriksen.png',
        },
      ],
    },
  ],
}

describe('slm file roundtrip', () => {
  it('preserves document data and embedded images', async () => {
    const blob = await createSlmBlob(document)
    const file = new File([blob], 'test.slm')

    await expect(readSlmFile(file)).resolves.toEqual(document)
  })

  it('creates archive-friendly save filenames', () => {
    expect(createSlmFilename(document, new Date('2026-05-06T10:00:00Z'))).toBe(
      '2026-05_Børne-_og_Familieafdelingen.slm',
    )
  })
})
