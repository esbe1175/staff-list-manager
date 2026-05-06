import { DownloadIcon, FileIcon, GlobeIcon, ReaderIcon, ResetIcon } from '@radix-ui/react-icons'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Button, Flex, Heading } from '@radix-ui/themes'
import dkFlag from 'flag-icons/flags/4x3/dk.svg'
import gbFlag from 'flag-icons/flags/4x3/gb.svg'
import { t } from '../i18n/translations'
import { createSlmBlob, createSlmFilename, readSlmFile, saveBlob } from '../lib/slmFile'
import type { Locale, StaffDocument } from '../types/document'

type ToolbarProps = {
  document: StaffDocument
  locale: Locale
  onOpen: (document: StaffDocument) => void
  onNew: () => void
  onLocaleChange: (locale: Locale) => void
  onPrint: () => void
}

export function Toolbar({ document, locale, onOpen, onNew, onLocaleChange, onPrint }: ToolbarProps) {
  const label = (key: Parameters<typeof t>[1]) => t(locale, key)
  const activeLanguage = locale === 'da'
    ? { code: 'DA', name: 'Dansk', flag: dkFlag }
    : { code: 'EN', name: 'English', flag: gbFlag }

  async function saveFile() {
    const blob = await createSlmBlob(document)
    await saveBlob(blob, createSlmFilename(document))
  }

  async function openFile(file: File | undefined) {
    if (!file) {
      return
    }

    onOpen(await readSlmFile(file))
  }

  return (
    <header className="toolbar">
      <Flex align="center" gap="3">
        <Heading size="4">{label('appName')}</Heading>
      </Flex>
      <Flex align="center" gap="3">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger className="language-trigger" title={label('language')}>
            <GlobeIcon aria-hidden="true" />
            <img alt="" aria-hidden="true" className="language-flag" src={activeLanguage.flag} />
            <span>{activeLanguage.code}</span>
            <span aria-hidden="true" className="language-caret">
              ▾
            </span>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="end" className="language-menu" sideOffset={6}>
              <DropdownMenu.Item
                className="language-menu-item"
                onSelect={() => onLocaleChange('da')}
              >
                <img alt="" aria-hidden="true" className="language-flag" src={dkFlag} />
                <span>DA</span>
                <small>Dansk</small>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="language-menu-item"
                onSelect={() => onLocaleChange('en')}
              >
                <img alt="" aria-hidden="true" className="language-flag" src={gbFlag} />
                <span>EN</span>
                <small>English</small>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
        <Button className="high-contrast-button" variant="solid" onClick={onNew}>
          <ResetIcon />
          {label('new')}
        </Button>
        <Button asChild className="high-contrast-button" variant="solid">
          <label>
            <FileIcon />
            {label('open')}
            <input
              accept=".slm"
              className="visually-hidden"
              type="file"
              onChange={(event) => void openFile(event.target.files?.[0])}
            />
          </label>
        </Button>
        <Button className="success-action-button" variant="solid" onClick={() => void saveFile()}>
          <DownloadIcon />
          {label('save')}
        </Button>
        <Button className="success-action-button" variant="solid" onClick={onPrint}>
          <ReaderIcon />
          {label('print')}
        </Button>
      </Flex>
    </header>
  )
}
