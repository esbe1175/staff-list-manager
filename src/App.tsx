import '@radix-ui/themes/styles.css'
import { CheckIcon } from '@radix-ui/react-icons'
import { Theme } from '@radix-ui/themes'
import { useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { EditorPanel } from './components/EditorPanel'
import { PagesPanel } from './components/PagesPanel'
import { PrintPreview } from './components/PrintPreview'
import { Toolbar } from './components/Toolbar'
import { t } from './i18n/translations'
import { paginateDocument } from './lib/pagination'
import { useDocumentStore } from './state/documentStore'
import type { Locale } from './types/document'
import './styles/index.css'
import './styles/print.css'

function App() {
  const { locale } = useDocumentStore()
  const isMobileLayout = useIsMobileLayout()

  return (
    <Theme accentColor="gray" grayColor="slate" radius="medium" scaling="95%">
      {isMobileLayout ? <MobileUnsupported locale={locale} /> : <DesktopApp />}
    </Theme>
  )
}

function DesktopApp() {
  const { document, locale, resetDocument, setDocument, setLocale } = useDocumentStore()
  const pages = useMemo(() => paginateDocument(document), [document])
  const pageCount = pages.length
  const [selectedPageNumber, setSelectedPageNumber] = useState(1)
  const [isPrintRenderEnabled, setIsPrintRenderEnabled] = useState(false)
  const visiblePageNumber = Math.min(selectedPageNumber, pageCount)

  function printDocument() {
    flushSync(() => setIsPrintRenderEnabled(true))
    window.setTimeout(() => window.print(), 50)
  }

  function createNewDocument() {
    if (window.confirm(t(locale, 'confirmNewDocument'))) {
      resetDocument()
    }
  }

  useEffect(() => {
    const enablePrintRender = () => setIsPrintRenderEnabled(true)
    const disablePrintRender = () => setIsPrintRenderEnabled(false)

    window.addEventListener('beforeprint', enablePrintRender)
    window.addEventListener('afterprint', disablePrintRender)

    return () => {
      window.removeEventListener('beforeprint', enablePrintRender)
      window.removeEventListener('afterprint', disablePrintRender)
    }
  }, [])

  return (
    <div className="app-shell">
      <Toolbar
        document={document}
        locale={locale}
        onLocaleChange={setLocale}
        onNew={createNewDocument}
        onOpen={setDocument}
        onPrint={printDocument}
      />
      <div className="workspace">
        <EditorPanel />
        <main className="canvas-area" aria-label="A4 preview">
          <PrintPreview
            document={document}
            isPrintRenderEnabled={isPrintRenderEnabled}
            pages={pages}
            selectedPageNumber={visiblePageNumber}
            onPageSelect={setSelectedPageNumber}
          />
        </main>
        <PagesPanel
          document={document}
          pages={pages}
          selectedPageNumber={visiblePageNumber}
          onPageSelect={setSelectedPageNumber}
        />
      </div>
      <footer className="status-bar">
        <span className="status-pill">
          <CheckIcon />
          {t(locale, 'ready')}
        </span>
        <span>A4 (210 x 297 mm)</span>
        <span>{t(locale, 'printHint')}</span>
        <span>{pageCount} sider</span>
        <span className="version-label">v1.0</span>
      </footer>
    </div>
  )
}

function MobileUnsupported({ locale }: { locale: Locale }) {
  return (
    <main className="mobile-unsupported">
      <section className="mobile-unsupported-card">
        <strong>{t(locale, 'mobileUnsupportedTitle')}</strong>
        <p>{t(locale, 'mobileUnsupportedBody')}</p>
      </section>
    </main>
  )
}

function useIsMobileLayout() {
  const [isMobileLayout, setIsMobileLayout] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.matchMedia('(max-width: 900px), (pointer: coarse)').matches
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 900px), (pointer: coarse)')
    const updateLayout = () => setIsMobileLayout(mediaQuery.matches)

    updateLayout()
    mediaQuery.addEventListener('change', updateLayout)

    return () => mediaQuery.removeEventListener('change', updateLayout)
  }, [])

  return isMobileLayout
}

export default App
