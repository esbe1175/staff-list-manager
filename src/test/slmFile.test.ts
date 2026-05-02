import { describe, expect, it } from 'vitest'
import { createSlmBlob, readSlmFile } from '../lib/slmFile'
import type { StaffDocument } from '../types/document'

const document: StaffDocument = {
  schemaVersion: 1,
  id: 'doc-1',
  title: 'Børne- og Familieafdelingen',
  subtitle: 'Personaleoversigt – Maj 2026',
  useAutoDateSubtitle: false,
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
})
