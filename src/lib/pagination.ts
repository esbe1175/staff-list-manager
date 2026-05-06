import { A4_LAYOUT, availableBodyHeightMm, contentWidthMm, getAvailableBodyHeightMm, staffPerRow } from './layoutConstants'
import { sortStaffForPrint } from './staffSorting'
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

function chunkStaff(staff: StaffMember[], perRow = staffPerRow): StaffMember[][] {
  const rows: StaffMember[][] = []

  for (let index = 0; index < staff.length; index += perRow) {
    rows.push(staff.slice(index, index + perRow))
  }

  return rows
}

export type CompactLayoutMetrics = {
  cardGapMm: number
  cardHeightMm: number
  cardWidthMm: number
  imageHeightMm: number
  imageWidthMm: number
  perRow: number
  rowGapMm: number
  sectionGapMm: number
  sectionHeaderHeightMm: number
}

function compactCardGap(perRow: number): number {
  return Math.min(A4_LAYOUT.compactCardGapMm, contentWidthMm / Math.max(1, perRow * 8))
}

export function getCompactLayoutMetrics(document: StaffDocument): CompactLayoutMetrics {
  const sectionsWithStaff = document.sections.filter((section) => section.staff.length > 0)
  const sectionCount = Math.max(1, document.sections.length)
  const staffCount = Math.max(
    1,
    document.sections.reduce((total, section) => total + section.staff.length, 0),
  )
  const availableHeight = getAvailableBodyHeightMm(true)
  const headerHeight =
    sectionCount * A4_LAYOUT.compactSectionHeaderHeightMm +
    Math.max(0, sectionCount - 1) * A4_LAYOUT.compactSectionGapMm

  for (let perRow = 6; perRow <= Math.max(6, staffCount); perRow += 1) {
    const cardGapMm = compactCardGap(perRow)
    const rowCount = Math.max(
      1,
      sectionsWithStaff.reduce(
        (total, section) => total + Math.ceil(section.staff.length / perRow),
        document.sections.length - sectionsWithStaff.length,
      ),
    )
    const rowGapTotal = Math.max(0, rowCount - 1) * A4_LAYOUT.compactRowGapMm
    const usableCardHeight = Math.max(4, availableHeight - headerHeight - rowGapTotal)
    const cardHeightMm = usableCardHeight / rowCount
    const cardWidthMm =
      (contentWidthMm - Math.max(0, perRow - 1) * cardGapMm) / perRow
    const imageWidthMm = Math.min(cardWidthMm * 0.86, (cardHeightMm - 4.2) * 0.75)
    const imageHeightMm = imageWidthMm / 0.75

    if (cardHeightMm >= imageHeightMm + 4.2) {
      return {
        cardGapMm,
        cardHeightMm,
        cardWidthMm,
        imageHeightMm,
        imageWidthMm,
        perRow,
        rowGapMm: A4_LAYOUT.compactRowGapMm,
        sectionGapMm: A4_LAYOUT.compactSectionGapMm,
        sectionHeaderHeightMm: A4_LAYOUT.compactSectionHeaderHeightMm,
      }
    }
  }

  const perRow = staffCount
  const cardGapMm = compactCardGap(perRow)
  const cardWidthMm =
    (contentWidthMm - Math.max(0, perRow - 1) * cardGapMm) / perRow
  const cardHeightMm = Math.max(4, availableHeight - headerHeight)
  const imageWidthMm = Math.max(2, Math.min(cardWidthMm * 0.86, (cardHeightMm - 3.4) * 0.75))

  return {
    cardGapMm,
    cardHeightMm,
    cardWidthMm,
    imageHeightMm: imageWidthMm / 0.75,
    imageWidthMm,
    perRow,
    rowGapMm: A4_LAYOUT.compactRowGapMm,
    sectionGapMm: A4_LAYOUT.compactSectionGapMm,
    sectionHeaderHeightMm: A4_LAYOUT.compactSectionHeaderHeightMm,
  }
}

function sectionStartHeight(rowCount: number): number {
  return (
    A4_LAYOUT.sectionHeaderHeightMm +
    rowCount * A4_LAYOUT.staffCardHeightMm +
    Math.max(0, rowCount - 1) * A4_LAYOUT.rowGapMm
  )
}

export function paginateDocument(document: StaffDocument): PrintPage[] {
  if (document.compactLayout) {
    const metrics = getCompactLayoutMetrics(document)

    return [
      {
        pageNumber: 1,
        sections: document.sections.map((section) => ({
          id: section.id,
          name: section.name,
          continued: false,
          rows: chunkStaff(sortStaffForPrint(section.staff, document.locale), metrics.perRow),
        })),
      },
    ]
  }

  const pages: PrintPage[] = []
  let currentPage: PrintPage = { pageNumber: 1, sections: [] }
  let remainingHeight = availableBodyHeightMm

  const pushPage = () => {
    pages.push(currentPage)
    currentPage = { pageNumber: pages.length + 1, sections: [] }
    remainingHeight = availableBodyHeightMm
  }

  for (const section of document.sections) {
    const rows = chunkStaff(sortStaffForPrint(section.staff, document.locale))

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
