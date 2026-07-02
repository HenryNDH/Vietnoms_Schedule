import { VietnomsLogo } from './VietnomsLogo'

export function Header() {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <VietnomsLogo />
        <div>
          <h1>vietnoms</h1>
          <p>cafe, pho and street food · staff schedule</p>
        </div>
      </div>
    </header>
  )
}
