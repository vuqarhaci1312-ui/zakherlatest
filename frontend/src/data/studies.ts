import type { CaseStudy } from '../types/case'
import raw from './studies.json'

export const studies = raw as CaseStudy[]

export function studyBySlug(path: string) {
  return studies.find((s) => s.slug === path) ?? null
}

export function studyNeighbors(slug: string) {
  const idx = studies.findIndex((s) => s.slug === slug)
  if (idx < 0 || studies.length < 2) return { prev: null, next: null }
  const at = (i: number) => studies[(i + studies.length) % studies.length]
  return { prev: at(idx - 1), next: at(idx + 1) }
}
