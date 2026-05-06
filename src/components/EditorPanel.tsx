import { PlusIcon, TrashIcon, UploadIcon } from '@radix-ui/react-icons'
import { Badge, Box, Button, Checkbox, Flex, Heading, Text, TextField } from '@radix-ui/themes'
import { memo, useEffect, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { t } from '../i18n/translations'
import { autoSubtitle } from '../lib/date'
import { nameFromFilename } from '../lib/filenameParsing'
import { optimizeStaffImage } from '../lib/imageProcessing'
import { sortStaffForPrint } from '../lib/staffSorting'
import { useDocumentStore } from '../state/documentStore'
import type { StaffMember } from '../types/document'

type StaffTileProps = {
  isSelected: boolean
  labelPraktikant: string
  onSelect: () => void
  staff: StaffMember
}

const EditorStaffTile = memo(function EditorStaffTile({
  isSelected,
  labelPraktikant,
  onSelect,
  staff,
}: StaffTileProps) {
  const tileRef = useRef<HTMLButtonElement>(null)
  const [visibleImageSource, setVisibleImageSource] = useState<string | null>(null)
  const imageSource = staff.thumbnailDataUrl ?? staff.imageDataUrl

  useEffect(() => {
    const tile = tileRef.current

    if (!tile || !imageSource) {
      return
    }

    const loadImage = () => setVisibleImageSource(imageSource)
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          window.requestAnimationFrame(loadImage)
          observer.disconnect()
        }
      },
      { rootMargin: '160px' },
    )

    observer.observe(tile)

    return () => observer.disconnect()
  }, [imageSource])

  return (
    <button
      className={`staff-tile ${isSelected ? 'selected' : ''}`}
      ref={tileRef}
      type="button"
      onClick={onSelect}
    >
      {visibleImageSource === imageSource && imageSource ? (
        <img
          alt=""
          decoding="async"
          height="80"
          loading="lazy"
          src={imageSource}
          width="60"
        />
      ) : (
        <div className="staff-tile-placeholder">{staff.name.slice(0, 1)}</div>
      )}
      <span>{staff.name}</span>
      {staff.isPraktikant ? <Badge color="blue">{labelPraktikant}</Badge> : null}
    </button>
  )
})

