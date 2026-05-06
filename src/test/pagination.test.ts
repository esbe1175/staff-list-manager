import { describe, expect, it } from 'vitest'
import { paginateDocument } from '../lib/pagination'
import type { StaffDocument, StaffMember } from '../types/document'

function staff(index: number): StaffMember {
  return {
    id: `staff-${index}`,
    name: `Person ${index}`,
    jobTitle: 'Medarbejder',
    imageDataUrl: '',
    isPraktikant: index % 7 === 0,
  }
}

function documentWithCounts(counts: number[]): StaffDocument {
  return {
    schemaVersion: 1,
    id: 'doc',
    title: 'Test',
    subtitle: 'Test subtitle',
    useAutoDateSubtitle: false,
    compactLayout: false,
    primaryColor: '#0969da',
    locale: 'da',
    sections: counts.map((count, sectionIndex) => ({
      id: `section-${sectionIndex}`,
      name: `Section ${sectionIndex}`,
      staff: Array.from({ length: count }, (_, index) => staff(sectionIndex * 100 + index)),
    })),
  }
}

describe('paginateDocument', () => {
  it('keeps a small document on one page', () => {
    expect(paginateDocument(documentWithCounts([4, 5]))).toHaveLength(1)
  })

  it('creates multiple explicit pages for long documents', () => {
    expect(paginateDocument(documentWithCounts([40])).length).toBeGreaterThan(1)
  })

  it('preserves all staff across page boundaries', () => {
    const pages = paginateDocument(documentWithCounts([9, 32, 3]))
    const printedStaff = pages.flatMap((page) =>
      page.sections.flatMap((section) => section.rows.flatMap((row) => row)),
    )

    expect(printedStaff).toHaveLength(44)
  })

  it('sorts staff by name and places interns last', () => {
    const document = documentWithCounts([0])
    document.sections[0].staff = [
      { ...staff(1), name: 'Charlie', isPraktikant: false },
      { ...staff(2), name: 'Anne', isPraktikant: true },
      { ...staff(3), name: 'Bent', isPraktikant: false },
    ]
    const printedStaff = paginateDocument(document).flatMap((page) =>
      page.sections.flatMap((section) => section.rows.flatMap((row) => row)),
    )

    expect(printedStaff.map((person) => person.name)).toEqual(['Bent', 'Charlie', 'Anne'])
  })

  it('keeps compact layout on a single page', () => {
    const document = documentWithCounts([48, 48])
    document.compactLayout = true

    expect(paginateDocument(document)).toHaveLength(1)
  })

  it('renders empty sections without adding staff', () => {
    const pages = paginateDocument(documentWithCounts([0, 2]))

    expect(pages.flatMap((page) => page.sections).some((section) => section.rows.length === 0)).toBe(true)
  })
})
