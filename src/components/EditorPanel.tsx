import { DragHandleDots2Icon, Pencil1Icon, PlusIcon, TrashIcon, UploadIcon } from '@radix-ui/react-icons'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Badge, Box, Button, Checkbox, Flex, Heading, Text, TextField } from '@radix-ui/themes'
import { memo, useEffect, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { t } from '../i18n/translations'
import { autoSubtitle } from '../lib/date'
import { nameFromFilename } from '../lib/filenameParsing'
import { optimizeStaffImage } from '../lib/imageProcessing'
import { sortStaffForPrint } from '../lib/staffSorting'
import { useDocumentStore } from '../state/documentStore'
import type { StaffMember, StaffSection } from '../types/document'

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
          height="75"
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

type SectionListItemProps = {
  canMoveDown: boolean
  canMoveUp: boolean
  canRemove: boolean
  deleteLabel: string
  editLabel: string
  dragLabel: string
  isSelected: boolean
  onDelete: () => void
  onMoveDown: () => void
  onMoveUp: () => void
  onNameChange: (name: string) => void
  onSelect: () => void
  section: StaffSection
}

function SectionListItem({
  canMoveDown,
  canMoveUp,
  canRemove,
  deleteLabel,
  editLabel,
  dragLabel,
  isSelected,
  onDelete,
  onMoveDown,
  onMoveUp,
  onNameChange,
  onSelect,
  section,
}: SectionListItemProps) {
  const nameInputRef = useRef<HTMLInputElement>(null)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  })

  function selectTitle() {
    onSelect()
    nameInputRef.current?.focus()
    nameInputRef.current?.select()
  }

  return (
    <div
      className={`section-list-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        aria-label={dragLabel}
        className="section-drag-handle"
        type="button"
        {...attributes}
        {...listeners}
      >
        <DragHandleDots2Icon />
      </button>
      <div className="section-title-block">
        <div className="section-title-row">
          <input
            aria-label={editLabel}
            className="section-name-input"
            ref={nameInputRef}
            value={section.name}
            onChange={(event) => onNameChange(event.target.value)}
            onFocus={onSelect}
          />
          <button
            aria-label={editLabel}
            className="section-edit-button"
            type="button"
            onClick={selectTitle}
          >
            <Pencil1Icon />
          </button>
        </div>
        <span>{section.staff.length} personer</span>
      </div>
      <div className="section-controls">
        <button disabled={!canMoveUp} type="button" onClick={onMoveUp}>
          ↑
        </button>
        <button disabled={!canMoveDown} type="button" onClick={onMoveDown}>
          ↓
        </button>
        <button
          aria-label={deleteLabel}
          className="section-delete-button"
          disabled={!canRemove}
          type="button"
          onClick={onDelete}
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  )
}

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
    reorderSection,
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
  const sectionDragSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

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

  function handleSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      reorderSection(String(active.id), String(over.id))
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
      </section>

      <section className="editor-section">
        <Flex align="center" justify="between">
          <Heading size="4">2. {label('sections')}</Heading>
          <Button className="primary-action-button" size="2" variant="solid" onClick={addSection}>
            <PlusIcon />
            {label('addSection')}
          </Button>
        </Flex>
        <DndContext
          collisionDetection={closestCenter}
          sensors={sectionDragSensors}
          onDragEnd={handleSectionDragEnd}
        >
          <SortableContext
            items={document.sections.map((section) => section.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="section-list">
              {document.sections.map((section, index) => (
                <SectionListItem
                  canMoveDown={index < document.sections.length - 1}
                  canMoveUp={index > 0}
                  canRemove={document.sections.length > 1}
                  deleteLabel={label('delete')}
                  dragLabel={label('dragSection')}
                  editLabel={label('editSectionName')}
                  isSelected={section.id === selectedSection?.id}
                  key={section.id}
                  section={section}
                  onDelete={() => confirmRemoveSection(section.id)}
                  onMoveDown={() => moveSection(section.id, 1)}
                  onMoveUp={() => moveSection(section.id, -1)}
                  onNameChange={(name) => updateSectionName(section.id, name)}
                  onSelect={() => selectSection(section.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </section>

      <section className="editor-section">
        <Heading size="4">3. {label('staff')}</Heading>
        <Box {...dropzone.getRootProps()} className={`dropzone ${!selectedSection ? 'disabled' : ''}`}>
          <input {...dropzone.getInputProps()} />
          <UploadIcon />
          <Text size="2">{selectedSection ? label('dropHint') : label('addSectionFirst')}</Text>
        </Box>
        <div className="staff-grid-editor">
          {selectedSection
            ? sortStaffForPrint(selectedSection.staff, document.locale).map((staff) => (
                <EditorStaffTile
                  isSelected={staff.id === selectedStaffId}
                  key={staff.id}
                  labelPraktikant={label('praktikant')}
                  staff={staff}
                  onSelect={() => selectStaff(selectedSection.id, staff.id)}
                />
              ))
            : null}
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