export function EditorPanel() {
  const {
    document,
    selectedSectionId,
    selectedStaffId,
    updateDocument,
    addSection,
    updateSectionName,
    removeSection,
    moveSection,
    selectSection,
    selectStaff,
    addStaffToSection,
    updateStaff,
    removeStaff,
  } = useDocumentStore()
  const label = (key: Parameters<typeof t>[1]) => t(document.locale, key)
  const selectedSection =
    document.sections.find((section) => section.id === selectedSectionId) ??
    document.sections[0] ??
    null
  const selectedStaff =
    selectedSection?.staff.find((staff) => staff.id === selectedStaffId) ?? null

  function confirmRemoveSection(sectionId: string) {
    if (window.confirm(label('confirmDeleteSection'))) {
      removeSection(sectionId)
    }
  }

  function confirmRemoveStaff(staffId: string) {
    if (window.confirm(label('confirmDeleteStaff'))) {
      removeStaff(staffId)
    }
  }

  async function importFiles(files: File[]) {
    if (!selectedSection) {
      return
    }

    const imageFiles = files.filter((file) => file.type.startsWith('image/'))
    const staff = imageFiles.map((file) => ({
      id: crypto.randomUUID(),
      name: nameFromFilename(file.name),
      jobTitle: '',
      email: '',
      phone: '',
      imageDataUrl: '',
      isPraktikant: false,
      sourceFilename: file.name,
    }))

    addStaffToSection(selectedSection.id, staff)

    imageFiles.forEach((file, index) => {
      const staffId = staff[index].id

      window.setTimeout(() => {
        void optimizeStaffImage(file).then((optimizedImage) => {
          updateStaff(staffId, {
            imageDataUrl: optimizedImage.imageDataUrl,
            thumbnailDataUrl: optimizedImage.thumbnailDataUrl,
          })
        })
      }, index * 25)
    })
  }

  const dropzone = useDropzone({
    accept: { 'image/*': [] },
    disabled: !selectedSection,
    onDrop: (acceptedFiles) => void importFiles(acceptedFiles),
  })

  return (
    <aside className="editor-panel">
      <section className="editor-section">
        <Heading size="4">1. {label('document')}</Heading>
        <label className="field">
          <Text as="span" size="2">
            {label('title')}
          </Text>
          <TextField.Root
            value={document.title}
            onChange={(event) => updateDocument({ title: event.target.value })}
          />
        </label>
        <label className="check-row">
          <Checkbox
            checked={document.compactLayout}
            onCheckedChange={(checked) =>
              updateDocument({
                compactLayout: checked === true,
              })
            }
          />
          <Text size="2">{label('compactLayout')}</Text>
        </label>
        <label className="field">
          <Text as="span" size="2">
            {label('subtitle')}
          </Text>
          <TextField.Root
            disabled={document.useAutoDateSubtitle}
            value={document.subtitle}
            onChange={(event) => updateDocument({ subtitle: event.target.value })}
          />
        </label>
        <label className="check-row">
          <Checkbox
            checked={document.useAutoDateSubtitle}
            onCheckedChange={(checked) =>
              updateDocument({
                useAutoDateSubtitle: checked === true,
                subtitle: checked === true ? '' : autoSubtitle(document.locale),
              })
            }
          />
          <Text size="2">{label('autoDate')}</Text>
        </label>
        <label className="field">
          <Text as="span" size="2">
            {label('primaryColor')}
          </Text>
          <input
            aria-label={label('primaryColor')}
            className="document-color-picker"
            type="color"
            value={document.primaryColor}
            onChange={(event) => updateDocument({ primaryColor: event.target.value })}
          />
        </label>
      </section>

      <section className="editor-section">
        <Flex align="center" justify="between">
          <Heading size="4">2. {label('sections')}</Heading>
          <Button className="primary-action-button" size="2" variant="solid" onClick={addSection}>
            <PlusIcon />
            {label('addSection')}
          </Button>
        </Flex>
        <div className="section-list">
          {document.sections.map((section, index) => (
            <div
              className={`section-list-item ${section.id === selectedSection?.id ? 'selected' : ''}`}
              key={section.id}
            >
              <div>
                <input
                  aria-label={label('sectionName')}
                  className="section-name-input"
                  value={section.name}
                  onChange={(event) => updateSectionName(section.id, event.target.value)}
                  onFocus={() => selectSection(section.id)}
                />
                <span>{section.staff.length} personer</span>
              </div>
              <div className="section-controls">
                <button disabled={index === 0} type="button" onClick={() => moveSection(section.id, -1)}>
                  ↑
                </button>
                <button
                  disabled={index === document.sections.length - 1}
                  type="button"
                  onClick={() => moveSection(section.id, 1)}
                >
                  ↓
                </button>
                <button
                  aria-label={label('delete')}
                  className="section-delete-button"
                  disabled={document.sections.length < 2}
                  type="button"
                  onClick={() => confirmRemoveSection(section.id)}
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="editor-section">
        <Heading size="4">3. {label('staff')}</Heading>
        <Box {...dropzone.getRootProps()} className={`dropzone ${!selectedSection ? 'disabled' : ''}`}>
          <input {...dropzone.getInputProps()} />
          <UploadIcon />
          <Text size="2">{selectedSection ? label('dropHint') : label('addSectionFirst')}</Text>
        </Box>
        <div className="staff-grid-editor">
          {selectedSection ? sortStaffForPrint(selectedSection.staff, document.locale).map((staff) => (
            <EditorStaffTile
              isSelected={staff.id === selectedStaffId}
              key={staff.id}
              labelPraktikant={label('praktikant')}
              staff={staff}
              onSelect={() => selectStaff(selectedSection.id, staff.id)}
            />
          )) : null}
        </div>
      </section>

      <section className="editor-section">
        <Heading size="4">4. {label('editSelected')}</Heading>
        {selectedStaff ? (
          <div className="selected-editor">
            <label className="field">
              <Text as="span" size="2">
                {label('name')}
              </Text>
              <TextField.Root
                value={selectedStaff.name}
                onChange={(event) => updateStaff(selectedStaff.id, { name: event.target.value })}
              />
            </label>
            <label className="field">
              <Text as="span" size="2">
                {label('jobTitle')}
              </Text>
              <TextField.Root
                placeholder={selectedStaff.isPraktikant ? label('praktikant') : undefined}
                value={selectedStaff.jobTitle}
                onChange={(event) => updateStaff(selectedStaff.id, { jobTitle: event.target.value })}
              />
            </label>
            <label className="field">
              <Text as="span" size="2">
                {label('email')}
              </Text>
              <TextField.Root
                value={selectedStaff.email ?? ''}
                onChange={(event) => updateStaff(selectedStaff.id, { email: event.target.value })}
              />
            </label>
            <label className="field">
              <Text as="span" size="2">
                {label('phone')}
              </Text>
              <TextField.Root
                value={selectedStaff.phone ?? ''}
                onChange={(event) => updateStaff(selectedStaff.id, { phone: event.target.value })}
              />
            </label>
            <label className="check-row">
              <Checkbox
                checked={selectedStaff.isPraktikant}
                onCheckedChange={(checked) =>
                  updateStaff(selectedStaff.id, { isPraktikant: checked === true })
                }
              />
              <Text size="2">{label('praktikant')}</Text>
            </label>
            <Button color="red" variant="soft" onClick={() => confirmRemoveStaff(selectedStaff.id)}>
              <TrashIcon />
              {label('delete')}
            </Button>
          </div>
        ) : (
          <Text color="gray" size="2">
            {label('noSelection')}
          </Text>
        )}
      </section>
    </aside>
  )
}
