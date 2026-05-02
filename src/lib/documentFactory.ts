import type { Locale, StaffDocument } from '../types/document'

export function createEmptyDocument(locale: Locale = 'da'): StaffDocument {
  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    title: '',
    subtitle: '',
    useAutoDateSubtitle: true,
    primaryColor: '#0969da',
    locale,
    sections: [],
  }
}
