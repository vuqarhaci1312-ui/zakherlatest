import { SITE_TITLE } from '../../config'
import { tours } from '../../data/tours'

type Props = { booting?: boolean }

export function FolioSticky(_: Props) {
  return (
    <aside className="folio-sticky">
      <span className="fs-rail" aria-hidden />
      <div className="fs-lines">
        <p className="fs-name">{SITE_TITLE}</p>
        <p>{tours.hero.subtitle}</p>
      </div>
    </aside>
  )
}
