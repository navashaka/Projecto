const navItems = [
  'Dashboard',
  'Accounts',
  'Banking',
  'Invoices',
  'Journal',
  'Payments',
  'Reports',
]

const Navbar = () => {
  return (
    <nav className="header-nav navbar-nav d-flex flex-row flex-wrap gap-2" aria-label="Accounting modules navigation">
      {navItems.map((item) => (
        <button key={item} type="button" className="btn btn-sm btn-outline-secondary rounded-pill">
          {item}
        </button>
      ))}
    </nav>
  )
}

export default Navbar
