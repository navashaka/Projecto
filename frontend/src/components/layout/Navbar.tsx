import { useState } from 'react'

const Navbar = () => {
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  return (
    <nav className="header-nav" aria-label="Main navigation">
      <ul className="main-nav-list">
        <li className={`main-nav-item has-submenu${openMenu === 'file' ? ' is-open' : ''}`}>
          <button
            type="button"
            className="main-nav-trigger"
            aria-haspopup="true"
            aria-expanded={openMenu === 'file'}
            aria-controls="nav-submenu-file"
            onClick={() => setOpenMenu(openMenu === 'file' ? null : 'file')}
          >
            File
          </button>
          <ul id="nav-submenu-file" className="nav-submenu">
            <li><button type="button" className="submenu-trigger">Open</button></li>
            <li><button type="button" className="submenu-trigger">Save</button></li>
            <li><button type="button" className="submenu-trigger">Save As</button></li>
          </ul>
        </li>
        <li className="main-nav-item">
          <button type="button" className="main-nav-trigger">View</button>
        </li>
        <li className={`main-nav-item has-submenu${openMenu === 'about' ? ' is-open' : ''}`}>
          <button
            type="button"
            className="main-nav-trigger"
            aria-haspopup="true"
            aria-expanded={openMenu === 'about'}
            aria-controls="nav-submenu-about"
            onClick={() => setOpenMenu(openMenu === 'about' ? null : 'about')}
          >
            About
          </button>
          <ul id="nav-submenu-about" className="nav-submenu">
            <li><button type="button" className="submenu-trigger">Company</button></li>
            <li><button type="button" className="submenu-trigger">Policies</button></li>
          </ul>
        </li>
        <li className="main-nav-item">
          <button type="button" className="main-nav-trigger">Career</button>
        </li>
        <li className="main-nav-item">
          <button type="button" className="main-nav-trigger">Contact Us</button>
        </li>
      </ul>
    </nav>
  )
}

export default Navbar
