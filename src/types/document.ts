export type Locale = 'da' | 'en'

export type StaffMember = {
  id: string
  name: string
  jobTitle: string
  email?: string
  phone?: string
  imageDataUrl: string
  thumbnailDataUrl?: string
  isPraktikant: boolean
  sourceFilename?: string
}

export type StaffSection = {
  id: string
  name: string
  staff: StaffMember[]
}

export type StaffDocument = {
  schemaVersion: 1
  id: string
  title: string
  subtitle: string
  useAutoDateSubtitle: boolean
  compactLayout: boolean
  primaryColor: string
  locale: Locale
  sections: StaffSection[]
}

export type SlmArchive = {
  app: 'staff-list-manager'
  schemaVersion: 1
  savedAt: string
  document: StaffDocument
}
