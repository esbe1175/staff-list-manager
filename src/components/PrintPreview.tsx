import { A4Page } from './A4Page'
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons'
import { useEffect, useRef, useState } from 'react'
import { t } from '../i18n/translations'
import { A4_LAYOUT } from '../lib/layoutConstants'
import type { PrintPage } from '../lib/pagination'
import type { StaffDocument } from '../types/document'

type PrintPreviewProps = {
  document: StaffDocument
  pages: PrintPage[]
  isPrintRenderEnabled: boolean
  selectedPageNumber: number
  onPageSelect: (pageNumber: number) => void
}

const millimeterToPixel = 96 / 25.4

export function PrintPreview({
  document,
  pages,
  isPrintRenderEnabled,
  selectedPageNumber,
  onPageSelect,
}: PrintPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const selectedPage = pages[selectedPageNumber - 1] ?? pages[0]
  const canGoBack = selectedPageNumber > 1
  const canGoForward = selectedPageNumber < pages.length

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    const updateScale = () => {
      const verticalPadding = 56
      const availableHeight = Math.max(320, container.clientHeight - verticalPadding)
      const pageHeightPixels = A4_LAYOUT.pageHeightMm * millimeterToPixel
      setScale(Math.min(1, availableHeight / pageHeightPixels))
    }

    updateScale()

    const observer = new ResizeObserver(updateScale)
    observer.observe(container)

    return () => observer.disconnect()
  }, [])

  return (
    <div className="single-preview" ref={containerRef}>
      {canGoBack ? (
        <button
          aria-label={t(document.locale, 'previousPage')}
          className="page-chevron page-chevron-left"
          type="button"
          onClick={() => onPageSelect(selectedPageNumber - 1)}
        >
          <ChevronLeftIcon />
        </button>
      ) : null}
      <div
        className="single-page-frame"
        style={{
          width: `${A4_LAYOUT.pageWidthMm * scale}mm`,
          height: `${A4_LAYOUT.pageHeightMm * scale}mm`,
        }}
      >
        <A4Page document={document} page={selectedPage} pageCount={pages.length} scale={scale} />
      </div>
      {canGoForward ? (
        <button
          aria-label={t(document.locale, 'nextPage')}
          className="page-chevron page-chevron-right"
          type="button"
          onClick={() => onPageSelect(selectedPageNumber + 1)}
        >
          <ChevronRightIcon />
        </button>
      ) : null}
      {isPrintRenderEnabled ? (
        <div className="print-page-stack">
          {pages.map((page) => (
            <A4Page document={document} page={page} pageCount={pages.length} key={page.pageNumber} />
          ))}
        </div>
      ) : null}
    </div>
  )
}
