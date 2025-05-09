export interface Website {
  id: string
  title: string
  url: string
  favicon: string | null
  description: string
  themeColor: string
  visitCount: number
  lastVisited: string // ISO string date
}

export interface SectionVisibility {
  yourWebsites: boolean
  frequentlyVisited: boolean
  recentlyVisited: boolean
  quickNotes: boolean
  weather: boolean
}

export interface VisitHistoryEntry {
  count: number
  lastVisited: string
}

export interface VisitHistory {
  [id: string]: VisitHistoryEntry
}

export interface ThemeColors {
  primary: string
  secondary: string
}
