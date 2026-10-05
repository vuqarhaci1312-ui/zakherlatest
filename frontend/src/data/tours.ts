import raw from './tours.json'

export type TextPart = { type: 'text'; value: string }
export type LinkPart = { type: 'link'; text: string; href: string }
export type InfoPart = TextPart | LinkPart
export type InfoLine =
  | { type: 'text'; content: string }
  | { type: 'rich'; parts: InfoPart[] }

export type TourPackage = {
  id: string
  title: string
  pdf: string
  validity: string
}

export type CountryTours = {
  id: string
  title: string
  info?: InfoLine[]
  packages: TourPackage[]
  contactPrefix?: string
  phones?: { number: string; whatsapp: string }[]
  email?: string
}

export type ToursContent = {
  hero: { title: string; subtitle: string; desc1: string; desc2: string }
  credit: string
  countries: CountryTours[]
}

export const tours = raw as ToursContent

/** Local copy of a package PDF. Paths stay on this site. */
export function localPdf(rel: string) {
  return (
    '/tours/' +
    rel
      .replace(/^\/+/, '')
      .split('/')
      .map((part) => encodeURIComponent(part))
      .join('/')
  )
}

export function whatsApp(num: string) {
  const digits = num.replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}` : '#'
}
