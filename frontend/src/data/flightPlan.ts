export type CaseLink = {
  title: string
  desc: string
  to: string
  shots: string[]
}

export type FlightLeg = {
  year: string
  route: string
  logos: { src: string; url?: string; name?: string; bg?: string }[]
  company: string
  href: string
  current?: boolean
  role: string
  desc: string
  cases?: CaseLink[]
}

const shots = (id: string) =>
  ['left', 'middle', 'right'].map((side) => `/folio/shots/${id}-${side}.png`)

export const flightPlan: FlightLeg[] = [
  {
    year: '2025',
    route: 'NYC>MAN',
    logos: [
      { src: '/folio/logo-studio.png', url: 'https://buildwithstudio.com/' },
      { src: '/folio/logo-fahlo.png', url: 'https://myfahlo.com/', name: 'Fahlo' },
    ],
    company: 'Studio',
    href: 'https://buildwithstudio.com/',
    current: true,
    role: 'Lead Product Designer',
    desc:
      'New York based product agency. Led several end-to-end client product and branding engagements across mobile and web, shipping to millions of users.',
    cases: [
      {
        title: 'Fahlo™',
        desc: 'Animal tracking products driving conservation efforts worldwide',
        to: '/fahlo',
        shots: shots('fahlo'),
      },
    ],
  },
  {
    year: '2024',
    route: 'DEN>MAN',
    logos: [
      { src: '/folio/logo-matter-dark.png', url: 'https://matter.xyz/', name: 'Matter' },
      { src: '/folio/logo-matter-blue.png', url: 'https://matter.xyz/app', name: 'Matter app' },
    ],
    company: 'Matter Neuroscience',
    href: 'https://matter.xyz/',
    role: 'Senior Product Designer',
    desc:
      "Colorado biotech start-up investing in longevity through frontline neuroscience. Played a critical role in helping shape Matter's visual language and user experience 0-1.",
    cases: [
      {
        title: 'Matter',
        desc: 'Tracking neurotransmitter activity through a biomarker for happiness',
        to: '/matter',
        shots: shots('matter-ios'),
      },
    ],
  },
  {
    year: '2022',
    route: 'LON',
    logos: [{ src: '/folio/logo-contact.png', url: 'https://contact.xyz/' }],
    company: 'Contact',
    href: 'https://contact.xyz/',
    role: 'Senior Product Designer',
    desc:
      'London based marketplace start-up. Led design and a bold rebrand for a vertical shift in a fast-moving creative gig industry.',
    cases: [
      {
        title: 'Contact',
        desc: 'A B2B SaaS platform for booking, managing and paying creative talent',
        to: '/contact',
        shots: shots('contact'),
      },
    ],
  },
  {
    year: '2019',
    route: 'LON',
    logos: [
      { src: '/folio/logo-fueled.png', url: 'https://fueled.com/' },
      { src: '/folio/logo-immi.png', url: 'https://immi.io', name: 'Immi' },
      { src: '/folio/logo-sakara.png', url: 'https://www.sakara.com/', name: 'Sakara' },
      { src: '/folio/logo-webex.png', url: 'https://www.webex.com/', name: 'Webex' },
    ],
    company: 'Fueled',
    href: 'https://fueled.com/',
    role: 'Product Designer',
    desc:
      'New-York based digital agency for startup and enterprise clients. I learned the ropes, honed my craft, and shipped my first products.',
    cases: [
      {
        title: 'Webex for iPad',
        desc: 'Unifying antiquated software into a single seamless native experience',
        to: '/webex',
        shots: shots('webex'),
      },
      {
        title: 'Sakara',
        desc: 'A blueprint for high end meal subscription management',
        to: '/sakara',
        shots: shots('sakara'),
      },
      {
        title: 'Immi',
        desc: 'A world class, family friendly AR animation studio in your pocket',
        to: '/immi',
        shots: shots('immi'),
      },
    ],
  },
]

export const memories = [
  { src: '/folio/memories/m1.jpg', caption: 'Home sweet home' },
  { src: '/folio/memories/m2.jpg', caption: 'Happy place' },
  { src: '/folio/memories/m3.jpg', caption: 'I Miss Japan' },
  { src: '/folio/memories/m4.jpg', caption: 'NYC, ILY' },
  { src: '/folio/memories/m5.jpg', caption: 'Wannabe Rockstar' },
]

export const socialLinks = [
  { label: 'X', href: 'https://x.com/mjbarton_' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/mikejbarton/' },
]
