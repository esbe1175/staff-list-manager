import { A4_LAYOUT, availableBodyHeightMm, staffPerRow } from './layoutConstants'
import type { StaffDocument, StaffMember } from '../types/document'

export type PageSection = {
  id: string
  name: string
  continued: boolean
  rows: StaffMember[][]
}

export type PrintPage = {
  pageNumber: number
  sections: PageSection[]
}

function chunkStaff(staff: StaffMember[]): StaffMember[][] {
  const rows: StaffMember[][] = []

  for (let index = 0; index < staff.length; index += staffPerRow) {
    rows.push(staff.slice(index, index + staffPerRow))
  }

  return rows
}

function sectionStartHeight(rowCount: number): number {
  return (
    A4_LAYOUT.sectionHeaderHeightMm +
    rowCount * A4_LAYOUT.staffCardHeightMm +
    Math.max(0, rowCount - 1) * A4_LAYOUT.rowGapMm
  )
}

export function paginateDocument(document: StaffDocument): PrintPage[] {
  const pages: PrintPage[] = []
  let currentPage: PrintPage = { pageNumber: 1, sections: [] }
  let remainingHeight = availableBodyHeightMm

  const pushPage = () => {
    pages.push(currentPage)
    currentPage = { pageNumber: pages.length + 1, sections: [] }
    remainingHeight = availableBodyHeightMm
  }

  for (const section of document.sections) {
    const rows = chunkStaff(section.staff)

    if (rows.length === 0) {
      const requiredHeight =
        A4_LAYOUT.sectionHeaderHeightMm +
        (currentPage.sections.length > 0 ? A4_LAYOUT.sectionGapMm : 0)

      if (requiredHeight > remainingHeight && currentPage.sections.length > 0) {
        pushPage()
      }

      currentPage.sections.push({
        id: section.id,
        name: section.name,
        continued: false,
        rows: [],
      })
      remainingHeight -= A4_LAYOUT.sectionHeaderHeightMm
      continue
    }

    let rowIndex = 0
    let continued = false

    while (rowIndex < rows.length) {
      const sectionGap = currentPage.sections.length > 0 ? A4_LAYOUT.sectionGapMm : 0
      const headerAndGap = A4_LAYOUT.sectionHeaderHeightMm + sectionGap
      if (headerAndGap + A4_LAYOUT.staffCardHeightMm > remainingHeight) {
        if (currentPage.sections.length > 0) {
          pushPage()
          continued = true
          continue
        }
      }

      const pageRows: StaffMember[][] = []
      let usedHeight = headerAndGap

      while (rowIndex < rows.length) {
        const nextRowGap = pageRows.length > 0 ? A4_LAYOUT.rowGapMm : 0
        const nextHeight = nextRowGap + A4_LAYOUT.staffCardHeightMm

        if (usedHeight + nextHeight > remainingHeight && pageRows.length > 0) {
          break
        }

        if (usedHeight + nextHeight > remainingHeight && pageRows.length === 0) {
          break
        }

        pageRows.push(rows[rowIndex])
        usedHeight += nextHeight
        rowIndex += 1
      }

      if (pageRows.length === 0) {
        pushPage()
        continued = true
        continue
      }

      currentPage.sections.push({
        id: `${section.id}-${rowIndex}`,
        name: section.name,
        continued,
        rows: pageRows,
      })
      remainingHeight -= sectionStartHeight(pageRows.length) + sectionGap
      continued = true
    }
  }

  if (currentPage.sections.length > 0 || pages.length === 0) {
    pages.push(currentPage)
  }

  return pages
}
