import { localPdf, tours, whatsApp, type InfoLine } from '../../data/tours'

function PlanPlaneIcon() {
  return (
    <svg className="plan-plane" viewBox="0 0 16 15" fill="none" aria-hidden>
      <path
        d="M8 0c.73 0 1.32 1.05 1.32 2.35v2.2l6.13 3.54c.25.14.4.4.4.69v1.1a.44.44 0 0 1-.56.42L9.32 8.5v3.06l1.9 1.33c.15.11.24.28.24.47v.79a.44.44 0 0 1-.56.42L8 13.79l-2.9.78a.44.44 0 0 1-.56-.42v-.79c0-.19.09-.36.24-.47l1.9-1.33V8.5L.71 10.3a.44.44 0 0 1-.56-.42v-1.1c0-.29.15-.55.4-.69l6.13-3.54v-2.2C6.68 1.05 7.27 0 8 0Z"
        fill="currentColor"
      />
    </svg>
  )
}

function TimelineDot({ variant }: { variant: 'now' | 'past' | 'case' }) {
  return <span className={`tl-dot tl-dot-${variant}`} aria-hidden />
}

function InfoCopy({ lines }: { lines: InfoLine[] }) {
  if (!lines.length) return null
  return (
    <>
      {lines.map((line, i) => {
        if (line.type === 'text') {
          return (
            <p className="tl-desc" key={i}>
              {line.content}
            </p>
          )
        }
        return (
          <p className="tl-desc" key={i}>
            {line.parts.map((part, j) =>
              part.type === 'text' ? (
                <span key={j}>{part.value}</span>
              ) : (
                <a key={j} href={localPdf(part.href)} target="_blank" rel="noreferrer">
                  {part.text}
                </a>
              ),
            )}
          </p>
        )
      })}
    </>
  )
}

type Props = {
  trackRef: React.RefObject<HTMLDivElement | null>
  tailRef: React.RefObject<HTMLDivElement | null>
  pathRail: React.ReactNode
}

export function Timeline({ trackRef, tailRef, pathRail }: Props) {
  return (
    <div className="folio-track" ref={trackRef}>
      <div className="plan-head reveal" aria-hidden>
        <span className="plan-label">Tour packages</span>
        <PlanPlaneIcon />
      </div>
      {pathRail}
      <ol className="folio-timeline">
        {tours.countries.map((country) => (
          <li className="tl-entry" key={country.id} id={country.id}>
            <span className="tl-head">
              <TimelineDot variant="past" />
              <span className="tl-company">{country.title}</span>
            </span>
            <div className="tl-body">
              <InfoCopy lines={country.info ?? []} />
              <p className="tl-desc">
                {country.contactPrefix}{' '}
                {(country.phones ?? []).map((phone, i) => (
                  <span key={phone.whatsapp}>
                    {i > 0 ? ' or ' : null}
                    <a href={whatsApp(phone.whatsapp)} target="_blank" rel="noreferrer">
                      {phone.number}
                    </a>
                  </span>
                ))}
                {country.email ? (
                  <>
                    {' '}
                    email:{' '}
                    <a href={`mailto:${country.email}`}>{country.email}</a>
                  </>
                ) : null}
              </p>
            </div>
            {country.packages.length > 0 && (
              <ul className="tl-cases">
                {country.packages.map((pkg) => (
                  <li className="tl-case" key={pkg.id}>
                    <a
                      className="case"
                      href={localPdf(pkg.pdf)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <TimelineDot variant="case" />
                      <span className="case-text">
                        <span className="case-title">{pkg.title}</span>
                        <span className="case-desc">{pkg.validity}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
      <div className="folio-outro reveal">
        <div className="outro-text" ref={tailRef}>
          <p className="outro-title">{tours.credit}</p>
          <p className="outro-sub">{tours.hero.desc2}</p>
        </div>
      </div>
    </div>
  )
}
