export type MediaItem = {
  src?: string
  poster?: string
  hover?: boolean
  label?: string
  before?: string
  after?: string
  demo?: string
  bare?: boolean
}

export type CaseSection =
  | { type: 'overview'; label: string; body: string }
  | { type: 'deep-dive'; title: string; body: string }
  | {
      type: 'figure'
      media: MediaItem
      caption?: string
      aspect?: number
      wide?: boolean
    }
  | { type: 'phones'; rows: MediaItem[][] }

export type CaseStudy = {
  slug: string
  title: string
  years: string
  platforms: string
  blurb: string
  sections: CaseSection[]
}
