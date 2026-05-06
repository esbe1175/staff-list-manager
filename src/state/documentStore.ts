import { create } from 'zustand'
import { detectSystemLocale } from '../i18n/locale'
import { createEmptyDocument } from '../lib/documentFactory'
import type { Locale, StaffDocument, StaffMember } from '../types/document'

type DocumentState = {
  document: StaffDocument
  locale: Locale
  selectedSectionId: string | null
  selectedStaffId: string | null
  setDocument: (document: StaffDocument) => void
  resetDocument: () => void
  setLocale: (locale: Locale) => void
  updateDocument: (patch: Partial<Pick<StaffDocument, 'title' | 'subtitle' | 'useAutoDateSubtitle' | 'compactLayout' | 'primaryColor'>>) => void
  addSection: () => void
  updateSectionName: (sectionId: string, name: string) => void
  removeSection: (sectionId: string) => void
  moveSection: (sectionId: string, direction: -1 | 1) => void
  selectSection: (sectionId: string) => void
  selectStaff: (sectionId: string, staffId: string) => void
  addStaffToSection: (sectionId: string, staff: StaffMember[]) => void
  updateStaff: (staffId: string, patch: Partial<Omit<StaffMember, 'id'>>) => void
  removeStaff: (staffId: string) => void
}

const localeStorageKey = 'staff-list-manager:locale'

function getInitialLocale(): Locale {
  const savedLocale = window.localStorage.getItem(localeStorageKey)

  return savedLocale === 'da' || savedLocale === 'en' ? savedLocale : detectSystemLocale()
}

function withAutoSubtitle(document: StaffDocument): StaffDocument {
  const normalizedDocument = {
    ...document,
    compactLayout: document.compactLayout ?? false,
    primaryColor: document.primaryColor ?? '#0969da',
  }

  return normalizedDocument.useAutoDateSubtitle
    ? { ...normalizedDocument, subtitle: '' }
    : normalizedDocument
}

export const useDocumentStore = create<DocumentState>((set, get) => {
  const initialLocale = getInitialLocale()
  const initialDocument = createEmptyDocument(initialLocale)

  return {
    document: initialDocument,
    locale: initialLocale,
    selectedSectionId: initialDocument.sections[0]?.id ?? null,
    selectedStaffId: initialDocument.sections[0]?.staff[0]?.id ?? null,
    setDocument: (document) =>
      set({
        document: withAutoSubtitle(document),
        selectedSectionId: document.sections[0]?.id ?? null,
        selectedStaffId: document.sections[0]?.staff[0]?.id ?? null,
      }),
    resetDocument: () => {
      const locale = get().locale
      const document = createEmptyDocument(locale)
      set({
        document,
        selectedSectionId: document.sections[0]?.id ?? null,
        selectedStaffId: document.sections[0]?.staff[0]?.id ?? null,
      })
    },
    setLocale: (locale) => {
      window.localStorage.setItem(localeStorageKey, locale)
      set(({ document }) => ({
        locale,
        document: withAutoSubtitle({ ...document, locale }),
      }))
    },
    updateDocument: (patch) =>
      set(({ document }) => ({
        document: withAutoSubtitle({ ...document, ...patch }),
      })),
    addSection: () =>
      set(({ document }) => {
        const section = { id: crypto.randomUUID(), name: 'Ny sektion', staff: [] }

        return {
          document: { ...document, sections: [...document.sections, section] },
          selectedSectionId: section.id,
          selectedStaffId: null,
        }
      }),
    updateSectionName: (sectionId, name) =>
      set(({ document }) => ({
        document: {
          ...document,
          sections: document.sections.map((section) =>
            section.id === sectionId ? { ...section, name } : section,
          ),
        },
      })),
    removeSection: (sectionId) =>
      set(({ document }) => {
        const sections = document.sections.filter((section) => section.id !== sectionId)
        const selectedSectionId = sections[0]?.id ?? null

        return {
          document: { ...document, sections },
          selectedSectionId,
          selectedStaffId: sections[0]?.staff[0]?.id ?? null,
        }
      }),
    moveSection: (sectionId, direction) =>
      set(({ document }) => {
        const sections = [...document.sections]
        const currentIndex = sections.findIndex((section) => section.id === sectionId)
        const nextIndex = currentIndex + direction

        if (currentIndex < 0 || nextIndex < 0 || nextIndex >= sections.length) {
          return { document }
        }

        const [section] = sections.splice(currentIndex, 1)
        sections.splice(nextIndex, 0, section)

        return { document: { ...document, sections } }
      }),
    selectSection: (sectionId) =>
      set(({ document }) => {
        const section = document.sections.find((candidate) => candidate.id === sectionId)

        return {
          selectedSectionId: sectionId,
          selectedStaffId: section?.staff[0]?.id ?? null,
        }
      }),
    selectStaff: (sectionId, staffId) =>
      set({
        selectedSectionId: sectionId,
        selectedStaffId: staffId,
      }),
    addStaffToSection: (sectionId, staff) =>
      set(({ document }) => ({
        document: {
          ...document,
          sections: document.sections.map((section) =>
            section.id === sectionId
              ? { ...section, staff: [...section.staff, ...staff] }
              : section,
          ),
        },
        selectedSectionId: sectionId,
        selectedStaffId: staff[0]?.id ?? get().selectedStaffId,
      })),
    updateStaff: (staffId, patch) =>
      set(({ document }) => ({
        document: {
          ...document,
          sections: document.sections.map((section) => ({
            ...section,
            staff: section.staff.map((staff) =>
              staff.id === staffId ? { ...staff, ...patch } : staff,
            ),
          })),
        },
      })),
    removeStaff: (staffId) =>
      set(({ document, selectedSectionId }) => {
        const sections = document.sections.map((section) => ({
          ...section,
          staff: section.staff.filter((staff) => staff.id !== staffId),
        }))
        const selectedSection = sections.find((section) => section.id === selectedSectionId)

        return {
          document: { ...document, sections },
          selectedStaffId: selectedSection?.staff[0]?.id ?? null,
        }
      }),
  }
})
