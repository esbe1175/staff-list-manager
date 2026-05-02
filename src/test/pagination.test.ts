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

  it('renders empty sections without adding staff', () => {
    const pages = paginateDocument(documentWithCounts([0, 2]))

    expect(pages.flatMap((page) => page.sections).some((section) => section.rows.length === 0)).toBe(true)
  })
})
