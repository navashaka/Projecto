function App() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between rounded-xl bg-white px-8 py-4 shadow-md ring-1 ring-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-sm">
            P
          </div>
          <div className="text-2xl font-black uppercase tracking-[0.18em] text-blue-600 font-mono">
            Projecto
          </div>
        </div>

        <nav className="hidden items-center gap-12 text-sm font-medium text-slate-600 md:flex">
          <a href="#" className="transition hover:text-blue-600">Dashboard</a>
          <a href="#" className="transition hover:text-blue-600">Employees</a>
          <a href="#" className="transition hover:text-blue-600">Departments</a>
          <a href="#" className="transition hover:text-blue-600">Reports</a>
        </nav>

        <button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
          Login
        </button>
      </header>
    </main>
  )
}

export default App
