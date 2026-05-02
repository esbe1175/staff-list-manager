import '@radix-ui/themes/styles.css'
import { Theme } from '@radix-ui/themes'
import { useEffect, useMemo, useState } from 'react'
import { EditorPanel } from './components/EditorPanel'
import { PagesPanel } from './components/PagesPanel'
import { PrintPreview } from './components/PrintPreview'
import { Toolbar } from './components/Toolbar'
import { t } from './i18n/translations'
import { paginateDocument } from './lib/pagination'
import { useDocumentStore } from './state/documentStore'
import './styles/index.css'
import './styles/print.css'

function App() {
  const { document, locale, resetDocument, setDocument, setLocale } = useDocumentStore()
  const pages = useMemo(() => paginateDocument(document), [document])
  const pageCount = pages.length
  const [selectedPageNumber, setSelectedPageNumber] = useState(1)
  const [isPrintRenderEnabled, setIsPrintRenderEnabled] = useState(false)
  const visiblePageNumber = Math.min(selectedPageNumber, pageCount)

  function printDocument() {
    setIsPrintRenderEnabled(true)
    window.requestAnimationFrame(() => window.print())
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
    <Theme accentColor="gray" grayColor="slate" radius="medium" scaling="95%">
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
          <span className="status-pill">✓ {t(locale, 'ready')}</span>
          <span>A4 (210 × 297 mm)</span>
          <span>{t(locale, 'printHint')}</span>
          <span>{pageCount} sider</span>
          <span className="version-label">v1.0</span>
        </footer>
      </div>
    </Theme>
  )
}

export default App
