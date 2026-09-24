const menuItems = ['Dashboard', 'Employees', 'Attendance', 'Payroll', 'Reports']

const LeftSidebar = () => {
  return (
    <aside className="card border-0 shadow-sm h-100">
      <div className="card-body p-3">
        <p className="text-uppercase text-muted small fw-semibold mb-3">Menu</p>
        <div className="d-grid gap-2">
          {menuItems.map((item) => (
            <button key={item} type="button" className="btn btn-light text-start">
              {item}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}

export default LeftSidebar
