import { useEffect, useRef, useState } from 'react'

const Navbar = () => {
  const navRef = useRef<HTMLElement>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [openDownloadSubmenu, setOpenDownloadSubmenu] = useState<string | null>(null)

  const closeMenus = () => {
    setOpenMenu(null)
    setOpenDownloadSubmenu(null)
  }

  const toggleMenu = (menu: string) => {
    setOpenMenu((current) => current === menu ? null : menu)
    setOpenDownloadSubmenu(null)
  }

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) closeMenus()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenus()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <nav ref={navRef} className="header-nav" aria-label="Main navigation">
      <ul className="main-nav-list">
        <li className={`main-nav-item has-submenu${openMenu === 'file' ? ' is-open' : ''}`}>
          <button
            type="button"
            className="main-nav-trigger"
            aria-haspopup="true"
            aria-expanded={openMenu === 'file'}
            aria-controls="nav-submenu-file"
            onClick={() => toggleMenu('file')}
          >
            File
          </button>
          <ul id="nav-submenu-file" className="nav-submenu">
            <li><button type="button" className="submenu-trigger" onClick={closeMenus}>Open</button></li>
            <li><button type="button" className="submenu-trigger" onClick={closeMenus}>Save</button></li>
            <li><button type="button" className="submenu-trigger" onClick={closeMenus}>Save As</button></li>
          </ul>
        </li>
        <li className="main-nav-item">
          <button type="button" className="main-nav-trigger" onClick={closeMenus}>View</button>
        </li>
        <li className={`main-nav-item has-submenu${openMenu === 'download' ? ' is-open' : ''}`}>
          <button
            type="button"
            className="main-nav-trigger"
            aria-haspopup="true"
            aria-expanded={openMenu === 'download'}
            aria-controls="nav-submenu-download"
            onClick={() => toggleMenu('download')}
          >
            Download
          </button>
          <ul id="nav-submenu-download" className="nav-submenu">
            <li className={`main-nav-item has-submenu${openDownloadSubmenu === 'pdf' ? ' is-open' : ''}`}>
              <button
                type="button"
                className="submenu-trigger nested-submenu-trigger"
                aria-haspopup="true"
                aria-expanded={openDownloadSubmenu === 'pdf'}
                aria-controls="nav-submenu-pdf"
                onClick={() => setOpenDownloadSubmenu((current) =>
                  current === 'pdf' ? null : 'pdf'
                )}
              >
                PDF
                <span aria-hidden="true">›</span>
              </button>
              <ul id="nav-submenu-pdf" className="nav-submenu nav-submenu-nested">
                <li>
                  <span className="submenu-trigger submenu-unavailable" aria-disabled="true">
                    No PDF files available yet
                  </span>
                </li>
              </ul>
            </li>
          </ul>
        </li>
        <li className={`main-nav-item has-submenu${openMenu === 'about' ? ' is-open' : ''}`}>
          <button
            type="button"
            className="main-nav-trigger"
            aria-haspopup="true"
            aria-expanded={openMenu === 'about'}
            aria-controls="nav-submenu-about"
            onClick={() => toggleMenu('about')}
          >
            About
          </button>
          <ul id="nav-submenu-about" className="nav-submenu">
            <li><button type="button" className="submenu-trigger" onClick={closeMenus}>Company</button></li>
            <li><button type="button" className="submenu-trigger" onClick={closeMenus}>Policies</button></li>
          </ul>
        </li>
        <li className="main-nav-item">
          <button type="button" className="main-nav-trigger" onClick={closeMenus}>Career</button>
        </li>
        <li className="main-nav-item">
          <button type="button" className="main-nav-trigger" onClick={closeMenus}>Contact Us</button>
        </li>
      </ul>
    </nav>
  )
}

export default Navbar
