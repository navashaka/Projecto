const rightPanels = ['Alerts', 'Calendar', 'Notes']

const RightSidebar = () => {
  return (
    <aside className="card border-0 shadow-sm h-100">
      <div className="card-body p-3">
        <div className="d-grid gap-2">
          {rightPanels.map((title) => (
            <div key={title} className="border rounded p-3 bg-light-subtle">
              <h3 className="h6 mb-0">{title}</h3>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}

export default RightSidebar
